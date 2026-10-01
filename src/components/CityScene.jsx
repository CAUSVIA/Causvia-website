import { useEffect, useRef, useState } from 'react'
import { CITY_BUILDINGS, reduce } from '../data.js'
import './city.css'

/* building geometry on a 1200x440 stage; ground line at y=400 */
const GEO = {
  main:      { x: 60,   w: 150, h: 180 },
  forge:     { x: 252,  w: 130, h: 244 },
  core:      { x: 468,  w: 184, h: 330 },
  sentinel:  { x: 694,  w: 120, h: 208 },
  dashboard: { x: 856,  w: 150, h: 262 },
  studio:    { x: 1048, w: 110, h: 158 },
}
const GROUND = 400

/* deterministic window grid — lit pattern is stable across renders */
function windows(b, key) {
  const cells = []
  const inset = 16, pitchX = 22, pitchY = 20, ww = 9, wh = 6
  const cols = Math.floor((b.w - inset * 2) / pitchX)
  const rows = Math.floor((b.h - inset * 2 - 8) / pitchY)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = (r * 7 + c * 3 + key.length) % 5 < 2
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={b.x + inset + c * pitchX}
          y={GROUND - b.h + inset + r * pitchY}
          width={ww}
          height={wh}
          className={lit ? 'win lit' : 'win'}
        />
      )
    }
  }
  return cells
}

function Bracket({ b }) {
  const pad = 8, L = 14
  const x0 = b.x - pad, x1 = b.x + b.w + pad
  const y0 = GROUND - b.h - pad, y1 = GROUND + pad
  return (
    <g className="hud-bracket" aria-hidden="true">
      <path d={`M${x0} ${y0 + L} V${y0} H${x0 + L}`} />
      <path d={`M${x1 - L} ${y0} H${x1} V${y0 + L}`} />
      <path d={`M${x1} ${y1 - L} V${y1} H${x1 - L}`} />
      <path d={`M${x0 + L} ${y1} H${x0} V${y1 - L}`} />
    </g>
  )
}

export default function CityScene({ onEnterCore }) {
  const [hot, setHot] = useState(null)        /* hovered/focused building */
  const [soonKey, setSoonKey] = useState(null) /* clicked coming-soon building */
  const soonTimer = useRef(0)

  useEffect(() => () => clearTimeout(soonTimer.current), [])

  const engage = (b) => {
    if (b.status === 'online') { onEnterCore(); return }
    clearTimeout(soonTimer.current)
    setSoonKey(b.key)
    soonTimer.current = setTimeout(() => setSoonKey(null), 2200)
  }

  /* HUD readout — HTML (not SVG) so it never scales down or clips with the stage */
  const activeKey = hot || soonKey
  const activeB = activeKey ? CITY_BUILDINGS.find((b) => b.key === activeKey) : null
  const readout = !activeB
    ? 'SCANNING SECTORS…'
    : activeB.status === 'online'
      ? `${activeB.name} // ONLINE — ENTER`
      : soonKey === activeB.key
        ? `${activeB.name} // COMING SOON`
        : `${activeB.name} // SECTOR LOCKED`
  const readoutMod = !activeB ? '' : activeB.status === 'online' ? ' online' : soonKey === activeB.key ? ' denied' : ''

  return (
    <section className="sz-city section" id="city">
      <div className="container">
        <div className="sec-head rv">
          <span className="sec-label">[06] // THE CITY</span>
          <h2 className="display">Choose your building</h2>
          <p className="sub">
            Every district of Aurexis lives here. CORE is online today — the rest of the city
            is under construction, and it says so instead of pretending.
          </p>
        </div>

        <div className="city-stage ticks rv">
          <span className="tk" aria-hidden="true" />
          <div className={`city-readout mono${readoutMod}`} key={readout} aria-hidden="true">
            <i /> {readout}
          </div>
          <svg
            viewBox="0 0 1200 440"
            className="city-svg"
            role="group"
            aria-label="Aurexis city map — select a building"
          >
            {/* backdrop grid */}
            <g className="grid" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <line key={i} x1="0" y1={GROUND + i * 7} x2="1200" y2={GROUND + i * 7} />
              ))}
            </g>

            {/* scan beam */}
            {!reduce && <rect className="scan" x="-80" y="0" width="80" height={GROUND} aria-hidden="true" />}

            {CITY_BUILDINGS.map((meta) => {
              const b = { ...meta, ...GEO[meta.key] }
              const on = hot === b.key || soonKey === b.key
              return (
                <g
                  key={b.key}
                  className={[
                    'bld',
                    b.status === 'online' ? 'online' : 'locked',
                    on ? 'hot' : '',
                    soonKey === b.key ? 'denied' : '',
                  ].join(' ')}
                  role="button"
                  tabIndex={0}
                  aria-label={b.status === 'online' ? `${b.name} — online, enter` : `${b.name} — coming soon`}
                  onMouseEnter={() => setHot(b.key)}
                  onMouseLeave={() => setHot(null)}
                  onFocus={() => setHot(b.key)}
                  onBlur={() => setHot(null)}
                  onClick={() => engage(b)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); engage(b) } }}
                >
                  <rect className="body" x={b.x} y={GROUND - b.h} width={b.w} height={b.h} />
                  <rect className="roof" x={b.x} y={GROUND - b.h} width={b.w} height="6" />
                  {windows(b, b.key)}

                  {/* CORE antenna + beacon */}
                  {b.status === 'online' && (
                    <g aria-hidden="true">
                      <line className="antenna" x1={b.x + b.w / 2} y1={GROUND - b.h} x2={b.x + b.w / 2} y2={GROUND - b.h - 46} />
                      <circle className="beacon" cx={b.x + b.w / 2} cy={GROUND - b.h - 50} r="4" />
                      {!reduce && <circle className="beacon-pulse" cx={b.x + b.w / 2} cy={GROUND - b.h - 50} r="4" />}
                    </g>
                  )}

                  {on && <Bracket b={b} />}
                </g>
              )
            })}

            {/* ground line */}
            <line className="ground" x1="0" y1={GROUND} x2="1200" y2={GROUND} aria-hidden="true" />
          </svg>

          <div className="city-legend mono" aria-hidden="true">
            <span className="lg-item on"><i />ONLINE</span>
            <span className="lg-item"><i />COMING SOON</span>
          </div>
        </div>
      </div>
    </section>
  )
}
