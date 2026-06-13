import type { NodeProps } from '@xyflow/react'
import type { AppNodeData, ClientConfig } from '../../types'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { BaseNode } from './BaseNode'

const MonitorIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export function ClientNode({ id, data, selected }: NodeProps<AppNodeData>) {
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
        <InfoRow label="RPS" value={cfg.rps} />
        <InfoRow label="Method" value={cfg.method} />
        <InfoRow label="Path" value={cfg.path} />
      </div>
    </BaseNode>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-white/40 font-mono">{label}</span>
      <span className="text-[10px] text-white/70 font-mono truncate max-w-[70px]">{value}</span>
    </div>
  )
}
