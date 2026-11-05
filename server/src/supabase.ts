import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load server/.env first, then fallback to current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

export const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL !== 'your_supabase_project_url' &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
)

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key'

if (!isSupabaseConfigured) {
  console.warn('\n⚠️  [PERHATIAN] Kunci Supabase belum diset di server/.env.')
  console.warn('   Salin file server/.env.example menjadi server/.env lalu isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.\n')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
})
