import { supabase } from './supabase'

const BUCKET = 'hymn-audio'

// Upload an mp3 (or other audio) for a hymn and register its URL in the DB.
export async function uploadHymnAudio(id, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${id}.${ext}`
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'audio/mpeg' })
  if (upErr) throw upErr

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const url = data.publicUrl

  const { error: dbErr } = await supabase
    .from('liturgia_hymn_audio')
    .upsert({ id, url, filename: file.name, updated_at: new Date().toISOString() })
  if (dbErr) throw dbErr

  return url
}

// Load all hymn audio urls -> { [id]: url }
export async function loadAllHymnAudio() {
  try {
    const { data, error } = await supabase
      .from('liturgia_hymn_audio')
      .select('id, url')
    if (error || !data) return {}
    return Object.fromEntries(data.map((r) => [r.id, r.url]))
  } catch {
    return {}
  }
}

// Remove a hymn's audio (storage + db row)
export async function removeHymnAudio(id) {
  try {
    const { data } = await supabase
      .from('liturgia_hymn_audio')
      .select('url')
      .eq('id', id)
      .maybeSingle()
    if (data?.url) {
      const path = data.url.split(`/${BUCKET}/`)[1]?.split('?')[0]
      if (path) await supabase.storage.from(BUCKET).remove([path])
    }
    await supabase.from('liturgia_hymn_audio').delete().eq('id', id)
  } catch (e) {
    console.warn('[supabase] remove hymn audio:', e.message)
  }
}
