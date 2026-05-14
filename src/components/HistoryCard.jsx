import { OIL_CONDITIONS, getScoreColor } from '../utils/oilConditions.js'

export default function HistoryCard({ record, onClick, onDelete }) {
  const { analysis, previewDataUrl, analyzedAt, userNotes } = record
  const condition = OIL_CONDITIONS[analysis?.condition] || OIL_CONDITIONS.atencao
  const scoreColor = getScoreColor(analysis?.score ?? 50)
  const date = new Date(analyzedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = new Date(analyzedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-4">
        {previewDataUrl && (
          <img
            src={previewDataUrl}
            alt="Mancha"
            className="w-14 h-14 rounded-full object-cover border-2 border-surface-600 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold ${condition.color}`}>{condition.icon} {condition.label}</span>
            {analysis?.score != null && (
              <span className={`ml-auto text-sm font-mono font-bold ${scoreColor}`}>{analysis.score}/100</span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">
            {analysis?.conditionLabel || 'Análise de óleo'}
          </p>
          {userNotes && (
            <p className="text-xs text-gray-500 truncate mt-0.5">📝 {userNotes}</p>
          )}
          <p className="text-xs text-gray-600 mt-1">{date} às {time}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete?.() }}
          className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
          aria-label="Excluir análise"
        >
          🗑️
        </button>
      </div>
      {/* Mini condition bar */}
      <div className="h-1 w-full bg-surface-700">
        <div
          className={`h-full transition-all ${
            analysis?.condition === 'bom' ? 'bg-emerald-500' :
            analysis?.condition === 'critico' ? 'bg-red-500' : 'bg-amber-500'
          }`}
          style={{ width: `${analysis?.score ?? 50}%` }}
        />
      </div>
    </div>
  )
}
