// fleetStorage.js — replaces src/services/storage.js when fleet mode is activated
// Saves to IndexedDB first (offline-safe), then enqueues Supabase sync.
// Drop-in: same saveAnalysis / getAnalyses / getAnalysis signature as storage.js

import { set, get, keys, del } from 'idb-keyval'
import { supabase } from './supabaseClient.js'

const ANALYSIS_PREFIX = 'analysis:'
const SYNC_QUEUE_KEY  = 'fleet:sync_queue'

// ── Public API (same shape as storage.js) ───────────────────

export async function saveAnalysis(record) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const entry = { ...record, id, savedAt: new Date().toISOString(), synced: false }

  await set(`${ANALYSIS_PREFIX}${id}`, entry)
  await enqueueSync(id)
  triggerSync()   // fire-and-forget; will retry on next open if offline
  return entry
}

export async function getAnalyses() {
  const allKeys = await keys()
  const analysisKeys = allKeys.filter(k => String(k).startsWith(ANALYSIS_PREFIX))
  const items = await Promise.all(analysisKeys.map(k => get(k)))
  return items.filter(Boolean).sort((a, b) => b.analyzedAt?.localeCompare(a.analyzedAt))
}

export async function getAnalysis(id) {
  return get(`${ANALYSIS_PREFIX}${id}`)
}

export async function deleteAnalysis(id) {
  await del(`${ANALYSIS_PREFIX}${id}`)
}

// ── Equipment helpers ─────────────────────────────────────────

export async function getEquipmentList() {
  const { data, error } = await supabase
    .from('equipment')
    .select('id, name, vessel, engine_model, oil_spec')
    .eq('active', true)
    .order('vessel')
  if (error) throw new Error(error.message)
  return data
}

export async function getEquipmentHistory(equipmentId, limit = 8) {
  const { data, error } = await supabase
    .from('analyses')
    .select('analyzed_at, condition, score, color_data, reference_color_data, user_notes, is_comparative')
    .eq('equipment_id', equipmentId)
    .order('analyzed_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Offline sync queue ────────────────────────────────────────

async function enqueueSync(analysisId) {
  const queue = (await get(SYNC_QUEUE_KEY)) ?? []
  if (!queue.includes(analysisId)) {
    await set(SYNC_QUEUE_KEY, [...queue, analysisId])
  }
}

export async function triggerSync() {
  if (!navigator.onLine) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const queue = (await get(SYNC_QUEUE_KEY)) ?? []
  if (queue.length === 0) return

  const remaining = []
  for (const id of queue) {
    const record = await get(`${ANALYSIS_PREFIX}${id}`)
    if (!record || record.synced) continue
    try {
      await pushToSupabase(record, user.id)
      await set(`${ANALYSIS_PREFIX}${id}`, { ...record, synced: true })
    } catch {
      remaining.push(id)
    }
  }
  await set(SYNC_QUEUE_KEY, remaining)
}

async function pushToSupabase(record, userId) {
  // Upload images to Storage, then insert analysis row
  const orgId = await getCurrentOrgId(userId)
  const imageUrl = record.previewDataUrl
    ? await uploadImage(orgId, record.id, record.previewDataUrl, 'spot.jpg')
    : null
  const refImageUrl = record.referencePreviewDataUrl
    ? await uploadImage(orgId, record.id, record.referencePreviewDataUrl, 'ref.jpg')
    : null

  const { error } = await supabase.from('analyses').insert({
    id:                   record.id,
    equipment_id:         record.equipmentId,
    user_id:              userId,
    analyzed_at:          record.analyzedAt,
    condition:            record.analysis?.condition ?? 'atencao',
    score:                record.analysis?.score ?? null,
    color_data:           record.colorData ?? null,
    reference_color_data: record.referenceColorData ?? null,
    analysis_json:        record.analysis ?? {},
    image_url:            imageUrl,
    reference_image_url:  refImageUrl,
    is_comparative:       record.isComparative ?? false,
    user_notes:           record.userNotes ?? null,
    device_id:            getDeviceId()
  })
  if (error) throw new Error(error.message)
}

async function uploadImage(orgId, analysisId, dataUrl, filename) {
  const base64 = dataUrl.split(',')[1]
  const bytes   = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const path    = `${orgId}/${analysisId}/${filename}`
  const { error } = await supabase.storage
    .from('analysis-images')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(error.message)
  return path
}

async function getCurrentOrgId(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .single()
  return data?.org_id
}

function getDeviceId() {
  let id = localStorage.getItem('dripview:device_id')
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('dripview:device_id', id)
  }
  return id
}

// Auto-sync when connection is restored
window.addEventListener('online', () => triggerSync())
