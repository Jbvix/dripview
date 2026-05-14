# Licenças de Terceiros — DripView

DripView utiliza os seguintes pacotes e serviços de terceiros. Todos os pacotes npm listados são
distribuídos sob licença MIT, compatível com a licença MIT do projeto.

---

## Dependências de Runtime

| Pacote | Versão | Licença | Titular |
|---|---|---|---|
| react | ^18.3.1 | MIT | Meta Platforms, Inc. |
| react-dom | ^18.3.1 | MIT | Meta Platforms, Inc. |
| react-router-dom | ^6.26.1 | MIT | Remix Software, Inc. |
| idb-keyval | ^6.2.1 | Apache-2.0 | Jake Archibald / Google |

## Dependências de Build / Dev

| Pacote | Versão | Licença | Titular |
|---|---|---|---|
| vite | ^5.4.3 | MIT | Evan You |
| @vitejs/plugin-react | ^4.3.1 | MIT | Evan You |
| vite-plugin-pwa | ^0.20.5 | MIT | antfu |
| workbox-window | ^7.1.0 | MIT | Google LLC |
| tailwindcss | ^3.4.10 | MIT | Tailwind Labs, Inc. |
| postcss | ^8.4.43 | MIT | Andrey Sitnik |
| autoprefixer | ^10.4.20 | MIT | Andrey Sitnik |
| eslint | ^9.9.1 | MIT | OpenJS Foundation |

> **Nota sobre idb-keyval:** distribuído sob Apache-2.0, compatível com MIT para uso em
> software proprietário e de código aberto sem restrições adicionais relevantes ao projeto.

---

## Serviços Externos de Terceiros

### xAI GROK API
- **Fornecedor:** xAI Corp.
- **Uso:** análise de imagens via modelo `grok-4.3` (Vision)
- **Termos de serviço:** https://x.ai/legal/terms-of-service
- **Política de privacidade:** https://x.ai/legal/privacy-policy
- **Dados transmitidos:** imagens capturadas pelo usuário, enviadas exclusivamente durante
  a solicitação de análise. Não há armazenamento persistente de imagens no servidor.

### Netlify
- **Fornecedor:** Netlify, Inc.
- **Uso:** hospedagem estática e serverless functions (proxy da API)
- **Termos de serviço:** https://www.netlify.com/legal/terms-of-use/

### Google Fonts
- **Fontes utilizadas:** Inter, JetBrains Mono
- **Licença:** SIL Open Font License 1.1 (OFL)
- **Titular:** Inter — Rasmus Andersson; JetBrains Mono — JetBrains s.r.o.

---

## Aviso de Isenção — Análise por IA

As análises geradas pelo modelo GROK são de natureza **educativa e qualitativa**.
Não substituem análise laboratorial quantitativa (ICP, FTIR, TAN/TBN) nem laudo técnico
de profissional habilitado. O titular do copyright e os fornecedores de serviço não se
responsabilizam por decisões técnicas ou operacionais baseadas exclusivamente nos resultados
apresentados pelo aplicativo.

---

*Documento atualizado em: maio de 2026*
*Titular: Jossian Costa de Brito - Tuglife Systems*
