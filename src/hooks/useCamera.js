import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const cameras = devices.filter(d => d.kind === 'videoinput')
      setHasMultipleCameras(cameras.length > 1)
    }).catch(() => {})
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    setIsActive(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    let stream
    try {
      // Use 'ideal' so browser falls back gracefully instead of throwing
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
      // Any other error: retry with bare minimum constraints
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
    const video = videoRef.current
    if (!video) return

    video.srcObject = stream

    // Set active only when video actually has frames to show
    video.addEventListener('canplay', () => setIsActive(true), { once: true })

    try {
      await video.play()
    } catch (e) {
      // AbortError is expected on fast unmount; ignore it
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
  }, [])

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

  return { videoRef, isActive, error, hasMultipleCameras, startCamera, stopCamera, captureFrame, flipCamera, facingMode }
}
