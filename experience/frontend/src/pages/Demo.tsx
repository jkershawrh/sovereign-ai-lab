import { useState } from 'react'
import { motion } from 'motion/react'
import AttestationPanel from '../components/AttestationPanel'
import AibomPanel from '../components/AibomPanel'
import RoutingPanel from '../components/RoutingPanel'
import PolicyPanel from '../components/PolicyPanel'
import VerifyPanel from '../components/VerifyPanel'
import ProofChain from '../components/ProofChain'
import { useLedger } from '../hooks/useLedger'

const TABS = [
  { id: 'attestation', label: 'Hardware Trust' },
  { id: 'provenance', label: 'Provenance' },
  { id: 'routing', label: 'Routing' },
  { id: 'policy', label: 'Policy' },
  { id: 'verify', label: 'Proof Chain' },
]

export default function Demo() {
  const [activeTab, setActiveTab] = useState('attestation')
  const { entries } = useLedger()

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', height: '100vh' }}
    >
      <div style={{
        flex: 1, padding: '24px 32px', overflow: 'auto',
      }}>
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          borderBottom: '1px solid var(--border)', paddingBottom: '12px',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: '8px 8px 0 0',
                border: 'none', cursor: 'pointer',
                fontFamily: 'Red Hat Text, sans-serif', fontSize: '13px',
                background: activeTab === tab.id ? 'var(--surface-2)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-dim)',
                borderBottom: activeTab === tab.id ? '2px solid var(--gpu-amber)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'attestation' && <AttestationPanel />}
        {activeTab === 'provenance' && <AibomPanel />}
        {activeTab === 'routing' && <RoutingPanel />}
        {activeTab === 'policy' && <PolicyPanel />}
        {activeTab === 'verify' && <VerifyPanel />}
      </div>

      {activeTab !== 'verify' && (
        <div style={{
          width: '240px', padding: '24px 16px',
          borderLeft: '1px solid var(--border)',
          overflow: 'auto',
        }}>
          <div style={{
            fontSize: '11px', color: 'var(--text-dim)',
            marginBottom: '12px', fontFamily: 'Red Hat Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Live Proof Chain
          </div>
          <ProofChain entries={entries} variant="compact" />
        </div>
      )}
    </motion.div>
  )
}
