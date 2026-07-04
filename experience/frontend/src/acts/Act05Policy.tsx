import { useState } from 'react'
import { motion } from 'motion/react'
import { api } from '../lib/api'

const POLICIES = [
  {
    name: 'Data Residency', policy: 'sovereign/data_residency/allow', color: 'var(--rh-teal)',
    description: 'Controls where data can be processed. Sensitive personal data must stay in-jurisdiction.',
    allowInput: { destination_region: 'local', data_classification: 'general' },
    allowLabel: 'Local processing, general data',
    denyInput: { destination_region: 'us-east-1', data_classification: 'sensitive_personal' },
    denyLabel: 'Foreign region, sensitive data',
  },
  {
    name: 'Model Promotion', policy: 'sovereign/model_promotion/allow', color: 'var(--gpu-amber)',
    description: 'Gates model deployment. Requires AIBOM, in-jurisdiction training, and passing benchmarks.',
    allowInput: { aibom_present: true, training_in_jurisdiction: true, all_benchmarks_pass: true },
    allowLabel: 'AIBOM ✓, in-jurisdiction ✓, benchmarks ✓',
    denyInput: { aibom_present: false, training_in_jurisdiction: true, all_benchmarks_pass: true },
    denyLabel: 'Missing AIBOM',
  },
  {
    name: 'Model Access', policy: 'sovereign/model_access/allow', color: 'var(--rh-purple)',
    description: 'Requires verified agent identity. Anonymous and unverifiable agents are denied.',
    allowInput: { agent_identity: 'spiffe://demo/agent-1', requested_model: 'granite-3.2-sovereign' },
    allowLabel: 'SPIFFE identity, approved model',
    denyInput: { agent_identity: '', requested_model: 'granite-3.2-sovereign' },
    denyLabel: 'No agent identity',
  },
]

function PolicyCard({ policy }: { policy: typeof POLICIES[0] }) {
  const [allowResult, setAllowResult] = useState<boolean | null>(null)
  const [denyResult, setDenyResult] = useState<boolean | null>(null)
  const [testing, setTesting] = useState(false)

  const test = async (input: Record<string, unknown>, setter: (v: boolean) => void) => {
    setTesting(true)
    try {
      const r = await api.policies.evaluate(policy.policy, input)
      setter(r.result)
    } catch { setter(false) }
    finally { setTesting(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 24, borderRadius: 12,
        background: 'var(--surface-1)',
        borderLeft: `4px solid ${policy.color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: policy.color, boxShadow: `0 0 8px ${policy.color}` }} />
        <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Red Hat Display, sans-serif' }}>{policy.name}</h3>
      </div>
      <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 16 }}>
        {policy.description}
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase' }}>Allow path</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{policy.allowLabel}</div>
          <button
            onClick={() => test(policy.allowInput, setAllowResult)}
            disabled={testing || allowResult !== null}
            style={{
              background: allowResult !== null ? 'var(--rh-green)' : 'var(--rh-red)',
              border: 'none', color: '#fff', padding: '6px 16px', borderRadius: 6,
              cursor: allowResult !== null ? 'default' : 'pointer',
              fontFamily: 'Red Hat Text, sans-serif', fontSize: 13, fontWeight: 600,
            }}
          >
            {allowResult !== null ? `✓ ALLOW` : 'Test Allow'}
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase' }}>Deny path</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{policy.denyLabel}</div>
          <button
            onClick={() => test(policy.denyInput, setDenyResult)}
            disabled={testing || denyResult !== null}
            style={{
              background: denyResult !== null ? 'var(--rh-red)' : 'var(--rh-red)',
              border: 'none', color: '#fff', padding: '6px 16px', borderRadius: 6,
              cursor: denyResult !== null ? 'default' : 'pointer',
              fontFamily: 'Red Hat Text, sans-serif', fontSize: 13, fontWeight: 600,
              opacity: denyResult !== null ? 0.7 : 1,
            }}
          >
            {denyResult !== null ? `✗ DENY` : 'Test Deny'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Act05Policy({ onComplete }: { onComplete?: () => void }) {
  return (
    <div style={{ padding: '48px 32px', maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-disabled)' }}>05</span>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          Policy Enforcement
        </h2>
      </div>
      <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 700, marginBottom: 32 }}>
        OPA enforces deny-by-default policies. Every allow and every deny is a decision — and every
        decision is recorded. Test both paths to see the governance in action.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {POLICIES.map(p => <PolicyCard key={p.name} policy={p} />)}
      </div>

      <button onClick={onComplete} style={{
        marginTop: 24, background: 'var(--rh-red)', border: 'none', color: '#fff',
        padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
        fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
      }}>
        Verify the proof chain →
      </button>
    </div>
  )
}
