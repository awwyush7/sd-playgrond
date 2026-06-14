import { useGraphStore } from '../../stores/graphStore'
import { useSimulationStore } from '../../stores/simulationStore'
import type { TraceOutcome } from '../../types'
import { cn } from '../../utils/cn'

const outcomeConfig: Record<TraceOutcome, { label: string; color: string }> = {
  forwarded: { label: 'FORWARDED', color: 'text-violet-400' },
  processed: { label: 'PROCESSED', color: 'text-emerald-400' },
  'cache-hit': { label: 'CACHE HIT', color: 'text-emerald-400' },
  'cache-miss': { label: 'CACHE MISS', color: 'text-yellow-400' },
  queued: { label: 'QUEUED', color: 'text-orange-400' },
  dropped: { label: 'DROPPED', color: 'text-red-400' },
  error: { label: 'ERROR', color: 'text-red-400' },
}

export function InspectPanel() {
  const trace = useSimulationStore(s => s.inspectTrace)
  const stepIndex = useSimulationStore(s => s.inspectStepIndex)
  const nextStep = useSimulationStore(s => s.nextStep)
  const prevStep = useSimulationStore(s => s.prevStep)
  const exitInspect = useSimulationStore(s => s.exitInspect)
  const nodes = useGraphStore(s => s.nodes)

  if (!trace) return null

  const step = trace[stepIndex]
  if (!step) return null

  const node = nodes.find(n => n.id === step.nodeId)
  const outcome = outcomeConfig[step.outcome]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === trace.length - 1
  const isFinal = ['processed', 'cache-hit', 'dropped', 'error'].includes(step.outcome)

  return (
    <div className="border-t border-ui bg-base flex-shrink-0">
      {/* Progress bar */}
      <div className="h-0.5 bg-elevated">
        <div
          className="h-full bg-violet-500 transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / trace.length) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-4 px-4 py-3">
        {/* Step counter */}
        <div className="flex-shrink-0">
          <p className="text-[10px] text-3 font-mono uppercase">Step</p>
          <p className="text-sm font-bold text-1 font-mono">
            {stepIndex + 1} <span className="text-3">/ {trace.length}</span>
          </p>
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Current node */}
        <div className="flex-shrink-0">
          <p className="text-[10px] text-3 font-mono uppercase">Node</p>
          <p className="text-xs font-semibold text-1 max-w-[120px] truncate">
            {node?.data.label ?? step.nodeId}
          </p>
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Decision */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-3 font-mono uppercase">Decision</p>
          <p className="text-[11px] text-2 font-mono truncate">{step.decision}</p>
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Latency */}
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] text-3 font-mono uppercase">Latency</p>
          <p className="text-xs font-mono text-2">
            +{step.latencyMs}ms
            <span className="text-3 ml-1">({step.cumulativeLatencyMs}ms total)</span>
          </p>
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Outcome badge */}
        <div className="flex-shrink-0">
          <span className={cn('text-[10px] font-bold font-mono tracking-wide', outcome.color)}>
            {outcome.label}
          </span>
        </div>

        <div className="w-px h-8 bg-[var(--border)]" />

        {/* Navigation */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <NavButton onClick={prevStep} disabled={isFirst}>←</NavButton>
          <NavButton onClick={nextStep} disabled={isLast || isFinal}>→</NavButton>
          <button
            onClick={exitInspect}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-3 hover:text-2 hover:bg-lift transition-colors ml-1"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1 px-4 pb-2">
        {trace.map((_s, i) => (
          <button
            key={i}
            onClick={() => {
              const diff = i - stepIndex
              if (diff > 0) for (let j = 0; j < diff; j++) nextStep()
              else for (let j = 0; j < -diff; j++) prevStep()
            }}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all',
              i === stepIndex ? 'bg-violet-400 scale-125' : 'bg-[var(--border)] hover:bg-[var(--text-3)]'
            )}
          />
        ))}
      </div>
    </div>
  )
}

function NavButton({ onClick, disabled, children }: {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono border border-ui text-2 hover:text-1 hover:border-[var(--text-3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  )
}
