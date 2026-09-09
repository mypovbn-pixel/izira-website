import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://cafufqdkfkeftqdjewnh.supabase.co'
export const supabasePublishableKey = 'sb_publishable_HzwDusWmoYut1EtZyupuEg_d2A1W92f'

export const supabasePublic = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
