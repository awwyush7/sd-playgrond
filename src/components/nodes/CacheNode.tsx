import type { NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'
import type { AppNode, CacheConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

export function CacheNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as CacheConfig

  return (
    <BaseNode id={id} selected={selected} accentColor="#EF4444"
      icon={<Zap size={12} strokeWidth={2} />}
      label={data.label} status={data.status} validationErrors={validationErrors}
      showBothHandles
    >
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Hit Rate</span>
          <span className="text-[10px] text-emerald-500 font-mono">{cfg.hitRate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Hit / Miss</span>
          <span className="text-[10px] text-2 font-mono">{cfg.hitLatencyMs}ms / {cfg.missLatencyMs}ms</span>
        </div>
      </div>
    </BaseNode>
  )
}
