import { useState } from 'react'
import './nav.css'

const LINKS = [
  { label: 'THE ENGINE', href: '#engine' },
  { label: 'THE MOAT', href: '#moat' },
  { label: 'MANIFESTO', href: '#manifesto' },
  { label: 'SOURCES', href: '#sources' },
]

export default function Nav({ onRequestAccess }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="sz-nav">
      <div className="bar">
        <a className="brand" href="#top" onClick={close}>
          <span className="mark" aria-hidden="true" />
          <span className="name display">AUREXIS</span>
        </a>

        <nav className="links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="right">
          <span className="status" aria-hidden="true">S.01 — LIVE</span>
          <button
            type="button"
            className="btn primary cta"
            onClick={() => { close(); onRequestAccess() }}
          >
            REQUEST ACCESS
          </button>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="sz-nav-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕ CLOSE' : 'MENU'}
          </button>
        </div>
      </div>

      {open && (
        <div id="sz-nav-menu" className="menu">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>{l.label}</a>
          ))}
        </div>
      )}
    </header>
  )
}
