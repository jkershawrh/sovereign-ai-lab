import { useState } from 'react'
import { motion } from 'motion/react'

interface Props {
  step: number
  title: string
  description: string
  color?: string
  onRun: () => Promise<unknown>
  renderResult?: (data: Record<string, unknown>) => React.ReactNode
  disabled?: boolean
}

export default function StepCard({ step, title, description, color = 'var(--intel-cyan)', onRun, renderResult, disabled }: Props) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [done, setDone] = useState(false)

  const run = async () => {
    setRunning(true)
    try {
      const data = await onRun() as Record<string, unknown>
      setResult(data)
      setDone(true)
    } catch (e) {
      setResult({ error: String(e) } as Record<string, unknown>)
    } finally {
      setRunning(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        padding: '24px',
        background: 'var(--surface-1)',
        borderRadius: 12,
        borderLeft: `3px solid ${done ? 'var(--rh-green)' : color}`,
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'var(--rh-green)' : color,
          color: 'var(--bg-dark)',
          fontFamily: 'Red Hat Mono, monospace', fontSize: 13, fontWeight: 700,
        }}>
          {done ? '✓' : step}
        </div>
        <h3 style={{
          margin: 0, fontSize: 18, fontWeight: 700,
          fontFamily: 'Red Hat Display, sans-serif',
        }}>
          {title}
        </h3>
      </div>

      <p style={{
        fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7,
        margin: '0 0 16px',
      }}>
        {description}
      </p>

      {!done && (
        <motion.button
          className="btn btn-primary"
          onClick={run}
          disabled={running}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'var(--rh-red)', border: 'none', color: '#fff',
            padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
          }}
        >
          {running ? 'Running...' : `Run ${title}`}
        </motion.button>
      )}

      {result && renderResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          style={{ marginTop: 16 }}
        >
          {renderResult(result)}
        </motion.div>
      )}
    </motion.div>
  )
}

