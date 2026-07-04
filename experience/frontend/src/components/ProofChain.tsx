import { motion, AnimatePresence } from 'motion/react'
import type { LedgerEntry, LayerName } from '../lib/types'

const LAYER_ORDER: LayerName[] = [
  'hardware', 'platform', 'models', 'data', 'governance', 'agentControl', 'execution',
]

const LAYER_LABELS: Record<LayerName, string> = {
  hardware: 'Hardware Trust',
  platform: 'Platform',
  models: 'Models',
  data: 'Data',
  governance: 'Governance',
  agentControl: 'Agent Control',
  execution: 'Execution',
}

const LAYER_COLORS: Record<LayerName, string> = {
  hardware: 'var(--intel-cyan)',
  platform: 'var(--rh-red)',
  models: 'var(--ibm-blue)',
  data: 'var(--rh-teal)',
  governance: 'var(--gpu-amber)',
  agentControl: 'var(--rh-purple)',
  execution: 'var(--rh-green)',
}

function entryToLayer(entry: LedgerEntry): LayerName {
  const t = entry.entry_type
  if (t.startsWith('tdx.')) return 'hardware'
  if (t.startsWith('platform.')) return 'platform'
  if (t.startsWith('pipeline.')) return 'models'
  if (t.startsWith('model.')) return 'models'
  if (t.startsWith('data.')) return 'data'
  if (t.startsWith('agent.')) return 'agentControl'
  if (t.startsWith('router.')) return 'execution'
  if (t.startsWith('verify.')) return 'governance'
  return 'governance'
}

interface Props {
  entries: LedgerEntry[]
  variant?: 'compact' | 'full'
}

export default function ProofChain({ entries, variant = 'compact' }: Props) {
  const isCompact = variant === 'compact'
  const grouped = new Map<LayerName, LedgerEntry[]>()
  for (const layer of LAYER_ORDER) grouped.set(layer, [])
  for (const e of entries) {
    const layer = entryToLayer(e)
    grouped.get(layer)?.push(e)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: isCompact ? '2px' : '8px',
      width: isCompact ? '220px' : '100%',
    }}>
      {LAYER_ORDER.map(layer => {
        const layerEntries = grouped.get(layer) ?? []
        const color = LAYER_COLORS[layer]

        return (
          <div key={layer}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: isCompact ? '4px 8px' : '8px 12px',
              background: 'var(--surface-2)',
              borderRadius: '4px',
              borderLeft: `3px solid ${color}`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: layerEntries.length > 0 ? color : 'var(--text-disabled)',
              }} />
              <span style={{
                fontSize: isCompact ? 11 : 14,
                fontFamily: 'Red Hat Text, sans-serif',
                color: layerEntries.length > 0 ? 'var(--text-primary)' : 'var(--text-dim)',
              }}>
                {LAYER_LABELS[layer]}
              </span>
              {layerEntries.length > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  fontFamily: 'Red Hat Mono, monospace',
                  color: 'var(--text-dim)',
                }}>
                  {layerEntries.length}
                </span>
              )}
            </div>

            {!isCompact && (
              <AnimatePresence>
                {layerEntries.map(e => (
                  <motion.div
                    key={e.entry_id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                      marginLeft: '19px',
                      borderLeft: `1px solid ${color}`,
                      padding: '4px 12px',
                      fontSize: 11,
                      fontFamily: 'Red Hat Mono, monospace',
                    }}
                  >
                    <span style={{ color }}>{e.entry_type}</span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>
                      {e.entry_hash.slice(0, 12)}...
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )
      })}
    </div>
  )
}
