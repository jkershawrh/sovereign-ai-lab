import { motion } from 'motion/react'
import { useAttestation } from '../hooks/useAttestation'

export default function AttestationPanel() {
  const { data, loading, error, refresh } = useAttestation()

  if (loading) return <div style={{ color: 'var(--text-dim)' }}>Loading attestation...</div>
  if (error) return <div style={{ color: 'var(--rh-orange)' }}>Error: {error}</div>

  const report = data?.report as Record<string, string> | null
  const tcbStatus = report?.tcb_status ?? 'unknown'
  const isSimulated = tcbStatus.includes('simulated')
  const statusColor = tcbStatus.includes('UpToDate') || tcbStatus === 'OK'
    ? 'var(--rh-green)' : 'var(--rh-orange)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '1.25rem', margin: 0 }}>
          Hardware Trust
        </h2>
        <span style={{
          padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
          fontFamily: 'Red Hat Mono, monospace',
          background: statusColor, color: 'var(--bg-dark)',
          fontWeight: 600,
        }}>
          {tcbStatus}
        </span>
      </div>

      {data?.td_config && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>
            Trust Domain Configuration
          </div>
          {Object.entries(data.td_config).map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '4px 0', borderBottom: '1px solid var(--border)',
              fontSize: '13px',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-primary)' }}>
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {report?.quote_hash && (
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Quote Hash: </span>
          <span style={{ fontFamily: 'Red Hat Mono, monospace', color: 'var(--intel-cyan)' }}>
            {report.quote_hash}
          </span>
        </div>
      )}

      <motion.button
        className="btn btn-secondary"
        onClick={refresh}
        whileTap={{ scale: 0.97 }}
        style={{ alignSelf: 'flex-start' }}
      >
        {isSimulated ? 'Re-attest (simulated)' : 'Re-attest'}
      </motion.button>
    </div>
  )
}
