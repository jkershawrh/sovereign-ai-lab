import { useEffect, useState } from 'react'

interface Props {
  actCount: number
  currentAct: number
  onActClick: (i: number) => void
  title?: string
}

export default function Header({ actCount, currentAct, onActClick, title = 'Sovereign AI Lab' }: Props) {
  const [healthy, setHealthy] = useState(false)

  useEffect(() => {
    const check = () => fetch('/api/health').then(r => setHealthy(r.ok)).catch(() => setHealthy(false))
    check()
    const id = setInterval(check, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px',
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logos/redhat.svg" alt="Red Hat" style={{ height: 20 }} />
        <span style={{ color: 'var(--text-disabled)', fontSize: 22, fontWeight: 300 }}>×</span>
        <img src="/logos/intel.png" alt="Intel" style={{ height: 20 }} />
      </div>

      <div style={{
        fontFamily: 'Red Hat Display, sans-serif',
        fontSize: 18, fontWeight: 700, letterSpacing: -0.5,
      }}>
        {title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: actCount }, (_, i) => (
            <button
              key={i}
              onClick={() => onActClick(i)}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                border: 'none', cursor: 'pointer', padding: 0,
                background: i === currentAct
                  ? 'var(--intel-cyan)'
                  : i < currentAct
                    ? 'var(--rh-green)'
                    : 'var(--border)',
                boxShadow: i === currentAct ? '0 0 6px var(--intel-cyan)' : 'none',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
        <span style={{
          fontFamily: 'Red Hat Mono, monospace',
          fontSize: 11, color: 'var(--text-disabled)',
        }}>
          {String(currentAct + 1).padStart(2, '0')} / {String(actCount).padStart(2, '0')}
        </span>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: healthy ? 'var(--rh-green)' : 'var(--text-disabled)',
          boxShadow: healthy ? '0 0 6px var(--rh-green)' : 'none',
        }} />
      </div>
    </div>
  )
}
