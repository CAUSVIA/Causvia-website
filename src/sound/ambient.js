// Ambient soundscape, generated live with the Web Audio API (no audio files): a warm pad drifting through four
// related chords, soft bells, a breath of air and a large reverb. Off by default; the navbar's speaker turns it on.
// window.cvAudio lets page scripts (the home page's boot loader and flight cues) play on top and duck the music.

const KEY = 'cv-sound'            // 'on' | 'off': the visitor's choice, kept between visits
const LIVE = 'cv-sound-live'      // this tab has played music: the next page tries to carry on without a click
const MASTER = Math.pow(10, -24 / 20)          // -24 dB
const FADE_IN = 3, FADE_OUT = 1.5, DUCK = 0.55
const RM = matchMedia('(prefers-reduced-motion: reduce)')
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)
const rand = (a, b) => a + Math.random() * (b - a)
const store = (s, k, v) => { try { v === undefined ? s.removeItem(k) : s.setItem(k, v) } catch {} }
const load = (s, k) => { try { return s.getItem(k) } catch { return null } }

// D major colour, each chord voiced across two octaves: Dmaj7 → Bm11 → Gmaj9 → Aadd9
const CHORDS = [[50, 57, 61, 66, 69], [47, 54, 57, 62, 64], [43, 50, 59, 66, 69], [45, 52, 59, 61, 64]]
const SPREAD = [-0.5, 0.35, -0.2, 0.55, -0.05]     // where each voice sits in the stereo field

let ctx = null, n = null
let on = load(localStorage, KEY) === 'on'
let playing = false, waiting = false, hiddenPause = false
let chord = 0, bank = 0, chordT = 0, bellT = 0, offT = 0, holds = 0

function ramp(param, v, dur) {
  const t = ctx.currentTime
  param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + dur)
}
function panner(p) {
  if (!ctx.createStereoPanner) return ctx.createGain()
  const s = ctx.createStereoPanner(); s.pan.value = Math.max(-1, Math.min(1, p)); return s
}

/* the whole graph is made once; while the sound is off the context is suspended, so it costs nothing */
function build() {
  if (ctx) return true
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  try { ctx = new AC({ latencyHint: 'playback' }) } catch { return false }
  const c = ctx
  const limiter = c.createDynamicsCompressor()            // nothing ever spikes
  limiter.threshold.value = -12; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.25
  limiter.connect(c.destination)
  const master = c.createGain(); master.gain.value = 0; master.connect(limiter)
  const duck = c.createGain(); duck.connect(master)
  const fx = c.createGain(); fx.connect(limiter)          // page cues keep their own levels, on top of the music

  const verb = c.createConvolver(); verb.buffer = impulse(c, 3.6)
  const wet = c.createGain(); wet.gain.value = 0.55; verb.connect(wet); wet.connect(duck)

  // pad: two banks of five voices; a chord change crossfades from one bank to the other
  const padBus = c.createGain(); padBus.gain.value = 1
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5; lp.frequency.value = 950
  const dry = c.createGain(); dry.gain.value = 0.7
  padBus.connect(lp); lp.connect(dry); dry.connect(duck); lp.connect(verb)
  const lfo = c.createOscillator(), lfoAmt = c.createGain(); lfo.type = 'sine'
  lfo.frequency.value = RM.matches ? 0.02 : 0.05; lfoAmt.gain.value = RM.matches ? 140 : 420     // start at the sweep's own pace
  lfo.connect(lfoAmt); lfoAmt.connect(lp.frequency); lfo.start()
  const banks = [0, 1].map(() => {
    const g = c.createGain(); g.gain.value = 0; g.connect(padBus)
    const voices = CHORDS[0].map((_, i) => {
      const vg = c.createGain(); vg.gain.value = 0.085; vg.connect(g)
      return [-1, 1].map((side, k) => {                   // a slightly detuned pair, spread apart for width
        const o = c.createOscillator(); o.type = k ? 'sine' : 'triangle'; o.detune.value = side * 6
        const p = panner(SPREAD[i] + side * 0.22); o.connect(p); p.connect(vg); o.start(); return o
      })
    })
    return { g, voices }
  })

  // air: filtered noise, barely there
  const noise = c.createBufferSource(); noise.buffer = noiseBuffer(c); noise.loop = true
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600
  const nlp = c.createBiquadFilter(); nlp.type = 'lowpass'; nlp.frequency.value = 7000
  const air = c.createGain(); air.gain.value = 0.014
  noise.connect(hp); hp.connect(nlp); nlp.connect(air); air.connect(duck); air.connect(verb); noise.start()

  const bells = c.createGain(); bells.gain.value = 0.9; bells.connect(duck)
  const bellSend = c.createGain(); bellSend.gain.value = 0.9; bells.connect(bellSend); bellSend.connect(verb)

  n = { master, duck, fx, lfo, lfoAmt, banks, bells }
  RM.addEventListener?.('change', motion)
  setChord(0, 0.05)
  return true
}

/* a large soft room: decaying noise, darkened, slightly different in each ear */
function impulse(c, sec) {
  const rate = c.sampleRate, len = Math.floor(rate * sec), buf = c.createBuffer(2, len, rate), fade = rate * 0.03
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch); let s = 0
    for (let i = 0; i < len; i++) {
      s = s * 0.6 + (Math.random() * 2 - 1) * 0.4
      d[i] = s * Math.pow(1 - i / len, 3) * Math.min(1, i / fade)
    }
  }
  return buf
}
function noiseBuffer(c) {
  const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/* filter sweep: a slow breath (gentler and slower when reduced motion is preferred) */
function motion() {
  if (!n) return
  const t = ctx.currentTime
  n.lfo.frequency.setTargetAtTime(RM.matches ? 0.02 : 0.05, t, 1)
  n.lfoAmt.gain.setTargetAtTime(RM.matches ? 140 : 420, t, 1)
}

function setChord(i, fade = 9) {
  const next = n.banks[bank ^ 1], cur = n.banks[bank], t = ctx.currentTime
  CHORDS[i].forEach((note, v) => next.voices[v].forEach((o) => o.frequency.setValueAtTime(midi(note), t)))
  ramp(cur.g.gain, 0, fade); ramp(next.g.gain, 1, fade)
  bank ^= 1; chord = i
}

/* a soft high bell on a note of the current chord: a sine with a slow decay and a faint shimmer */
function bell() {
  const c = ctx, t = c.currentTime + 0.03
  let note = CHORDS[chord][Math.floor(Math.random() * 5)]; while (note < 74) note += 12
  const peak = rand(0.045, 0.075), p = panner(rand(-0.6, 0.6)); p.connect(n.bells)
  ;[[1, peak, 6], [2.76, peak * 0.16, 2.2]].forEach(([ratio, v, dur]) => {
    const o = c.createOscillator(), g = c.createGain()
    o.type = 'sine'; o.frequency.value = midi(note) * ratio; o.connect(g); g.connect(p)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.start(t); o.stop(t + dur + 0.1)
  })
}

function schedule() {
  unschedule()
  chordT = setTimeout(function next() { setChord((chord + 1) % CHORDS.length); chordT = setTimeout(next, rand(12000, 20000)) }, rand(12000, 20000))
  bellT = setTimeout(function ring() { bell(); bellT = setTimeout(ring, rand(8000, 20000)) }, rand(4000, 9000))
}
function unschedule() { clearTimeout(chordT); clearTimeout(bellT) }

/* start (or carry on) playing; only works once the browser allows audio on this page */
function start(fade = FADE_IN) {
  if (!build()) return
  clearTimeout(offT)
  const go = () => {
    if (ctx.state !== 'running') { arm(); return }
    if (!on || playing || document.hidden) return
    playing = true; waiting = false
    schedule(); ramp(n.master.gain, MASTER, fade)
    store(sessionStorage, LIVE, '1'); emit()
  }
  if (ctx.state === 'running') return go()
  ctx.resume().then(go, arm)
  setTimeout(() => { if (ctx.state !== 'running') arm() }, 400)    // resume() can stay pending until a click
}
function stop(fade = FADE_OUT) {
  if (!ctx || !playing) return
  playing = false; unschedule(); ramp(n.master.gain, 0, fade); emit()
  clearTimeout(offT); offT = setTimeout(() => { if (!playing) ctx.suspend() }, fade * 1000 + 200)
}

/* the choice is "on" but the browser needs a click first: start on the visitor's first interaction */
const GESTURES = ['pointerdown', 'pointerup', 'click', 'keydown', 'touchend']
function onGesture(e) {
  if (e.target?.closest?.('[data-sound-toggle]')) return       // a click on the speaker decides for itself
  if (!on) return disarm()
  if (playing) return disarm()
  start()
}
function arm() {
  if (waiting || !on) return
  waiting = true; GESTURES.forEach((t) => addEventListener(t, onGesture, true)); emit()
}
function disarm() { waiting = false; GESTURES.forEach((t) => removeEventListener(t, onGesture, true)) }

function set(next) {
  on = !!next; store(localStorage, KEY, on ? 'on' : 'off')
  if (on) start()
  else { disarm(); stop(); store(sessionStorage, LIVE) }
  emit()
}

/* page cues (boot loader, flight blips) dip the music a little while they sound */
function duck(sec = 0.6) {
  if (!n) return
  const g = n.duck.gain, t = ctx.currentTime
  g.cancelScheduledValues(t); g.setTargetAtTime(DUCK, t, 0.05)
  if (!holds) g.setTargetAtTime(1, t + sec, 0.6)
}
function hold(down) {
  if (!n) return
  holds = Math.max(0, holds + (down ? 1 : -1))
  const g = n.duck.gain, t = ctx.currentTime
  g.cancelScheduledValues(t); g.setTargetAtTime(holds ? DUCK : 1, t, holds ? 0.12 : 0.8)
}

const state = () => ({ on, playing, waiting })
function emit() { dispatchEvent(new CustomEvent('cv-sound', { detail: state() })) }

/* hidden tab: fade out and suspend; back again: fade in */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (playing) { hiddenPause = true; stop(0.6) } }
  else if (hiddenPause) { hiddenPause = false; if (on) start(2) }
})

export const cvAudio = {
  state, set, toggle: () => set(!on), duck, hold,
  isOn: () => on, isPlaying: () => playing,
  context: () => (build() ? ctx : null), fx: () => (n ? n.fx : null),
  supported: () => !!(window.AudioContext || window.webkitAudioContext),
  // read-only snapshot, for checking fades and ducking from the console or a test
  debug: () => ({ context: ctx ? ctx.state : 'none', master: n ? n.master.gain.value : 0, duck: n ? n.duck.gain.value : 1,
    lfoHz: n ? n.lfo.frequency.value : 0, lfoDepth: n ? n.lfoAmt.gain.value : 0, chord, ...state() }),
}
window.cvAudio = cvAudio

/* on load: the choice was "on". Moving between pages, try to carry on (browsers allow it after a click on the
   previous page); on a fresh visit, wait for the visitor's first click. */
if (on) {
  if (load(sessionStorage, LIVE)) start(FADE_IN)
  else arm()
}
