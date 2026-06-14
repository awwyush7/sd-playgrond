import type { NodeProps } from '@xyflow/react'
import { Shuffle } from 'lucide-react'
import type { AppNode, LoadBalancerConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

export function LoadBalancerNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const edges = useGraphStore(s => s.edges)
  const cfg = data.config as LoadBalancerConfig
  const targetCount = edges.filter(e => e.source === id).length

  return (
    <BaseNode id={id} selected={selected} accentColor="#F97316"
      icon={<Shuffle size={12} strokeWidth={2} />}
      label={data.label} status={data.status} validationErrors={validationErrors}
    >
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Algo</span>
          <span className="text-[10px] text-orange-500 font-mono">{cfg.algorithm}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Targets</span>
          <span className="text-[10px] text-2 font-mono">{targetCount}</span>
        </div>
      </div>
    </BaseNode>
  )
}
