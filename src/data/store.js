import { SERVICES as BASE } from './liturgy'

const LS_KEY = 'liturgia.layout.v1'

export function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {}
  } catch {
    return {}
  }
}

export function saveOverrides(ov) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ov))
  } catch {
    /* ignora */
  }
}

// Aplica os overrides (nomes, durações e ordem) salvos sobre a estrutura base.
// Mantém compatibilidade: novos segmentos adicionados no código continuam aparecendo.
export function buildServices(overrides) {
  return BASE.map((svc) => {
    const so = overrides[svc.id] || {}
    const segOv = so.segments || {}

    let segs = svc.segments.map((seg) => ({
      ...seg,
      name: segOv[seg.id]?.name ?? seg.name,
      duration: segOv[seg.id]?.duration ?? seg.duration,
    }))

    if (Array.isArray(so.order) && so.order.length) {
      const byId = Object.fromEntries(segs.map((s) => [s.id, s]))
      const ordered = []
      so.order.forEach((id) => {
        if (byId[id]) {
          ordered.push(byId[id])
          delete byId[id]
        }
      })
      // segmentos novos (ainda não presentes na ordem salva) vão para o fim
      segs.forEach((s) => {
        if (byId[s.id]) ordered.push(s)
      })
      segs = ordered
    }

    return {
      ...svc,
      name: so.name ?? svc.name,
      shortName: so.shortName ?? svc.shortName,
      segments: segs,
    }
  })
}

// ---- Mutadores (retornam um novo objeto de overrides) ----

function withSegment(ov, serviceId, segId, patch) {
  const so = ov[serviceId] || {}
  const segments = so.segments || {}
  return {
    ...ov,
    [serviceId]: {
      ...so,
      segments: {
        ...segments,
        [segId]: { ...segments[segId], ...patch },
      },
    },
  }
}

export function renameSegment(ov, serviceId, segId, name) {
  return withSegment(ov, serviceId, segId, { name })
}

export function setSegmentDuration(ov, serviceId, segId, duration) {
  const d = Math.max(1, Math.min(180, Math.round(Number(duration) || 1)))
  return withSegment(ov, serviceId, segId, { duration: d })
}

export function renameService(ov, serviceId, name) {
  const so = ov[serviceId] || {}
  return { ...ov, [serviceId]: { ...so, shortName: name } }
}

// Reordena segmentos: recebe a lista atual de ids já reordenada
export function setOrder(ov, serviceId, orderedIds) {
  const so = ov[serviceId] || {}
  return { ...ov, [serviceId]: { ...so, order: orderedIds } }
}

export function resetService(ov, serviceId) {
  const next = { ...ov }
  delete next[serviceId]
  return next
}
