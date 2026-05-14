import { useState, useCallback } from 'react'
import { analyzeOilSpot } from '../services/grokApi.js'
import { processImageDataUrl, processImageFile } from '../services/imageProcessor.js'
import { saveAnalysis } from '../services/storage.js'

async function processSource(source) {
  if (!source) return null
  return source.dataUrl
    ? processImageDataUrl(source.dataUrl)
    : processImageFile(source.file)
}

export function useAnalysis() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  const analyze = useCallback(async ({ dataUrl, file, userNotes = '', referenceSource = null }) => {
    setStatus('processing')
    setError(null)
    setResult(null)

    try {
      setStatus('processing:image')
      const [processed, processedRef] = await Promise.all([
        processSource({ dataUrl, file }),
        processSource(referenceSource)
      ])

      setPreview(processed.previewDataUrl)

      setStatus('processing:ai')
      const apiResult = await analyzeOilSpot({
        imageBase64: processed.imageBase64,
        mimeType: processed.mimeType,
        userNotes,
        colorData: processed.colorData,
        referenceImageBase64: processedRef?.imageBase64 ?? null,
        referenceMimeType: processedRef?.mimeType ?? 'image/jpeg',
        referenceColorData: processedRef?.colorData ?? null
      })

      const record = {
        analysis: apiResult.analysis,
        previewDataUrl: processed.previewDataUrl,
        referencePreviewDataUrl: processedRef?.previewDataUrl ?? null,
        colorData: processed.colorData,
        referenceColorData: processedRef?.colorData ?? null,
        isComparative: apiResult.isComparative ?? false,
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
