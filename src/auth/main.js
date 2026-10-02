import { supabase, configured, enabledProviders, profileFor, friendlyError } from '../lib/supabase.js'
import { space } from './space.js'
import { autopilot } from './switch.js'

const $ = (id) => document.getElementById(id)
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const ORIGIN = location.origin
const landing = window.__authUrl || { hash: location.hash, search: location.search }
const params = new URLSearchParams(landing.search)
const hash = new URLSearchParams(landing.hash.replace(/^#/, ''))

const PENDING = "You're on the early-access list. We'll email you when your workspace is ready."
const EXPIRED = 'That link has expired or was already used. Request a new one below.'
const UNAVAILABLE = "Sign-in isn't available right now. Please try again shortly."

/* ================= Take the controls ================= */
const scene = space(document.querySelector('.sp'))
const sweep = $('spSweep')
autopilot($('apSwitch'), {
  onChange(on, byUser) {
    document.documentElement.classList.toggle('you', on)
    scene.setWarm(on)
    if (on && !RM) { sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go') }
    if (on && byUser) setTimeout(focusEmail, RM ? 0 : 420)
  },
})
function focusEmail() {
  const view = document.querySelector('.panel:not([hidden]) .view:not([hidden])')
  const field = view && (view.querySelector('input[type=email]') || view.querySelector('input:not([type=hidden]):not([tabindex="-1"])'))
  if (field) field.focus()
}

/* ================= tabs ================= */
const tabsEl = document.querySelector('.tabs')
const TABS = { signin: [$('tabSignin'), $('pSignin')], request: [$('tabRequest'), $('pRequest')] }
let activeTab = 'signin'
function selectTab(name, { focusTab = false, updateUrl = false } = {}) {
  activeTab = name
  for (const [key, [tab, panel]] of Object.entries(TABS)) {
    const on = key === name
    tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; panel.hidden = !on
  }
  tabsEl.dataset.active = name
  if (focusTab) TABS[name][0].focus()
  if (updateUrl) history.replaceState(null, '', name === 'request' ? '/auth?tab=request' : '/auth')
}
for (const [key, [tab]] of Object.entries(TABS)) tab.addEventListener('click', () => selectTab(key, { updateUrl: true }))
tabsEl.addEventListener('keydown', (e) => {
  const order = ['signin', 'request'], i = order.indexOf(activeTab)
  const next = { ArrowRight: order[(i + 1) % 2], ArrowLeft: order[(i + 1) % 2], Home: 'signin', End: 'request' }[e.key]
  if (!next) return
  e.preventDefault(); selectTab(next, { focusTab: true, updateUrl: true })
})

/* ================= sign-in panel views ================= */
const VIEWS = { signin: $('vSignin'), forgot: $('vForgot'), reset: $('vReset') }
function showView(name, focusId) {
  for (const [key, el] of Object.entries(VIEWS)) el.hidden = key !== name
  if (activeTab !== 'signin') selectTab('signin')
  if (focusId) $(focusId).focus()
}
for (const b of document.querySelectorAll('[data-back]')) b.addEventListener('click', () => {
  for (const n of ['siNote', 'fpNote', 'rsNote']) note($(n))
  showView('signin', 'siEmail')
})
$('toForgot').addEventListener('click', () => {
  $('fpEmail').value = $('siEmail').value.trim(); note($('fpNote'))
  showView('forgot', 'fpEmail')
})

/* ================= helpers: notes, validation, busy buttons ================= */
function note(el, kind, text) {
  if (!kind) { el.hidden = true; el.textContent = ''; return }
  el.className = 'note ' + kind
  el.setAttribute('role', kind === 'bad' ? 'alert' : 'status')
  el.textContent = text; el.hidden = false
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RULES = {
  email: (el) => EMAIL.test(el.value.trim()) ? '' : 'Enter a work email',
  password: (el) => !el.value ? 'Enter your password' : el.value.length < 8 ? 'Password must be at least 8 characters' : '',
  newPassword: (el) => el.value.length < 8 ? 'Password must be at least 8 characters' : '',
  confirm: (el) => el.value && el.value === $('rsPass').value ? '' : "The passwords don't match",
  name: (el) => el.value.trim() ? '' : 'Enter your full name',
  company: (el) => el.value.trim() ? '' : 'Enter your company',
  role: (el) => el.value ? '' : 'Choose your role',
  size: (el) => el.value ? '' : 'Choose your team size',
  flow: (el) => el.value ? '' : 'Choose the workflow you would test first',
  agree: (el) => el.checked ? '' : 'Please agree to the Privacy Policy and Terms',
}
function setError(el, msg) {
  const err = $(el.id + 'Err')
  if (msg) { err.textContent = msg; err.hidden = false; el.setAttribute('aria-invalid', 'true') }
  else { err.hidden = true; err.textContent = ''; el.removeAttribute('aria-invalid') }
  return !msg
}
/** Validate [element, rule] pairs; focus the first problem. Fields re-check themselves as they're corrected. */
function validate(pairs) {
  let first = null
  for (const [el, rule] of pairs) {
    if (!setError(el, RULES[rule](el)) && !first) first = el
    if (!el.dataset.live) {
      el.dataset.live = '1'
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => setError(el, RULES[rule](el)))
    }
  }
  if (first) first.focus()
  return !first
}
function busy(btn, on) {
  btn.classList.toggle('loading', on); btn.disabled = on
  on ? btn.setAttribute('aria-busy', 'true') : btn.removeAttribute('aria-busy')
}
function ready(noteEl) {
  if (configured) return true
  note(noteEl, 'bad', UNAVAILABLE); return false
}

/* show / hide password */
const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'
for (const btn of document.querySelectorAll('.pw-tog')) {
  const input = $(btn.getAttribute('aria-controls'))
  btn.innerHTML = EYE
  btn.addEventListener('click', () => {
    const show = input.type === 'password'
    input.type = show ? 'text' : 'password'
    btn.innerHTML = show ? EYE_OFF : EYE
    btn.setAttribute('aria-pressed', String(show)); btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password')
  })
}

/* ================= approval gate ================= */
/** Approved users go to /app; everyone else sees the early-access note and is signed out. */
async function admit(session) {
  let profile
  try { profile = await profileFor(session.user) }
  catch (err) { await supabase.auth.signOut(); showView('signin'); note($('siNote'), 'bad', friendlyError(err)); return }
  if (profile?.approved) { location.replace('/app'); return }
  await supabase.auth.signOut()
  showView('signin')
  note($('siNote'), 'info', PENDING)
}

/* ================= sign in ================= */
$('fSignin').addEventListener('submit', async (e) => {
  e.preventDefault()
  const noteEl = $('siNote'); note(noteEl)
  if (!validate([[$('siEmail'), 'email'], [$('siPass'), 'password']]) || !ready(noteEl)) return
  const btn = $('siBtn'); busy(btn, true)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: $('siEmail').value.trim(), password: $('siPass').value })
    if (error) throw error
    await admit(data.session)
  } catch (err) {
    note(noteEl, 'bad', friendlyError(err))
  } finally { busy(btn, false) }
})

/* magic link: existing accounts only, so it never creates a stray account */
$('magicBtn').addEventListener('click', async () => {
  const noteEl = $('siNote'); note(noteEl); setError($('siPass'), '')
  if (!validate([[$('siEmail'), 'email']]) || !ready(noteEl)) return
  const btn = $('magicBtn'), email = $('siEmail').value.trim(); busy(btn, true)
  try {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${ORIGIN}/auth` } })
    if (error) throw error
    note(noteEl, 'ok', `Check your inbox. We sent a sign-in link to ${email}. It works once and expires in an hour.`)
  } catch (err) { note(noteEl, 'bad', friendlyError(err)) }
  finally { busy(btn, false) }
})

/* Google / Microsoft: only shown once the provider is switched on in Supabase */
enabledProviders().then((on) => {
  const google = $('oaGoogle'), microsoft = $('oaMicrosoft')
  google.hidden = !on.google; microsoft.hidden = !on.azure
  $('oauth').hidden = !(on.google || on.azure)
})
for (const btn of [$('oaGoogle'), $('oaMicrosoft')]) btn.addEventListener('click', async () => {
  const noteEl = $('siNote'); note(noteEl)
  if (!ready(noteEl)) return
  const provider = btn.dataset.provider; busy(btn, true)
  const { error } = await supabase.auth.signInWithOAuth({
    provider, options: { redirectTo: `${ORIGIN}/auth`, ...(provider === 'azure' ? { scopes: 'email' } : {}) },
  })
  if (error) { busy(btn, false); note(noteEl, 'bad', friendlyError(error)) }
})

/* ================= forgot / reset password ================= */
$('fForgot').addEventListener('submit', async (e) => {
  e.preventDefault()
  const noteEl = $('fpNote'); note(noteEl)
  if (!validate([[$('fpEmail'), 'email']]) || !ready(noteEl)) return
  const btn = $('fpBtn'), email = $('fpEmail').value.trim(); busy(btn, true)
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${ORIGIN}/auth?mode=reset` })
    if (error) throw error
    note(noteEl, 'ok', `Check your inbox. If there's a Causvia account for ${email}, a reset link is on its way. It expires in an hour.`)
  } catch (err) { note(noteEl, 'bad', friendlyError(err)) }
  finally { busy(btn, false) }
})

$('fReset').addEventListener('submit', async (e) => {
  e.preventDefault()
  const noteEl = $('rsNote'); note(noteEl)
  if (!validate([[$('rsPass'), 'newPassword'], [$('rsPass2'), 'confirm']]) || !ready(noteEl)) return
  const btn = $('rsBtn'); busy(btn, true)
  try {
    const { data, error } = await supabase.auth.updateUser({ password: $('rsPass').value })
    if (error) throw error
    note(noteEl, 'ok', 'Password updated.')
    const { data: { session } } = await supabase.auth.getSession()
    await admit(session || { user: data.user })
  } catch (err) { note(noteEl, 'bad', friendlyError(err)) }
  finally { busy(btn, false) }
})

/* ================= request access ================= */
const RQ_KEY = 'causvia.requests', RQ_MAX = 3, RQ_WINDOW = 10 * 60 * 1000
const shownAt = performance.now()
const recentRequests = () => { try { return JSON.parse(localStorage.getItem(RQ_KEY) || '[]').filter((t) => Date.now() - t < RQ_WINDOW) } catch { return [] } }
const stampRequest = () => { try { localStorage.setItem(RQ_KEY, JSON.stringify([...recentRequests(), Date.now()])) } catch { /* private mode: rely on the server guard */ } }
function requestDone() {
  $('vRequest').hidden = true
  const done = $('vDone'); done.hidden = false; done.focus()
}

$('fRequest').addEventListener('submit', async (e) => {
  e.preventDefault()
  const noteEl = $('rqNote'); note(noteEl)
  const ok = validate([[$('rqName'), 'name'], [$('rqEmail'), 'email'], [$('rqCompany'), 'company'], [$('rqRole'), 'role'],
    [$('rqSize'), 'size'], [$('rqFlow'), 'flow'], [$('rqAgree'), 'agree']])
  if (!ok) return
  // bots fill the hidden field or submit inhumanly fast: thank them and store nothing
  if ($('rqSite').value || performance.now() - shownAt < 2500) { requestDone(); return }
  if (recentRequests().length >= RQ_MAX) {
    note(noteEl, 'bad', "You've sent a few requests in the last few minutes. Please wait a little, then try again."); return
  }
  if (!ready(noteEl)) return
  const btn = $('rqBtn'); busy(btn, true); stampRequest()
  try {
    const { error } = await supabase.from('access_requests').insert({
      name: $('rqName').value.trim(), email: $('rqEmail').value.trim().toLowerCase(), company: $('rqCompany').value.trim(),
      role: $('rqRole').value, team_size: $('rqSize').value, workflow: $('rqFlow').value,
    })
    if (!error) return requestDone()
    if (error.code === '23505') note(noteEl, 'info', "You've already requested access. We'll be in touch soon.")
    else if (error.code === 'P0001') note(noteEl, 'bad', "We're receiving a lot of requests right now. Try again in a minute.")
    else note(noteEl, 'bad', friendlyError(error))
  } catch (err) { note(noteEl, 'bad', friendlyError(err)) }
  finally { busy(btn, false) }
})

/* ================= arrival: tab, prefill, links coming back from email / OAuth ================= */
if (params.get('tab') === 'request') selectTab('request')
if (params.get('email')) $('rqEmail').value = params.get('email').slice(0, 254)
if (params.get('notice') === 'pending') note($('siNote'), 'info', PENDING)
if (params.get('notice') === 'signedout') note($('siNote'), 'ok', "You're signed out.")

const linkType = hash.get('type')
const linkError = hash.get('error_code') || hash.get('error') || params.get('error_code') || params.get('error')
const resetMode = params.get('mode') === 'reset' || linkType === 'recovery' || linkType === 'invite'

if (linkType === 'invite') {
  $('rsTitle').textContent = 'Set your password'
  $('rsSub').textContent = 'Welcome to Causvia. Choose a password with at least 8 characters to finish setting up your account.'
}

async function arrive() {
  if (linkError) {
    const desc = hash.get('error_description') || params.get('error_description') || ''
    const msg = /expired|invalid/i.test(linkError + desc) ? EXPIRED : friendlyError({ message: desc || linkError })
    if (resetMode) { showView('forgot'); note($('fpNote'), 'bad', msg) }
    else note($('siNote'), 'bad', msg)
    history.replaceState(null, '', location.pathname + (params.get('tab') === 'request' ? '?tab=request' : ''))
    return
  }
  if (!configured) return
  const { data: { session } } = await supabase.auth.getSession()
  if (resetMode) {
    if (session) showView('reset', 'rsPass')
    else { showView('forgot'); note($('fpNote'), 'bad', EXPIRED) }
    return
  }
  if (session) {                                   // back from Google / Microsoft / a magic link, or already signed in
    if (hash.get('access_token')) note($('siNote'), 'info', 'Signing you in…')
    await admit(session)
  }
}
if (configured) supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') showView('reset', 'rsPass') })
arrive()
