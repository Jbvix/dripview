import { useEffect, useRef } from 'react'
import { useCamera } from '../hooks/useCamera.js'

export default function Camera({ onCapture, onFileSelect }) {
  const { videoRef, isActive, error, hasMultipleCameras, startCamera, stopCamera, captureFrame, flipCamera, torchOn, hasTorch, toggleTorch } = useCamera()
  const fileInputRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  function handleCapture() {
    const dataUrl = captureFrame()
    if (dataUrl) onCapture(dataUrl)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl overflow-hidden bg-surface-800 aspect-square max-w-sm mx-auto w-full">

        {/*
          Video is ALWAYS in the DOM and never hidden.
          play() must be called on a visible element on Android Chrome.
          Overlay states are absolutely positioned on top of it.
        */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Loading overlay */}
        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
            <div className="w-8 h-8 border-2 border-t-oil-gold border-surface-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {!isActive && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-surface-800">
            <span className="text-3xl">📷</span>
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-oil-gold text-surface-900 rounded-xl text-sm font-bold"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Guide overlay — only when video is playing */}
        {isActive && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border-2 border-dashed border-oil-gold/60" />
              <div className="absolute w-2 h-2 rounded-full bg-oil-gold/80" />
            </div>
            {/* Torch toggle — top-right corner */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  torchOn
                    ? 'bg-yellow-400 text-surface-900 shadow-lg shadow-yellow-400/50'
                    : 'bg-black/50 text-white/80'
                }`}
                aria-label={torchOn ? 'Desligar lanterna' : 'Ligar lanterna'}
              >
                <TorchIcon on={torchOn} />
              </button>
            )}
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded-full">
                Centralize a mancha de óleo no círculo
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 px-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors"
          aria-label="Carregar da galeria"
        >
          <span className="text-xl">🖼️</span>
          <span className="text-xs text-gray-400">Galeria</span>
        </button>

        <button
          onClick={handleCapture}
          disabled={!isActive}
          className="w-20 h-20 rounded-full bg-oil-gold hover:bg-oil-amber disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-oil-gold/30 flex items-center justify-center"
          aria-label="Capturar foto"
        >
          <div className="w-14 h-14 rounded-full border-4 border-oil-dark/50" />
        </button>

        <button
          onClick={flipCamera}
          disabled={!hasMultipleCameras}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-700 hover:bg-surface-600 disabled:opacity-30 transition-colors"
          aria-label="Inverter câmera"
        >
          <span className="text-xl">🔄</span>
          <span className="text-xs text-gray-400">Virar</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

function TorchIcon({ on }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8l1 6H7L8 2z" />
      <path d="M7 8l-2 14h14L17 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      {on && <line x1="12" y1="2" x2="12" y2="0" stroke="currentColor" strokeWidth="2" />}
      {on && <line x1="18" y1="5" x2="20" y2="3" stroke="currentColor" strokeWidth="2" />}
      {on && <line x1="6" y1="5" x2="4" y2="3" stroke="currentColor" strokeWidth="2" />}
    </svg>
  )
}
