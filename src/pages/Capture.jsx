import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Camera from '../components/Camera.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAnalysis } from '../hooks/useAnalysis.js'

export default function Capture() {
  const navigate = useNavigate()
  const { status, analyze, error, statusLabel } = useAnalysis()

  const [mode, setMode] = useState('simple') // 'simple' | 'comparative'
  const [step, setStep] = useState(1)         // 1 = reference, 2 = used oil

  const [refPreview, setRefPreview] = useState(null)
  const [refSource, setRefSource] = useState(null)

  const [preview, setPreview] = useState(null)
  const [pendingSource, setPendingSource] = useState(null)

  const [userNotes, setUserNotes] = useState('')

  const isProcessing = status.startsWith('processing')
  const isComparative = mode === 'comparative'

  function handleCapture(dataUrl) {
    if (isComparative && step === 1) {
      setRefPreview(dataUrl); setRefSource({ dataUrl })
    } else {
      setPreview(dataUrl); setPendingSource({ dataUrl })
    }
  }

  function handleFileSelect(file) {
    const url = URL.createObjectURL(file)
    if (isComparative && step === 1) {
      setRefPreview(url); setRefSource({ file })
    } else {
      setPreview(url); setPendingSource({ file })
    }
  }

  function handleReset() {
    setRefPreview(null); setRefSource(null)
    setPreview(null); setPendingSource(null)
    setStep(1); setUserNotes('')
  }

  function handleModeChange(next) {
    setMode(next)
    handleReset()
  }

  async function handleAnalyze() {
    if (!pendingSource) return
    try {
      const result = await analyze({
        ...pendingSource,
        userNotes,
        referenceSource: isComparative ? refSource : null
      })
      navigate('/analysis', { state: { result } })
    } catch {
      // error state handled by hook
    }
  }

  // Derived display state
  const showCamera =
    (!isComparative && !preview) ||
    (isComparative && step === 1 && !refPreview) ||
    (isComparative && step === 2 && !preview)

  const readyToAnalyze = isComparative ? (!!refPreview && !!preview) : !!preview
  const stepLabel = isComparative ? `Passo ${step} de 2` : 'Passo 1 de 1'

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
        <span className="ml-auto text-xs text-gray-500">{stepLabel}</span>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-64">
            <LoadingSpinner label={statusLabel} />
            <p className="text-xs text-gray-500 text-center max-w-xs mt-2">
              O KRATOS está lendo os anéis cromatográficos e preparando a análise educativa...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* Mode toggle — only before any capture */}
            {!refPreview && !preview && (
              <div className="flex gap-1 bg-surface-800 p-1 rounded-xl">
                <ModeBtn active={mode === 'simple'} onClick={() => handleModeChange('simple')}>
                  Simples
                </ModeBtn>
                <ModeBtn active={mode === 'comparative'} onClick={() => handleModeChange('comparative')}>
                  Comparativa
                </ModeBtn>
              </div>
            )}

            {/* Reference thumbnail banner during step 2 */}
            {isComparative && step === 2 && refPreview && !preview && (
              <div className="flex items-center gap-3 bg-surface-800 rounded-xl p-3 border border-emerald-800/60">
                <img
                  src={refPreview}
                  alt="Referência"
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 flex-shrink-0"
                />
                <div>
                  <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">Referência salva</p>
                  <p className="text-xs text-gray-400">Capture a gota do óleo usado</p>
                </div>
              </div>
            )}

            {/* Instruction banner */}
            {showCamera && (
              <div className="bg-surface-800/50 border border-surface-600 rounded-xl p-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isComparative && step === 1 ? (
                    <><span className="text-emerald-400 font-semibold">Passo 1 — Referência:</span> Aplique uma gota de <strong className="text-white">óleo limpo/novo</strong> no papel. Use a mesma iluminação e distância que usará na próxima foto.</>
                  ) : isComparative && step === 2 ? (
                    <><span className="text-oil-gold font-semibold">Passo 2 — Analisado:</span> Capture a gota do <strong className="text-white">óleo usado</strong>. Mantenha as mesmas condições da referência para comparação precisa.</>
                  ) : (
                    <><span className="text-oil-gold font-semibold">Dica:</span> Posicione a mancha no centro do guia circular. Boa iluminação, sem reflexos. A câmera traseira oferece melhor resolução.</>
                  )}
                </p>
              </div>
            )}

            {/* Camera */}
            {showCamera && (
              <Camera onCapture={handleCapture} onFileSelect={handleFileSelect} />
            )}

            {/* Step 1 preview (comparative) */}
            {isComparative && step === 1 && refPreview && (
              <>
                <PreviewCard src={refPreview} label="Referência (óleo limpo)" labelColor="text-emerald-400" />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setRefPreview(null); setRefSource(null) }}
                    className="flex-1 py-3 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors font-medium text-sm"
                  >
                    Retirar
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 transition-all active:scale-[0.98] font-bold text-sm text-white"
                  >
                    Próximo →
                  </button>
                </div>
              </>
            )}

            {/* Final preview + analyze */}
            {readyToAnalyze && (
              <>
                {isComparative ? (
                  <div className="flex gap-3">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">Referência</p>
                      <div className="rounded-2xl overflow-hidden bg-surface-800 aspect-square w-full border border-emerald-900">
                        <img src={refPreview} alt="Referência" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs text-oil-gold font-semibold uppercase tracking-widest">Analisado</p>
                      <div className="rounded-2xl overflow-hidden bg-surface-800 aspect-square w-full border border-oil-gold/30">
                        <img src={preview} alt="Óleo usado" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <PreviewCard src={preview} />
                )}

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">
                    Notas (opcional)
                  </label>
                  <input
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
                    onClick={handleReset}
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
              </>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-oil-gold text-surface-900' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

function PreviewCard({ src, label, labelColor = 'text-oil-gold' }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && <p className={`text-xs font-semibold uppercase tracking-widest ${labelColor}`}>{label}</p>}
      <div className="relative rounded-2xl overflow-hidden bg-surface-800 aspect-square max-w-sm mx-auto w-full">
        <img src={src} alt="Captura" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full border-2 border-dashed border-oil-gold/40" />
        </div>
      </div>
    </div>
  )
}
