// Client-side caller for the Netlify serverless function that proxies to GROK Vision API

const ANALYZE_ENDPOINT = '/.netlify/functions/analyze'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 6000

export async function analyzeOilSpot({ imageBase64, mimeType = 'image/jpeg', userNotes = '', colorData = null }) {
  let lastError
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS)

    try {
      const response = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, userNotes, colorData })
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        // Netlify returned HTML (timeout 504, deploy in progress, etc.)
        if (response.status === 504 || response.status === 502) {
          lastError = new Error('Serviço temporariamente indisponível. Tente novamente em instantes.')
          continue
        }
        throw new Error('Resposta inesperada do servidor. Verifique a conexão e tente novamente.')
      }

      if (!response.ok) {
        const msg = data.error || `Erro ${response.status}`
        // Retry on 429 (rate limit) or 503 (capacity)
        if ((response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
          lastError = new Error('KRATOS sobrecarregado. Tentando novamente...')
          continue
        }
        if (response.status === 429) {
          throw new Error('KRATOS está sobrecarregado no momento. Aguarde alguns minutos e tente novamente.')
        }
        throw new Error(msg)
      }

      return data
    } catch (err) {
      if (err.message.includes('sobrecarregado') || err.message.includes('indisponível')) throw err
      lastError = err
    }
  }
  throw lastError
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
