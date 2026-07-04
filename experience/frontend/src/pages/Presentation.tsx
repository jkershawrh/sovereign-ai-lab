import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import StackDiagram from '../components/StackDiagram'

function Slide0() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 80px' }}>
      <h1 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>
        90% of the world's AI compute.
        <br />
        <span style={{ color: 'var(--gpu-amber)' }}>Two countries control it.</span>
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', lineHeight: 1.6 }}>
        Every API call to a foreign model is a sovereignty decision.
        Most organizations have not made it consciously.
      </p>
      <svg width={500} height={120} style={{ marginTop: '40px' }}>
        {[
          { label: 'US', w: 200, color: 'var(--rh-red)' },
          { label: 'CN', w: 160, color: 'var(--rh-orange)' },
          { label: 'EU', w: 30, color: 'var(--rh-blue)' },
          { label: 'UK', w: 15, color: 'var(--rh-teal)' },
          { label: 'Others', w: 10, color: 'var(--text-dim)' },
        ].map((bar, i) => {
          const x = 10
          const y = i * 24
          return (
            <g key={bar.label}>
              <motion.rect
                x={x + 50} y={y} height={18} rx={3}
                fill={bar.color}
                initial={{ width: 0 }}
                animate={{ width: bar.w }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
              />
              <text x={x} y={y + 13} fill="var(--text-dim)" fontSize={12} fontFamily="Red Hat Mono, monospace">{bar.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Slide1() {
  const pillars = [
    { name: 'Infrastructure', color: 'var(--intel-cyan)', active: true },
    { name: 'Data', color: 'var(--rh-teal)', active: true },
    { name: 'Models', color: 'var(--ibm-blue)', active: true },
    { name: 'Operations', color: 'var(--rh-green)', active: true },
    { name: 'Governance', color: 'var(--gpu-amber)', active: true },
    { name: 'Energy', color: 'var(--text-disabled)', active: false },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '2rem', marginBottom: '40px' }}>
        Six Pillars of AI Sovereignty
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px' }}>
        {pillars.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="card"
            style={{
              padding: '20px', textAlign: 'center',
              borderTop: `3px solid ${p.color}`,
              opacity: p.active ? 1 : 0.4,
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
            {!p.active && <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>Out of scope</div>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Slide2() {
  const models = [
    { name: 'Granite 3B', origin: 'IBM / Red Hat', license: 'Apache-2.0' },
    { name: 'Llama 3.2', origin: 'Meta', license: 'Llama 3.2 CUL' },
    { name: 'Mistral 7B', origin: 'Mistral AI', license: 'Apache-2.0' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 60px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '2rem', marginBottom: '32px' }}>
        The Open Weights Argument
      </h2>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        {models.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="card"
            style={{ padding: '20px', width: '200px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{m.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{m.origin}</div>
            <div style={{
              marginTop: '8px', padding: '2px 8px', borderRadius: '8px',
              background: 'var(--rh-green-dim, rgba(99,153,61,0.12))',
              color: 'var(--rh-green)', fontSize: '11px', display: 'inline-block',
            }}>
              {m.license}
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '32px', maxWidth: '700px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rh-red)', marginBottom: '12px' }}>Closed API Model</div>
          {['Cannot inspect weights', 'Cannot possess the model', 'Cannot adapt for jurisdiction', 'Cannot prove training data'].map(t => (
            <div key={t} style={{ fontSize: '13px', color: 'var(--text-dim)', padding: '4px 0' }}>✗ {t}</div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rh-green)', marginBottom: '12px' }}>Open Weights Model</div>
          {['Full weight inspection', 'Local possession & control', 'Jurisdiction-specific fine-tuning', 'Documented provenance (AIBOM)'].map(t => (
            <div key={t} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0' }}>✓ {t}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Slide3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 80px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px' }}>
        Running locally is necessary.
        <br />
        <span style={{ color: 'var(--gpu-amber)' }}>It is not sufficient.</span>
      </h2>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.6 }}>
        Without a tamper-evident audit trail, "deployed locally" is a claim.
        With an immutable ledger, it is a proof.
      </p>
      <div style={{ marginTop: '32px' }}>
        <StackDiagram variant="compact" />
      </div>
    </div>
  )
}

function Slide4() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 60px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '2rem', marginBottom: '24px' }}>
        What You Are About to See
      </h2>
      <StackDiagram variant="full" />
      <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: 'Live Demo', path: '/demo' },
          { label: 'Showroom', path: '/showroom' },
          { label: 'Leave-Behind', path: '/leave-behind' },
        ].map(link => (
          <motion.button
            key={link.label}
            className="btn btn-primary"
            onClick={() => navigate(link.path)}
            whileTap={{ scale: 0.97 }}
          >
            {link.label}
          </motion.button>
        ))}
      </div>
      <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--gpu-amber)', fontFamily: 'Red Hat Mono, monospace' }}>
        All of this is running right now on a single Intel Xeon node. Every proof is real.
      </p>
    </div>
  )
}

const SLIDES = [Slide0, Slide1, Slide2, Slide3, Slide4]

export default function Presentation() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'Space'].includes(e.code))
        setSlide(s => Math.min(s + 1, SLIDES.length - 1))
      if (['ArrowLeft', 'ArrowUp'].includes(e.code))
        setSlide(s => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const SlideComponent = SLIDES[slide]

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            style={{ height: '100%' }}
          >
            <SlideComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: '8px',
        padding: '16px', borderTop: '1px solid var(--border)',
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className="progress-dot"
            style={{
              width: i === slide ? 24 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === slide ? 'var(--gpu-amber)' : 'var(--surface-2)',
              transition: 'width 0.3s, background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
