import { SCANS, SECURITY_CARDS, reduce } from '../data.js'
import './security.css'

/* decorative glyphs for the three cards (index-matched to SECURITY_CARDS) */
const GLYPHS = ['⌖', '⊘', '✓']

export default function Security() {
  const badges = (prefix, hidden) => (
    <ul className="szs-list" aria-hidden={hidden || undefined}>
      {SCANS.map((s, i) => (
        <li className="szs-badge" key={`${prefix}-${s}`}>
          <span className={`szs-sq szs-sq-${i % 4}`} aria-hidden="true" />
          {s}
        </li>
      ))}
    </ul>
  )

  return (
    <section className="sz-security section" id="sentinel">
      <div className="container">
        <div className="sec-head szs-head rv">
          <span className="sec-label">[05] // SENTINEL</span>
          <h2 className="display">Audited, not assumed</h2>
        </div>
      </div>

      <div className={`szs-marquee rv${reduce ? ' szs-static' : ''}`}>
        {reduce ? (
          badges('s', false)
        ) : (
          <div className="szs-track">
            {badges('a', false)}
            {badges('b', true)}
          </div>
        )}
      </div>

      <div className="container">
        <div className="szs-grid rv">
          {SECURITY_CARDS.map((c, i) => (
            <article className="szs-card ticks" key={c.n}>
              <i className="tk" aria-hidden="true" />
              <div className="szs-top">
                <span className="szs-idx mono">{c.n}</span>
                <span className="szs-glyph" aria-hidden="true">{GLYPHS[i % GLYPHS.length]}</span>
              </div>
              <h3 className="szs-title">{c.title}</h3>
              <p className="szs-body">{c.body}</p>
              <div className="szs-det mono">↳ {c.det}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
