import type { NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'
import type { AppNode, DatabaseConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

export function DatabaseNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as DatabaseConfig

  return (
    <BaseNode id={id} selected={selected} accentColor="#F59E0B"
      icon={<Database size={12} strokeWidth={2} />}
      label={data.label} status={data.status} validationErrors={validationErrors}
      hasTarget hasSource={false}
    >
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Query</span>
          <span className="text-[10px] text-2 font-mono">{cfg.queryLatencyMs}ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-3 font-mono">Pool</span>
          <span className="text-[10px] text-2 font-mono">{cfg.connectionPoolSize}</span>
        </div>
      </div>
    </BaseNode>
  )
}
