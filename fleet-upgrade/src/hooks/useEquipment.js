import { useState, useEffect, useCallback } from 'react'
import { getEquipmentList, getEquipmentHistory } from '../services/fleetStorage.js'

const EQUIPMENT_KEY = 'dripview:selected_equipment'

export function useEquipment() {
  const [equipmentList, setEquipmentList] = useState([])
  const [selected, setSelectedState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(EQUIPMENT_KEY)) } catch { return null }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getEquipmentList()
      setEquipmentList(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadList() }, [loadList])

  function selectEquipment(eq) {
    setSelectedState(eq)
    localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(eq))
  }

  function clearEquipment() {
    setSelectedState(null)
    localStorage.removeItem(EQUIPMENT_KEY)
  }

  return { equipmentList, selected, loading, error, selectEquipment, clearEquipment, reload: loadList }
}

// Returns last N analyses for the selected equipment — used to build RAG context
export function useEquipmentHistory(equipmentId, limit = 8) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!equipmentId) { setHistory([]); return }
    setLoading(true)
    getEquipmentHistory(equipmentId, limit)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [equipmentId, limit])

  return { history, loading }
}

// Serialises history into prompt context lines
export function buildHistoryContext(history, equipment) {
  if (!history.length) return ''

  const lines = [
    `Histórico deste equipamento: ${equipment?.name ?? 'desconhecido'} (${equipment?.engine_model ?? 'motor diesel'})`,
    `${history.length} análise(s) anteriores (mais recente primeiro):`
  ]

  for (const h of history) {
    const date = new Date(h.analyzed_at).toLocaleDateString('pt-BR')
    const nuc  = h.color_data?.nucleo
    const nucDark = nuc ? ` — núcleo escuridão ${(nuc.darkness * 100).toFixed(0)}%` : ''
    lines.push(`  • ${date}: condição=${h.condition}, score=${h.score ?? '—'}${nucDark}`)
  }

  // Simple trend calculation
  const scores = history.map(h => h.score).filter(Number.isFinite).reverse()
  if (scores.length >= 2) {
    const delta = scores[scores.length - 1] - scores[0]
    const trend = delta < -10 ? 'degradação acelerada' : delta < 0 ? 'degradação gradual' : 'estável'
    lines.push(`Tendência de score: ${scores.join(' → ')} (${trend})`)
  }

  const darknesses = history
    .map(h => h.color_data?.nucleo?.darkness)
    .filter(Number.isFinite)
    .reverse()
  if (darknesses.length >= 2) {
    const avg = (darknesses[darknesses.length - 1] - darknesses[0]) / (darknesses.length - 1)
    lines.push(`Escuridão do núcleo por ciclo: +${(avg * 100).toFixed(1)}% em média`)
  }

  lines.push('Use este histórico para calibrar o score e identificar aceleração ou desaceleração da degradação.')
  return lines.join('\n')
}
