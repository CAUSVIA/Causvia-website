import { useEffect, useRef } from 'react'
import { ACCESS_FORM_URL } from '../data.js'
import './modals.css'

/* access gate: the embedded Google Form loads once on open and again on submit —
   a second load after >1.4s is treated as "submitted" and opens the prototype.
   The iframe mounts fresh on every open, so detection state resets per visit. */
export default function FormModal({ open, onClose, onComplete }) {
  const t0 = useRef(0)
  const loads = useRef(0)
  const done = useRef(false)
  const timer = useRef(0)
  const closeRef = useRef(null)
  const lastFocus = useRef(null)

  /* per-open reset + focus in; cancel a pending onComplete and restore focus on close */
  useEffect(() => {
    if (open) {
      t0.current = Date.now()
      loads.current = 0
      done.current = false
      lastFocus.current = document.activeElement
      closeRef.current?.focus()
    } else {
      clearTimeout(timer.current)
      if (lastFocus.current) { lastFocus.current.focus?.(); lastFocus.current = null }
    }
  }, [open])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onFrameLoad = () => {
    loads.current++
    if (loads.current >= 2 && !done.current && Date.now() - t0.current > 1400) {
      done.current = true
      timer.current = setTimeout(onComplete, 500)
    }
  }

  return (
    <div className={`szm modal${open ? ' open' : ''}`} id="formModal" aria-hidden={!open}>
      <div className="szm-bd" onClick={onClose}></div>
      <div className="szm-dialog szm-form ticks" role="dialog" aria-modal="true" aria-label="Request access">
        <span className="tk" aria-hidden="true"></span>
        <div className="szm-bar">
          <div className="szm-head">
            <span className="szm-title">// Request access</span>
            <span className="szm-sub">Tell us a little about you — or skip straight in. The prototype opens the moment you submit.</span>
          </div>
          <div className="szm-actions">
            <button className="btn chip" onClick={onComplete}>Skip — explore instantly →</button>
            <button className="btn chip" ref={closeRef} onClick={onClose}>✕ Close</button>
          </div>
        </div>
        <div className="szm-frame szm-form-body" id="formBody">
          {open && (
            <iframe
              id="accessFrame"
              title="Request access form"
              src={ACCESS_FORM_URL}
              onLoad={onFrameLoad}
            ></iframe>
          )}
        </div>
      </div>
    </div>
  )
}
