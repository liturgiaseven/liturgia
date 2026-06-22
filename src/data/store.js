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

    const baseById = Object.fromEntries(
      svc.segments.map((seg) => [seg.id, {
        ...seg,
        name: segOv[seg.id]?.name ?? seg.name,
        duration: segOv[seg.id]?.duration ?? seg.duration,
      }])
    )

    let segs
    if (Array.isArray(so.order) && so.order.length) {
      const seen = new Set()
      segs = []
      so.order.forEach((id) => {
        if (baseById[id]) {
          segs.push(baseById[id])
          seen.add(id)
        } else if (segOv[id]?._custom) {
          // features stored in so.segmentFeatures[id]; fall back to legacy segOv[id] fields
          const f = (so.segmentFeatures || {})[id] || {}
          const fLeg = segOv[id]
          segs.push({
            id,
            name: segOv[id].name ?? 'Segmento',
            duration: segOv[id].duration ?? 5,
            icon: 'star',
            _custom: true,
            hasYoutube: f.hasYoutube ?? fLeg.hasYoutube ?? false,
            hasImages:  f.hasImages  ?? fLeg.hasImages  ?? false,
            hymnCategory: (f.hasHymns ?? fLeg.hasHymns ?? false) ? 'especial' : undefined,
          })
          seen.add(id)
        }
      })
      // segmentos base novos (ainda não presentes na ordem salva) vão para o fim
      svc.segments.forEach((s) => { if (!seen.has(s.id)) segs.push(baseById[s.id]) })
    } else {
      segs = Object.values(baseById)
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

export function addSegment(ov, serviceId) {
  const svc = BASE.find((s) => s.id === serviceId)
  const id = `custom-${Date.now()}`
  const so = ov[serviceId] || {}
  const currentOrder = Array.isArray(so.order) && so.order.length
    ? [...so.order]
    : (svc?.segments.map((s) => s.id) || [])
  return {
    ...ov,
    [serviceId]: {
      ...so,
      segments: {
        ...(so.segments || {}),
        [id]: { name: 'Novo segmento', duration: 5, _custom: true, hasYoutube: false, hasImages: false, hasHymns: false },
      },
      order: [...currentOrder, id],
    },
  }
}

export function setSegmentFeature(ov, serviceId, segId, key, value) {
  const so = ov[serviceId] || {}
  const sf = so.segmentFeatures || {}
  return {
    ...ov,
    [serviceId]: {
      ...so,
      segmentFeatures: { ...sf, [segId]: { ...(sf[segId] || {}), [key]: value } },
    },
  }
}

export function removeSegment(ov, serviceId, segId) {
  const svc = BASE.find((s) => s.id === serviceId)
  const so = ov[serviceId] || {}
  const currentOrder = Array.isArray(so.order) && so.order.length
    ? [...so.order]
    : (svc?.segments.map((s) => s.id) || [])
  const segments = { ...(so.segments || {}) }
  delete segments[segId]
  return {
    ...ov,
    [serviceId]: {
      ...so,
      segments,
      order: currentOrder.filter((id) => id !== segId),
    },
  }
}
