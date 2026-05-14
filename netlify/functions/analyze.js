// Netlify serverless function — proxies image to xAI GROK Vision API (Responses API)
// Keeps GROK_API_KEY server-side only

const GROK_API_URL = 'https://api.x.ai/v1/responses'
const MODEL = 'grok-4.3'

const SYSTEM_PROMPT = `Você é um especialista em tribologia e análise de óleos lubrificantes.
Analise a imagem de um teste de mancha por gota (blotter spot test) em papel cromatográfico e forneça uma análise educativa detalhada em português brasileiro.

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
  "referenceInfo": "informação sobre o método blotter spot test"
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

  const { imageBase64, mimeType = 'image/jpeg', userNotes = '' } = body

  if (!imageBase64) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'imageBase64 é obrigatório' }) }
  }

  const userText = userNotes
    ? `Analise este teste de gota de óleo. Notas do usuário: ${userNotes}`
    : 'Analise este teste de gota de óleo lubrificante no papel cromatográfico.'

  const payload = {
    model: MODEL,
    instructions: SYSTEM_PROMPT,
    input: [
      { type: 'text', text: userText },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: imageBase64
        }
      }
    ],
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

    // Extract text from xAI Responses API output structure
    let content = null

    if (data.output) {
      // New Responses API: output is array of message objects
      for (const item of data.output) {
        if (item.type === 'message' && item.content) {
          for (const c of item.content) {
            if (c.type === 'output_text' && c.text) { content = c.text; break }
            if (c.type === 'text' && c.text) { content = c.text; break }
          }
        }
        if (content) break
        // Sometimes output_text is directly in the array
        if (item.type === 'output_text' && item.text) { content = item.text; break }
      }
    }

    // Fallback: old chat completions structure
    if (!content) {
      content = data.choices?.[0]?.message?.content
    }

    if (!content) {
      console.error('Unexpected GROK response structure:', JSON.stringify(data).slice(0, 500))
      return { statusCode: 502, headers: corsHeaders(), body: JSON.stringify({ error: 'Resposta inesperada da API GROK', raw: JSON.stringify(data).slice(0, 300) }) }
    }

    // Extract JSON from response (model may wrap it in markdown code blocks)
    let analysis
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
      analysis = JSON.parse(jsonStr.trim())
    } catch {
      analysis = { raw: content, condition: 'atencao', conditionLabel: 'Análise recebida', score: 50, educationalSummary: content }
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis,
        model: data.model || MODEL,
        timestamp: new Date().toISOString()
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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
}
