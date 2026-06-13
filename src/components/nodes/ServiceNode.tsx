import type { NodeProps } from '@xyflow/react'
import type { AppNodeData, ServiceConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

const ServiceIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <path d="M6 6h.01M6 18h.01" />
  </svg>
)

export function ServiceNode({ id, data, selected }: NodeProps<AppNodeData>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as ServiceConfig

  return (
    <BaseNode
      id={id}
      selected={selected}
      accentColor="#22C55E"
      icon={<ServiceIcon />}
      label={data.label}
      status={data.status}
      validationErrors={validationErrors}
    >
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">Latency</span>
          <span className="text-[10px] text-white/70 font-mono">{cfg.latencyMs}ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">Err Rate</span>
          <span className={`text-[10px] font-mono ${cfg.errorRate > 0 ? 'text-red-400/80' : 'text-white/70'}`}>
            {cfg.errorRate}%
          </span>
        </div>
      </div>
    </BaseNode>
  )
}
