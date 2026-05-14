// Client-side caller for the Netlify serverless function that proxies to GROK Vision API

const ANALYZE_ENDPOINT = '/.netlify/functions/analyze'

export async function analyzeOilSpot({ imageBase64, mimeType = 'image/jpeg', userNotes = '' }) {
  const response = await fetch(ANALYZE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, userNotes })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Erro ${response.status} ao chamar a API`)
  }

  return data
}
