// IndexedDB persistence via idb-keyval — stores analysis history offline
import { get, set, del, keys } from 'idb-keyval'

const PREFIX = 'dripview_analysis_'

export async function saveAnalysis(record) {
  const id = `${PREFIX}${Date.now()}`
  const entry = { ...record, id, savedAt: new Date().toISOString() }
  await set(id, entry)
  return entry
}

export async function getAllAnalyses() {
  const allKeys = await keys()
  const analysisKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(PREFIX))
  const entries = await Promise.all(analysisKeys.map(k => get(k)))
  return entries
    .filter(Boolean)
    .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
}

export async function deleteAnalysis(id) {
  await del(id)
}

export async function getAnalysis(id) {
  return get(id)
}

export async function clearAllAnalyses() {
  const allKeys = await keys()
  const analysisKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(PREFIX))
  await Promise.all(analysisKeys.map(k => del(k)))
}
