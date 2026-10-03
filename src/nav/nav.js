// Site navbar: scroll state, the Product dropdown (hover + click + keyboard), the mobile sheet and the sound toggle.
// The markup is injected at build time by the site-nav plugin in vite.config.js.
import './nav.css'
import { toggleSound } from './sound.js'

const nav = document.getElementById('siteNav')
if (nav) init(nav)

function init(nav) {
  const $ = (id) => document.getElementById(id)
  const dropBtn = $('snDropBtn'), drop = $('snDrop'), prod = dropBtn.parentElement
  const menuBtn = $('snMenuBtn'), sheet = $('snSheet'), closeBtn = $('snClose')
  const snd = $('snd'), snd2 = $('snSound2')
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
  drop.hidden = false; sheet.hidden = false            // shown and hidden with classes from here on (for the transitions)

  /* ---- after 40px the bar firms up and eases to 56px ---- */
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40)
  addEventListener('scroll', onScroll, { passive: true }); onScroll()

  /* ---- Product dropdown ---- */
  let open = false, hoverOpenedAt = 0, closeT = 0
  const links = () => [...drop.querySelectorAll('a')]
  function setDrop(v, focus) {
    open = v; drop.classList.toggle('open', v); dropBtn.setAttribute('aria-expanded', String(v))
    if (v && focus === 'first') links()[0].focus()
    if (v && focus === 'last') links().at(-1).focus()
  }
  dropBtn.addEventListener('click', (e) => {
    if (open && performance.now() - hoverOpenedAt < 450) return       // a click right after hover-open keeps it open
    setDrop(!open, e.detail === 0 && !open ? 'first' : null)          // keyboard activation moves into the panel
  })
  if (matchMedia('(hover: hover)').matches) {
    prod.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(closeT)
      if (!open) { setDrop(true); hoverOpenedAt = performance.now() } })
    prod.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return
      closeT = setTimeout(() => { if (!prod.contains(document.activeElement)) setDrop(false) }, 150) })
  }
  dropBtn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setDrop(true, 'first') }
    if (e.key === 'ArrowUp') { e.preventDefault(); setDrop(true, 'last') }
  })
  drop.addEventListener('keydown', (e) => {
    const all = links(), i = all.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); all[(i + 1) % all.length].focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); all[(i - 1 + all.length) % all.length].focus() }
    else if (e.key === 'Home') { e.preventDefault(); all[0].focus() }
    else if (e.key === 'End') { e.preventDefault(); all.at(-1).focus() }
  })
  prod.addEventListener('focusout', (e) => { if (open && !prod.contains(e.relatedTarget)) setDrop(false) })
  document.addEventListener('click', (e) => { if (open && !prod.contains(e.target)) setDrop(false) })

  /* ---- mobile sheet ---- */
  let sheetOpen = false, lastFocus = null
  function openSheet() {
    sheetOpen = true; lastFocus = document.activeElement
    sheet.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true')
    document.documentElement.classList.add('sn-lock')
    closeBtn.focus()
  }
  function closeSheet(restore = true) {
    if (!sheetOpen) return
    sheetOpen = false; sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false')
    document.documentElement.classList.remove('sn-lock')
    if (restore) (lastFocus && lastFocus.focus ? lastFocus : menuBtn).focus()
  }
  menuBtn.addEventListener('click', openSheet)
  closeBtn.addEventListener('click', () => closeSheet())
  sheet.addEventListener('keydown', (e) => {                       // keep Tab inside the sheet while it is open
    if (e.key !== 'Tab') return
    const f = [...sheet.querySelectorAll('a,button')], first = f[0], last = f.at(-1)
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  })
  addEventListener('resize', () => { if (innerWidth >= 900) closeSheet(false) }, { passive: true })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    if (sheetOpen) closeSheet()
    else if (open) { setDrop(false); dropBtn.focus() }
  })

  /* ---- links: on the home page, steps open the stage explorer, "How it works" and the logo scroll in place ---- */
  const onHome = location.pathname === '/' || location.pathname === '/index.html'
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a')
    if (!a) return
    const step = a.dataset.step
    if (step != null && typeof window.__openStage === 'function') {
      e.preventDefault()
      const back = sheet.contains(a) ? menuBtn : dropBtn                // the explorer hands focus back here when it closes
      setDrop(false); closeSheet(false); back.focus({ preventScroll: true })
      window.__openStage(+step); return
    }
    if (onHome && a.classList.contains('sn-logo')) {
      e.preventDefault(); closeSheet(false); scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return
    }
    if (onHome && a.getAttribute('href') === '/#features') {
      const target = document.getElementById('features')
      if (target) { e.preventDefault(); closeSheet(false); target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); return }
    }
    if (sheet.contains(a)) closeSheet(false)
  })

  /* ---- sound: the speaker button reflects its state; the sheet's labelled button drives the same control ---- */
  function syncSound() {
    const on = snd.getAttribute('aria-pressed') === 'true', label = on ? 'Sound on' : 'Sound off'
    snd.querySelector('.sn-tip').textContent = label
    snd2.setAttribute('aria-pressed', String(on)); snd2.querySelector('.sn-sound-l').textContent = label
  }
  new MutationObserver(syncSound).observe(snd, { attributes: true, attributeFilter: ['aria-pressed'] })
  syncSound()
  snd2.addEventListener('click', () => snd.click())
  // the home page runs its own copy of the engine (it also plays the flight's cues); everywhere else this one does
  if (!window.__homeSound) snd.addEventListener('click', () => { toggleSound(snd) })
}
