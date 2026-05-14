// Netlify serverless function — proxies image to xAI GROK Vision API
// Keeps GROK_API_KEY server-side only

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const MODEL = 'grok-2-vision-1212'

const SYSTEM_PROMPT = `Você é um especialista em tribologia e análise de óleos lubrificantes.
Analise a imagem de um teste de mancha por gota (blotter spot test) em papel cromatográfico e forneça uma análise educativa detalhada em português brasileiro.

Estruture sua resposta EXATAMENTE neste formato JSON:
{
  "condition": "bom" | "atencao" | "critico",
  "conditionLabel": "texto curto da condição (ex: Óleo em bom estado)",
  "score": 0-100,
  "rings": [
    {
      "zone": "núcleo central",
      "color": "descrição da cor observada",
      "interpretation": "o que essa zona indica sobre o óleo"
    },
    {
      "zone": "anel de difusão",
      "color": "descrição da cor observada",
      "interpretation": "o que esse anel indica"
    },
    {
      "zone": "anel externo / halo",
      "color": "descrição da cor observada",
      "interpretation": "o que o halo indica"
    }
  ],
  "contaminants": [
    {
      "name": "nome do contaminante ou característica",
      "detected": true | false,
      "severity": "baixa" | "media" | "alta",
      "explanation": "explicação educativa do que isso significa"
    }
  ],
  "oilType": "provável tipo de óleo analisado (se possível inferir)",
  "educationalSummary": "parágrafo educativo de 3-4 frases explicando o resultado geral, como interpretar o teste e o que fazer",
  "recommendation": "ação recomendada clara e objetiva",
  "referenceInfo": "breve informação sobre o método blotter spot test para contextualização educativa"
}

Analise especificamente:
- Cor e textura dos anéis cromatográficos
- Presença de partículas metálicas (manchas escuras/cinzas)
- Contaminação por água (halos brancos/opacos)
- Oxidação (cor escura/marrom intensa)
- Fuligem/carbono (manchas pretas densas)
- Aditivos depletados (ausência de anel de difusão claro)
- Estado geral da viscosidade base`

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

  const userMessage = userNotes
    ? `Analise este teste de gota de óleo. Notas do usuário: ${userNotes}`
    : 'Analise este teste de gota de óleo lubrificante no papel cromatográfico.'

  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userMessage },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
        ]
      }
    ],
    temperature: 0.2,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
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

    if (!response.ok) {
      const errText = await response.text()
      console.error('GROK API error:', response.status, errText)
      return {
        statusCode: response.status,
        headers: corsHeaders(),
        body: JSON.stringify({ error: `GROK API error: ${response.status}`, detail: errText })
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { statusCode: 502, headers: corsHeaders(), body: JSON.stringify({ error: 'Resposta vazia da API GROK' }) }
    }

    let analysis
    try {
      analysis = JSON.parse(content)
    } catch {
      analysis = { raw: content }
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis,
        model: data.model,
        usage: data.usage,
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
