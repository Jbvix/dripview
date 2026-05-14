import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const cameras = devices.filter(d => d.kind === 'videoinput')
      setHasMultipleCameras(cameras.length > 1)
    }).catch(() => {})
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    setIsActive(false)
    setTorchOn(false)
    setHasTorch(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Permita o acesso nas configurações do navegador.')
        return
      }
      if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      } catch (e2) {
        if (e2.name === 'NotAllowedError') {
          setError('Permissão de câmera negada. Permita o acesso nas configurações do navegador.')
        } else {
          setError(`Erro ao acessar câmera: ${e2.message}`)
        }
        return
      }
    }

    streamRef.current = stream

    // Detect torch support from track capabilities
    const track = stream.getVideoTracks()[0]
    if (track) {
      const caps = track.getCapabilities?.()
      if (caps?.torch) setHasTorch(true)
    }

    const video = videoRef.current
    if (!video) return

    video.srcObject = stream
    video.addEventListener('canplay', () => setIsActive(true), { once: true })

    try {
      await video.play()
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(`Erro ao reproduzir câmera: ${e.message}`)
      }
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setTorchOn(false)
    setHasTorch(false)
  }, [])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] })
      setTorchOn(next)
    } catch {
      // torch not supported on this device/browser — silently ignore
    }
  }, [torchOn])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !streamRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  return {
    videoRef, isActive, error,
    hasMultipleCameras, startCamera, stopCamera, captureFrame, flipCamera, facingMode,
    torchOn, hasTorch, toggleTorch
  }
}
