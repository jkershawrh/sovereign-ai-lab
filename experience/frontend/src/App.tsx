import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Header from './components/Header'
import Footer from './components/Footer'
import SplashIntro from './components/SplashIntro'

// ─── Act type ──────────────────────────────────────────────────────────────
type ActEntry = {
  id: string
  label: string
  component: React.ComponentType<{ onComplete?: () => void }>
  nextLabel?: string
}

// ─── Sovereign Stack interactive slide ─────────────────────────────────────
const STACK_LAYERS = [
  { label: 'Your Compute Is Yours', tech: 'Intel TDX', desc: 'Confidential computing proves your workload runs in a hardware-attested trust domain. No one — not the cloud provider, not the host OS — can see inside.', color: '#00AEEF' },
  { label: 'Your Platform Is Yours', tech: 'OpenShift AI', desc: 'Kubernetes orchestration with confidential containers. Deploy AI workloads on your infrastructure with the same tools your teams already know.', color: '#ee0000' },
  { label: 'Your Model Is Yours', tech: 'Granite · Open Weights', desc: 'Open-weight models you can inspect, possess, and fine-tune for your jurisdiction. Not an API you rent — weights you own, licensed Apache 2.0.', color: '#0F62FE' },
  { label: 'Your Data Stays Here', tech: 'OPA · Residency Policies', desc: 'Deny-by-default policies enforce data residency per jurisdiction. Sensitive data never leaves your borders. Every policy decision is logged.', color: '#37a3a3' },
  { label: 'Your Agents Are Governed', tech: 'Semantic Router · SPIFFE', desc: 'Every agent has a verified identity. Prompts are classified before they reach the model. Injection attempts are blocked. Routing enforces jurisdictional rules.', color: '#5e40be' },
  { label: 'Your Gateway Is Controlled', tech: 'Praxis · ContextForge', desc: 'AI-aware proxy with filter pipeline and MCP federation. Every request flowing through the gateway is recorded and hash-chained.', color: '#63993d' },
  { label: 'Every Decision Is Provable', tech: 'are-immutable-ledger', desc: 'A tamper-evident hash chain records every governance decision. The root hash proves the full audit trail. Modify any entry and the chain breaks.', color: '#F5A623' },
]

function SovereignStackSlide({ advance }: { advance: () => void }) {
  const [revealed, setRevealed] = useState(-1)
  const allRevealed = revealed >= STACK_LAYERS.length - 1
  const showSummary = revealed >= STACK_LAYERS.length

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showSummary) return
    setRevealed(r => r + 1)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: '0 40px',
        cursor: showSummary ? 'default' : 'pointer',
      }}
    >
      {!showSummary && revealed < 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
            What makes AI sovereign?
          </h2>
          <p style={{ fontSize: 20, color: 'var(--text-dim)' }}>Click to explore each layer.</p>
        </motion.div>
      )}

      {!showSummary && revealed >= 0 && !allRevealed && (
        <AnimatePresence mode="wait">
          <motion.div
            key={revealed}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', maxWidth: 700 }}
          >
            <div style={{
              display: 'inline-block', padding: '6px 20px', borderRadius: 20,
              background: STACK_LAYERS[revealed].color, color: '#000',
              fontFamily: 'Red Hat Mono, monospace', fontSize: 13, fontWeight: 700,
              marginBottom: 16,
            }}>
              {revealed + 1} / {STACK_LAYERS.length}
            </div>
            <h2 style={{
              fontFamily: 'Red Hat Display, sans-serif', fontSize: 36, fontWeight: 800,
              marginBottom: 12, color: STACK_LAYERS[revealed].color,
            }}>
              {STACK_LAYERS[revealed].label}
            </h2>
            <div style={{
              fontFamily: 'Red Hat Mono, monospace', fontSize: 14,
              color: 'var(--text-dim)', marginBottom: 20,
            }}>
              {STACK_LAYERS[revealed].tech}
            </div>
            <p style={{ fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {STACK_LAYERS[revealed].desc}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 24 }}>
              click to continue
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {allRevealed && !showSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
          onClick={(e) => { e.stopPropagation(); setRevealed(STACK_LAYERS.length) }}
        >
          <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 36, fontWeight: 800, color: STACK_LAYERS[6].color, marginBottom: 12 }}>
            {STACK_LAYERS[6].label}
          </h2>
          <div style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, color: 'var(--text-dim)', marginBottom: 20 }}>
            {STACK_LAYERS[6].tech}
          </div>
          <p style={{ fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 700 }}>
            {STACK_LAYERS[6].desc}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 24 }}>click to see the full stack</p>
        </motion.div>
      )}

      {showSummary && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', maxWidth: 800 }}>
          <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 24 }}>
            The Sovereign AI Stack
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 32 }}>
            {STACK_LAYERS.map((l, i) => (
              <motion.div
                key={l.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 20px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: `4px solid ${l.color}`,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif' }}>{l.label}</span>
                <span style={{ fontSize: 13, fontFamily: 'Red Hat Mono, monospace', color: l.color }}>{l.tech}</span>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 24 }}>
              All seven layers. Running on a single Intel Xeon. All provably governed.
            </p>
            <motion.button
              onClick={(e) => { e.stopPropagation(); advance() }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: '#ee0000', border: 'none', color: '#fff',
                padding: '16px 48px', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'Red Hat Text, sans-serif', fontSize: 18, fontWeight: 600,
              }}
            >
              See the live proof →
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Slides ────────────────────────────────────────────────────────────────
const SLIDES: ((props: { advance: () => void }) => React.ReactNode)[] = [
  // Slide 0: Splash
  () => <SplashIntro />,

  // Slide 1: The sovereignty gap — sourced from Epoch AI 2025
  () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 60px' }}>
      <h1 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 32, maxWidth: 900 }}>
        One country controls three-quarters
        <br />
        <span style={{ color: 'var(--gpu-amber)' }}>of the world's AI compute.</span>
      </h1>
      <div style={{ width: '100%', maxWidth: 700, marginTop: 24 }}>
        {[
          { label: 'United States', pct: 74.5, color: '#ee0000' },
          { label: 'China', pct: 14.1, color: '#f0561d' },
          { label: 'European Union', pct: 4.8, color: '#0066cc' },
          { label: 'Rest of world', pct: 6.6, color: '#707070' },
        ].map((bar, i) => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <span style={{ width: 130, textAlign: 'right', fontSize: 16, fontFamily: 'Red Hat Text, sans-serif', color: 'var(--text-secondary)' }}>
              {bar.label}
            </span>
            <div style={{ flex: 1, height: 28, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.pct}%` }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: bar.color, borderRadius: 6 }}
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 + i * 0.15 }}
              style={{ width: 60, fontSize: 18, fontWeight: 700, fontFamily: 'Red Hat Mono, monospace', color: bar.color }}
            >
              {bar.pct}%
            </motion.span>
          </div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
        style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 24, fontStyle: 'italic' }}
      >
        Source: Epoch AI / GeoCoded, GPU cluster performance share, 2025
      </motion.p>
    </div>
  ),

  // Slide 2: What sovereignty means
  () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 60px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 44, fontWeight: 800, maxWidth: 800, lineHeight: 1.2, marginBottom: 32 }}>
        Every API call to a foreign model
        <br />
        is a sovereignty decision.
      </h2>
      <p style={{ fontSize: 24, color: 'var(--text-secondary)', maxWidth: 700, lineHeight: 1.6 }}>
        Your data leaves your jurisdiction. Your prompts are logged on foreign infrastructure.
        Your model's behavior is controlled by someone else's terms of service.
      </p>
      <p style={{ fontSize: 22, color: 'var(--gpu-amber)', marginTop: 32, fontWeight: 600 }}>
        Most organizations have not made this decision consciously.
      </p>
    </div>
  ),

  // Slide 3: Open weights
  () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 60px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 32, marginBottom: 32, textAlign: 'center' }}>
        The Open Weights Argument
      </h2>
      <div style={{ display: 'flex', gap: 20, marginBottom: 36 }}>
        {[
          { name: 'Granite 3B', origin: 'IBM / Red Hat', license: 'Apache-2.0' },
          { name: 'Llama 3.2', origin: 'Meta', license: 'Llama 3.2 CUL' },
          { name: 'Mistral 7B', origin: 'Mistral AI', license: 'Apache-2.0' },
        ].map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            style={{
              padding: 24, width: 200, textAlign: 'center',
              background: 'var(--surface-1)', borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{m.name}</div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{m.origin}</div>
            <div style={{
              marginTop: 10, padding: '4px 12px', borderRadius: 10,
              background: 'rgba(99,153,61,0.12)', color: 'var(--rh-green)',
              fontSize: 12, display: 'inline-block',
            }}>
              {m.license}
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 40, maxWidth: 700, width: '100%' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--rh-red)', marginBottom: 14 }}>Closed API Model</div>
          {['Cannot inspect weights', 'Cannot possess the model', 'Cannot adapt for jurisdiction', 'Cannot prove training data'].map(t => (
            <div key={t} style={{ fontSize: 15, color: 'var(--text-dim)', padding: '5px 0' }}>✗ {t}</div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--rh-green)', marginBottom: 14 }}>Open Weights Model</div>
          {['Full weight inspection', 'Local possession & control', 'Jurisdiction-specific fine-tuning', 'Documented provenance (AIBOM)'].map(t => (
            <div key={t} style={{ fontSize: 15, color: 'var(--text-secondary)', padding: '5px 0' }}>✓ {t}</div>
          ))}
        </div>
      </div>
    </div>
  ),

  // Slide 4: What does sovereignty actually mean?
  () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 60px' }}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 48, maxWidth: 800 }}
      >
        Sovereign AI means
        <br />
        <span style={{ color: 'var(--gpu-amber)' }}>you can prove it's yours.</span>
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, maxWidth: 800 }}
      >
        {[
          { verb: 'Possess', desc: 'Own the model weights. Not rent access.', color: '#ee0000' },
          { verb: 'Run', desc: 'On your hardware. In your jurisdiction.', color: '#00AEEF' },
          { verb: 'Adapt', desc: 'Fine-tune for your language and laws.', color: '#0F62FE' },
          { verb: 'Govern', desc: 'Enforce policies. Control who uses it.', color: '#37a3a3' },
          { verb: 'Prove', desc: 'Tamper-evident record of every decision.', color: '#F5A623' },
          { verb: 'Take home', desc: 'Fork it. Run it. It\'s Apache 2.0.', color: '#63993d' },
        ].map((s, i) => (
          <motion.div
            key={s.verb}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            style={{ textAlign: 'left', padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${s.color}` }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif', color: s.color, marginBottom: 4 }}>{s.verb}</div>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  ),

  // Slide 5: The sovereign stack — interactive progressive reveal
  // This is a stateful slide — click reveals each layer one at a time, then shows all
  SovereignStackSlide,

]

// ─── Demo acts ─────────────────────────────────────────────────────────────
import Act01ProofStack from './acts/Act01ProofStack'
import Act02HardwareTrust from './acts/Act02HardwareTrust'
import Act03Provenance from './acts/Act03Provenance'
import Act04Routing from './acts/Act04Routing'
import Act05Policy from './acts/Act05Policy'
import Act06Verification from './acts/Act06Verification'
import JurisdictionLab from './lab/JurisdictionLab'

const DEMO_ACTS: ActEntry[] = [
  { id: 'proof-stack', label: 'The Stack', component: Act01ProofStack, nextLabel: 'Your compute →' },
  { id: 'hardware-trust', label: 'Your Compute', component: Act02HardwareTrust, nextLabel: 'Your model →' },
  { id: 'provenance', label: 'Your Model', component: Act03Provenance, nextLabel: 'Your agents →' },
  { id: 'routing', label: 'Your Agents', component: Act04Routing, nextLabel: 'Your policies →' },
  { id: 'policy', label: 'Your Policies', component: Act05Policy, nextLabel: 'Your proof →' },
  { id: 'verification', label: 'Your Proof', component: Act06Verification, nextLabel: 'Your jurisdiction →' },
]

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState<'slides' | 'demo' | 'lab'>('slides')
  const [slide, setSlide] = useState(0)
  const [actIndex, setActIndex] = useState(0)

  const advanceSlide = useCallback(() => {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1)
    }
  }, [slide])

  const enterDemo = useCallback(() => {
    setMode('demo')
    setActIndex(0)
    window.scrollTo({ top: 0 })
  }, [])

  const advanceAct = useCallback(() => {
    if (actIndex < DEMO_ACTS.length - 1) {
      setActIndex(i => i + 1)
      window.scrollTo({ top: 0 })
    } else {
      setMode('lab')
    }
  }, [actIndex])

  // ─── SLIDES MODE ──────────────────────────────────────────────────────
  if (mode === 'slides') {
    const isLastSlide = slide === SLIDES.length - 1
    const SlideContent = SLIDES[slide]

    return (
      <div
        style={{ height: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontFamily: 'Red Hat Text, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={isLastSlide ? undefined : advanceSlide}
      >
        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 0' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setSlide(i) }}
              style={{
                width: i === slide ? 20 : 8, height: 8, borderRadius: 4,
                border: 'none', cursor: 'pointer', padding: 0,
                background: i === slide ? 'var(--rh-red)' : i < slide ? 'var(--rh-green)' : 'var(--border)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        {/* Slide content */}
        <div style={{ flex: 1, cursor: isLastSlide ? 'default' : 'pointer', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <SlideContent advance={enterDemo} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 32px', borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setSlide(s => Math.max(0, s - 1)) }}
            disabled={slide === 0}
            style={{
              background: 'transparent', border: 'none', cursor: slide === 0 ? 'default' : 'pointer',
              color: slide === 0 ? 'var(--text-disabled)' : 'var(--text-secondary)',
              fontFamily: 'Red Hat Text, sans-serif', fontSize: 13,
            }}
          >
            ← Back
          </button>
          <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 10, color: 'var(--text-disabled)' }}>
            {slide + 1} / {SLIDES.length}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); isLastSlide ? enterDemo() : advanceSlide() }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontFamily: 'Red Hat Text, sans-serif', fontSize: 13,
            }}
          >
            Next →
          </button>
        </div>
      </div>
    )
  }

  // ─── DEMO MODE ────────────────────────────────────────────────────────
  if (mode === 'demo') {
    const act = DEMO_ACTS[actIndex]
    const ActComponent = act.component

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontFamily: 'Red Hat Text, sans-serif', display: 'flex', flexDirection: 'column' }}>
        <Header
          actCount={DEMO_ACTS.length}
          currentAct={actIndex}
          onActClick={(i) => { setActIndex(i); window.scrollTo({ top: 0 }) }}
        />

        <div style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <ActComponent onComplete={advanceAct} />
            </motion.div>
          </AnimatePresence>
        </div>

        <Footer
          onBack={actIndex === 0 ? () => { setMode('slides'); setSlide(SLIDES.length - 1) } : () => { setActIndex(i => i - 1); window.scrollTo({ top: 0 }) }}
          backLabel={actIndex === 0 ? '← Slides' : '← Back'}
          onNext={advanceAct}
          nextLabel={act.nextLabel ?? 'Next →'}
          counter={`${String(actIndex + 1).padStart(2, '0')} / ${String(DEMO_ACTS.length).padStart(2, '0')}`}
        />
      </div>
    )
  }

  // ─── LAB MODE ─────────────────────────────────────────────────────────
  return <JurisdictionLab onExit={() => setMode('demo')} />
}
