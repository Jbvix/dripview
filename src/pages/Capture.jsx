import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Camera from '../components/Camera.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAnalysis } from '../hooks/useAnalysis.js'

export default function Capture() {
  const navigate = useNavigate()
  const { status, analyze, error, statusLabel } = useAnalysis()
  const [preview, setPreview] = useState(null)
  const [pendingSource, setPendingSource] = useState(null) // { dataUrl } | { file }
  const [userNotes, setUserNotes] = useState('')
  const notesRef = useRef(null)

  const isProcessing = status.startsWith('processing')

  function handleCapture(dataUrl) {
    setPreview(dataUrl)
    setPendingSource({ dataUrl })
  }

  function handleFileSelect(file) {
    const url = URL.createObjectURL(file)
    setPreview(url)
    setPendingSource({ file })
  }

  function handleRetake() {
    setPreview(null)
    setPendingSource(null)
    setUserNotes('')
  }

  async function handleAnalyze() {
    if (!pendingSource) return
    try {
      const result = await analyze({ ...pendingSource, userNotes })
      navigate('/analysis', { state: { result } })
    } catch {
      // error state handled by hook
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top py-4 border-b border-surface-700">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-surface-700 transition-colors"
          aria-label="Voltar"
        >
          ←
        </button>
        <h1 className="font-semibold">Nova Análise</h1>
        <span className="ml-auto text-xs text-gray-500">Passo 1 de 1</span>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-64">
            <LoadingSpinner label={statusLabel} />
            <p className="text-xs text-gray-500 text-center max-w-xs mt-2">
              O GROK está lendo os anéis cromatográficos e preparando a análise educativa...
            </p>
          </div>
        ) : preview ? (
          <div className="flex flex-col gap-5">
            {/* Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-surface-800 aspect-square max-w-sm mx-auto w-full">
              <img src={preview} alt="Captura da mancha" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border-2 border-dashed border-oil-gold/40" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">
                Notas (opcional)
              </label>
              <input
                ref={notesRef}
                type="text"
                value={userNotes}
                onChange={e => setUserNotes(e.target.value)}
                placeholder="Ex: Motor diesel, 5000h, óleo 15W40..."
                className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-oil-gold transition-colors"
                maxLength={200}
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors font-medium text-sm"
              >
                Retirar
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-1 py-3 rounded-xl bg-oil-gold hover:bg-oil-amber transition-all active:scale-[0.98] font-bold text-surface-900"
              >
                Analisar com IA
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Instructions */}
            <div className="bg-surface-800/50 border border-surface-600 rounded-xl p-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-oil-gold font-semibold">Dica:</span> Posicione a mancha de óleo no centro do
                guia circular. Use boa iluminação e evite reflexos. A câmera traseira oferece melhor resolução.
              </p>
            </div>

            <Camera onCapture={handleCapture} onFileSelect={handleFileSelect} />
          </div>
        )}
      </div>
    </div>
  )
}
