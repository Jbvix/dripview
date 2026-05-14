import { useEffect, useRef } from 'react'
import { useCamera } from '../hooks/useCamera.js'

export default function Camera({ onCapture, onFileSelect }) {
  const { videoRef, isActive, error, hasMultipleCameras, startCamera, stopCamera, captureFrame, flipCamera } = useCamera()
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
      {/* Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden bg-surface-800 aspect-square max-w-sm mx-auto w-full">
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Overlay guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border-2 border-dashed border-oil-gold/60" />
              <div className="absolute w-2 h-2 rounded-full bg-oil-gold/80" />
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded-full">
                Centralize a mancha de óleo no círculo
              </span>
            </div>
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 p-6 text-center">
            <span className="text-3xl">📷</span>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-t-oil-gold border-surface-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 px-4">
        {/* Upload from gallery */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors"
          aria-label="Carregar da galeria"
        >
          <span className="text-xl">🖼️</span>
          <span className="text-xs text-gray-400">Galeria</span>
        </button>

        {/* Capture button */}
        <button
          onClick={handleCapture}
          disabled={!isActive}
          className="w-20 h-20 rounded-full bg-oil-gold hover:bg-oil-amber disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-oil-gold/30 flex items-center justify-center"
          aria-label="Capturar foto"
        >
          <div className="w-14 h-14 rounded-full border-4 border-oil-dark/50" />
        </button>

        {/* Flip camera */}
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
