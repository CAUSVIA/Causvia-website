import { useEffect, useRef, useState } from 'react'
import { HERO_TABS, reduce } from '../data.js'
import './hero.css'

export default function Hero({ onRequestAccess }) {
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const [paused, setPaused] = useState(false)
  const tabRefs = useRef([])

  /* auto-cycle tabs every 4s until the user picks one; pauses while the console
     is hovered or holds focus; never runs under reduced motion */
  useEffect(() => {
    if (touched || paused || reduce) return
    const id = setInterval(() => setActive((i) => (i + 1) % HERO_TABS.length), 4000)
    return () => clearInterval(id)
  }, [touched, paused])

  const pick = (i) => { setTouched(true); setActive(i) }

  /* ARIA tabs keyboard pattern: arrows move selection, Home/End jump */
  const onTabKey = (e) => {
    const n = HERO_TABS.length
    let next = null
    if (e.key === 'ArrowRight') next = (active + 1) % n
    else if (e.key === 'ArrowLeft') next = (active - 1 + n) % n
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next === null) return
    e.preventDefault()
    pick(next)
    tabRefs.current[next]?.focus()
  }

  const tab = HERO_TABS[active]

  return (
    <section className="sz-hero section">
      <div className="container">
        {/* (a) top block */}
        <div className="sz-hero-top rv">
          <span className="sz-hero-kicker"><i>{'//'}</i> The opportunity-to-reality engine</span>
          <h1 className="display">From who you are to a live product</h1>
          <p className="sz-hero-sub">
            Profile, opportunity, build, security, deploy, dashboard, AI reach — one continuous,
            honest run. Every number traces to a real source. Nothing is simulated.
          </p>
          <div className="sz-hero-cta">
            <button type="button" className="btn primary" onClick={onRequestAccess}>
              Request access →
            </button>
            <a className="btn ghost" href="#run">See the run</a>
          </div>
        </div>

        {/* (b) tab console */}
        <div
          className="sz-hero-console ticks rv"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <span className="tk" aria-hidden="true" />

          <div className="sz-hero-tabs" role="tablist" aria-label="Engine phases" onKeyDown={onTabKey}>
            {HERO_TABS.map((t, i) => (
              <button
                key={t.key}
                id={`sz-hero-tab-${i}`}
                ref={(el) => { tabRefs.current[i] = el }}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls="sz-hero-panel"
                tabIndex={i === active ? 0 : -1}
                className={`sz-hero-tab${i === active ? ' on' : ''}`}
                onClick={() => pick(i)}
              >
                <span className="idx">{t.n}</span>
                <span className="nm">{t.key}</span>
              </button>
            ))}
          </div>

          {/* remount per tab so the entrance animation replays */}
          <div
            className="sz-hero-swap"
            key={active}
            id="sz-hero-panel"
            role="tabpanel"
            aria-labelledby={`sz-hero-tab-${active}`}
          >
            <div className="sz-hero-readout">
              {tab.lines.map((ln) => (
                <div className="sz-hero-row" key={ln.label}>
                  <span className="lbl">{ln.label}</span>
                  <span className="arw">→</span>
                  <span className="val">{ln.value}</span>
                  <span className="ok">✓ {ln.ok}</span>
                </div>
              ))}
            </div>
            <div className="sz-hero-cap">{tab.cap}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
