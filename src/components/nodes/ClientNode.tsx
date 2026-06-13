import type { NodeProps } from '@xyflow/react'
import type { AppNode, ClientConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

const MonitorIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export function ClientNode({ id, data, selected }: NodeProps<AppNode>) {
  const validationErrors = useGraphStore(s => s.validationErrorsByNodeId.get(id) ?? EMPTY_ERRORS)
  const cfg = data.config as ClientConfig

  return (
    <BaseNode
      id={id}
      selected={selected}
      accentColor="#3B82F6"
      icon={<MonitorIcon />}
      label={data.label}
      status={data.status}
      validationErrors={validationErrors}
      hasTarget={false}
      hasSource={true}
    >
      <div className="flex flex-col gap-0.5">
        {(cfg.routes ?? []).slice(0, 3).map(r => (
          <div key={r.id} className="flex items-center gap-1">
            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-white/[0.06] text-white/50 flex-shrink-0">{r.method}</span>
            <span className="text-[9px] text-white/55 font-mono truncate flex-1">{r.path}</span>
            <span className="text-[8px] text-white/35 font-mono flex-shrink-0">{r.rps}/s</span>
          </div>
        ))}
        {(cfg.routes ?? []).length > 3 && (
          <span className="text-[8px] text-white/25 font-mono">+{cfg.routes.length - 3} more</span>
        )}
        <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-white/[0.06]">
          <span className="text-[8px] text-white/25 font-mono">Total</span>
          <span className="text-[9px] text-white/55 font-mono">{(cfg.routes ?? []).reduce((s, r) => s + (r.rps ?? 0), 0)}/s</span>
        </div>
      </div>
    </BaseNode>
  )
}

