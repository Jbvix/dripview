// Canvas-based color analysis for blotter spot images
// Samples the image in concentric rings to extract color data before sending to GROK

export function analyzeImageColors(canvas) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.min(cx, cy) * 0.9

  const zones = [
    { label: 'nucleo', minRatio: 0, maxRatio: 0.25 },
    { label: 'difusao', minRatio: 0.25, maxRatio: 0.6 },
    { label: 'halo', minRatio: 0.6, maxRatio: 1.0 }
  ]

  const results = {}

  for (const zone of zones) {
    const samples = []
    const count = 200

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const ratio = zone.minRatio + Math.random() * (zone.maxRatio - zone.minRatio)
      const r = ratio * maxR
      const x = Math.round(cx + Math.cos(angle) * r)
      const y = Math.round(cy + Math.sin(angle) * r)

      if (x < 0 || y < 0 || x >= width || y >= height) continue

      const pixel = ctx.getImageData(x, y, 1, 1).data
      samples.push({ r: pixel[0], g: pixel[1], b: pixel[2] })
    }

    if (samples.length === 0) {
      results[zone.label] = null
      continue
    }

    const avg = samples.reduce(
      (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
      { r: 0, g: 0, b: 0 }
    )
    avg.r = Math.round(avg.r / samples.length)
    avg.g = Math.round(avg.g / samples.length)
    avg.b = Math.round(avg.b / samples.length)

    results[zone.label] = {
      rgb: avg,
      hex: rgbToHex(avg.r, avg.g, avg.b),
      hsl: rgbToHsl(avg.r, avg.g, avg.b),
      darkness: 1 - (avg.r + avg.g + avg.b) / (3 * 255)
    }
  }

  return results
}

export function cropToCenter(sourceCanvas, targetSize = 600) {
  const s = Math.min(sourceCanvas.width, sourceCanvas.height)
  const offX = (sourceCanvas.width - s) / 2
  const offY = (sourceCanvas.height - s) / 2

  const out = document.createElement('canvas')
  out.width = targetSize
  out.height = targetSize
  const ctx = out.getContext('2d')
  ctx.drawImage(sourceCanvas, offX, offY, s, s, 0, 0, targetSize, targetSize)
  return out
}

export function enhanceContrast(canvas, factor = 1.3) {
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const intercept = 128 * (1 - factor)

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * factor + intercept)
    data[i + 1] = clamp(data[i + 1] * factor + intercept)
    data[i + 2] = clamp(data[i + 2] * factor + intercept)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export function canvasToBase64(canvas, quality = 0.85) {
  return canvas.toDataURL('image/jpeg', quality).split(',')[1]
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}
