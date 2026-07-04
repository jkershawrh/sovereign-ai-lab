import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { JurisdictionProfile, AIBOM, ChainVerification } from '../lib/types'

export default function LeaveBehinds() {
  const [params] = useSearchParams()
  const profileId = params.get('profile') || 'eu'
  const [profile, setProfile] = useState<JurisdictionProfile | null>(null)
  const [aibom, setAibom] = useState<AIBOM | null>(null)
  const [verification, setVerification] = useState<ChainVerification | null>(null)

  useEffect(() => {
    api.profiles.get(profileId).then(setProfile).catch(() => {})
    api.model.aibom().then(setAibom).catch(() => {})
    api.ledger.verify().then(setVerification).catch(() => {})
  }, [profileId])

  if (!profile) return <div style={{ padding: '2rem', color: 'var(--text-dim)' }}>Loading...</div>

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 64px', maxWidth: '900px', margin: '0 auto' }}
    >
      <h1 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '2rem', marginBottom: '8px' }}>
        Your Sovereign AI Stack
      </h1>
      <div style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '32px' }}>
        {profile.flag} {profile.name} &middot; {new Date().toISOString().split('T')[0]}
      </div>

      <Section title="Why this matters for you">
        <p style={{ fontSize: '15px', color: 'var(--gpu-amber)', lineHeight: 1.6, fontStyle: 'italic' }}>
          {profile.key_concern}
        </p>
      </Section>

      <Section title="Your compliance posture">
        {profile.compliance_labels.map(l => (
          <div key={l.name} style={{ padding: '6px 0', fontSize: '14px' }}>
            <strong>{l.name}</strong> ({l.layer}): {l.description}
          </div>
        ))}
      </Section>

      <Section title="Your OPA policies">
        {profile.opa_policies.map(p => (
          <div key={p} style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: '13px', padding: '2px 0', color: 'var(--text-secondary)' }}>
            {p}
          </div>
        ))}
      </Section>

      <Section title="Your model path">
        <div style={{ marginBottom: '12px' }}>
          <strong>Recommended models:</strong>
          {profile.recommended_models.map(m => (
            <div key={m.name} style={{ padding: '4px 0', fontSize: '14px' }}>
              • <strong>{m.name}</strong>: {m.reason}
            </div>
          ))}
        </div>
        <div>
          <strong>AIBOM requirements:</strong>
          {profile.aibom_requirements.map((r, i) => (
            <div key={i} style={{ padding: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              • {r}
            </div>
          ))}
        </div>
        {aibom && (
          <div style={{ marginTop: '12px', fontFamily: 'Red Hat Mono, monospace', fontSize: '12px', color: 'var(--text-dim)' }}>
            Current AIBOM hash: {aibom.provenance_hash.slice(0, 24)}...
          </div>
        )}
      </Section>

      <Section title="Your proof chain">
        {verification && (
          <div style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: '14px' }}>
            <div>All chains valid: <span style={{ color: verification.all_valid ? 'var(--rh-green)' : 'var(--rh-red)' }}>{String(verification.all_valid)}</span></div>
            <div>Chains verified: {verification.chains.length}</div>
            <div>Total entries checked: {verification.chains.reduce((s, c) => s + c.entries_checked, 0)}</div>
          </div>
        )}
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '12px' }}>
          This chain is tamper-evident. Every governance decision made during this session
          is recorded here. You can verify independently against any entry in the chain.
        </p>
      </Section>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '1.2rem', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
