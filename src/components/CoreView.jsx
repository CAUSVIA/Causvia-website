import { useEffect, useRef, useState } from 'react'
import { PROTOTYPE_URL } from '../data.js'
import './coreview.css'

/* full-screen district view entered from the CORE building in the city */
export default function CoreView({ open, onClose }) {
  /* the engine iframe loads once on first entry, then stays mounted */
  const [loaded, setLoaded] = useState(false)
  const closeRef = useRef(null)
  const lastFocus = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  /* move focus into the district on entry; restore it on exit */
  useEffect(() => {
    if (open) {
      setLoaded(true)
      lastFocus.current = document.activeElement
      closeRef.current?.focus()
    } else if (lastFocus.current) {
      lastFocus.current.focus?.()
      lastFocus.current = null
    }
  }, [open])

  /* engine.html is same-origin — forward Escape presses from inside the iframe */
  const hookEscape = (e) => {
    try {
      e.target.contentWindow.document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') onCloseRef.current()
      })
    } catch { /* cross-origin — the exit button still closes */ }
  }

  return (
    <div
      className={`sz-core${open ? ' open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="CORE district"
      aria-hidden={!open}
    >
      <header className="core-head">
        <div className="core-id">
          <span className="core-mark" aria-hidden="true" />
          <h1 className="display core-title">CORE</h1>
          <span className="core-chip mono">SECTOR 01 // ONLINE</span>
        </div>
        <div className="core-actions">
          <span className="core-status mono" aria-hidden="true">
            <i className="dot" /> LIVE RUN
          </span>
          <button type="button" className="btn chip" ref={closeRef} onClick={onClose}>✕ EXIT DISTRICT</button>
        </div>
      </header>

      <div className="core-body">
        <iframe
          title="Aurexis CORE — interactive engine"
          src={loaded ? PROTOTYPE_URL : undefined}
          onLoad={loaded ? hookEscape : undefined}
        />
      </div>

      <footer className="core-foot mono" aria-hidden="true">
        AUREXIS // CORE DISTRICT — NOTHING IS SIMULATED
      </footer>
    </div>
  )
}
