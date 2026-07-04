import { motion } from 'motion/react'
import type { LayerName, JurisdictionProfile } from '../lib/types'

const LAYERS: { key: LayerName; label: string; component: string }[] = [
  { key: 'hardware', label: 'Hardware Trust', component: 'Intel TDX' },
  { key: 'platform', label: 'Platform', component: 'OpenShift AI' },
  { key: 'models', label: 'Models', component: 'Granite (open weights)' },
  { key: 'data', label: 'Data', component: 'OPA + Residency' },
  { key: 'governance', label: 'Governance', component: 'are-immutable-ledger' },
  { key: 'agentControl', label: 'Agent Control', component: 'Kagenti' },
  { key: 'execution', label: 'Execution', component: 'Praxis + ContextForge' },
]

const LAYER_COLORS: Record<string, string> = {
  hardware: 'var(--intel-cyan)',
  platform: 'var(--rh-red)',
  models: 'var(--ibm-blue)',
  data: 'var(--rh-teal)',
  governance: 'var(--gpu-amber)',
  agentControl: 'var(--rh-purple)',
  execution: 'var(--rh-green)',
}

interface Props {
  highlightLayer?: LayerName
  profile?: JurisdictionProfile
  variant?: 'full' | 'compact' | 'background'
}

export default function StackDiagram({ highlightLayer, profile, variant = 'full' }: Props) {
  const isCompact = variant === 'compact'
  const isBg = variant === 'background'
  const w = isCompact ? 200 : isBg ? 300 : 400
  const layerH = isCompact ? 28 : 40
  const gap = isCompact ? 4 : 8
  const h = LAYERS.length * (layerH + gap)

  const badges = profile?.compliance_labels ?? []

  return (
    <svg width={w} height={h} style={{ opacity: isBg ? 0.15 : 1 }}>
      {LAYERS.map((layer, i) => {
        const y = i * (layerH + gap)
        const active = highlightLayer === layer.key
        const color = LAYER_COLORS[layer.key]
        const layerBadges = badges.filter(b => b.layer === layer.key)

        return (
          <motion.g key={layer.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <rect
              x={0} y={y} width={w} height={layerH} rx={6}
              fill={active ? color : 'var(--surface-2)'}
              stroke={color}
              strokeWidth={active ? 2 : 1}
              opacity={active ? 1 : 0.7}
            />
            <text
              x={12} y={y + layerH / 2 + 1}
              fill="var(--text-primary)"
              fontSize={isCompact ? 10 : 13}
              fontFamily="Red Hat Text, sans-serif"
              dominantBaseline="middle"
            >
              {layer.label}
            </text>
            {!isCompact && (
              <text
                x={w - 12} y={y + layerH / 2 + 1}
                fill="var(--text-dim)"
                fontSize={11}
                fontFamily="Red Hat Mono, monospace"
                dominantBaseline="middle"
                textAnchor="end"
              >
                {layer.component}
              </text>
            )}
            {layerBadges.map((badge, bi) => (
              <g key={badge.name}>
                <rect
                  x={w - 80 - bi * 70} y={y + 2} width={65} height={16} rx={8}
                  fill={`var(--rh-${badge.color}, var(--rh-teal))`}
                  opacity={0.3}
                />
                <text
                  x={w - 80 - bi * 70 + 32} y={y + 12}
                  fill="var(--text-primary)"
                  fontSize={8}
                  fontFamily="Red Hat Mono, monospace"
                  textAnchor="middle"
                >
                  {badge.name}
                </text>
              </g>
            ))}
            {i < LAYERS.length - 1 && (
              <line
                x1={w / 2} y1={y + layerH}
                x2={w / 2} y2={y + layerH + gap}
                stroke="var(--border)" strokeWidth={1}
              />
            )}
          </motion.g>
        )
      })}
    </svg>
  )
}
