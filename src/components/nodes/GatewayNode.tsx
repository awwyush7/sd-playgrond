import type { NodeProps } from '@xyflow/react'
import type { AppNodeData, GatewayConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

const GatewayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
)

export function GatewayNode({ id, data, selected }: NodeProps<AppNodeData>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as GatewayConfig
  const ruleCount = cfg.rules.length

  return (
    <BaseNode
      id={id}
      selected={selected}
      accentColor="#8B5CF6"
      icon={<GatewayIcon />}
      label={data.label}
      status={data.status}
      validationErrors={validationErrors}
      hasTarget={true}
      hasSource={true}
    >
      <div className="mt-1">
        {ruleCount === 0 ? (
          <span className="text-[10px] text-red-400/80 font-mono">No routing rules</span>
        ) : (
          <div className="space-y-0.5">
            {cfg.rules.slice(0, 3).map(rule => (
              <div key={rule.id} className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-violet-300/60 bg-violet-400/10 px-1 rounded">
                  {rule.method}
                </span>
                <span className="text-[9px] text-white/50 font-mono truncate max-w-[80px]">
                  {rule.pathPrefix}
                </span>
              </div>
            ))}
            {ruleCount > 3 && (
              <span className="text-[9px] text-white/30 font-mono">+{ruleCount - 3} more</span>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  )
}
