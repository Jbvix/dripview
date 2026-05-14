# DripView — Oil Analysis PWA

PWA educativo para análise de óleo lubrificante via **Blotter Spot Test** com câmera e IA GROK (xAI).

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **PWA**: vite-plugin-pwa + Workbox
- **IA**: xAI GROK Vision API (`grok-2-vision-1212`)
- **Backend**: Netlify Functions (proxy seguro da API)
- **Storage**: IndexedDB (histórico offline via idb-keyval)
- **Câmera**: MediaDevices API (`getUserMedia`)
- **Deploy**: Netlify

## Desenvolvimento local

```bash
npm install
netlify dev   # requer Netlify CLI: npm i -g netlify-cli
```

Configure `GROK_API_KEY` no arquivo `.env` local ou no dashboard do Netlify.

## Deploy (Netlify)

1. Conecte o repositório no Netlify
2. Configure a variável de ambiente `GROK_API_KEY` em **Site Settings > Environment Variables**
3. O build command e publish directory já estão configurados no `netlify.toml`

## Estrutura

```
src/
├── components/   UI components reutilizáveis
├── pages/        Páginas (Home, Capture, Analysis, History, Guide)
├── services/     grokApi.js, imageProcessor.js, storage.js
├── hooks/        useCamera.js, useAnalysis.js
└── utils/        colorAnalysis.js, oilConditions.js

netlify/functions/analyze.js   Proxy seguro para GROK API
public/manifest.json           PWA manifest
netlify.toml                   Config de build e headers
```

## Método educativo

O **Blotter Spot Test** (ASTM D7843) analisa 3 zonas cromatográficas:
- **Núcleo central**: partículas insolúveis e contaminantes pesados
- **Anel de difusão**: qualidade dos dispersantes e aditivos
- **Halo externo**: óleo base e presença de água

A IA GROK Vision interpreta essas zonas e retorna uma análise educativa estruturada em JSON.
