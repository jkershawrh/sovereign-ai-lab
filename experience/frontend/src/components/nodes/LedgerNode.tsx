import { Handle, Position } from '@xyflow/react'
import { motion } from 'motion/react'

interface LedgerNodeData {
  label: string
  tech: string
  port: string
  color: string
}

export default function LedgerNode({ data }: { data: LedgerNodeData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        padding: '16px 24px',
        background: 'var(--surface-1)',
        borderRadius: 10,
        border: `2px solid ${data.color}`,
        width: 720,
        textAlign: 'center',
        boxShadow: `0 0 20px ${data.color}22`,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif', color: data.color }}>
        {data.label}
      </div>
      <div style={{ fontSize: 12, fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-dim)', marginTop: 4 }}>
        {data.tech} · {data.port}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: data.color, width: 6, height: 6 }} />
    </motion.div>
  )
}
