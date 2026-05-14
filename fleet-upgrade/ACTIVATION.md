# DripView Fleet — Guia de Ativação

Ative este módulo quando a operação exigir múltiplos usuários e/ou múltiplos
equipamentos com histórico centralizado e curva de aprendizado por frota.

Tempo estimado de ativação: **2–4 horas** com acesso ao Netlify e Supabase.

---

## Pré-requisitos

- Conta Netlify (projeto DripView já hospedado)
- Conta Supabase (gratuita em supabase.com)
- Node.js 20+ localmente

---

## Passo 1 — Criar projeto Supabase

1. Acesse https://supabase.com → New project
2. Nome: `dripview-fleet`  |  Região: South America (São Paulo)
3. Anote: **Project URL** e **anon key** (Settings → API)
4. Anote: **service_role key** (Settings → API → Project API keys)

---

## Passo 2 — Executar schema do banco

1. Supabase Dashboard → SQL Editor → New query
2. Cole o conteúdo de `fleet-upgrade/schema.sql`
3. Execute (Run)
4. Verifique: Tables → deve existir `organizations`, `profiles`, `equipment`, `analyses`

---

## Passo 3 — Criar bucket de imagens

1. Supabase Dashboard → Storage → New bucket
2. Nome: `analysis-images`  |  Public: **OFF** (privado)
3. Policies → New policy → For authenticated users:
   - Allowed operation: SELECT, INSERT
   - Policy definition:
     ```sql
     bucket_id = 'analysis-images'
     AND (storage.foldername(name))[1] = (
       SELECT org_id::text FROM profiles WHERE id = auth.uid()
     )
     ```

---

## Passo 4 — Criar organização e primeiro admin

No SQL Editor do Supabase:

```sql
-- 1. Inserir a organização
INSERT INTO organizations (name, port)
VALUES ('Nome da Empresa Portuária', 'Porto de Santos')
RETURNING id;  -- anote o UUID retornado

-- 2. Criar o usuário admin via Supabase Auth (Authentication → Users → Invite)
--    E-mail: admin@empresa.com.br
--    Após criação, anote o user UUID

-- 3. Criar o perfil admin manualmente (substitua os UUIDs)
INSERT INTO profiles (id, org_id, name, role)
VALUES (
  '<user-uuid-do-auth>',
  '<org-uuid-do-passo-1>',
  'Nome do Administrador',
  'admin'
);
```

Para adicionar operadores, use Authentication → Users → Invite e insira o
`org_id` em `raw_user_meta_data` — o trigger criará o perfil automaticamente:

```json
{ "org_id": "<org-uuid>", "name": "João Maquinista", "role": "operator" }
```

---

## Passo 5 — Configurar variáveis de ambiente

### Netlify (Functions)

Netlify Dashboard → Site → Environment variables → Add:

```
SUPABASE_URL          = https://xxxx.supabase.co
SUPABASE_SERVICE_KEY  = eyJ...  (service_role key — nunca expor no front)
```

As variáveis `GROK_API_KEY` já existem — mantenha-as.

### Local (.env) — para desenvolvimento

Crie `.env` na raiz (já está no .gitignore):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  (anon key — segura para o front)
```

---

## Passo 6 — Instalar dependência

```bash
npm install @supabase/supabase-js
```

---

## Passo 7 — Copiar arquivos do scaffold

```bash
# Serviços
cp fleet-upgrade/src/services/supabaseClient.js  src/services/
cp fleet-upgrade/src/services/fleetStorage.js    src/services/

# Hook
cp fleet-upgrade/src/hooks/useEquipment.js       src/hooks/

# Páginas
cp fleet-upgrade/src/pages/Login.jsx             src/pages/
cp fleet-upgrade/src/pages/Equipment.jsx         src/pages/

# Netlify functions
cp fleet-upgrade/netlify/functions/fleet-history.js   netlify/functions/
cp fleet-upgrade/netlify/functions/fleet-equipment.js netlify/functions/
```

---

## Passo 8 — Atualizar src/App.jsx

Adicione as rotas e o guard de autenticação:

```jsx
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './services/supabaseClient.js'
import Login     from './pages/Login.jsx'
import Equipment from './pages/Equipment.jsx'
// ... demais imports existentes

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null  // loading splash

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      {!session && <Route path="*" element={<Navigate to="/login" />} />}
      <Route path="/"         element={<Home />} />
      <Route path="/equipment" element={<Equipment />} />
      <Route path="/capture"  element={<Capture />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/history"  element={<History />} />
      <Route path="/guide"    element={<Guide />} />
    </Routes>
  )
}
```

---

## Passo 9 — Substituir storage.js por fleetStorage.js

Em `src/hooks/useAnalysis.js`, troque a importação:

```js
// Antes:
import { saveAnalysis } from '../services/storage.js'

// Depois:
import { saveAnalysis } from '../services/fleetStorage.js'
```

---

## Passo 10 — Injetar histórico no analyze.js (RAG)

Em `netlify/functions/analyze.js`, adicione chamada ao histórico antes de
montar o payload para o KRATOS. Acrescente ao início do handler:

```js
// Fetch equipment history for RAG context
let historyContext = ''
if (body.equipmentId) {
  try {
    const histUrl = `${process.env.URL}/.netlify/functions/fleet-history`
      + `?equipment_id=${body.equipmentId}&limit=8`
    const histRes = await fetch(histUrl, {
      headers: { Authorization: event.headers.authorization ?? '' }
    })
    if (histRes.ok) {
      const histData = await histRes.json()
      historyContext = histData.historyContext ?? ''
    }
  } catch {}
}
```

E inclua `historyContext` no `userText`:

```js
const userText = [
  isComparative ? 'Realize análise COMPARATIVA...' : 'Analise este teste...',
  colorContext,
  historyContext,          // ← linha nova
  userNotes ? `Notas do usuário: ${userNotes}` : ''
].filter(Boolean).join('\n\n')
```

---

## Passo 11 — Passar equipmentId do front para o analyze

Em `src/services/grokApi.js`, adicione `equipmentId` ao body:

```js
export async function analyzeOilSpot({ ..., equipmentId = null }) {
  body: JSON.stringify({ ..., equipmentId })
}
```

Em `src/hooks/useAnalysis.js`, leia o equipamento selecionado:

```js
import { useEquipment } from './useEquipment.js'
// dentro do hook:
const { selected: equipment } = useEquipment()
// e passe ao analyzeOilSpot:
equipmentId: equipment?.id ?? null
```

---

## Passo 12 — Cadastrar equipamentos da frota

Com o admin logado, use o endpoint ou Supabase Dashboard → Table Editor → equipment:

```json
{
  "org_id": "<org-uuid>",
  "name": "Rebocador Atlântico — Motor Principal",
  "vessel": "Rebocador Atlântico",
  "engine_model": "Caterpillar 3512",
  "oil_spec": "SAE 40 CF-4",
  "oil_capacity_liters": 120,
  "max_hours_between_changes": 500
}
```

---

## Passo 13 — Deploy e teste

```bash
npm run build
git add -A && git commit -m "feat: activate fleet mode with Supabase"
git push origin main
```

Netlify fará o deploy automaticamente. Teste:
1. Acesse dripview.netlify.app → deve redirecionar para /login
2. Entre com as credenciais do admin
3. Selecione um equipamento → realize análise comparativa
4. Verifique em Supabase → Table Editor → analyses: registro criado
5. Realize segunda análise do mesmo equipamento e confirme que o histórico aparece no resultado

---

## Estrutura de arquivos após ativação

```
src/
├── services/
│   ├── grokApi.js          (atualizado: +equipmentId)
│   ├── fleetStorage.js     (novo: substitui storage.js)
│   ├── supabaseClient.js   (novo)
│   └── imageProcessor.js   (sem alteração)
├── hooks/
│   ├── useAnalysis.js      (atualizado: +equipmentId, +referenceSource)
│   └── useEquipment.js     (novo)
├── pages/
│   ├── Login.jsx           (novo)
│   ├── Equipment.jsx       (novo)
│   └── ...                 (sem alteração)
netlify/functions/
├── analyze.js              (atualizado: +historyContext)
├── fleet-history.js        (novo)
└── fleet-equipment.js      (novo)
```

---

*DripView Fleet — Jossian Costa de Brito · Tuglife Systems · MIT License*
