import { useEffect, useState } from 'react'
import { useGraphStore } from '../../stores/graphStore'
import { useSimulationStore } from '../../stores/simulationStore'
import type { NodeMetrics } from '../../types'

interface Observation {
  text: string
  kind: 'info' | 'warn' | 'good'
}

function buildObservations(
  nodeMetrics: [string, NodeMetrics][],
  droppedCount: number,
  completedCount: number,
): Observation[] {
  const obs: Observation[] = []

  for (const [, m] of nodeMetrics) {
    if (m.queueDepth > 8) {
      obs.push({ kind: 'warn', text: `Queue depth is ${m.queueDepth} — requests are piling up faster than they\'re processed. This is the classic bottleneck signature.` })
    }
    if (m.errorRate > 20) {
      obs.push({ kind: 'warn', text: `Error rate at ${m.errorRate.toFixed(0)}% — more than 1 in 5 requests are failing. In production this would trigger your SLO alert.` })
    }
  }

  const total = completedCount + droppedCount
  if (total > 20 && droppedCount / total > 0.3) {
    obs.push({ kind: 'warn', text: `${Math.round(droppedCount / total * 100)}% of requests are dropped — check your gateway routing rules or load balancer connections.` })
  }

  let maxP99 = 0
  let bottleneckLabel = ''
  for (const [nodeId, m] of nodeMetrics) {
    if (m.p99Latency > maxP99) {
      maxP99 = m.p99Latency
      bottleneckLabel = nodeId
    }
  }
  if (maxP99 > 200 && bottleneckLabel) {
    obs.push({ kind: 'warn', text: `P99 latency is ${maxP99}ms — 1 in 100 users waits over ${maxP99}ms. The orange dot in the MetricsBar marks your bottleneck.` })
  }

  const allQueuesLow = nodeMetrics.every(([, m]) => m.queueDepth < 3)
  const allErrorsLow = nodeMetrics.every(([, m]) => m.errorRate < 2)
  if (allQueuesLow && allErrorsLow && completedCount > 50) {
    obs.push({ kind: 'good', text: `System is healthy — queues are clear and error rate is near zero. Try increasing client RPS to find the breaking point.` })
  }

  return obs
}

const KIND_STYLES = {
  info: 'border-ui bg-lift text-2',
  warn: 'border-orange-500/25 bg-orange-500/[0.06] text-orange-300/80',
  good: 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300/70',
}

const KIND_DOT = {
  info: 'bg-[var(--text-3)]',
  warn: 'bg-orange-400',
  good: 'bg-emerald-400',
}

export function SimObserver() {
  const status = useSimulationStore(s => s.status)
  const metrics = useSimulationStore(s => s.metrics)
  const droppedCount = useSimulationStore(s => s.droppedCount)
  const completedCount = useSimulationStore(s => s.completedCount)
  const nodes = useGraphStore(s => s.nodes)

  const [obs, setObs] = useState<Observation | null>(null)
  const [_cycleIndex, setCycleIndex] = useState(0)

  useEffect(() => {
    if (status !== 'running') { setObs(null); return }

    function refresh() {
      const labeled: [string, NodeMetrics][] = []
      for (const node of nodes) {
        const m = metrics.get(node.id)
        if (m) labeled.push([node.data.label, m])
      }
      const all = buildObservations(labeled, droppedCount, completedCount)
      if (all.length === 0) { setObs(null); return }
      setCycleIndex(i => {
        const next = i % all.length
        setObs(all[next])
        return next + 1
      })
    }

    refresh()
    const id = setInterval(refresh, 4000)
    return () => clearInterval(id)
  }, [status, metrics, droppedCount, completedCount, nodes])

  if (!obs) return null

  return (
    <div
      className={`absolute bottom-4 left-4 max-w-[280px] rounded-xl border px-3 py-2.5 flex items-start gap-2 shadow-xl transition-all duration-500 z-10 ${KIND_STYLES[obs.kind]}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${KIND_DOT[obs.kind]} ${obs.kind === 'warn' ? 'animate-pulse' : ''}`} />
      <p className="text-[10px] leading-relaxed font-mono">{obs.text}</p>
    </div>
  )
}
