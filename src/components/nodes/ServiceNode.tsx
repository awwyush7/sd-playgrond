import type { NodeProps } from '@xyflow/react'
import { Server } from 'lucide-react'
import type { AppNode, ServiceConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

export function ServiceNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as ServiceConfig

  return (
    <BaseNode id={id} selected={selected} accentColor="#22C55E"
      icon={<Server size={12} strokeWidth={2} />}
      label={data.label} status={data.status} validationErrors={validationErrors}
    >
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Latency</span>
          <span className="text-[10px] text-2 font-mono">{cfg.latencyMs}ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Err Rate</span>
          <span className={`text-[10px] font-mono ${cfg.errorRate > 0 ? 'text-red-500' : 'text-2'}`}>
            {cfg.errorRate}%
          </span>
        </div>
      </div>
    </BaseNode>
  )
}
