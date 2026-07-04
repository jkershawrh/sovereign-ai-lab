import { api } from '../lib/api'
import StepCard from '../components/StepCard'

export default function Act02HardwareTrust({ onComplete }: { onComplete?: () => void }) {
  return (
    <div style={{ padding: '48px 32px', maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-disabled)' }}>02</span>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          Hardware Trust
        </h2>
      </div>
      <p style={{ fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 700, marginBottom: 32 }}>
        Your compute is yours. Intel TDX creates a cryptographically isolated trust domain —
        no one, not even the cloud provider, can see inside. Intel Trust Authority verifies
        the hardware is genuine. This is the foundation every other sovereignty layer builds on.
      </p>

      <StepCard
        step={1}
        title="TDX Attestation"
        description="Call Intel Trust Authority to attest the running trust domain. The attestation report includes the TCB status, quote hash, and timestamp. This is written to the immutable ledger as the first proof."
        color="var(--intel-cyan)"
        onRun={async () => {
          await api.attestation.refresh()
          return await api.attestation.get()
        }}
        renderResult={(data) => {
          const d = data as { summary?: string; report?: Record<string, string> }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{
                  padding: '6px 16px', borderRadius: 12, fontSize: 14,
                  fontFamily: 'Red Hat Mono, monospace', fontWeight: 600,
                  background: 'var(--rh-green)', color: 'var(--bg-dark)',
                }}>
                  {d.report?.tcb_status ?? 'unknown'}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>TCB Status</span>
              </div>
              {d.report?.quote_hash && (
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Quote Hash: </span>
                  <span style={{ fontFamily: 'Red Hat Mono, monospace', color: 'var(--intel-cyan)' }}>
                    {d.report.quote_hash}
                  </span>
                </div>
              )}
              <div style={{
                padding: 12, background: 'var(--surface-2)', borderRadius: 8,
                fontSize: 12, fontFamily: 'Red Hat Mono, monospace', color: 'var(--gpu-amber)',
              }}>
                ✓ Attestation recorded in immutable ledger
              </div>
            </div>
          )
        }}
      />

      <button
        onClick={onComplete}
        style={{
          marginTop: 24, background: 'var(--rh-red)', border: 'none', color: '#fff',
          padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
        }}
      >
        See model provenance →
      </button>
    </div>
  )
}
