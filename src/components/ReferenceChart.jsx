import { SPOT_TEST_ZONES } from '../utils/oilConditions.js'

export default function ReferenceChart() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-400 leading-relaxed">
        O <strong className="text-white">Blotter Spot Test</strong> (ASTM D7843) é um método qualitativo rápido
        para avaliar a condição de óleos lubrificantes em campo. Uma gota de óleo é aplicada em papel cromatográfico
        e analisada após 24h pelas zonas de difusão formadas.
      </p>

      {/* Visual reference */}
      <div className="flex justify-center my-2">
        <SpotDiagram />
      </div>

      {/* Zone table */}
      <div className="flex flex-col gap-3">
        {SPOT_TEST_ZONES.map((zone, i) => (
          <div key={i} className="bg-surface-800 rounded-xl p-4 border border-surface-600">
            <div className="flex items-center gap-2 mb-3">
              <ZoneBadge index={i} />
              <h4 className="font-semibold text-sm">{zone.zone}</h4>
            </div>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">{zone.description}</p>
            <div className="grid grid-cols-3 gap-2">
              <ConditionCell label="Bom" value={zone.healthy} color="emerald" />
              <ConditionCell label="Atenção" value={zone.warning} color="amber" />
              <ConditionCell label="Crítico" value={zone.critical} color="red" />
            </div>
          </div>
        ))}
      </div>

      {/* How to perform the test */}
      <div className="bg-surface-800 rounded-xl p-4 border border-oil-gold/20 mt-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-oil-gold">🔬</span>
          <h4 className="font-semibold text-sm text-oil-gold">Como realizar o teste</h4>
        </div>
        <ol className="flex flex-col gap-2">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-oil-gold/20 text-oil-gold text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <p className="text-xs text-gray-300 leading-relaxed pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

const STEPS = [
  'Use papel de filtro cromatográfico ou papel absorvente de gramatura uniforme (ex: papel Whatman nº 1).',
  'Coleta uma gota de óleo (aprox. 0,05 mL) com seringa ou conta-gotas e deposite no centro do papel.',
  'Aguarde de 1 a 24 horas em superfície plana, à temperatura ambiente, longe de vibração.',
  'Fotografe a mancha com boa iluminação uniforme, preferencialmente luz difusa natural ou LED branco.',
  'Use o DripView para capturar e enviar a imagem para análise com IA GROK.',
  'Compare com o resultado anterior do mesmo equipamento para detectar tendências de degradação.'
]

function ConditionCell({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-900/20',
    amber: 'text-amber-400 bg-amber-900/20',
    red: 'text-red-400 bg-red-900/20'
  }
  return (
    <div className={`rounded-lg p-2 ${colors[color]}`}>
      <p className={`text-xs font-semibold mb-1 ${colors[color].split(' ')[0]}`}>{label}</p>
      <p className="text-xs text-gray-300 leading-tight">{value}</p>
    </div>
  )
}

function ZoneBadge({ index }) {
  const bg = ['bg-oil-gold/30 border-oil-gold', 'bg-oil-amber/30 border-oil-amber', 'bg-gray-200/20 border-gray-400']
  return (
    <span className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${bg[index]}`} />
  )
}

function SpotDiagram() {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-xl">
      {/* Paper */}
      <circle cx="90" cy="90" r="85" fill="#F5F0E8" opacity="0.95" />
      {/* Outer halo */}
      <circle cx="90" cy="90" r="72" fill="#E8D5A0" />
      {/* Diffusion ring */}
      <circle cx="90" cy="90" r="52" fill="#B8860B" opacity="0.85" />
      {/* Core */}
      <circle cx="90" cy="90" r="28" fill="#5C3A1E" />
      {/* Center drop */}
      <circle cx="90" cy="90" r="10" fill="#1A0A00" />
      {/* Labels */}
      <text x="90" y="14" textAnchor="middle" fill="#9CA3AF" fontSize="8" fontFamily="monospace">Halo externo</text>
      <line x1="90" y1="18" x2="90" y2="20" stroke="#9CA3AF" strokeWidth="0.5" />
      <text x="155" y="58" textAnchor="start" fill="#9CA3AF" fontSize="8" fontFamily="monospace">Difusão</text>
      <line x1="142" y1="60" x2="150" y2="60" stroke="#9CA3AF" strokeWidth="0.5" />
      <text x="90" y="166" textAnchor="middle" fill="#9CA3AF" fontSize="8" fontFamily="monospace">Núcleo</text>
      <line x1="90" y1="162" x2="90" y2="118" stroke="#9CA3AF" strokeWidth="0.5" />
    </svg>
  )
}
