import { useEffect, useRef, useState } from 'react'
import { RUN_STAGES, RUN_SUB, reduce } from '../data.js'
import './run.css'

const TOTAL = String(RUN_STAGES.length).padStart(2, '0')

export default function RunSection() {
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const railRef = useRef(null)

  /* auto-advance every 3.2s until the user takes over (skipped for reduced motion) */
  useEffect(() => {
    if (touched || reduce) return
    const id = setInterval(() => setActive((i) => (i + 1) % RUN_STAGES.length), 3200)
    return () => clearInterval(id)
  }, [touched])

  /* keep the active chip in view when the rail is in horizontal (mobile) mode —
     only ever scrolls the rail itself, never the page */
  useEffect(() => {
    const rail = railRef.current
    if (!rail || rail.scrollWidth <= rail.clientWidth + 1) return
    const el = rail.children[active]
    if (!el) return
    rail.scrollTo({
      left: el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [active])

  const stage = RUN_STAGES[active]

  return (
    <section id="run" className="sz-run section">
      <div className="container">
        <div className="sec-head rv">
          <span className="sec-label">[02] // ONE RUN · SEVEN STAGES</span>
          <h2 className="display">ONE CONTINUOUS RUN</h2>
          <p className="sub">{RUN_SUB}</p>
        </div>

        <div className="run-grid rv">
          {/* stage rail — vertical rows ≥1000px, horizontal scroll-snap chips below */}
          <div className="rs-rail" ref={railRef} aria-label="Run stages">
            {RUN_STAGES.map((st, i) => (
              <button
                key={st.id}
                type="button"
                className={`rs-row${i === active ? ' on' : ''}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => { setTouched(true); setActive(i) }}
              >
                <span className="rs-idx">{st.n}</span>
                <span className="rs-name">{st.name}</span>
                <span className="rs-kc">{st.kc}</span>
              </button>
            ))}
          </div>

          {/* terminal panel */}
          <div className="rs-panel ticks">
            <span className="tk" aria-hidden="true" />
            <div className="rs-head">
              <span className="rs-dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="rs-title">AUREXIS // RUN.LOG</span>
              <span className="rs-count">{stage.n} / {TOTAL}</span>
            </div>
            <div className="rs-body">
              {/* key remounts the block so the slide-in replays per stage */}
              <div className="rs-enter" key={active}>
                <p className="rs-cmd"><span className="rs-ps">$</span> stage.{stage.id}</p>
                <h3 className="rs-h">{stage.h}</h3>
                <p className="rs-p">{stage.p}</p>
                <p className="rs-det"><span aria-hidden="true">↳ </span>{stage.det}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
