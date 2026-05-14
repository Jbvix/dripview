import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import HistoryCard from '../components/HistoryCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { getAllAnalyses, deleteAnalysis, clearAllAnalyses } from '../services/storage.js'

export default function History() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllAnalyses()
      setRecords(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    await deleteAnalysis(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  async function handleClearAll() {
    await clearAllAnalyses()
    setRecords([])
    setShowConfirmClear(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top py-4 border-b border-surface-700 sticky top-0 bg-surface-900/95 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-700 transition-colors">←</button>
        <h1 className="font-semibold">Histórico</h1>
        {records.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="ml-auto text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
          >
            Limpar tudo
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {loading ? (
          <LoadingSpinner label="Carregando histórico..." />
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="text-5xl">📋</span>
            <p className="text-gray-400 font-medium">Nenhuma análise salva</p>
            <p className="text-sm text-gray-500">Realize sua primeira análise de óleo para ver o histórico aqui.</p>
            <button
              onClick={() => navigate('/capture')}
              className="mt-2 px-6 py-3 bg-oil-gold text-surface-900 font-bold rounded-xl text-sm"
            >
              Nova Análise
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500">{records.length} análise{records.length !== 1 ? 's' : ''} salva{records.length !== 1 ? 's' : ''}</p>
            {records.map(record => (
              <HistoryCard
                key={record.id}
                record={record}
                onClick={() => navigate('/analysis', { state: { result: record } })}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm clear modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="w-full bg-surface-800 rounded-t-2xl p-6 border-t border-surface-600">
            <h3 className="font-semibold mb-2">Limpar todo o histórico?</h3>
            <p className="text-sm text-gray-400 mb-5">Esta ação não pode ser desfeita. Todas as {records.length} análises serão removidas do dispositivo.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 py-3 bg-surface-700 rounded-xl font-medium text-sm">
                Cancelar
              </button>
              <button onClick={handleClearAll} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-sm">
                Limpar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
