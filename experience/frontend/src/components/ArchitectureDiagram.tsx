import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const STEPS = [
  { label: 'Hardware Trust Boundary', desc: 'Intel TDX creates a cryptographically isolated trust domain. Everything inside this boundary is hardware-attested.' },
  { label: 'Immutable Ledger', desc: 'The foundation. Every component writes proof events here. A tamper-evident hash chain records every governance decision.' },
  { label: 'Sovereign Model', desc: 'Granite 3.2 open-weight model served locally via OpenVINO. You possess the weights. The AIBOM documents its origin.' },
  { label: 'Semantic Router', desc: 'Classifies every prompt before it reaches the model. Sensitive data is flagged. Injection attempts are blocked. Routing enforces jurisdictional rules.' },
  { label: 'OPA Policy Engine', desc: 'Deny-by-default policies per jurisdiction. Data residency, model promotion, agent identity — every decision is logged.' },
  { label: 'Praxis Gateway', desc: 'The front door. AI-aware reverse proxy with filter pipeline. Every request passing through is recorded and hash-chained.' },
  { label: 'Tool Federation', desc: 'ContextForge federates MCP tools. The sovereign data server provides jurisdiction-local documents. Zero external API calls.' },
  { label: 'Proof Connections', desc: 'Every component writes to the ledger. The dotted lines represent governance events flowing into the tamper-evident chain.' },
  { label: 'Request Flow', desc: 'Watch a prompt flow through the sovereign stack: enter gateway, classify, check policy, route to model, respond, record proof.' },
]

const C = {
  tdx: '#00AEEF',
  ledger: '#F5A623',
  model: '#0F62FE',
  router: '#5e40be',
  opa: '#37a3a3',
  gateway: '#ee0000',
  tools: '#63993d',
  surface: '#1f1f1f',
  border: '#383838',
  text: '#ffffff',
  dim: '#a3a3a3',
}

interface Props {
  onComplete?: () => void
}

export default function ArchitectureDiagram({ onComplete }: Props) {
  const [step, setStep] = useState(-1)
  const show = (n: number) => step >= n
  const done = step >= STEPS.length - 1

  const advance = () => {
    if (done) {
      onComplete?.()
    } else {
      setStep(s => s + 1)
    }
  }

  const W = 860
  const H = 520

  return (
    <div style={{ padding: '48px 32px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-disabled)' }}>01</span>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          The Sovereign AI Stack
        </h2>
      </div>

      {/* Narration */}
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 700, marginBottom: 24, minHeight: 50 }}
        >
          {step < 0
            ? 'Click to build the sovereign AI stack, one component at a time.'
            : STEPS[step].desc}
        </motion.p>
      </AnimatePresence>

      {/* SVG Diagram */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}>

        {/* Step 0: TDX Trust Domain boundary */}
        {show(0) && (
          <motion.rect
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 0.8 }}
            x={20} y={20} width={W - 40} height={H - 80} rx={16}
            fill="none" stroke={C.tdx} strokeWidth={2} strokeDasharray="8 4"
          />
        )}
        {show(0) && (
          <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            x={40} y={46} fill={C.tdx} fontSize={12} fontFamily="Red Hat Mono, monospace">
            Intel TDX Trust Domain
          </motion.text>
        )}

        {/* Step 1: Ledger — wide bar at bottom of trust domain */}
        {show(1) && (
          <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <rect x={40} y={340} width={W - 80} height={70} rx={10} fill={C.surface} stroke={C.ledger} strokeWidth={2} />
            <text x={W / 2} y={370} fill={C.ledger} fontSize={15} fontWeight={700} fontFamily="Red Hat Display, sans-serif" textAnchor="middle">are-immutable-ledger</text>
            <text x={W / 2} y={392} fill={C.dim} fontSize={11} fontFamily="Red Hat Mono, monospace" textAnchor="middle">every layer writes proof here</text>
          </motion.g>
        )}

        {/* Step 2: OVMS Model — right side */}
        {show(2) && (
          <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <rect x={600} y={100} width={200} height={80} rx={10} fill={C.surface} stroke={C.model} strokeWidth={2} />
            <text x={700} y={130} fill={C.model} fontSize={14} fontWeight={700} fontFamily="Red Hat Display, sans-serif" textAnchor="middle">Granite Model</text>
            <text x={700} y={150} fill={C.dim} fontSize={11} fontFamily="Red Hat Mono, monospace" textAnchor="middle">OVMS · open weights</text>
            <text x={700} y={168} fill={C.dim} fontSize={10} fontFamily="Red Hat Mono, monospace" textAnchor="middle">:8080</text>
          </motion.g>
        )}

        {/* Step 3: Semantic Router — middle */}
        {show(3) && (
          <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <rect x={340} y={100} width={200} height={80} rx={10} fill={C.surface} stroke={C.router} strokeWidth={2} />
            <text x={440} y={130} fill={C.router} fontSize={14} fontWeight={700} fontFamily="Red Hat Display, sans-serif" textAnchor="middle">Semantic Router</text>
            <text x={440} y={150} fill={C.dim} fontSize={11} fontFamily="Red Hat Mono, monospace" textAnchor="middle">classify · route · block</text>
            <text x={440} y={168} fill={C.dim} fontSize={10} fontFamily="Red Hat Mono, monospace" textAnchor="middle">:8001</text>
          </motion.g>
        )}
        {/* Arrow: Router → Model */}
        {show(3) && (
          <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            x1={540} y1={140} x2={600} y2={140} stroke={C.router} strokeWidth={2} markerEnd="url(#arrowPurple)" />
        )}

        {/* Step 4: OPA — below router */}
        {show(4) && (
          <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <rect x={340} y={220} width={200} height={70} rx={10} fill={C.surface} stroke={C.opa} strokeWidth={2} />
            <text x={440} y={248} fill={C.opa} fontSize={14} fontWeight={700} fontFamily="Red Hat Display, sans-serif" textAnchor="middle">OPA Policies</text>
            <text x={440} y={268} fill={C.dim} fontSize={11} fontFamily="Red Hat Mono, monospace" textAnchor="middle">deny-by-default · :8181</text>
          </motion.g>
        )}
        {/* Arrow: Router → OPA */}
        {show(4) && (
          <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            x1={440} y1={180} x2={440} y2={220} stroke={C.opa} strokeWidth={2} markerEnd="url(#arrowTeal)" />
        )}

        {/* Step 5: Praxis Gateway — left side */}
        {show(5) && (
          <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
            <rect x={80} y={100} width={200} height={80} rx={10} fill={C.surface} stroke={C.gateway} strokeWidth={2} />
            <text x={180} y={130} fill={C.gateway} fontSize={14} fontWeight={700} fontFamily="Red Hat Display, sans-serif" textAnchor="middle">Praxis Gateway</text>
            <text x={180} y={150} fill={C.dim} fontSize={11} fontFamily="Red Hat Mono, monospace" textAnchor="middle">filter pipeline</text>
            <text x={180} y={168} fill={C.dim} fontSize={10} fontFamily="Red Hat Mono, monospace" textAnchor="middle">:9000</text>
          </motion.g>
        )}
        {/* Arrow: Gateway → Router */}
        {show(5) && (
          <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            x1={280} y1={140} x2={340} y2={140} stroke={C.gateway} strokeWidth={2} markerEnd="url(#arrowRed)" />
        )}

        {/* Step 6: ContextForge + MCP — bottom left */}
        {show(6) && (
          <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <rect x={80} y={220} width={120} height={70} rx={10} fill={C.surface} stroke={C.tools} strokeWidth={2} />
            <text x={140} y={248} fill={C.tools} fontSize={12} fontWeight={700} fontFamily="Red Hat Display, sans-serif" textAnchor="middle">ContextForge</text>
            <text x={140} y={266} fill={C.dim} fontSize={10} fontFamily="Red Hat Mono, monospace" textAnchor="middle">MCP · :4444</text>

            <rect x={220} y={220} width={100} height={70} rx={10} fill={C.surface} stroke={C.tools} strokeWidth={2} />
            <text x={270} y={248} fill={C.tools} fontSize={12} fontWeight={700} fontFamily="Red Hat Display, sans-serif" textAnchor="middle">MCP Data</text>
            <text x={270} y={266} fill={C.dim} fontSize={10} fontFamily="Red Hat Mono, monospace" textAnchor="middle">docs · :8090</text>
          </motion.g>
        )}

        {/* Step 7: Dotted proof lines to ledger */}
        {show(7) && [
          { x: 180, y: 180, label: 'gateway' },
          { x: 440, y: 180, label: 'router' },
          { x: 700, y: 180, label: 'model' },
          { x: 440, y: 290, label: 'opa' },
          { x: 140, y: 290, label: 'tools' },
        ].map((p, i) => (
          <motion.line key={p.label}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            x1={p.x} y1={p.y} x2={p.x} y2={340}
            stroke={C.ledger} strokeWidth={1} strokeDasharray="4 3"
          />
        ))}

        {/* Step 8: Animated request flow */}
        {show(8) && (
          <motion.circle
            r={6} fill={C.gateway}
            initial={{ cx: 40, cy: 140, opacity: 0 }}
            animate={{
              cx: [40, 180, 440, 700, 700, 440, 180, 40],
              cy: [140, 140, 140, 140, 340, 340, 340, 340],
              fill: [C.gateway, C.gateway, C.router, C.model, C.ledger, C.ledger, C.ledger, C.ledger],
              opacity: [0, 1, 1, 1, 1, 0.6, 0.3, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Arrow markers */}
        <defs>
          <marker id="arrowPurple" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={C.router} />
          </marker>
          <marker id="arrowTeal" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={C.opa} />
          </marker>
          <marker id="arrowRed" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={C.gateway} />
          </marker>
        </defs>

        {/* Frontend — below trust domain */}
        {show(5) && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <rect x={W / 2 - 80} y={H - 50} width={160} height={40} rx={8} fill={C.surface} stroke={C.border} strokeWidth={1} />
            <text x={W / 2} y={H - 25} fill={C.dim} fontSize={12} fontFamily="Red Hat Mono, monospace" textAnchor="middle">Frontend · :9001</text>
          </motion.g>
        )}
        {show(5) && (
          <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.4 }}
            x1={W / 2} y1={H - 50} x2={180} y2={180} stroke={C.border} strokeWidth={1} strokeDasharray="4 3" />
        )}
      </svg>

      {/* Progress + button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i <= step ? 'var(--gpu-amber)' : 'var(--surface-2)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <motion.button
          onClick={advance}
          whileTap={{ scale: 0.97 }}
          style={{
            background: '#ee0000', border: 'none', color: '#fff',
            padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
          }}
        >
          {step < 0 ? 'Build the stack' : done ? 'See the live proof' : `Next: ${STEPS[Math.min(step + 1, STEPS.length - 1)].label}`}
        </motion.button>
      </div>
    </div>
  )
}
