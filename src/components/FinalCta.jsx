import './finalcta.css'

export default function FinalCta({ onRequestAccess }) {
  return (
    <section className="sz-finalcta section">
      <div className="container">
        <div className="fc-inner rv">
          <h2 className="display fc-title">
            SEE YOUR <span className="fc-hot">RUN.</span>
          </h2>
          <p className="fc-body">
            Request access, tell us a little about you, and the interactive
            prototype opens the moment you submit.
          </p>
          <div className="fc-actions">
            <button
              type="button"
              className="btn primary fc-btn"
              onClick={onRequestAccess}
            >
              REQUEST ACCESS <span aria-hidden="true">→</span>
            </button>
          </div>
          <span className="fc-chip">ILLUSTRATIVE PROTOTYPE · SAMPLE FIGURES</span>
        </div>
      </div>
    </section>
  )
}
