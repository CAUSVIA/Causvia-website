import { FOOTER_COLS } from '../data.js'
import './footer.css'

export default function Footer({ onRequestAccess }) {
  return (
    <footer className="sz-footer">
      <div className="container">
        <div className="cols rv">
          {FOOTER_COLS.map((col) => (
            <div className="col" key={col.title}>
              <h4 className="col-title mono">{col.title}</h4>
              <ul className="col-list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.action === 'access' ? (
                      <button
                        type="button"
                        className="f-link mono"
                        onClick={onRequestAccess}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a className="f-link mono" href={link.href}>
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="strip rv">
          <a className="brand" href="#top" aria-label="Aurexis — back to top">
            <span className="mark" aria-hidden="true" />
            <span className="name display">Aurexis</span>
          </a>
          <p className="tagline mono">
            Nothing is simulated. Every number traces to a real source.
          </p>
          <p className="copy mono">&copy; 2026 Aurexis</p>
        </div>
      </div>
    </footer>
  )
}
