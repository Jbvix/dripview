import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-surface-800 to-surface-900 px-6 pt-16 pb-10">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-8 left-8 w-32 h-32 rounded-full border border-oil-gold" />
          <div className="absolute top-16 left-16 w-16 h-16 rounded-full border border-oil-gold" />
          <div className="absolute bottom-4 right-8 w-48 h-48 rounded-full border border-oil-gold/50" />
        </div>
        <div className="relative text-center">
          <div className="flex justify-center mb-4">
            <SpotIcon size={80} />
          </div>
          <h1 className="text-4xl font-bold mb-1">
            Drip<span className="text-oil-gold">View</span>
          </h1>
          <p className="text-sm text-gray-400 font-mono tracking-widest uppercase mb-4">
            Oil Analysis by AI
          </p>
          <p className="text-sm text-gray-300 max-w-xs mx-auto leading-relaxed">
            Analise a condição do seu óleo lubrificante com câmera e inteligência artificial GROK.
            Educativo, rápido e acessível em campo.
          </p>
        </div>
      </div>

      {/* Main CTA */}
      <div className="px-6 py-6 flex flex-col gap-3">
        <button
          onClick={() => navigate('/capture')}
          className="w-full py-4 rounded-2xl bg-oil-gold hover:bg-oil-amber active:scale-[0.98] transition-all font-bold text-surface-900 text-lg shadow-lg shadow-oil-gold/20 flex items-center justify-center gap-3"
        >
          <span>📷</span> Nova Análise
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/history')}
            className="py-3 rounded-xl bg-surface-700 hover:bg-surface-600 active:scale-[0.98] transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>📋</span> Histórico
          </button>
          <button
            onClick={() => navigate('/guide')}
            className="py-3 rounded-xl bg-surface-700 hover:bg-surface-600 active:scale-[0.98] transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>📚</span> Guia do Teste
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="px-6 pb-6 flex flex-col gap-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest text-center">Recursos</p>
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-start gap-4 bg-surface-800 rounded-xl p-4 border border-surface-600">
            <span className="text-2xl flex-shrink-0">{f.icon}</span>
            <div>
              <p className="font-semibold text-sm mb-0.5">{f.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto px-6 py-4 border-t border-surface-700 text-center">
        <p className="text-xs text-gray-600">
          Análise educativa com <span className="text-oil-gold">GROK Vision</span> (xAI) · Dados armazenados localmente
        </p>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: '🔬',
    title: 'Blotter Spot Test',
    desc: 'Método cromatográfico qualitativo baseado no ASTM D7843 para análise de campo.'
  },
  {
    icon: '🤖',
    title: 'IA GROK Vision',
    desc: 'Análise visual por modelo multimodal de última geração da xAI, com explicação educativa detalhada.'
  },
  {
    icon: '📴',
    title: 'Funciona Offline',
    desc: 'Histórico de análises disponível sem internet. Análise requer conexão apenas no momento do envio.'
  },
  {
    icon: '🎓',
    title: 'Conteúdo Educativo',
    desc: 'Cada resultado explica os fundamentos tribológicos para aprendizado contínuo.'
  }
]

function SpotIcon({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="28" fill="#F5F0E8" opacity="0.15" />
      <circle cx="30" cy="30" r="22" fill="#B8860B" opacity="0.5" />
      <circle cx="30" cy="30" r="13" fill="#D4A017" opacity="0.8" />
      <circle cx="30" cy="30" r="5" fill="#1A0A00" />
    </svg>
  )
}
