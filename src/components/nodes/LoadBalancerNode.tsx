import type { NodeProps } from '@xyflow/react'
import type { AppNode, LoadBalancerConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

const LBIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 10.49L8.59 6.51" />
  </svg>
)

export function LoadBalancerNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const edges = useGraphStore(s => s.edges)
  const cfg = data.config as LoadBalancerConfig
  const targetCount = edges.filter(e => e.source === id).length

  return (
    <BaseNode
      id={id}
      selected={selected}
      accentColor="#F97316"
      icon={<LBIcon />}
      label={data.label}
      status={data.status}
      validationErrors={validationErrors}
    >
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">Algo</span>
          <span className="text-[10px] text-orange-300/70 font-mono">{cfg.algorithm}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">Targets</span>
          <span className="text-[10px] text-white/70 font-mono">{targetCount}</span>
        </div>
      </div>
    </BaseNode>
  )
}
