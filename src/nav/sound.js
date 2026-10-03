// The site's ambient sound (same engine as the home page): a warm pad with a slow pentatonic melody through an echo.
// Off until the visitor asks. The home page runs its own copy of this engine (it also drives the flight's blips).
let actx = null, master = null, echo = null, pad = [], on = false, step = 0, timer = 0
const SCALE = [329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99]
const CHORDS = [[130.81, 164.81, 196.0], [110.0, 130.81, 164.81], [146.83, 174.61, 220.0], [98.0, 146.83, 196.0]]

function init() {
  if (actx) return true
  try { actx = new (window.AudioContext || window.webkitAudioContext)() } catch { return false }
  master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination)
  echo = actx.createDelay(1.0); echo.delayTime.value = 0.42
  const fb = actx.createGain(); fb.gain.value = 0.34; const wet = actx.createGain(); wet.gain.value = 0.3
  echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(master)
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820
  const padGain = actx.createGain(); padGain.gain.value = 0.4; lp.connect(padGain); padGain.connect(master); padGain.connect(echo)
  pad = CHORDS[0].map((f) => { const o = actx.createOscillator(); o.type = 'triangle'; o.frequency.value = f
    const g = actx.createGain(); g.gain.value = 0.5; o.connect(g); g.connect(lp); o.start(); return o })
  return true
}
function note(freq, dur, vol) {
  const t = actx.currentTime + 0.02, o = actx.createOscillator(), g = actx.createGain()
  o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(master); g.connect(echo)
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t); o.stop(t + dur + 0.05)
}
function tick() {
  if (!on || !actx) return
  const t = actx.currentTime
  if (step % 8 === 0) { const ch = CHORDS[(step / 8 | 0) % CHORDS.length]; pad.forEach((o, i) => o.frequency.setTargetAtTime(ch[i], t, 0.7)) }
  if (step % 2 === 0 && Math.random() < 0.66) note(SCALE[Math.random() * SCALE.length | 0], 1.8, 0.07)
  step++
}

/** Toggle the sound and reflect the state on the button (aria-pressed). Returns false if audio is unavailable. */
export function toggleSound(btn) {
  if (!init()) return false
  if (actx.state === 'suspended') actx.resume()
  on = !on
  master.gain.setTargetAtTime(on ? 0.16 : 0, actx.currentTime, 0.6)
  if (on && !timer) { step = 0; tick(); timer = setInterval(tick, 900) }
  else if (!on && timer) { clearInterval(timer); timer = 0 }
  btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on))
  return true
}
