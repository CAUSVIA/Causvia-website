// Liquid glass behaviour: the highlight that follows the pointer across glass cards, and the faint refracted
// edge on hero cards (Chromium on large screens only). The material itself is src/glass/glass.css.
import './glass.css'

const RM = matchMedia('(prefers-reduced-motion: reduce)')
const FINE = matchMedia('(hover: hover) and (pointer: fine)')

/* the highlight glides after the pointer rather than snapping to it, and fades in and out with the hover */
let card = null, prev = null, tx = 0, ty = 0, x = 0, y = 0, hl = 0, phl = 0, raf = 0
function frame() {
  let busy = false
  if (card) {
    x += (tx - x) * 0.16; y += (ty - y) * 0.16; hl += (1 - hl) * 0.14
    card.style.setProperty('--mx', x.toFixed(1) + 'px'); card.style.setProperty('--my', y.toFixed(1) + 'px')
    card.style.setProperty('--g-hl', hl.toFixed(3))
    busy = Math.abs(tx - x) + Math.abs(ty - y) > 0.6 || hl < 0.99
  }
  if (prev) {
    phl *= 0.84
    if (phl < 0.01) { prev.style.removeProperty('--g-hl'); prev = null } else { prev.style.setProperty('--g-hl', phl.toFixed(3)); busy = true }
  }
  raf = busy ? requestAnimationFrame(frame) : 0
}
function leave() {
  if (card) { if (prev) prev.style.removeProperty('--g-hl'); prev = card; phl = hl; card = null }
  if (!raf) raf = requestAnimationFrame(frame)
}
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || RM.matches || !FINE.matches) return
  const el = e.target.closest?.('.glass-2,.glass-3')
  if (!el || el.closest('.sn') || el.classList.contains('glass-still')) return leave()
  const r = el.getBoundingClientRect()
  tx = e.clientX - r.left; ty = e.clientY - r.top
  if (el !== card) { leave(); card = el; x = tx; y = ty; hl = 0 }
  if (!raf) raf = requestAnimationFrame(frame)
}, { passive: true })
document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) leave() })

/* refraction: an SVG displacement that bends only the outer few percent of what is seen through the card */
const WIDE = matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)')
const SOLID = matchMedia('(prefers-reduced-transparency: reduce)')
const chromium = navigator.userAgentData?.brands?.some((b) => b.brand === 'Chromium')
if (chromium && document.querySelector('.refract')) {
  const map = (dir, ch) => {
    const [a, b] = ch === 'r' ? ['rgb(255,128,128)', 'rgb(0,128,128)'] : ['rgb(128,255,128)', 'rgb(128,0,128)']
    const g = dir === 'x' ? "x1='0' y1='0' x2='1' y2='0'" : "x1='0' y1='0' x2='0' y2='1'"
    return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>` +
      `<linearGradient id='g' ${g}><stop offset='0' stop-color='${a}'/><stop offset='.07' stop-color='rgb(128,128,128)'/>` +
      `<stop offset='.93' stop-color='rgb(128,128,128)'/><stop offset='1' stop-color='${b}'/></linearGradient>` +
      `<rect width='100' height='100' fill='url(#g)'/></svg>`)
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  svg.innerHTML = `<filter id="cv-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feImage href="${map('x', 'r')}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="mx"/>
    <feImage href="${map('y', 'g')}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="my"/>
    <feDisplacementMap in="SourceGraphic" in2="mx" scale="12" xChannelSelector="R" yChannelSelector="G" result="bent"/>
    <feDisplacementMap in="bent" in2="my" scale="12" xChannelSelector="R" yChannelSelector="G"/></filter>`
  document.body.appendChild(svg)
  const apply = () => document.documentElement.classList.toggle('cv-refract', WIDE.matches && !SOLID.matches)
  apply(); WIDE.addEventListener?.('change', apply); SOLID.addEventListener?.('change', apply)
}
