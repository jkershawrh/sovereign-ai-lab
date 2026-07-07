import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react'

export default function DataFlowEdge({ sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const color = (data as { color?: string })?.color ?? '#707070'

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 2,
          strokeDasharray: '8 4',
          animation: 'flowDash 1.5s linear infinite',
        }}
        markerEnd={`url(#arrow-${color.replace('#', '')})`}
      />
      <defs>
        <marker id={`arrow-${color.replace('#', '')}`} markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={color} />
        </marker>
      </defs>
    </>
  )
}
