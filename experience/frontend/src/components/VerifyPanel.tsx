import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { api } from '../lib/api'
import { useLedger } from '../hooks/useLedger'
import ProofChain from './ProofChain'
import type { ChainVerification, WriterSummary } from '../lib/types'

export default function VerifyPanel() {
  const { entries } = useLedger()
  const [verification, setVerification] = useState<ChainVerification | null>(null)
  const [writers, setWriters] = useState<WriterSummary | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    api.ledger.writers().then(setWriters).catch(() => {})
  }, [entries.length])

  const verify = async () => {
    setVerifying(true)
    try {
      const v = await api.ledger.verify()
      setVerification(v)
      const w = await api.ledger.writers()
      setWriters(w)
    } catch { /* */ }
    finally { setVerifying(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '1.25rem', margin: 0 }}>
        Proof Chain
      </h2>

      <ProofChain entries={entries} variant="full" />

      {writers && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>
            Writers ({writers.total} total entries)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(writers.writers)
              .sort(([, a], [, b]) => b - a)
              .map(([writer, count]) => (
                <div key={writer} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 0', borderBottom: '1px solid var(--border)',
                  fontSize: '13px',
                }}>
                  <span style={{ fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-secondary)' }}>
                    {writer}
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <motion.button
        className="btn btn-primary"
        onClick={verify}
        disabled={verifying}
        whileTap={{ scale: 0.97 }}
        style={{ alignSelf: 'flex-start' }}
      >
        {verifying ? 'Verifying...' : 'Verify All Chains'}
      </motion.button>

      {verification && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '20px',
            background: verification.all_valid ? 'rgba(99,153,61,0.08)' : 'rgba(238,0,0,0.08)',
            borderRadius: '12px',
            border: `1px solid ${verification.all_valid ? 'var(--rh-green)' : 'var(--rh-red)'}`,
            textAlign: 'center',
          }}
        >
          <div style={{
            fontSize: '24px', fontWeight: 700,
            fontFamily: 'Red Hat Display, sans-serif',
            color: verification.all_valid ? 'var(--rh-green)' : 'var(--rh-red)',
            marginBottom: '8px',
          }}>
            {verification.all_valid ? 'CHAIN INTACT' : 'CHAIN BROKEN'}
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--text-dim)',
          }}>
            {verification.chains.length} chains verified &middot;{' '}
            {verification.chains.reduce((s, c) => s + c.entries_checked, 0)} entries checked
          </div>
          <div style={{
            marginTop: '12px', fontFamily: 'Red Hat Mono, monospace',
            fontSize: '11px', color: 'var(--gpu-amber)',
            wordBreak: 'break-all',
          }}>
            Every governance decision is recorded in a tamper-evident chain.
            Modifying any entry breaks every hash that follows it.
          </div>
        </motion.div>
      )}
    </div>
  )
}
