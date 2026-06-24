import { supabase } from './supabase'

export function logServiceSession(service) {
  const segments = service.segments.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
  }))
  supabase
    .from('liturgia_service_history')
    .insert({
      service_id: service.id,
      service_name: service.name,
      segments,
      logged_at: new Date().toISOString(),
    })
    .then(({ error }) => { if (error) console.warn('[supabase] history:', error.message) })
}

export async function fetchServiceHistory(limit = 30) {
  try {
    const { data, error } = await supabase
      .from('liturgia_service_history')
      .select('id, service_id, service_name, logged_at, segments')
      .order('logged_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  } catch {
    return []
  }
}
