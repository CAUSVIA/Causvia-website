// About page: things fade up as they enter, the autonomy bars fill, the Flight plan follows the reader,
// and the hero rings drift a few pixels with the mouse.
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const FINE = matchMedia('(pointer: fine)').matches

/* ---------- reveal: fade up 12px, blur to sharp, staggered 60ms among siblings, once ---------- */
const reveals = [...document.querySelectorAll('.reveal')]
if (RM || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('in'))
} else {
  const order = new Map()
  for (const el of reveals) {
    const n = order.get(el.parentElement) || 0
    el.style.setProperty('--d', `${n * 60}ms`)
    order.set(el.parentElement, n + 1)
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
  reveals.forEach((el) => io.observe(el))
}

/* ---------- Flight plan: highlight the chapter being read ---------- */
const links = [...document.querySelectorAll('.fp a')]
const linkFor = new Map(links.map((a) => [a.hash.slice(1), a]))
function setActive(id) {
  for (const a of links) a === linkFor.get(id) ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')
}
const sections = [...document.querySelectorAll('.secs > .sec')]
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) setActive(e.target.id)
    else if (e.target === sections[0] && e.boundingClientRect.top > innerHeight * 0.3) setActive(null)   // back up in the hero
  }
}, { rootMargin: '-30% 0px -65% 0px' })
sections.forEach((s) => spy.observe(s))

/* ---------- hero rings: a few pixels of mouse parallax ---------- */
const rings = document.getElementById('rings')
if (rings && !RM && FINE) {
  const layers = [...rings.querySelectorAll('[data-depth]')].map((el) => [el, +el.dataset.depth])
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0
  const tick = () => {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08
    for (const [el, d] of layers) el.style.transform = `translate3d(${(x * d * 2).toFixed(2)}px,${(y * d * 2).toFixed(2)}px,0)`
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0
  }
  addEventListener('pointermove', (e) => {
    tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5
    if (!raf) raf = requestAnimationFrame(tick)
  }, { passive: true })
}
