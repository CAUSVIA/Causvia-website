// Seven Rings: the rings ignite from the core outward as the section arrives, then turn slowly at their own speeds
// while a point of light carries evidence outward through each ring. Hovering or focusing a ring or its card links the two.
// Everything pauses while the section is off screen; with reduced motion the rings are simply drawn and still.
import './rings.css'
import { SHOW_CHARTER_LINK } from '../config.js'

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const STEP = 350                                   // ms between rings igniting
const section = document.getElementById('moats')
if (section) init(section)

function init(sec) {
  const art = sec.querySelector('.rg-art')
  // layers sit outermost-first in the markup (so inner rings stack on top); work in ring order, core outward
  const rings = [...art.querySelectorAll('.rg-ring')].sort((a, b) => a.dataset.n - b.dataset.n)
  const cards = [...sec.querySelectorAll('.rg-card')]
  const light = art.querySelector('.rg-light')
  const ringOf = (n) => rings[n - 1], cardOf = (n) => cards[n - 1]

  // Ring 1's charter link stays out of the page until the charter is published
  if (SHOW_CHARTER_LINK) {
    const a = document.createElement('a')
    a.className = 'rg-link'; a.href = '/charter'; a.textContent = 'Read the charter →'
    cardOf(1).querySelector('.rg-body').appendChild(a)
  }

  /* ---- ring ⇄ card highlight (pointer and keyboard) ---- */
  function highlight(n) {
    art.classList.toggle('has-hl', n != null)
    rings.forEach((r, i) => r.classList.toggle('hot', i + 1 === n))
    cards.forEach((c, i) => c.classList.toggle('hl', i + 1 === n))
  }
  rings.forEach((r, i) => {
    const hit = r.querySelector('.rg-hit')
    hit.addEventListener('pointerenter', () => highlight(i + 1))
    hit.addEventListener('pointerleave', () => highlight(null))
  })
  cards.forEach((c, i) => {
    c.addEventListener('pointerenter', () => highlight(i + 1))
    c.addEventListener('pointerleave', () => { if (!c.contains(document.activeElement)) highlight(null) })
    c.addEventListener('focusin', () => highlight(i + 1))
    c.addEventListener('focusout', (e) => { if (!c.contains(e.relatedTarget)) highlight(null) })
  })

  /* ---- art size → the travelling light's path length ---- */
  const size = () => art.style.setProperty('--R', `${art.clientWidth / 2}px`)
  size(); new ResizeObserver(size).observe(art)

  if (RM) { sec.classList.add('rg-still'); rings.forEach((r) => r.classList.add('lit')); return }

  /* ---- ignite from the core outward, once ---- */
  let ignited = false, onScreen = false, lightTimer = 0, flashTimers = []
  function ignite() {
    ignited = true
    rings.forEach((r, i) => setTimeout(() => {
      r.classList.add('lit')
      const c = cardOf(i + 1); c.classList.remove('ignite'); void c.offsetWidth; c.classList.add('ignite')
    }, i * STEP))
    setTimeout(() => { sec.classList.add('rg-spin'); if (onScreen) travel() }, rings.length * STEP + 600)
  }

  /* ---- evidence flowing outward: a point of light crosses every ring in turn ---- */
  const TRAVEL = 2100, START = 0.2, END = 1.02      // ms; path from 20% to 102% of the radius
  const radii = rings.map((r) => +r.dataset.r / 300)
  function travel() {
    clearTimeout(lightTimer); flashTimers.forEach(clearTimeout); flashTimers = []
    if (!onScreen) return
    light.style.setProperty('--a', `${Math.round(Math.random() * 360)}deg`)
    light.classList.remove('go'); void light.offsetWidth; light.classList.add('go')
    radii.forEach((f, i) => {
      const t = ((f - START) / (END - START)) * TRAVEL
      flashTimers.push(setTimeout(() => {
        const r = rings[i]; r.classList.add('flash'); flashTimers.push(setTimeout(() => r.classList.remove('flash'), 420))
      }, t))
    })
    lightTimer = setTimeout(travel, TRAVEL + 2300)
  }

  /* ---- only animate while the section is on screen ---- */
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting
    sec.classList.toggle('rg-off', !onScreen)
    if (onScreen && ignited && sec.classList.contains('rg-spin')) travel()
    if (!onScreen) { clearTimeout(lightTimer); flashTimers.forEach(clearTimeout); flashTimers = []; light.classList.remove('go') }
  }).observe(sec)
  new IntersectionObserver(([e], io) => {
    if (e.isIntersecting && !ignited) { io.disconnect(); ignite() }
  }, { threshold: 0.35 }).observe(art)
}
