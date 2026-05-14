// Image pre-processing pipeline: resize, enhance, extract color data, export base64
import { cropToCenter, enhanceContrast, canvasToBase64, analyzeImageColors } from '../utils/colorAnalysis.js'

export async function processImageFile(file) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d').drawImage(bitmap, 0, 0)

  return processCanvas(canvas, file.type)
}

export async function processImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      processCanvas(canvas, 'image/jpeg').then(resolve).catch(reject)
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

async function processCanvas(canvas, originalMimeType) {
  const cropped = cropToCenter(canvas, 800)
  enhanceContrast(cropped, 1.2)

  const colorData = analyzeImageColors(cropped)

  // Export at 512px — enough detail for spot analysis, keeps payload small
  const exportCanvas = cropToCenter(cropped, 512)
  const base64 = canvasToBase64(exportCanvas, 0.82)
  const previewDataUrl = exportCanvas.toDataURL('image/jpeg', 0.7)

  return {
    imageBase64: base64,
    mimeType: 'image/jpeg',
    previewDataUrl,
    colorData,
    originalDimensions: { width: canvas.width, height: canvas.height }
  }
}
