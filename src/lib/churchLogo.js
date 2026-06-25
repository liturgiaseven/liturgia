import { supabase } from './supabase'

const BUCKET = 'church-assets'
const PATH = 'logo/church-logo'

export async function loadChurchLogo() {
  try {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(PATH)
    // Bust cache so we get the latest upload
    return data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null
  } catch {
    return null
  }
}

export async function uploadChurchLogo(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${PATH}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}
