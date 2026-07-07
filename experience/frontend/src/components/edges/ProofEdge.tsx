import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react'

export default function ProofEdge({ sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return (
    <BaseEdge
      path={edgePath}
      style={{
        stroke: '#F5A623',
        strokeWidth: 1,
        strokeDasharray: '4 3',
        opacity: 0.5,
      }}
    />
  )
}
