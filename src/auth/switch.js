// The AUTOPILOT switch: tap or drag the knob, or use Space / Enter / arrow keys. A damped spring gives the slide a
// liquid overshoot; with reduced motion it changes instantly. onChange(on, byUser) fires when AI ⇄ YOU flips.
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches

export function autopilot(el, { onChange }) {
  const knob = el.querySelector('.ap-knob'), track = el.querySelector('.ap-track')
  let on = false, x = 0, v = 0, target = 0, raf = 0, drag = null

  const travel = () => track.clientWidth - knob.offsetWidth - 2 * knob.offsetLeft
  const render = () => { knob.style.transform = `translate3d(${(x * travel()).toFixed(2)}px,0,0)` }

  function spring() {
    cancelAnimationFrame(raf)
    let lt = performance.now()
    const step = (now) => {
      const dt = Math.min(32, now - lt) / 1000; lt = now
      const a = -380 * (x - target) - 21 * v                 // stiffness, damping: one soft overshoot, then rest
      v += a * dt; x += v * dt
      if (Math.abs(x - target) < .0008 && Math.abs(v) < .003) { x = target; v = 0; render(); raf = 0; return }
      render(); raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  function set(next, byUser = true) {
    const changed = next !== on
    on = next; target = on ? 1 : 0
    el.setAttribute('aria-checked', String(on))
    if (RM) { cancelAnimationFrame(raf); x = target; v = 0; render() } else spring()
    if (changed) onChange(on, byUser)
  }

  // pointer: a tap toggles; a drag follows the finger and settles on the nearer side, keeping its momentum
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    drag = { id: e.pointerId, sx: e.clientX, x0: x, moved: false, lx: e.clientX, lt: performance.now(), vel: 0 }
    el.setPointerCapture(e.pointerId)
  })
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const dx = e.clientX - drag.sx
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; cancelAnimationFrame(raf); raf = 0 }
    if (!drag.moved) return
    const now = performance.now(), tr = travel() || 1
    drag.vel = ((e.clientX - drag.lx) / tr) / Math.max(.008, (now - drag.lt) / 1000); drag.lx = e.clientX; drag.lt = now
    x = Math.max(-.05, Math.min(1.05, drag.x0 + dx / tr)); v = 0; render()
  })
  el.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const d = drag; drag = null
    if (!d.moved) { set(!on); return }
    v = RM ? 0 : Math.max(-6, Math.min(6, d.vel))
    set(x + d.vel * .08 > .5)
  })
  el.addEventListener('pointercancel', () => { if (drag) { drag = null; set(on, false) } })
  el.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); set(!on) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); set(true) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); set(false) }
  })
  // assistive tech "activate" dispatches a click with no pointer behind it
  el.addEventListener('click', (e) => { if (e.detail === 0) set(!on) })
  addEventListener('resize', render)
  render()
  return { set, get on() { return on } }
}
