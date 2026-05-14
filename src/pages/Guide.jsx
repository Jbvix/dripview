import { useNavigate } from 'react-router-dom'
import ReferenceChart from '../components/ReferenceChart.jsx'

export default function Guide() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top py-4 border-b border-surface-700 sticky top-0 bg-surface-900/95 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-700 transition-colors">←</button>
        <h1 className="font-semibold">Guia do Teste de Mancha</h1>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Intro */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-1">Blotter Spot Test</h2>
          <p className="text-xs text-gray-500 font-mono mb-4">Análise Cromatográfica Qualitativa de Campo</p>

          <div className="bg-surface-800 rounded-xl p-4 border border-oil-gold/20 mb-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              O teste de mancha por gota é uma técnica simples, rápida e de baixo custo para avaliar
              a condição de óleos lubrificantes em campo. Ao depositar uma gota de óleo em papel
              cromatográfico, os componentes se separam por capilaridade, revelando informações
              sobre contaminantes, aditivos e degradação.
            </p>
          </div>
        </div>

        <ReferenceChart />

        {/* Educational section: tribology basics */}
        <div className="mt-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Fundamentos de Tribologia</h3>

          {TRIBOLOGY_CONCEPTS.map((concept, i) => (
            <details key={i} className="bg-surface-800 rounded-xl border border-surface-600 group">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{concept.icon}</span>
                  <span className="font-medium text-sm">{concept.title}</span>
                </div>
                <span className="text-gray-500 text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 border-t border-surface-700 pt-3">
                <p className="text-sm text-gray-300 leading-relaxed">{concept.content}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Limitations */}
        <div className="mt-6 bg-amber-900/20 border border-amber-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>⚠️</span>
            <h4 className="text-sm font-semibold text-amber-400">Limitações do Método</h4>
          </div>
          <ul className="text-xs text-gray-300 leading-relaxed space-y-1">
            <li>• Método qualitativo: não substitui análise laboratorial quantitativa (ICP, FTIR, TAN, TBN)</li>
            <li>• A qualidade do papel afeta os resultados — use sempre o mesmo tipo para comparações</li>
            <li>• Temperatura e umidade ambiente influenciam a difusão</li>
            <li>• Óleos sintéticos apresentam padrões diferentes dos minerais</li>
            <li>• A IA analisa com base em padrões visuais — mantenha boa iluminação e foco</li>
          </ul>
        </div>

        <div className="mt-6 pb-6">
          <button
            onClick={() => navigate('/capture')}
            className="w-full py-4 rounded-2xl bg-oil-gold hover:bg-oil-amber font-bold text-surface-900 text-base transition-all active:scale-[0.98]"
          >
            Iniciar Análise Agora
          </button>
        </div>
      </div>
    </div>
  )
}

const TRIBOLOGY_CONCEPTS = [
  {
    icon: '🛢️',
    title: 'O que o óleo faz',
    content: 'O lubrificante cria uma película protetora entre superfícies em movimento, reduzindo atrito, dissipando calor, removendo partículas de desgaste e protegendo contra corrosão. Sua degradação compromete todos esses mecanismos simultaneamente.'
  },
  {
    icon: '🌡️',
    title: 'Oxidação e temperatura',
    content: 'Altas temperaturas aceleram exponencialmente a oxidação do óleo (regra de van\'t Hoff: a cada 10°C a mais, a taxa de oxidação dobra). O óleo oxidado forma depósitos, aumenta viscosidade e perde proteção antidesgaste. No teste de mancha, a oxidação aparece como coloração marrom-escura uniforme.'
  },
  {
    icon: '💧',
    title: 'Contaminação por água',
    content: 'A água provoca corrosão eletroquímica, emulsificação do óleo e falha da película lubrificante. Em rolamentos, concentrações acima de 0,1% são críticas. No papel cromatográfico, a água fica no anel externo como halo branco-leitoso opaco, pois não se dissolve nos hidrocarbonetos.'
  },
  {
    icon: '⚙️',
    title: 'Partículas de desgaste',
    content: 'Metais como ferro, cobre, alumínio e chumbo são liberados pelo desgaste de componentes. Partículas ferrosas abrasivas criam um ciclo autodestrutivo — desgastam mais enquanto circulam. No teste, aparecem como pontos escuros no núcleo central ou anéis cinza-prateados.'
  },
  {
    icon: '🧪',
    title: 'Aditivos e sua depleção',
    content: 'Aditivos antidesgaste (ZDDP), antioxidantes, detergentes, dispersantes e inibidores de corrosão têm vida útil limitada. Quando se esgotam, o óleo perde suas propriedades de proteção mesmo que ainda pareça "limpo" visualmente. O teste de mancha pode indicar depleção pela ausência de anel de difusão claro.'
  },
  {
    icon: '📊',
    title: 'Intervalo de troca',
    content: 'Não existe intervalo universal — depende do tipo de equipamento, regime de trabalho, tipo de óleo e qualidade do filtro. O monitoramento por análise de óleo (OA) permite estender intervalos com segurança ou antecipar trocas quando necessário, reduzindo custos e falhas.'
  }
]
