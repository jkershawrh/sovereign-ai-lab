import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'

const C = {
  tdx: '#00AEEF',
  ledger: '#F5A623',
  model: '#0F62FE',
  router: '#5e40be',
  opa: '#37a3a3',
  gateway: '#ee0000',
  tools: '#63993d',
}

export const STEPS = [
  { label: 'Hardware Trust Boundary', desc: 'Intel TDX creates a cryptographically isolated trust domain. Everything inside this boundary is hardware-attested.' },
  { label: 'Immutable Ledger', desc: 'The foundation. Every component writes proof events here. A tamper-evident hash chain records every governance decision.' },
  { label: 'Sovereign Model', desc: 'Granite 3.2 open-weight model served locally via OpenVINO. You possess the weights. The AIBOM documents its origin.' },
  { label: 'Semantic Router', desc: 'Classifies every prompt before it reaches the model. Sensitive data is flagged. Injection attempts are blocked.' },
  { label: 'OPA Policy Engine', desc: 'Deny-by-default policies per jurisdiction. Data residency, model promotion, agent identity — every decision is logged.' },
  { label: 'Praxis Gateway', desc: 'The front door. AI-aware reverse proxy with filter pipeline. Every request passing through is recorded and hash-chained.' },
  { label: 'Tool Federation', desc: 'ContextForge federates MCP tools. The sovereign data server provides jurisdiction-local documents. Zero external API calls.' },
  { label: 'Proof Connections', desc: 'Every component writes to the ledger. The dotted lines show governance events flowing into the tamper-evident chain.' },
  { label: 'Request Flow', desc: 'Watch a prompt flow through the sovereign stack: enter gateway, classify, check policy, route to model, respond, record proof.' },
]

interface StepNode extends Node { data: Record<string, unknown> & { step: number } }
interface StepEdge extends Edge { data: Record<string, unknown> & { step: number } }

const ALL_NODES: StepNode[] = [
  { id: 'tdx', type: 'group', position: { x: 0, y: 0 }, data: { label: 'Intel TDX Trust Domain', step: 0 }, style: { width: 820, height: 420, border: `2px dashed ${C.tdx}`, borderRadius: 16, background: 'transparent', padding: 10 } },
  { id: 'ledger', type: 'ledger', position: { x: 40, y: 320 }, data: { label: 'are-immutable-ledger', tech: 'tamper-evident hash chain', port: ':28099', color: C.ledger, step: 1 }, parentId: 'tdx', extent: 'parent' as const },
  { id: 'model', type: 'service', position: { x: 560, y: 40 }, data: { label: 'Granite Model', tech: 'OVMS · open weights', port: ':8080', color: C.model, step: 2 }, parentId: 'tdx', extent: 'parent' as const },
  { id: 'router', type: 'service', position: { x: 300, y: 40 }, data: { label: 'Semantic Router', tech: 'classify · route · block', port: ':8001', color: C.router, step: 3 }, parentId: 'tdx', extent: 'parent' as const },
  { id: 'opa', type: 'service', position: { x: 300, y: 180 }, data: { label: 'OPA Policies', tech: 'deny-by-default', port: ':8181', color: C.opa, step: 4 }, parentId: 'tdx', extent: 'parent' as const },
  { id: 'gateway', type: 'service', position: { x: 40, y: 40 }, data: { label: 'Praxis Gateway', tech: 'filter pipeline', port: ':9000', color: C.gateway, step: 5 }, parentId: 'tdx', extent: 'parent' as const },
  { id: 'contextforge', type: 'service', position: { x: 40, y: 180 }, data: { label: 'ContextForge', tech: 'MCP · A2A', port: ':4444', color: C.tools, step: 6 }, parentId: 'tdx', extent: 'parent' as const },
  { id: 'mcp', type: 'service', position: { x: 560, y: 180 }, data: { label: 'MCP Data Server', tech: 'jurisdiction docs', port: ':8090', color: C.tools, step: 6 }, parentId: 'tdx', extent: 'parent' as const },
  { id: 'frontend', type: 'service', position: { x: 300, y: 480 }, data: { label: 'Frontend + Demo API', tech: 'slides · demo · lab', port: ':9001 / :9099', color: '#707070', step: 5 } },
]

const ALL_EDGES: StepEdge[] = [
  { id: 'e-gw-router', source: 'gateway', target: 'router', type: 'dataflow', data: { color: C.gateway, step: 5 } },
  { id: 'e-router-model', source: 'router', target: 'model', type: 'dataflow', data: { color: C.router, step: 3 } },
  { id: 'e-router-opa', source: 'router', target: 'opa', type: 'dataflow', data: { color: C.opa, step: 4 } },
  { id: 'e-frontend-gw', source: 'frontend', target: 'gateway', type: 'dataflow', data: { color: '#707070', step: 5 } },
  { id: 'e-proof-gw', source: 'gateway', target: 'ledger', type: 'proof', data: { step: 7 } },
  { id: 'e-proof-router', source: 'router', target: 'ledger', type: 'proof', data: { step: 7 } },
  { id: 'e-proof-model', source: 'model', target: 'ledger', type: 'proof', data: { step: 7 } },
  { id: 'e-proof-opa', source: 'opa', target: 'ledger', type: 'proof', data: { step: 7 } },
  { id: 'e-proof-cf', source: 'contextforge', target: 'ledger', type: 'proof', data: { step: 7 } },
]

interface ArchitectureState {
  step: number
  nodes: Node[]
  edges: Edge[]
  exploring: boolean
  advance: () => void
  reset: () => void
  enableExploration: () => void
}

export const useArchitectureStore = create<ArchitectureState>((set, get) => ({
  step: -1,
  nodes: [],
  edges: [],
  exploring: false,

  advance: () => {
    const nextStep = get().step + 1
    if (nextStep >= STEPS.length) return

    const nodes = ALL_NODES.filter(n => n.data.step <= nextStep)
    const edges = ALL_EDGES.filter(e => e.data.step <= nextStep)

    set({ step: nextStep, nodes, edges })
  },

  reset: () => set({ step: -1, nodes: [], edges: [], exploring: false }),

  enableExploration: () => set({ exploring: true }),
}))
