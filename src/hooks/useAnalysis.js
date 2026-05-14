import { useState, useCallback } from 'react'
import { analyzeOilSpot } from '../services/grokApi.js'
import { processImageDataUrl, processImageFile } from '../services/imageProcessor.js'
import { saveAnalysis } from '../services/storage.js'

export function useAnalysis() {
  const [status, setStatus] = useState('idle') // idle | processing | success | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  const analyze = useCallback(async ({ dataUrl, file, userNotes = '' }) => {
    setStatus('processing')
    setError(null)
    setResult(null)

    try {
      setStatus('processing:image')
      const processed = dataUrl
        ? await processImageDataUrl(dataUrl)
        : await processImageFile(file)

      setPreview(processed.previewDataUrl)

      setStatus('processing:ai')
      const apiResult = await analyzeOilSpot({
        imageBase64: processed.imageBase64,
        mimeType: processed.mimeType,
        userNotes
      })

      const record = {
        analysis: apiResult.analysis,
        previewDataUrl: processed.previewDataUrl,
        colorData: processed.colorData,
        model: apiResult.model,
        usage: apiResult.usage,
        userNotes,
        analyzedAt: apiResult.timestamp
      }

      const saved = await saveAnalysis(record)
      setResult(saved)
      setStatus('success')
      return saved
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Erro desconhecido durante análise')
      setStatus('error')
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
    setPreview(null)
  }, [])

  const statusLabel = {
    idle: '',
    'processing:image': 'Processando imagem...',
    'processing:ai': 'Analisando com KRATOS...',
    success: 'Análise concluída',
    error: 'Erro na análise'
  }[status] || 'Processando...'

  return { status, result, error, preview, analyze, reset, statusLabel }
}
