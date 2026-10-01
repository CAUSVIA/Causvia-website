import { useEffect, useState } from 'react'
import Loader from './components/Loader.jsx'
import Frame from './components/Frame.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Features from './components/Features.jsx'
import RunSection from './components/RunSection.jsx'
import Manifesto from './components/Manifesto.jsx'
import CityScene from './components/CityScene.jsx'
import CoreView from './components/CoreView.jsx'
import Sources from './components/Sources.jsx'
import Security from './components/Security.jsx'
import FinalCta from './components/FinalCta.jsx'
import Footer from './components/Footer.jsx'
import FormModal from './components/FormModal.jsx'
import DemoModal from './components/DemoModal.jsx'

export default function App() {
  const [booted, setBooted] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [coreOpen, setCoreOpen] = useState(false)

  const openForm = () => setFormOpen(true)
  const closeForm = () => setFormOpen(false)
  const openDemo = () => { setFormOpen(false); setDemoOpen(true) }
  const closeDemo = () => setDemoOpen(false)

  /* body scroll lock while a modal, the CORE district, or the boot loader is open */
  useEffect(() => {
    document.body.style.overflow = !booted || formOpen || demoOpen || coreOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [booted, formOpen, demoOpen, coreOpen])

  /* escape closes the topmost overlay */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (formOpen) setFormOpen(false)
      else if (demoOpen) setDemoOpen(false)
      else if (coreOpen) setCoreOpen(false)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [formOpen, demoOpen, coreOpen])

  /* reveal on scroll */
  useEffect(() => {
    if (!booted) return
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
      })
    }, { threshold: 0.15 })
    document.querySelectorAll('.rv').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [booted])

  return (
    <>
      {!booted && <Loader onDone={() => setBooted(true)} />}
      <Frame />
      <Nav onRequestAccess={openForm} />

      <main id="top">
        <Hero onRequestAccess={openForm} />
        <Features />
        <RunSection />
        <Manifesto />
        <CityScene onEnterCore={() => setCoreOpen(true)} />
        <Sources />
        <Security />
        <FinalCta onRequestAccess={openForm} />
      </main>
      <Footer onRequestAccess={openForm} />

      <CoreView open={coreOpen} onClose={() => setCoreOpen(false)} />
      <FormModal open={formOpen} onClose={closeForm} onComplete={openDemo} />
      <DemoModal open={demoOpen} onClose={closeDemo} />
    </>
  )
}
