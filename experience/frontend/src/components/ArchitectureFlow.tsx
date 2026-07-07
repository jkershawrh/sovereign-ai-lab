import { useCallback, useEffect } from 'react'
import { ReactFlow, ReactFlowProvider, useReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import { AnimatePresence, motion } from 'motion/react'
import { useArchitectureStore, STEPS } from '../stores/architectureStore'
import ServiceNode from './nodes/ServiceNode'
import LedgerNode from './nodes/LedgerNode'
import DataFlowEdge from './edges/DataFlowEdge'
import ProofEdge from './edges/ProofEdge'

const nodeTypes = { service: ServiceNode, ledger: LedgerNode }
const edgeTypes = { dataflow: DataFlowEdge, proof: ProofEdge }

interface Props {
  onComplete?: () => void
}

function FlowCanvas({ onComplete }: Props) {
  const { nodes, edges, step, exploring, advance, enableExploration } = useArchitectureStore()
  const { fitView } = useReactFlow()
  const done = step >= STEPS.length - 1

  useEffect(() => {
    if (step >= 0) {
      setTimeout(() => fitView({ duration: 800, padding: 0.15 }), 100)
    }
  }, [step, fitView])

  const handleAdvance = useCallback(() => {
    if (done) {
      if (!exploring) {
        enableExploration()
      } else {
        onComplete?.()
      }
    } else {
      advance()
    }
  }, [done, exploring, advance, enableExploration, onComplete])

  return (
    <div style={{ padding: '48px 32px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Red Hat Mono, monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-disabled)' }}>01</span>
        <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          The Sovereign AI Stack
        </h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 700, marginBottom: 16, minHeight: 48 }}
        >
          {step < 0
            ? 'Click to build the sovereign AI stack, one component at a time.'
            : STEPS[step].desc}
        </motion.p>
      </AnimatePresence>

      <div style={{ width: '100%', height: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={exploring}
          nodesConnectable={false}
          panOnDrag={exploring}
          zoomOnScroll={exploring}
          zoomOnDoubleClick={false}
          colorMode="dark"
          fitView
          proOptions={{ hideAttribution: true }}
          style={{ background: 'var(--bg-dark)' }}
        >
          <Background color="var(--border)" gap={20} size={1} />
          {exploring && <Controls />}
          {exploring && <MiniMap nodeColor={() => 'var(--surface-2)'} style={{ background: 'var(--surface-1)' }} />}
        </ReactFlow>
      </div>

      <style>{`
        @keyframes flowDash {
          to { stroke-dashoffset: -24; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i <= step ? 'var(--gpu-amber)' : 'var(--surface-2)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <motion.button
          onClick={handleAdvance}
          whileTap={{ scale: 0.97 }}
          style={{
            background: '#ee0000', border: 'none', color: '#fff',
            padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Red Hat Text, sans-serif', fontSize: 14, fontWeight: 600,
          }}
        >
          {step < 0
            ? 'Build the stack'
            : done && !exploring
              ? 'Explore the topology'
              : done && exploring
                ? 'See the live proof'
                : `Next: ${STEPS[Math.min(step + 1, STEPS.length - 1)].label}`}
        </motion.button>
      </div>
    </div>
  )
}

export default function ArchitectureFlow(props: Props) {
  const reset = useArchitectureStore(s => s.reset)

  useEffect(() => {
    reset()
    return reset
  }, [reset])

  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  )
}
