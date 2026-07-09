import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://phctpwswosfwjmxhidyq.supabase.co'
const supabaseAnonKey = 'sb_publishable_HEy4rqVBXuH_qRBHEwYSdg_wW-677OT'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
