import { useState } from 'react'
import { motion } from 'motion/react'
import { api } from '../lib/api'
import { useLedger } from '../hooks/useLedger'
import ProofChain from '../components/ProofChain'
import type { ChainVerification, WriterSummary } from '../lib/types'

export default function Act06Verification({ onComplete }: { onComplete?: () => void }) {
  const { entries } = useLedger()
  const [verification, setVerification] = useState<ChainVerification | null>(null)
  const [writers, setWriters] = useState<WriterSummary | null>(null)
  const [verifying, setVerifying] = useState(false)

  const verify = async () => {
    setVerifying(true)
    try {
      const [v, w] = await Promise.all([api.ledger.verify(), api.ledger.writers()])
      setVerification(v)
      setWriters(w)
    } catch { /* */ }
    finally { setVerifying(false) }
  }

  return (
    <div style={{ padding: '48px 32px', maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-disabled)' }}>06</span>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          Proof Chain Verification
        </h2>
      </div>
      <p style={{ fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 700, marginBottom: 32 }}>
        This is the payoff. Everything you just saw — hardware attestation, model provenance,
        inference routing, policy enforcement — every decision is recorded. One button proves
        the entire chain is intact. This is what separates a sovereignty claim from a sovereignty proof.
      </p>

      {/* Full ProofChain */}
      <div style={{ marginBottom: 24 }}>
        <ProofChain entries={entries} variant="full" />
      </div>

      {/* Verify button */}
      <motion.button
        onClick={verify}
        disabled={verifying}
        whileTap={{ scale: 0.97 }}
        style={{
          background: 'var(--rh-red)', border: 'none', color: '#fff',
          padding: '12px 32px', borderRadius: 8, cursor: 'pointer',
          fontFamily: 'Red Hat Text, sans-serif', fontSize: 16, fontWeight: 600,
          display: 'block', margin: '0 auto 24px',
        }}
      >
        {verifying ? 'Verifying all chains...' : 'Verify All Chains'}
      </motion.button>

      {/* Verification result */}
      {verification && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            padding: 32, borderRadius: 16, textAlign: 'center',
            background: verification.all_valid ? 'rgba(99,153,61,0.08)' : 'rgba(238,0,0,0.08)',
            border: `2px solid ${verification.all_valid ? 'var(--rh-green)' : 'var(--rh-red)'}`,
            marginBottom: 24,
          }}
        >
          <div style={{
            fontSize: 36, fontWeight: 800,
            fontFamily: 'Red Hat Display, sans-serif',
            color: verification.all_valid ? 'var(--rh-green)' : 'var(--rh-red)',
            marginBottom: 8,
          }}>
            {verification.all_valid ? 'CHAIN INTACT' : 'CHAIN BROKEN'}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text-dim)', marginBottom: 16 }}>
            {verification.chains.length} chains verified · {verification.chains.reduce((s, c) => s + c.entries_checked, 0)} entries checked
          </div>
          <div style={{
            fontFamily: 'Red Hat Mono, monospace',
            fontSize: 14, color: 'var(--gpu-amber)',
            lineHeight: 1.6, maxWidth: 600, margin: '0 auto',
          }}>
            Every governance decision is recorded in a tamper-evident chain.
            Modifying any entry breaks every hash that follows it.
            You can verify this root hash independently.
          </div>
        </motion.div>
      )}

      {/* Writer breakdown */}
      {writers && (
        <div style={{ padding: 20, background: 'var(--surface-1)', borderRadius: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase' }}>
            Writers ({writers.total} entries)
          </div>
          {Object.entries(writers.writers)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([writer, count]) => (
              <div key={writer} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid var(--border)',
                fontSize: 14,
              }}>
                <span style={{ fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-secondary)' }}>{writer}</span>
                <span style={{ color: 'var(--text-dim)' }}>{count as number}</span>
              </div>
            ))}
        </div>
      )}

      {verification && (
        <button onClick={onComplete} style={{
          marginTop: 8, background: 'var(--rh-red)', border: 'none', color: '#fff',
          padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
        }}>
          Your Jurisdiction →
        </button>
      )}
    </div>
  )
}
