import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rdvtaiocyytjimtwmiyr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_vNFw9X9RBwz0c-c4RXNrtw__V9EZVhI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
