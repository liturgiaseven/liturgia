import { supabase } from './supabase'

export async function loadHymnLyricsFromCloud(id) {
  try {
    const { data, error } = await supabase
      .from('liturgia_hymn_lyrics')
      .select('lyrics')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return data.lyrics
  } catch {
    return null
  }
}

export function saveHymnLyricsToCloud(id, lyrics) {
  supabase
    .from('liturgia_hymn_lyrics')
    .upsert({ id, lyrics, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.warn('[supabase] hymn sync:', error.message) })
}

export async function loadAllHymnLyricsFromCloud() {
  try {
    const { data, error } = await supabase
      .from('liturgia_hymn_lyrics')
      .select('id, lyrics')
    if (error || !data) return {}
    return Object.fromEntries(data.map((r) => [r.id, r.lyrics]))
  } catch {
    return {}
  }
}
