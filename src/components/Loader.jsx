import { useEffect, useRef, useState } from 'react'
import { reduce } from '../data.js'
import './loader.css'

const BOOT_KEY = 'aurexisBooted'
const DURATION = 1600 // percent ticks 0 → 100 over ~1.6s
const HOLD = 200      // pause at 100% before fading
const FADE = 400      // matches opacity transition in loader.css

const alreadyBooted = () => {
  try { return sessionStorage.getItem(BOOT_KEY) === '1' } catch { return false }
}
const markBooted = () => {
  try { sessionStorage.setItem(BOOT_KEY, '1') } catch { /* storage unavailable — ignore */ }
}

export default function Loader({ onDone }) {
  /* skip the boot entirely for reduced-motion users and in-session replays (HMR/nav) */
  const [skip] = useState(() => reduce || alreadyBooted())
  const [pct, setPct] = useState(0)
  const [fading, setFading] = useState(false)
  const [done, setDone] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (skip) {
      markBooted()
      doneRef.current?.()
      return
    }
    let raf = 0
    const timers = []
    const start = performance.now()

    const tick = (now) => {
      const t = Math.min((now - start) / DURATION, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setPct(Math.round(eased * 100))
      if (t < 1) { raf = requestAnimationFrame(tick); return }
      timers.push(setTimeout(() => {
        setFading(true)
        timers.push(setTimeout(() => {
          markBooted()
          setDone(true)
          doneRef.current?.()
        }, FADE))
      }, HOLD))
    }

    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout) }
  }, [skip])

  if (skip || done) return null

  return (
    <div className={`sz-loader${fading ? ' out' : ''}`}>
      {/* static live region — announced once, not on every percent tick */}
      <span className="sr-only" role="status">Aurexis is initializing</span>
      <div className="szl-col">
        <span className="szl-mark" aria-hidden="true" />
        <span className="szl-sys mono">AUREXIS SYSTEM</span>
        <p className="szl-line display">Aurexis is Initializing</p>
        <span className="szl-pct mono" aria-hidden="true">{pct}%</span>
        <div className="szl-bar" aria-hidden="true">
          <span className="szl-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
