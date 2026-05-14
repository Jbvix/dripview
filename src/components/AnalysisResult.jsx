import { OIL_CONDITIONS, getScoreColor } from '../utils/oilConditions.js'

export default function AnalysisResult({ result }) {
  const { analysis, previewDataUrl, analyzedAt } = result
  const condition = OIL_CONDITIONS[analysis.condition] || OIL_CONDITIONS.atencao
  const scoreColor = getScoreColor(analysis.score ?? 50)

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header: condition badge */}
      <div className={`rounded-2xl p-5 border ${condition.bgColor} ${condition.borderColor}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-3xl font-bold ${condition.color}`}>{condition.icon}</span>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Condição do Óleo</p>
            <h2 className={`text-xl font-bold ${condition.color}`}>{analysis.conditionLabel || condition.label}</h2>
          </div>
          {analysis.score != null && (
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Score</p>
              <p className={`text-2xl font-mono font-bold ${scoreColor}`}>{analysis.score}</p>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-300">{condition.description}</p>
      </div>

      {/* Image preview */}
      {previewDataUrl && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Imagem Analisada</p>
          <img
            src={previewDataUrl}
            alt="Mancha de óleo analisada"
            className="w-48 h-48 rounded-full object-cover border-4 border-surface-700 shadow-xl"
          />
          <p className="text-xs text-gray-500">{new Date(analyzedAt).toLocaleString('pt-BR')}</p>
        </div>
      )}

      {/* Rings analysis */}
      {analysis.rings?.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Análise dos Anéis Cromatográficos
          </h3>
          <div className="flex flex-col gap-3">
            {analysis.rings.map((ring, i) => (
              <div key={i} className="bg-surface-800 rounded-xl p-4 border border-surface-600">
                <div className="flex items-center gap-2 mb-2">
                  <RingIcon index={i} />
                  <span className="font-semibold text-sm capitalize">{ring.zone}</span>
                  <span className="ml-auto text-xs text-gray-500 font-mono">{ring.color}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{ring.interpretation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contaminants */}
      {analysis.contaminants?.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Contaminantes e Indicadores
          </h3>
          <div className="flex flex-col gap-2">
            {analysis.contaminants.map((c, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl p-3 border ${
                  c.detected
                    ? c.severity === 'alta'
                      ? 'bg-red-900/20 border-red-800'
                      : c.severity === 'media'
                      ? 'bg-amber-900/20 border-amber-800'
                      : 'bg-blue-900/20 border-blue-800'
                    : 'bg-surface-800 border-surface-600 opacity-60'
                }`}
              >
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  !c.detected ? 'bg-gray-600' :
                  c.severity === 'alta' ? 'bg-red-400' :
                  c.severity === 'media' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      !c.detected ? 'bg-surface-700 text-gray-500' :
                      c.severity === 'alta' ? 'bg-red-900/50 text-red-300' :
                      c.severity === 'media' ? 'bg-amber-900/50 text-amber-300' :
                      'bg-blue-900/50 text-blue-300'
                    }`}>
                      {c.detected ? c.severity : 'não detectado'}
                    </span>
                  </div>
                  {c.explanation && (
                    <p className="text-xs text-gray-400 leading-relaxed">{c.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Educational summary */}
      {analysis.educationalSummary && (
        <section className="bg-surface-800 rounded-2xl p-5 border border-surface-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-oil-gold text-lg">📚</span>
            <h3 className="text-sm font-semibold text-oil-gold uppercase tracking-widest">Explicação Educativa</h3>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{analysis.educationalSummary}</p>
        </section>
      )}

      {/* Recommendation */}
      {analysis.recommendation && (
        <section className={`rounded-2xl p-5 border-l-4 ${condition.borderColor} bg-surface-800`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Recomendação</p>
          <p className="text-sm font-medium text-white leading-relaxed">{analysis.recommendation}</p>
        </section>
      )}

      {/* Reference info */}
      {analysis.referenceInfo && (
        <section className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Sobre o Método</p>
          <p className="text-xs text-gray-400 leading-relaxed">{analysis.referenceInfo}</p>
          {analysis.oilType && (
            <p className="text-xs text-gray-500 mt-2">
              <span className="text-gray-400">Tipo de óleo inferido:</span> {analysis.oilType}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function RingIcon({ index }) {
  const colors = ['#D4A017', '#B8860B', '#F5F0E8']
  const sizes = [10, 14, 18]
  return (
    <div className="relative flex items-center justify-center" style={{ width: 22, height: 22 }}>
      <div className="rounded-full border-2 border-surface-500" style={{ width: sizes[index], height: sizes[index], backgroundColor: colors[index] + '40', borderColor: colors[index] }} />
    </div>
  )
}
