import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const LAYERS = [
  { label: 'Your Compute', question: 'How do you know the hardware itself hasn\'t been compromised?', answer: 'Intel TDX creates a cryptographically attested trust domain. The CPU proves your workload is isolated. Intel Trust Authority verifies the firmware, enclave, and TCB status.', color: '#00AEEF' },
  { label: 'Your Platform', question: 'How do you isolate AI workloads at the infrastructure level?', answer: 'Confidential containers run inside TDX trust domains on OpenShift. Kata runtime provides process-level sandboxing. No code changes needed — the platform enforces isolation.', color: '#ee0000' },
  { label: 'Your Model', question: 'How do you know what\'s inside the model you\'re running?', answer: 'Open-weight models with full provenance. An AI Bill of Materials documents the base model, training data, fine-tuning method, evaluation results, and jurisdiction. OPA gates promotion to production.', color: '#0F62FE' },
  { label: 'Your Data', question: 'How do you enforce data residency across jurisdictions?', answer: 'Deny-by-default OPA policies per jurisdiction — GDPR for EU, data localization for Gulf states, PDPA for Southeast Asia. Sensitive data never leaves your borders.', color: '#37a3a3' },
  { label: 'Your Agents', question: 'How do you control what AI agents can do?', answer: 'Every agent has a SPIFFE identity. The semantic router classifies prompts — sensitive data is flagged, injection attempts are blocked, routing enforces jurisdictional constraints.', color: '#5e40be' },
  { label: 'Your Gateway', question: 'How does everything connect securely?', answer: 'Praxis proxy applies guardrails and strips credentials. ContextForge federates MCP tools. Every request through the gateway is recorded.', color: '#63993d' },
  { label: 'Your Proof', question: 'How do you prove all of this actually happened?', answer: 'A tamper-evident hash chain records every governance decision. Each entry references the previous hash. The root hash proves the full audit trail. Modify any entry and the chain breaks.', color: '#F5A623' },
]

export default function Act01ProofStack({ onComplete }: { onComplete?: () => void }) {
  const [currentLayer, setCurrentLayer] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const advance = () => {
    if (!showAnswer) {
      setShowAnswer(true)
    } else {
      if (currentLayer < LAYERS.length - 1) {
        setShowAnswer(false)
        setCurrentLayer(l => l + 1)
      } else {
        onComplete?.()
      }
    }
  }

  const layer = LAYERS[currentLayer]

  return (
    <div style={{ padding: '48px 32px', maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-disabled)' }}>01</span>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          The Sovereign AI Stack
        </h2>
      </div>
      <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 700, marginBottom: 32 }}>
        Seven sovereignty capabilities. Each one answers a question the previous cannot.
      </p>

      {/* Completed layers as badges */}
      {currentLayer > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {LAYERS.slice(0, currentLayer).map(l => (
            <span key={l.label} style={{
              padding: '4px 14px', borderRadius: 8, fontSize: 12,
              background: l.color, color: '#000',
              fontFamily: 'Red Hat Mono, monospace', fontWeight: 600,
            }}>
              ✓ {l.label}
            </span>
          ))}
        </div>
      )}

      {/* Current layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLayer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            padding: 28, borderRadius: 12,
            background: 'var(--surface-1)',
            borderLeft: `4px solid ${layer.color}`,
            maxWidth: 640,
          }}
        >
          <div style={{
            fontFamily: 'Red Hat Mono, monospace', fontSize: 13,
            color: layer.color, marginBottom: 12,
          }}>
            {currentLayer + 1} / {LAYERS.length} · {layer.label}
          </div>

          {/* Question — always visible for this layer */}
          <p style={{
            fontSize: 20, fontStyle: 'italic', fontWeight: 500,
            lineHeight: 1.5, margin: 0, color: 'var(--text-primary)',
          }}>
            "{layer.question}"
          </p>

          {/* Answer — appears below the question */}
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${layer.color}40` }}
            >
              <p style={{
                fontSize: 16, color: 'var(--text-secondary)',
                lineHeight: 1.7, margin: 0,
              }}>
                {layer.answer}
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.button
        onClick={advance}
        whileTap={{ scale: 0.97 }}
        style={{
          marginTop: 24, background: '#ee0000', border: 'none', color: '#fff',
          padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
        }}
      >
        {!showAnswer
          ? 'Show the answer →'
          : currentLayer < LAYERS.length - 1
            ? `Next: ${LAYERS[currentLayer + 1].label} →`
            : 'See the live proof →'}
      </motion.button>
    </div>
  )
}
