import { useEffect, useRef } from 'react'
import { PROTOTYPE_URL } from '../data.js'
import './modals.css'

export default function DemoModal({ open, onClose }) {
  const closeRef = useRef(null)
  const lastFocus = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  /* move focus into the dialog on open; restore it on close */
  useEffect(() => {
    if (open) {
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
    } catch { /* cross-origin — the ✕ button still closes */ }
  }

  return (
    <div className={`szm modal${open ? ' open' : ''}`} id="demoModal" aria-hidden={!open}>
      <div className="szm-bd" onClick={onClose}></div>
      <div className="szm-dialog szm-demo ticks" role="dialog" aria-modal="true" aria-label="Aurexis prototype">
        <span className="tk" aria-hidden="true"></span>
        <div className="szm-bar">
          <div className="szm-head">
            <span className="szm-title">// Aurexis engine</span>
            <span className="szm-sub">Interactive prototype — press “Begin the engine”.</span>
          </div>
          <div className="szm-actions">
            <button className="btn chip" ref={closeRef} onClick={onClose}>✕ Close</button>
          </div>
        </div>
        <div className="szm-frame szm-demo-body">
          {/* mounts per open and unloads on close — the persistent engine lives in CoreView */}
          {open && (
            <iframe
              id="demoFrame"
              title="Aurexis interactive prototype"
              src={PROTOTYPE_URL}
              onLoad={hookEscape}
            ></iframe>
          )}
        </div>
      </div>
    </div>
  )
}
