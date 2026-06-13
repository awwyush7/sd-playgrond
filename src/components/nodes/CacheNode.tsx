import type { NodeProps } from '@xyflow/react'
import type { AppNode, CacheConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

const CacheIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

export function CacheNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as CacheConfig

  return (
    <BaseNode
      id={id}
      selected={selected}
      accentColor="#EF4444"
      icon={<CacheIcon />}
      label={data.label}
      status={data.status}
      validationErrors={validationErrors}
      showBothHandles={true}
    >
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">Hit Rate</span>
          <span className="text-[10px] text-emerald-400/80 font-mono">{cfg.hitRate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">Hit / Miss</span>
          <span className="text-[10px] text-white/70 font-mono">
            {cfg.hitLatencyMs}ms / {cfg.missLatencyMs}ms
          </span>
        </div>
      </div>
    </BaseNode>
  )
}
