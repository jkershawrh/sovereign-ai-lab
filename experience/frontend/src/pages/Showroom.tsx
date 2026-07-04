import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import StackDiagram from '../components/StackDiagram'

const JURISDICTIONS = [
  { id: 'eu', label: 'European Union', flag: '🇪🇺' },
  { id: 'gulf', label: 'Gulf States', flag: '🌙' },
  { id: 'seasia', label: 'Southeast Asia', flag: '🌏' },
]

export default function Showroom() {
  const [selected, setSelected] = useState('eu')
  const { profile } = useProfile(selected)
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', height: '100vh', padding: '24px' }}
    >
      {/* Left: Selector */}
      <div style={{ width: '220px', paddingRight: '24px', borderRight: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '12px', fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Jurisdiction
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {JURISDICTIONS.map(j => (
            <button
              key={j.id}
              onClick={() => setSelected(j.id)}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'Red Hat Text, sans-serif', fontSize: '14px',
                background: selected === j.id ? 'var(--surface-2)' : 'transparent',
                color: selected === j.id ? 'var(--text-primary)' : 'var(--text-dim)',
                borderLeft: selected === j.id ? '3px solid var(--gpu-amber)' : '3px solid transparent',
              }}
            >
              {j.flag} {j.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Stack Diagram */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
        <StackDiagram variant="full" profile={profile ?? undefined} />
        <motion.button
          className="btn btn-primary"
          onClick={() => navigate(`/leave-behind?profile=${selected}`)}
          whileTap={{ scale: 0.97 }}
          style={{ marginTop: '32px' }}
        >
          Generate Leave-Behind
        </motion.button>
      </div>

      {/* Right: Profile Detail */}
      <div style={{ width: '320px', paddingLeft: '24px', borderLeft: '1px solid var(--border)', overflow: 'auto' }}>
        {profile ? (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '1.5rem', margin: 0 }}>
              {profile.flag} {profile.name}
            </h2>

            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '14px', color: 'var(--gpu-amber)', lineHeight: 1.5, fontStyle: 'italic' }}>
                {profile.key_concern}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase' }}>
                Compliance
              </div>
              {profile.compliance_labels.map(l => (
                <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '8px', fontSize: '10px',
                    background: `var(--rh-${l.color}-dim, rgba(55,163,163,0.12))`,
                    color: `var(--rh-${l.color}, var(--rh-teal))`,
                    fontFamily: 'Red Hat Mono, monospace',
                  }}>
                    {l.layer}
                  </span>
                  <span>{l.name}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase' }}>
                OPA Policies
              </div>
              {profile.opa_policies.map(p => (
                <div key={p} style={{ fontSize: '12px', fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-secondary)', padding: '2px 0' }}>
                  {p}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase' }}>
                Recommended Models
              </div>
              {profile.recommended_models.map(m => (
                <div key={m.name} style={{ padding: '4px 0', fontSize: '13px' }}>
                  <strong>{m.name}</strong>
                  <span style={{ color: 'var(--text-dim)', marginLeft: '8px' }}>{m.reason}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase' }}>
                AIBOM Requirements
              </div>
              {profile.aibom_requirements.map((r, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 0' }}>
                  • {r}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div style={{ color: 'var(--text-dim)' }}>Loading profile...</div>
        )}
      </div>
    </motion.div>
  )
}
