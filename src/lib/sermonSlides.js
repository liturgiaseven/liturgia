import { supabase } from './supabase'

const BUCKET = 'sermon-slides'

// Upload a PDF for a segment key and register its URL in the DB.
export async function uploadSermonSlides(key, file) {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_')
  const path = `${safe}.pdf`
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: 'application/pdf' })
  if (upErr) throw upErr

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`

  const { error: dbErr } = await supabase
    .from('liturgia_sermon_slides')
    .upsert({ id: key, url, filename: file.name, updated_at: new Date().toISOString() })
  if (dbErr) throw dbErr

  return { url, filename: file.name }
}

// Load all slides -> { [key]: { url, filename } }
export async function loadAllSermonSlides() {
  try {
    const { data, error } = await supabase
      .from('liturgia_sermon_slides')
      .select('id, url, filename')
    if (error || !data) return {}
    return Object.fromEntries(data.map((r) => [r.id, { url: r.url, filename: r.filename }]))
  } catch {
    return {}
  }
}

// Remove a segment's slides (storage + db row)
export async function removeSermonSlides(key) {
  try {
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_')
    await supabase.storage.from(BUCKET).remove([`${safe}.pdf`])
    await supabase.from('liturgia_sermon_slides').delete().eq('id', key)
  } catch (e) {
    console.warn('[supabase] remove sermon slides:', e.message)
  }
}
