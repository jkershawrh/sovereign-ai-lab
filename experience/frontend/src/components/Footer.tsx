interface Props {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  counter?: string
  backDisabled?: boolean
  nextDisabled?: boolean
}

export default function Footer({
  onBack, onNext, backLabel = 'Back', nextLabel = 'Next',
  counter, backDisabled = false, nextDisabled = false,
}: Props) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px',
      background: 'var(--surface-1)',
      borderTop: '1px solid var(--border)',
    }}>
      <button
        onClick={onBack}
        disabled={backDisabled}
        style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: backDisabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
          padding: '6px 16px', borderRadius: 6, cursor: backDisabled ? 'default' : 'pointer',
          fontFamily: 'Red Hat Text, sans-serif', fontSize: 13,
        }}
      >
        {backLabel}
      </button>

      {counter && (
        <span style={{
          fontFamily: 'Red Hat Mono, monospace',
          fontSize: 12, color: 'var(--text-disabled)',
        }}>
          {counter}
        </span>
      )}

      <button
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          background: nextDisabled ? 'var(--text-disabled)' : 'var(--rh-red)',
          border: 'none',
          color: '#fff', padding: '8px 24px', borderRadius: 6,
          cursor: nextDisabled ? 'default' : 'pointer',
          fontFamily: 'Red Hat Text, sans-serif', fontSize: 13, fontWeight: 600,
        }}
      >
        {nextLabel}
      </button>
    </div>
  )
}
