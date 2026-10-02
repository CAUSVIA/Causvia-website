import { supabase, configured, profileFor, firstName, friendlyError } from '../lib/supabase.js'

const $ = (id) => document.getElementById(id)
let leaving = false
const toAuth = (query = '') => { leaving = true; location.replace('/auth' + query) }

async function open() {
  if (!configured) return toAuth()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return toAuth()
  let profile
  try { profile = await profileFor(session.user) }
  catch (err) { $('wsLoad').hidden = true; const e = $('wsErr'); e.textContent = friendlyError(err); e.hidden = false; return }
  if (!profile?.approved) { leaving = true; await supabase.auth.signOut(); return toAuth('?notice=pending') }

  const name = firstName(profile, session.user)
  $('wsHello').textContent = name ? `Welcome, ${name}` : 'Welcome'
  $('wsLoad').hidden = true; $('wsBody').hidden = false
  $('ws').removeAttribute('aria-busy')
  document.title = `${name ? name + ' · ' : ''}Your workspace · Causvia`
}

$('wsOut').addEventListener('click', async () => {
  const btn = $('wsOut'); btn.classList.add('loading'); btn.disabled = true; leaving = true
  await supabase.auth.signOut()
  toAuth('?notice=signedout')
})

// signing out in another tab ends this one too
if (configured) supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT' && !leaving) toAuth() })
open()
