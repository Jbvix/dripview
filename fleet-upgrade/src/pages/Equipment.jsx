// Equipment selection screen — shown before capture when fleet mode is active.
// User picks which engine/machine to analyze; selection persists in localStorage.

import { useNavigate } from 'react-router-dom'
import { useEquipment } from '../hooks/useEquipment.js'

export default function Equipment() {
  const navigate = useNavigate()
  const { equipmentList, selected, loading, error, selectEquipment } = useEquipment()

  function handleSelect(eq) {
    selectEquipment(eq)
    navigate('/capture')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface-900">
      <div className="flex items-center gap-3 px-4 pt-safe-top py-4 border-b border-surface-700">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-700 transition-colors">←</button>
        <h1 className="font-semibold">Selecionar Equipamento</h1>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {loading && (
          <p className="text-sm text-gray-500 text-center py-12">Carregando equipamentos...</p>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && equipmentList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm mb-2">Nenhum equipamento cadastrado.</p>
            <p className="text-gray-600 text-xs">Contate o supervisor para cadastrar os motores da frota.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {equipmentList.map(eq => (
            <button
              key={eq.id}
              onClick={() => handleSelect(eq)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                selected?.id === eq.id
                  ? 'bg-oil-gold/10 border-oil-gold'
                  : 'bg-surface-800 border-surface-600 hover:border-surface-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{eq.name}</p>
                  {eq.vessel && (
                    <p className="text-xs text-gray-500 mt-0.5">{eq.vessel}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {eq.engine_model && (
                      <span className="text-xs text-gray-400">
                        <span className="text-gray-600">Motor:</span> {eq.engine_model}
                      </span>
                    )}
                    {eq.oil_spec && (
                      <span className="text-xs text-gray-400">
                        <span className="text-gray-600">Óleo:</span> {eq.oil_spec}
                      </span>
                    )}
                  </div>
                </div>
                {selected?.id === eq.id && (
                  <span className="text-oil-gold text-lg flex-shrink-0">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
