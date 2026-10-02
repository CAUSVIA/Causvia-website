// The Causvia moat: seven concentric layers that build up as the reader scrolls.
// Entrance (once): the logo glows on, rings draw outward 01→07, nodes pop onto their rings.
// Scroll: layers light up in order (earlier ones stay lit); the active one brightens, its node glows and a pulse runs
// along it. Hover, focus or tap a node or row to jump to a layer. When all seven are lit, one shimmer runs outward.
// Idle: the whole system turns once every 180s; labels stay upright on each node's outer side.
import './rings.css'
import { SHOW_CHARTER_LINK } from '../config.js'
import { placeLabels } from './layout.js'

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const RADII = [80, 115, 150, 185, 220, 255, 290]                  // in a 640 box
const N = RADII.length
const BASE = RADII.map((_, i) => -90 + i * (360 / N))             // node 1 at the top, then 51.4° clockwise each
const TURN = 180000                                               // ms per full rotation

const section = document.getElementById('moats')
if (section) init(section)

function init(sec) {
  const byN = (sel) => [...sec.querySelectorAll(sel)].sort((a, b) => a.dataset.n - b.dataset.n)
  const art = sec.querySelector('.mt-art'), ringsSvg = sec.querySelector('.mt-rings'), fxSvg = sec.querySelector('.mt-fx')
  const rings = byN('.mt-ring'), pulses = byN('.mt-pulse'), nodes = byN('.mt-node'), labels = byN('.mt-label'), rows = byN('.mt-row')
  const draws = RADII.map((_, i) => sec.querySelector(`#mtM${i + 1} .mt-draw`))
  const shimmer = sec.querySelector('.mt-shimmer')
  sec.classList.add('mt-js')

  // Ring 01's charter link stays out of the page until the charter is published
  if (SHOW_CHARTER_LINK) {
    const a = document.createElement('a'); a.className = 'mt-link'; a.href = '/charter'; a.textContent = 'Read the charter →'
    rows[0].querySelector('.mt-body').appendChild(a)
  }

  /* ---------- geometry: nodes on their rings, labels upright on the outer side ---------- */
  let W = 0, H = 0, s = 1, small = false, sizes = [], phi = 0
  function measure() {
    W = art.clientWidth; H = art.clientHeight; s = H / 640; small = innerWidth < 768
    sizes = labels.map((l) => [l.offsetWidth, l.offsetHeight || 22])
    place()
  }
  const pts = RADII.map(() => [0, 0, 0, 0])                         // node x, y, cos, sin
  function place() {
    const nodeR = small ? 13 : 20, gap = 8, cx = W / 2, cy = H / 2
    for (let i = 0; i < N; i++) {
      const a = (BASE[i] + phi) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a)
      const x = cx + RADII[i] * s * c, y = cy + RADII[i] * s * sn
      pts[i][0] = x; pts[i][1] = y; pts[i][2] = c; pts[i][3] = sn
      nodes[i].style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`
    }
    if (!small) {
      const spots = placeLabels(pts, sizes, { W, H, nodeR, gap })
      for (let i = 0; i < N; i++) labels[i].style.transform = `translate(${spots[i][0].toFixed(1)}px,${spots[i][1].toFixed(1)}px)`
    }
    const turn = `translateX(-50%) rotate(${phi.toFixed(3)}deg)`
    ringsSvg.style.transform = turn; fxSvg.style.transform = turn
  }

  /* ---------- state: which layers are built, which one is active ---------- */
  let ready = false, k = 0, hoverN = 0, pinN = 0, lastAct = -1, shimmered = false, onScreen = false
  function apply() {
    const act = RM ? (hoverN || pinN) : (hoverN || pinN || k)
    const lit = RM ? N : Math.max(k, act)
    for (let i = 0; i < N; i++) {
      const n = i + 1, on = n === act, built = n <= lit
      rings[i].classList.toggle('lit', built); rings[i].classList.toggle('active', on)
      nodes[i].classList.toggle('active', on); labels[i].classList.toggle('active', on)
      rows[i].classList.toggle('lit', built); rows[i].classList.toggle('active', on)
      on ? rows[i].setAttribute('aria-current', 'step') : rows[i].removeAttribute('aria-current')
    }
    if (act !== lastAct) {
      pulses.forEach((p) => p.classList.remove('go'))
      if (act && !RM) { const p = pulses[act - 1]; void p.getBoundingClientRect(); p.classList.add('go') }
      lastAct = act
    }
    if (lit === N && !shimmered && !RM) { shimmered = true; shimmer.classList.add('go') }
  }

  /* ---------- scroll sync: the moat builds layer by layer as the visual passes through view ---------- */
  function scrollK() {
    const r = art.getBoundingClientRect()
    const p = (innerHeight * 0.78 - r.top) / (r.height * 0.85)
    return Math.max(1, Math.min(N, Math.floor(p * N) + 1))
  }
  let sTick = 0
  addEventListener('scroll', () => {
    if (!ready || RM || sTick) return
    sTick = requestAnimationFrame(() => { sTick = 0; const nk = scrollK(); if (nk !== k) { k = nk; pinN = 0; apply() } })
  }, { passive: true })

  /* ---------- hover, focus or tap a node or a row ---------- */
  const bind = (el, n) => {
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hoverN = n; apply() } })
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && hoverN === n) { hoverN = 0; apply() } })
    el.addEventListener('focus', () => { hoverN = n; apply() })
    el.addEventListener('blur', () => { if (hoverN === n) { hoverN = 0; apply() } })
    el.addEventListener('click', () => { pinN = n; apply() })
  }
  nodes.forEach((el, i) => bind(el, i + 1))
  rows.forEach((el, i) => {
    bind(el, i + 1)
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinN = i + 1; apply() } })
  })

  /* ---------- idle turn: whole system, one revolution per 180s; only while on screen ---------- */
  let raf = 0, lastT = 0
  const frame = (t) => {
    raf = requestAnimationFrame(frame)
    const dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t
    phi = (phi + dt / TURN * 360) % 360
    place()
  }
  const run = () => { if (!raf && !RM && onScreen && ready) { lastT = 0; raf = requestAnimationFrame(frame) } }
  const stop = () => { cancelAnimationFrame(raf); raf = 0 }

  /* ---------- entrance, once ---------- */
  function enter() {
    sec.classList.add('mt-in')                                        // logo glows on
    const STAG = 150, DRAW = 600, START = 380
    draws.forEach((d, i) => setTimeout(() => { d.classList.add('drawn'); rings[i].classList.add('lit') }, START + i * STAG))
    const popAt = START + (N - 1) * STAG + DRAW - 150
    nodes.forEach((n, i) => setTimeout(() => n.classList.add('pop'), popAt + i * 70))
    setTimeout(() => {
      ready = true; sec.classList.add('mt-ready')
      k = scrollK(); apply(); run()
    }, popAt + N * 70 + 250)
  }

  measure()
  new ResizeObserver(measure).observe(art)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure)

  if (RM) {
    sec.classList.add('mt-rm', 'mt-in', 'mt-ready')
    draws.forEach((d) => d.classList.add('drawn')); nodes.forEach((n) => n.classList.add('pop'))
    ready = true; apply()
    return
  }

  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting
    sec.classList.toggle('mt-off', !onScreen)
    onScreen ? run() : stop()
  }).observe(sec)
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); enter() } }, { threshold: 0.3 }).observe(art)
}
