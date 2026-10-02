import { createClient } from '@supabase/supabase-js'

// Public project URL and anon key, injected at build time (Vercel env vars / local .env). Never the service role key.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configured = Boolean(url && anonKey)

export const supabase = configured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
    })
  : null

/** Which social providers are switched on in Supabase, so unconfigured buttons stay hidden. */
export async function enabledProviders() {
  if (!configured) return {}
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } })
    if (!res.ok) return {}
    const { external = {} } = await res.json()
    return { google: Boolean(external.google), azure: Boolean(external.azure) }
  } catch {
    return {}
  }
}

/** The signed-in user's profile row (RLS only returns their own). Null if it doesn't exist yet. */
export async function profileFor(user) {
  const { data, error } = await supabase.from('profiles').select('approved, full_name').eq('id', user.id).maybeSingle()
  if (error) throw error
  return data
}

export function firstName(profile, user) {
  const full = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  return full.trim().split(/\s+/)[0] || ''
}

/** Turn Supabase / network errors into calm, specific copy. */
export function friendlyError(err) {
  const msg = String(err?.message || err || '')
  const code = err?.code || ''
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg) || err?.name === 'AuthRetryableFetchError')
    return "We couldn't reach Causvia. Check your connection and try again."
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match. Check them, or reset your password."
  if (/email not confirmed/i.test(msg)) return 'Confirm your email first: open the link we sent you, then sign in.'
  if (/signups? not allowed/i.test(msg) || code === 'otp_disabled')
    return "There's no Causvia account for that email yet. Request access first."
  if (err?.status === 429 || /rate limit|too many|for security purposes/i.test(msg))
    return 'Too many attempts. Wait a minute, then try again.'
  if (/expired|invalid.*(token|link|otp)|otp_expired/i.test(msg) || code === 'otp_expired')
    return 'That link has expired or was already used. Request a new one.'
  if (/should be different/i.test(msg)) return 'Choose a password you haven’t used for Causvia before.'
  if (/password should be at least|weak/i.test(msg)) return 'Choose a stronger password: at least 8 characters, ideally a short phrase.'
  return 'Something went wrong on our side. Try again in a moment.'
}
