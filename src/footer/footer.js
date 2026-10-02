// Horizon footer: the sunrise when it scrolls into view, and the "Get Causvia updates" sign-up.
// The footer markup itself is injected at build time by the horizon-footer plugin in vite.config.js.
import './footer.css'

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const foot = document.querySelector('.hz')
if (foot) { sunrise(foot); updates(foot) }

/* the glow rises 60px and brightens over ~1.2s, the watermark fades up, once; then it breathes (CSS) */
function sunrise(el) {
  if (RM || !('IntersectionObserver' in window)) { el.classList.add('hz-lit'); return }
  el.classList.add('hz-pre')
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return
    io.disconnect()
    requestAnimationFrame(() => { el.classList.remove('hz-pre'); el.classList.add('hz-lit') })
  }, { threshold: 0.3 })
  io.observe(el.querySelector('.hz-horizon'))
}

/* sign-ups go straight to Supabase (insert-only table); a plain fetch keeps the library off every page */
function updates(el) {
  const form = el.querySelector('.hz-form')
  if (!form) return
  const input = form.querySelector('input[type=email]'), trap = form.querySelector('input[name=website]')
  const btn = form.querySelector('.hz-sub'), msg = form.querySelector('.hz-msg')
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const CHECK = '<svg class="hz-check" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12.5"/><path d="M8.5 14.5l3.6 3.6 7.4-8"/></svg>'

  const say = (kind, text) => { msg.className = 'hz-msg' + (kind ? ' ' + kind : ''); msg.textContent = text }
  const done = (text) => {
    form.classList.add('hz-done')
    msg.className = 'hz-msg ok'; msg.innerHTML = CHECK + '<span></span>'; msg.lastChild.textContent = text
    msg.focus()
  }

  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') && EMAIL.test(input.value.trim())) { input.removeAttribute('aria-invalid'); say('', '') }
  })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = input.value.trim().toLowerCase()
    if (!EMAIL.test(email)) { input.setAttribute('aria-invalid', 'true'); say('err', 'Enter a valid email'); input.focus(); return }
    input.removeAttribute('aria-invalid')
    if (trap.value) { done("You're on the list."); return }            // bots fill the hidden field: thank them, store nothing
    if (!SUPABASE_URL || !ANON_KEY) { say('err', 'Something went wrong. Try again.'); return }
    btn.disabled = true; btn.classList.add('busy'); say('', '')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
        method: 'POST',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ email, source_page: location.pathname.slice(0, 200) }),
      })
      if (res.ok) return done("You're on the list.")
      const body = await res.json().catch(() => ({}))
      if (res.status === 409 || body.code === '23505') return done("You're already on the list.")
      say('err', 'Something went wrong. Try again.')
    } catch {
      say('err', 'Something went wrong. Try again.')
    } finally {
      btn.disabled = false; btn.classList.remove('busy')
    }
  })
}
