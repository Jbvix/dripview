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
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {})
        }
      }

      setIsActive(true)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Permita o acesso nas configurações do navegador.')
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.')
      } else {
        setError(`Erro ao acessar câmera: ${err.message}`)
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
    if (!videoRef.current || !isActive) return null

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [isActive])

  const flipCamera = useCallback(() => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }, [stopCamera])

  useEffect(() => {
    if (facingMode && isActive) {
      startCamera()
    }
  }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, isActive, error, hasMultipleCameras, startCamera, stopCamera, captureFrame, flipCamera, facingMode }
}
