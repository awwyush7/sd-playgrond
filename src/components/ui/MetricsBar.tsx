import { useGraphStore } from '../../stores/graphStore'
import { useSimulationStore } from '../../stores/simulationStore'
import type { NodeType } from '../../types'

const NODE_COLOR: Record<NodeType, string> = {
  client:          '#3B82F6',
  gateway:         '#8B5CF6',
  'load-balancer': '#F97316',
  service:         '#22C55E',
  cache:           '#EF4444',
  database:        '#F59E0B',
}

export function MetricsBar() {
  const nodes          = useGraphStore(s => s.nodes)
  const metrics        = useSimulationStore(s => s.metrics)
  const status         = useSimulationStore(s => s.status)
  const completedCount = useSimulationStore(s => s.completedCount)
  const droppedCount   = useSimulationStore(s => s.droppedCount)

  if (status === 'idle') return null

  // Detect bottleneck: node with highest P99 latency
  let bottleneckId: string | null = null
  let maxP99 = 0
  for (const node of nodes) {
    const p99 = metrics.get(node.id)?.p99Latency ?? 0
    if (p99 > maxP99) { maxP99 = p99; bottleneckId = node.id }
  }

  return (
    <div className="flex items-stretch border-t border-white/[0.06] overflow-x-auto flex-shrink-0 h-[68px] bg-[#080810]">
      {nodes.map(node => {
        const m     = metrics.get(node.id)
        const color = NODE_COLOR[node.data.nodeType]
        const isBottleneck = node.id === bottleneckId && maxP99 > 0
        const rps   = m?.throughput ?? 0
        const err   = m?.errorRate ?? 0
        const p99   = m?.p99Latency ?? 0
        const q     = m?.queueDepth ?? 0

        return (
          <div
            key={node.id}
            className="flex flex-col justify-center px-3 min-w-[110px] border-r border-white/[0.04] hover:bg-white/[0.02] transition-colors relative flex-shrink-0"
            title={isBottleneck ? `⚠ Bottleneck: highest P99 in the graph` : undefined}
          >
            {/* Top accent bar — orange for bottleneck */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] transition-colors"
              style={{ background: isBottleneck ? '#F97316' : color }}
            />
            {isBottleneck && (
              <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" title="Bottleneck" />
            )}
            <p className="text-[9px] font-semibold text-white/50 truncate mb-1">{node.data.label}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              <Stat label="RPS" value={rps} />
              <Stat label="ERR" value={`${err.toFixed(0)}%`} isError={err > 0} />
              <Stat label="P99" value={`${p99}ms`} isWarn={isBottleneck} />
              <Stat label="Q"   value={q} isWarn={q > 5} />
            </div>
          </div>
        )
      })}

      {/* Global counters — sticky right */}
      <div className="ml-auto flex items-center gap-5 px-5 border-l border-white/[0.06] flex-shrink-0">
        <GlobalCounter label="Completed" value={completedCount} color="#22C55E" symbol="✓" />
        <div className="w-px h-7 bg-white/[0.06]" />
        <GlobalCounter label="Dropped"   value={droppedCount}   color="#F97316" symbol="✕" />
      </div>
    </div>
  )
}

function Stat({
  label, value, isError, isWarn,
}: { label: string; value: string | number; isError?: boolean; isWarn?: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[8px] text-white/25 font-mono uppercase">{label}</span>
      <span className={`text-[9px] font-mono font-medium ${isError ? 'text-red-400' : isWarn ? 'text-orange-400' : 'text-white/55'}`}>
        {value}
      </span>
    </div>
  )
}

function GlobalCounter({ label, value, color, symbol }: {
  label: string; value: number; color: string; symbol: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[56px]">
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-bold" style={{ color }}>{symbol}</span>
        <span className="text-[20px] font-bold font-mono tabular-nums leading-none" style={{ color }}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        </span>
      </div>
      <span className="text-[8px] text-white/30 font-mono uppercase tracking-wide">{label}</span>
    </div>
  )
}
