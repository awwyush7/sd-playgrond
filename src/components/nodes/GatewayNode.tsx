import type { NodeProps } from '@xyflow/react'
import { Route } from 'lucide-react'
import type { AppNode, GatewayConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

export function GatewayNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as GatewayConfig

  return (
    <BaseNode id={id} selected={selected} accentColor="#8B5CF6"
      icon={<Route size={12} strokeWidth={2} />}
      label={data.label} status={data.status} validationErrors={validationErrors}
      hasTarget hasSource
    >
      <div className="mt-1">
        {cfg.rules.length === 0 ? (
          <span className="text-[10px] text-red-500/80 font-mono">No routing rules</span>
        ) : (
          <div className="space-y-0.5">
            {cfg.rules.slice(0, 3).map(rule => (
              <div key={rule.id} className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-violet-500 bg-violet-500/10 px-1 rounded">{rule.method}</span>
                <span className="text-[9px] text-2 font-mono truncate max-w-[80px]">{rule.pathPrefix}</span>
              </div>
            ))}
            {cfg.rules.length > 3 && (
              <span className="text-[9px] text-3 font-mono">+{cfg.rules.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  )
}
