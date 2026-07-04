import { useState } from 'react'
import { motion } from 'motion/react'
import { api } from '../lib/api'

interface PolicyCard {
  name: string
  policy: string
  description: string
  allowInput: Record<string, unknown>
  denyInput: Record<string, unknown>
}

const POLICIES: PolicyCard[] = [
  {
    name: 'Data Residency',
    policy: 'sovereign/data_residency/allow',
    description: 'Controls where data can be processed based on classification and destination',
    allowInput: { destination_region: 'local', data_classification: 'general' },
    denyInput: { destination_region: 'us-east-1', data_classification: 'sensitive_personal' },
  },
  {
    name: 'Model Promotion',
    policy: 'sovereign/model_promotion/allow',
    description: 'Gates model deployment on AIBOM, jurisdiction, and benchmark requirements',
    allowInput: { aibom_present: true, training_in_jurisdiction: true, all_benchmarks_pass: true },
    denyInput: { aibom_present: false, training_in_jurisdiction: true, all_benchmarks_pass: true },
  },
  {
    name: 'Model Access',
    policy: 'sovereign/model_access/allow',
    description: 'Requires agent identity and approved model list for inference access',
    allowInput: { agent_identity: 'spiffe://demo/agent-1', requested_model: 'granite-3.2-sovereign' },
    denyInput: { agent_identity: '', requested_model: 'granite-3.2-sovereign' },
  },
]

function PolicyCardComponent({ card }: { card: PolicyCard }) {
  const [result, setResult] = useState<boolean | null>(null)
  const [testing, setTesting] = useState(false)

  const test = async (input: Record<string, unknown>) => {
    setTesting(true)
    try {
      const r = await api.policies.evaluate(card.policy, input)
      setResult(r.result)
    } catch {
      setResult(null)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--rh-green)',
          boxShadow: '0 0 6px var(--rh-green)',
        }} />
        <h3 style={{ margin: 0, fontSize: '14px', fontFamily: 'Red Hat Display, sans-serif' }}>
          {card.name}
        </h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '0 0 12px' }}>
        {card.description}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <motion.button
          className="btn btn-secondary"
          onClick={() => test(card.allowInput)}
          disabled={testing}
          whileTap={{ scale: 0.97 }}
          style={{ fontSize: '11px' }}
        >
          Test Allow
        </motion.button>
        <motion.button
          className="btn btn-secondary"
          onClick={() => test(card.denyInput)}
          disabled={testing}
          whileTap={{ scale: 0.97 }}
          style={{ fontSize: '11px' }}
        >
          Test Deny
        </motion.button>
        {result !== null && (
          <span style={{
            padding: '4px 10px', borderRadius: '10px', fontSize: '11px',
            fontFamily: 'Red Hat Mono, monospace', fontWeight: 600,
            background: result ? 'var(--rh-green)' : 'var(--rh-red)',
            color: 'var(--bg-dark)',
            display: 'flex', alignItems: 'center',
          }}>
            {result ? 'ALLOW' : 'DENY'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function PolicyPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '1.25rem', margin: 0 }}>
        Policy Enforcement
      </h2>
      {POLICIES.map(p => <PolicyCardComponent key={p.name} card={p} />)}
    </div>
  )
}
