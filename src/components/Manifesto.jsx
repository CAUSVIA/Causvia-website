import { MANIFESTO, reduce } from '../data.js'
import './manifesto.css'

export default function Manifesto() {
  return (
    <section id="manifesto" className="sz-manifesto section">
      {!reduce && <div className="scan" aria-hidden="true" />}
      <div className="container">
        <div className="inner">
          <div className="head rv">
            <span className="sec-label">[03] // MANIFESTO</span>
            <h2 className="display quote">
              Nothing is simulated<span className="dot">.</span>
            </h2>
          </div>

          <div className="body rv">
            {MANIFESTO.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="cta rv">
            <a className="btn ghost" href="#sources">READ THE MOAT ↓</a>
          </div>
        </div>
      </div>
    </section>
  )
}
