import { FEATURES, FEATURES_SUB } from '../data.js'
import './features.css'

export default function Features() {
  return (
    <section id="engine" className="sz-features section">
      <div className="container">
        <div className="sec-head rv">
          <span className="sec-label">[01] // CAPABILITIES</span>
          <h2 className="display">Ready for Reality</h2>
          <p className="sub">{FEATURES_SUB}</p>
        </div>

        <div className="f-grid rv">
          {FEATURES.map((f) => (
            <article className="f-card card ticks" key={f.n}>
              <div className="f-top">
                <span className="f-glyph" aria-hidden="true">{f.glyph}</span>
                <span className="f-index mono">{f.n}</span>
              </div>
              <h3 className="f-title">{f.title}</h3>
              <p className="f-body">{f.body}</p>
              <p className="f-det mono">↳ {f.det}</p>
              <span className="tk" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
