import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? 'No fue posible conectar con el servicio institucional. ' +
      'Contacta a la administración del sistema.'
    : null

export const supabase =
  supabaseConfigError === null
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
        },
      })
    : null





