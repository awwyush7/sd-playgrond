import { Handle, Position } from '@xyflow/react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import type { NodeStatus, ValidationError } from '../../types'
import { useSimulationStore } from '../../stores/simulationStore'

interface BaseNodeProps {
  id: string
  selected: boolean
  accentColor: string
  icon: ReactNode
  label: string
  status: NodeStatus
  validationErrors: ValidationError[]
  children?: ReactNode
  hasTarget?: boolean
  hasSource?: boolean
  showBothHandles?: boolean
}

const statusColors: Record<NodeStatus, string> = {
  idle:      'bg-black/10 dark:bg-white/20',
  active:    'bg-emerald-400',
  error:     'bg-red-400',
  saturated: 'bg-orange-400',
}

export function BaseNode({
  id, selected, accentColor, icon, label, status, validationErrors, children,
  hasTarget = true, hasSource = true, showBothHandles = false,
}: BaseNodeProps) {
  const simStatus  = useSimulationStore(s => s.status)
  const metrics    = useSimulationStore(s => s.metrics.get(id))
  const inspectTrace = useSimulationStore(s => s.inspectTrace)
  const inspectIdx   = useSimulationStore(s => s.inspectStepIndex)

  const isInspectHighlighted =
    simStatus === 'inspecting' && inspectTrace && inspectTrace[inspectIdx]?.nodeId === id

  const hasError   = validationErrors.some(e => e.type === 'error')
  const hasWarning = !hasError && validationErrors.some(e => e.type === 'warning')

  return (
    <div
      className={cn(
        'relative min-w-[148px] rounded-xl border backdrop-blur-sm transition-all duration-200 cursor-pointer select-none node-bg node-border',
        selected && 'ring-2 ring-violet-400/50',
        isInspectHighlighted && 'ring-2 ring-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.4)]',
        hasError && '!border-red-500/50',
        status === 'active' && 'node-active',
        status === 'error'  && 'node-error',
      )}
      style={{ '--pulse-color': `${accentColor}66` } as React.CSSProperties}
    >
      {/* Accent top bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl" style={{ background: accentColor }} />

      {/* Validation badge */}
      {(hasError || hasWarning) && (
        <div className={cn(
          'absolute -top-2 -right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center z-10',
          hasError ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'
        )}>
          {hasError ? '!' : '?'}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            {icon}
          </div>
          <span className="text-[11px] font-semibold text-1 truncate max-w-[90px]">{label}</span>
          <div className={cn('w-2 h-2 rounded-full ml-auto flex-shrink-0 transition-colors', statusColors[status], status === 'active' && 'animate-pulse')} />
        </div>

        {children}

        {simStatus !== 'idle' && simStatus !== 'inspecting' && metrics && (
          <div className="mt-2 pt-2 border-t border-ui grid grid-cols-2 gap-x-2 gap-y-0.5">
            <MetricItem label="RPS" value={metrics.throughput} />
            <MetricItem label="ERR" value={`${metrics.errorRate.toFixed(1)}%`} />
            <MetricItem label="P99" value={`${metrics.p99Latency}ms`} />
            <MetricItem label="Q"   value={metrics.queueDepth} />
          </div>
        )}
      </div>

      {(hasTarget || showBothHandles) && (
        <Handle type="target" position={Position.Left}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--node-border)] !bg-[var(--handle-bg)] transition-colors" />
      )}
      {(hasSource || showBothHandles) && (
        <Handle type="source" position={Position.Right}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--node-border)] !bg-[var(--handle-bg)] transition-colors" />
      )}
    </div>
  )
}

function MetricItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-1 items-baseline">
      <span className="text-[9px] text-3 font-mono uppercase">{label}</span>
      <span className="text-[10px] text-2 font-mono">{value}</span>
    </div>
  )
}
