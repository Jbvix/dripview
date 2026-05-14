// Netlify serverless function — proxies image to xAI GROK Vision API (Responses API)
// Keeps GROK_API_KEY server-side only

const GROK_API_URL = 'https://api.x.ai/v1/responses'
const MODEL = 'grok-4.3'

const SYSTEM_PROMPT = `Você é um especialista em tribologia e análise de óleos lubrificantes.
Analise a(s) imagem(ns) de um teste de mancha por gota (blotter spot test) em papel cromatográfico e forneça uma análise educativa detalhada em português brasileiro.

Quando houver DUAS imagens, a primeira é a REFERÊNCIA (óleo limpo/novo) e a segunda é o ÓLEO ANALISADO (usado). Compare-as diretamente, avaliando o delta de cor, difusão, contaminantes e degradação.

Estruture sua resposta EXATAMENTE neste formato JSON (sem texto fora do JSON):
{
  "condition": "bom" ou "atencao" ou "critico",
  "conditionLabel": "texto curto da condição",
  "score": número de 0 a 100,
  "rings": [
    { "zone": "núcleo central", "color": "cor observada", "interpretation": "o que indica" },
    { "zone": "anel de difusão", "color": "cor observada", "interpretation": "o que indica" },
    { "zone": "anel externo / halo", "color": "cor observada", "interpretation": "o que indica" }
  ],
  "contaminants": [
    { "name": "nome", "detected": true ou false, "severity": "baixa" ou "media" ou "alta", "explanation": "explicação educativa" }
  ],
  "oilType": "tipo de óleo inferido",
  "educationalSummary": "parágrafo educativo de 3-4 frases",
  "recommendation": "ação recomendada",
  "referenceInfo": "informação sobre o método blotter spot test",
  "comparison": null
}

Quando houver imagem de referência, substitua "comparison": null por:
  "comparison": {
    "degradationLevel": "leve" ou "moderada" ou "severa",
    "nucleusChange": "descrição da mudança no núcleo vs referência",
    "diffusionChange": "descrição da mudança no anel de difusão vs referência",
    "haloChange": "descrição da mudança no halo externo vs referência",
    "mainDifferences": ["diferença 1", "diferença 2", "diferença 3"],
    "summary": "resumo comparativo educativo de 2-3 frases explicando o que mudou"
  }

Analise: cor e textura dos anéis, partículas metálicas, contaminação por água, oxidação, fuligem, aditivos depletados.`

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'GROK_API_KEY não configurada no ambiente Netlify' })
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Body inválido' }) }
  }

  const {
    imageBase64,
    mimeType = 'image/jpeg',
    userNotes = '',
    colorData = null,
    referenceImageBase64 = null,
    referenceMimeType = 'image/jpeg',
    referenceColorData = null
  } = body

  if (!imageBase64) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'imageBase64 é obrigatório' }) }
  }

  const isComparative = !!referenceImageBase64

  const colorContext = buildColorContext(colorData, referenceColorData, isComparative)
  const userText = [
    isComparative
      ? 'Realize análise COMPARATIVA entre as duas gotas. A primeira imagem é a REFERÊNCIA (óleo limpo). A segunda imagem é o ÓLEO ANALISADO (usado). Avalie o delta de degradação entre elas.'
      : 'Analise este teste de gota de óleo lubrificante no papel cromatográfico.',
    colorContext,
    userNotes ? `Notas do usuário: ${userNotes}` : ''
  ].filter(Boolean).join('\n\n')

  const content = buildContent({
    imageBase64, mimeType,
    referenceImageBase64, referenceMimeType,
    userText, isComparative
  })

  const payload = {
    model: MODEL,
    instructions: SYSTEM_PROMPT,
    input: [{ role: 'user', content }],
    temperature: 0.2,
    max_output_tokens: 2000
  }

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    const rawText = await response.text()

    if (!response.ok) {
      console.error('GROK API error:', response.status, rawText)
      let detail = rawText
      try { detail = JSON.parse(rawText)?.error?.message || rawText } catch {}
      return {
        statusCode: response.status,
        headers: corsHeaders(),
        body: JSON.stringify({ error: `Erro ${response.status} da API GROK: ${detail}` })
      }
    }

    const data = JSON.parse(rawText)

    let content2 = null
    if (data.output) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content) {
          for (const c of item.content) {
            if (c.type === 'output_text' && c.text) { content2 = c.text; break }
            if (c.type === 'text' && c.text) { content2 = c.text; break }
          }
        }
        if (content2) break
        if (item.type === 'output_text' && item.text) { content2 = item.text; break }
      }
    }

    if (!content2) {
      content2 = data.choices?.[0]?.message?.content
    }

    if (!content2) {
      console.error('Unexpected GROK response structure:', JSON.stringify(data).slice(0, 500))
      return { statusCode: 502, headers: corsHeaders(), body: JSON.stringify({ error: 'Resposta inesperada da API GROK', raw: JSON.stringify(data).slice(0, 300) }) }
    }

    let analysis
    try {
      const jsonMatch = content2.match(/```(?:json)?\s*([\s\S]*?)```/) || content2.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content2
      analysis = JSON.parse(jsonStr.trim())
    } catch {
      analysis = { raw: content2, condition: 'atencao', conditionLabel: 'Análise recebida', score: 50, educationalSummary: content2 }
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis,
        model: data.model || MODEL,
        timestamp: new Date().toISOString(),
        isComparative
      })
    }
  } catch (err) {
    console.error('Function error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Erro interno ao chamar GROK API', detail: err.message })
    }
  }
}

function buildContent({ imageBase64, mimeType, referenceImageBase64, referenceMimeType, userText, isComparative }) {
  if (isComparative) {
    return [
      { type: 'input_text', text: '=== IMAGEM 1: REFERÊNCIA (óleo limpo/novo) ===' },
      { type: 'input_image', image_url: `data:${referenceMimeType};base64,${referenceImageBase64}` },
      { type: 'input_text', text: '=== IMAGEM 2: ÓLEO ANALISADO (usado) ===' },
      { type: 'input_image', image_url: `data:${mimeType};base64,${imageBase64}` },
      { type: 'input_text', text: userText }
    ]
  }
  return [
    { type: 'input_image', image_url: `data:${mimeType};base64,${imageBase64}` },
    { type: 'input_text', text: userText }
  ]
}

function buildColorContext(colorData, referenceColorData, isComparative) {
  const lines = []

  if (referenceColorData && isComparative) {
    lines.push('Medições colorimétricas locais — REFERÊNCIA (200 amostras/zona):')
    lines.push(...formatZones(referenceColorData))
    lines.push('')
  }

  if (colorData) {
    lines.push(`Medições colorimétricas locais — ${isComparative ? 'ÓLEO ANALISADO' : 'óleo analisado'} (200 amostras/zona):`)
    lines.push(...formatZones(colorData))
    lines.push(
      'Limiares de referência:',
      '  escuridão >70% no núcleo → fuligem/desgaste severo',
      '  escuridão <20% no halo com matiz amarelo (H 40-55°) → óleo fresco',
      '  escuridão >60% no halo → contaminação por água ou degradação avançada'
    )
  }

  return lines.join('\n')
}

function formatZones(colorData) {
  const zoneNames = { nucleo: 'Núcleo central', difusao: 'Anel de difusão', halo: 'Halo externo' }
  return Object.entries(zoneNames).map(([key, label]) => {
    const z = colorData[key]
    if (!z) return `- ${label}: sem dados`
    const { hex, hsl, darkness } = z
    return `- ${label}: hex=${hex}, HSL(${hsl.h}°, ${hsl.s}%, ${hsl.l}%), escuridão=${(darkness * 100).toFixed(1)}%`
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
}
