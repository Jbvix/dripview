import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AnalysisResult from '../components/AnalysisResult.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { getAnalysis } from '../services/storage.js'

export default function Analysis() {
  const { state } = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(state?.result || null)
  const [loading, setLoading] = useState(!record && !!id)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!record && id) {
      getAnalysis(id)
        .then(r => {
          if (r) setRecord(r)
          else setError('Análise não encontrada')
        })
        .catch(() => setError('Erro ao carregar análise'))
        .finally(() => setLoading(false))
    }
  }, [id, record])

  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top py-4 border-b border-surface-700 sticky top-0 bg-surface-900/95 backdrop-blur z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-surface-700 transition-colors"
          aria-label="Voltar"
        >
          ←
        </button>
        <h1 className="font-semibold">Resultado da Análise</h1>
        <button
          onClick={() => navigate('/capture')}
          className="ml-auto px-3 py-1.5 rounded-xl bg-oil-gold/20 text-oil-gold text-xs font-medium hover:bg-oil-gold/30 transition-colors"
        >
          + Nova
        </button>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {loading ? (
          <LoadingSpinner label="Carregando análise..." />
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-gray-400">{error}</p>
            <button onClick={() => navigate('/history')} className="px-4 py-2 bg-surface-700 rounded-xl text-sm">
              Ver Histórico
            </button>
          </div>
        ) : record ? (
          <AnalysisResult result={record} />
        ) : (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="text-4xl">🔬</span>
            <p className="text-gray-400">Nenhuma análise disponível</p>
            <button onClick={() => navigate('/capture')} className="px-4 py-2 bg-oil-gold text-surface-900 rounded-xl font-bold text-sm">
              Iniciar Análise
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
