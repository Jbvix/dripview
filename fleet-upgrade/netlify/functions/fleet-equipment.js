// fleet-equipment.js — CRUD for equipment within caller's org
// GET    /.netlify/functions/fleet-equipment            → list
// POST   /.netlify/functions/fleet-equipment            → create
// PATCH  /.netlify/functions/fleet-equipment?id=xxx     → update
// DELETE /.netlify/functions/fleet-equipment?id=xxx     → deactivate
// Authorization: Bearer <supabase_access_token>

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const handler = async (event) => {
  const token = (event.headers.authorization ?? '').replace('Bearer ', '').trim()
  if (!token) return resp(401, { error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return resp(401, { error: 'Invalid token' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user.id).single()
  if (!profile) return resp(403, { error: 'Profile not found' })

  const { org_id, role } = profile
  const id = event.queryStringParameters?.id

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('equipment')
      .select('id, name, vessel, engine_model, oil_spec, oil_capacity_liters, max_hours_between_changes, active, notes')
      .eq('org_id', org_id)
      .order('vessel')
    if (error) return resp(500, { error: error.message })
    return resp(200, data)
  }

  // Write operations require supervisor or admin role
  if (!['supervisor', 'admin'].includes(role)) {
    return resp(403, { error: 'Insufficient permissions' })
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody(event.body)
    const { data, error } = await supabaseAdmin
      .from('equipment')
      .insert({ ...body, org_id })
      .select().single()
    if (error) return resp(400, { error: error.message })
    return resp(201, data)
  }

  if (!id) return resp(400, { error: 'id required' })

  if (event.httpMethod === 'PATCH') {
    const body = parseBody(event.body)
    const { data, error } = await supabaseAdmin
      .from('equipment')
      .update(body)
      .eq('id', id).eq('org_id', org_id)
      .select().single()
    if (error) return resp(400, { error: error.message })
    return resp(200, data)
  }

  if (event.httpMethod === 'DELETE') {
    // Soft delete — keeps historical analyses intact
    const { error } = await supabaseAdmin
      .from('equipment')
      .update({ active: false })
      .eq('id', id).eq('org_id', org_id)
    if (error) return resp(400, { error: error.message })
    return resp(200, { deactivated: true })
  }

  return resp(405, { error: 'Method not allowed' })
}

function resp(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

function parseBody(raw) {
  try { return JSON.parse(raw) } catch { return {} }
}
