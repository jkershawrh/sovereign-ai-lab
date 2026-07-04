import { motion, AnimatePresence } from 'motion/react'
import type { LedgerEntry } from '../lib/types'

interface Props {
  entries: LedgerEntry[]
  maxVisible?: number
}

export default function LedgerFeed({ entries, maxVisible = 10 }: Props) {
  const visible = entries.slice(-maxVisible).reverse()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '4px',
      maxHeight: '400px', overflow: 'auto',
    }}>
      <AnimatePresence>
        {visible.map(entry => (
          <motion.div
            key={entry.entry_id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: '8px 12px',
              background: 'var(--surface-1)',
              borderRadius: '6px',
              borderLeft: '3px solid var(--gpu-amber)',
              fontSize: '12px',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'Red Hat Mono, monospace',
            }}>
              <span style={{ color: 'var(--gpu-amber)' }}>{entry.entry_type}</span>
              <span style={{ color: 'var(--text-dim)' }}>
                {entry.entry_hash.slice(0, 12)}...
              </span>
            </div>
            <div style={{ color: 'var(--text-dim)', marginTop: '2px' }}>
              {entry.agent_id}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
