import { useEffect, useRef } from 'react'
import { MOAT_ROWS, SOURCES, STATS, reduce } from '../data.js'
import './sources.css'

/* count-up on reveal — same IntersectionObserver + rAF pattern as the old Moat.jsx */
function countUp(el, to, suffix) {
  if (reduce) { el.textContent = to + suffix; return }
  const start = performance.now(), dur = 1100
  const frame = (now) => {
    const p = Math.min(1, (now - start) / dur)
    const e = 1 - Math.pow(1 - p, 3)
    el.textContent = Math.round(to * e) + suffix
    if (p < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

function Stat({ count, suffix = '', label }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { countUp(el, count, suffix); io.unobserve(el) }
      })
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [count, suffix])

  return (
    <div className="stat">
      <div className="stat-v mono" ref={ref}>0</div>
      <div className="stat-l mono">{label}</div>
    </div>
  )
}

function MoatCard({ variant, data, mark }) {
  return (
    <div className={`moat-card ticks ${variant}`}>
      <span className="tk" aria-hidden="true" />
      <span className="tag mono">{data.tag}</span>
      <h3>{data.title}</h3>
      <ul>
        {data.rows.map((row) => (
          <li key={row}>
            <span className="m mono" aria-hidden="true">{mark}</span>
            <span>{row}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Sources() {
  return (
    <section id="sources" className="sz-sources section">
      <div className="container">
        <div className="sec-head rv">
          <span className="sec-label">[04] // THE MOAT</span>
          <h2 className="display">Every number has a source</h2>
          <p className="sub">Most tools simulate. Aurexis sources.</p>
        </div>

        {/* (a) contrast strip — simulated vs real evidence */}
        <div className="moat-split rv" id="moat">
          <MoatCard variant="bad" data={MOAT_ROWS.bad} mark="✕" />
          <MoatCard variant="good" data={MOAT_ROWS.good} mark="✓" />
        </div>

        {/* (b) source tiles */}
        <div className="tile-grid rv">
          {SOURCES.map((s) => (
            <div className="tile" key={s.name}>
              <div className="tile-top">
                <span className="tile-name mono">{s.name}</span>
                <span className={`kind mono kind-${s.kind.toLowerCase()}`}>{s.kind}</span>
              </div>
              <p className="tile-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* stats row */}
        <div className="stats rv">
          {STATS.map((s) => (
            <Stat key={s.label} count={s.count} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  )
}
