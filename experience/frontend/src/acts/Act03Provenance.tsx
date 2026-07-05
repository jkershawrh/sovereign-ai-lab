import { useModel } from '../hooks/useModel'
import { motion } from 'motion/react'
import type { Benchmark } from '../lib/types'

function benchmarkPercent(benchmark: Benchmark) {
  if (benchmark.direction === 'max') {
    if (benchmark.score <= 0) return 100
    return Math.min(100, (benchmark.threshold / benchmark.score) * 100)
  }
  return Math.min(100, (benchmark.score / Math.max(benchmark.threshold, 0.01)) * 100)
}

function thresholdLabel(benchmark: Benchmark) {
  return `${benchmark.direction === 'max' ? '<=' : '>='} ${benchmark.threshold}`
}

export default function Act03Provenance({ onComplete }: { onComplete?: () => void }) {
  const { aibom, promotion, loading } = useModel()

  if (loading) return <div style={{ padding: '48px 32px', color: 'var(--text-dim)' }}>Loading model provenance...</div>

  const model = aibom?.model
  const ledgerRecorded = promotion?.ledger_status !== 'offline'
    && promotion?.ledger_entry_hash !== 'ledger-unreachable'

  return (
    <div style={{ padding: '48px 32px', maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-disabled)' }}>03</span>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          Model Provenance
        </h2>
      </div>
      <p style={{ fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 700, marginBottom: 32 }}>
        Your model is yours. You possess the weights, you know what went into the training,
        and you can prove it. The AI Bill of Materials documents origin, training data,
        evaluation results, and jurisdiction. A policy gate ensures only compliant models reach production.
      </p>

      {model && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Base model */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ padding: 24, background: 'var(--surface-1)', borderRadius: 12, borderLeft: '4px solid var(--ibm-blue)' }}>
            <div style={{ fontSize: 12, fontFamily: 'Red Hat Mono, monospace', color: 'var(--ibm-blue)', marginBottom: 8 }}>BASE MODEL</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif' }}>{model.base_model.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <span style={{ padding: '4px 12px', borderRadius: 10, fontSize: 12, background: 'rgba(99,153,61,0.12)', color: 'var(--rh-green)' }}>{model.base_model.license}</span>
              <span style={{ padding: '4px 12px', borderRadius: 10, fontSize: 12, background: 'rgba(15,98,254,0.12)', color: 'var(--ibm-blue)' }}>Open Weights</span>
            </div>
          </motion.div>

          {/* Training */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ padding: 24, background: 'var(--surface-1)', borderRadius: 12, borderLeft: '4px solid var(--rh-teal)' }}>
            <div style={{ fontSize: 12, fontFamily: 'Red Hat Mono, monospace', color: 'var(--rh-teal)', marginBottom: 8 }}>ADAPTATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 15 }}>
              <div><span style={{ color: 'var(--text-dim)' }}>Method:</span> <strong>{model.adaptation.method}</strong></div>
              <div><span style={{ color: 'var(--text-dim)' }}>Records:</span> <strong>{model.adaptation.training_data_sources[0]?.records}</strong></div>
              <div><span style={{ color: 'var(--text-dim)' }}>Platform:</span> <strong>{model.adaptation.training_environment.platform}</strong></div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>In-jurisdiction:</span>{' '}
                <strong style={{ color: model.adaptation.training_environment.in_jurisdiction ? 'var(--rh-green)' : 'var(--rh-red)' }}>
                  {model.adaptation.training_environment.in_jurisdiction ? '✓ Yes' : '✗ No'}
                </strong>
              </div>
            </div>
          </motion.div>

          {/* Evaluation */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ padding: 24, background: 'var(--surface-1)', borderRadius: 12, borderLeft: '4px solid var(--gpu-amber)' }}>
            <div style={{ fontSize: 12, fontFamily: 'Red Hat Mono, monospace', color: 'var(--gpu-amber)', marginBottom: 12 }}>EVALUATION</div>
            {model.evaluation.benchmarks.map(b => (
              <div key={b.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{b.name}</span>
                  <span style={{ fontFamily: 'Red Hat Mono, monospace', color: b.pass ? 'var(--rh-green)' : 'var(--rh-red)' }}>
                    {b.score.toFixed(3)} {thresholdLabel(b)} - {b.pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${benchmarkPercent(b)}%` }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    style={{ height: '100%', borderRadius: 4, background: b.pass ? 'var(--rh-green)' : 'var(--rh-red)' }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Promotion */}
          {promotion && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', background: 'var(--surface-1)', borderRadius: 12 }}>
              <span style={{
                padding: '6px 16px', borderRadius: 12, fontSize: 14,
                fontFamily: 'Red Hat Mono, monospace', fontWeight: 600,
                background: promotion.decision === 'allow' ? 'var(--rh-green)' : 'var(--rh-red)',
                color: 'var(--bg-dark)',
              }}>
                OPA: {promotion.decision.toUpperCase()}
              </span>
              <span style={{ fontSize: 13, fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-dim)' }}>
                AIBOM hash: {aibom?.provenance_hash.slice(0, 20)}...
              </span>
              <span style={{ fontSize: 12, color: 'var(--gpu-amber)' }}>
                {ledgerRecorded ? 'Ledger recorded' : 'Offline proof'}
              </span>
            </motion.div>
          )}
        </div>
      )}

      <button onClick={onComplete} style={{
        marginTop: 24, background: 'var(--rh-red)', border: 'none', color: '#fff',
        padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
        fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
      }}>
        Test the routing →
      </button>
    </div>
  )
}
