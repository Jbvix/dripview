// fleet-history.js — returns last N analyses for an equipment + built RAG context
// GET /.netlify/functions/fleet-history?equipment_id=xxx&limit=8
// Authorization: Bearer <supabase_access_token>

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service role — bypasses RLS for server reads
)

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Verify caller token via Supabase Auth
  const token = (event.headers.authorization ?? '').replace('Bearer ', '').trim()
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }

  const equipmentId = event.queryStringParameters?.equipment_id
  const limit       = Math.min(parseInt(event.queryStringParameters?.limit ?? '8', 10), 20)

  if (!equipmentId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'equipment_id required' }) }
  }

  // Verify equipment belongs to caller's org (RLS-equivalent server-side check)
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id').eq('id', user.id).single()

  const { data: eq } = await supabaseAdmin
    .from('equipment').select('id, org_id, name, engine_model, oil_spec')
    .eq('id', equipmentId).single()

  if (!eq || eq.org_id !== profile?.org_id) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Access denied' }) }
  }

  // Fetch history
  const { data: rows, error } = await supabaseAdmin
    .from('analyses')
    .select('analyzed_at, condition, score, color_data, reference_color_data, user_notes, is_comparative')
    .eq('equipment_id', equipmentId)
    .order('analyzed_at', { ascending: false })
    .limit(limit)

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) }

  // Build RAG context string for KRATOS prompt
  const historyContext = buildHistoryContext(rows ?? [], eq)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history: rows ?? [], historyContext, equipment: eq })
  }
}

function buildHistoryContext(history, equipment) {
  if (!history.length) return ''

  const lines = [
    `Histórico do equipamento: ${equipment.name} (${equipment.engine_model ?? 'motor diesel'})`,
    `${history.length} análise(s) anteriores (mais recente primeiro):`
  ]

  for (const h of history) {
    const date    = new Date(h.analyzed_at).toLocaleDateString('pt-BR')
    const nuc     = h.color_data?.nucleo
    const nucInfo = nuc ? `, núcleo escuridão=${(nuc.darkness * 100).toFixed(0)}%, hex=${nuc.hex}` : ''
    lines.push(`  • ${date}: condição=${h.condition}, score=${h.score ?? '—'}${nucInfo}`)
  }

  const scores = history.map(h => h.score).filter(Number.isFinite).reverse()
  if (scores.length >= 2) {
    const delta = scores[scores.length - 1] - scores[0]
    const trend = delta < -15 ? 'degradação acelerada ⚠' : delta < -5 ? 'degradação gradual' : 'estável'
    lines.push(`Tendência de score: ${scores.join(' → ')} — ${trend}`)
  }

  const darknesses = history
    .map(h => h.color_data?.nucleo?.darkness)
    .filter(v => typeof v === 'number')
    .reverse()
  if (darknesses.length >= 2) {
    const perCycle = ((darknesses[darknesses.length - 1] - darknesses[0]) / (darknesses.length - 1) * 100).toFixed(1)
    lines.push(`Escuridão do núcleo: +${perCycle}% por ciclo em média`)
  }

  lines.push('Use este histórico para calibrar o score relativo ao baseline do equipamento e identificar aceleração de degradação.')
  return lines.join('\n')
}
