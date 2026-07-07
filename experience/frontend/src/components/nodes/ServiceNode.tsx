import { Handle, Position } from '@xyflow/react'
import { motion } from 'motion/react'

interface ServiceNodeData {
  label: string
  tech: string
  port: string
  color: string
}

export default function ServiceNode({ data }: { data: ServiceNodeData }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        padding: '14px 18px',
        background: 'var(--surface-1)',
        borderRadius: 10,
        borderLeft: `4px solid ${data.color}`,
        minWidth: 180,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif', color: 'var(--text-primary)', marginBottom: 4 }}>
        {data.label}
      </div>
      <div style={{ fontSize: 11, fontFamily: 'Red Hat Mono, monospace', color: data.color, marginBottom: 2 }}>
        {data.tech}
      </div>
      <div style={{ fontSize: 10, fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-disabled)' }}>
        {data.port}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: data.color, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: data.color, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: data.color, width: 6, height: 6 }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: data.color, width: 6, height: 6 }} />
    </motion.div>
  )
}
