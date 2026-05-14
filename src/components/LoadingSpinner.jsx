export default function LoadingSpinner({ label = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-surface-700" />
        <div className="absolute inset-0 rounded-full border-4 border-t-oil-gold border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full bg-oil-dark/60 flex items-center justify-center">
          <span className="text-oil-gold text-xs font-mono">AI</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 animate-pulse">{label}</p>
    </div>
  )
}
