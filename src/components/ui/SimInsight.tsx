import { startTransition, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGraphStore } from '../../stores/graphStore'
import { useSimulationStore } from '../../stores/simulationStore'
import type { FinalSnapshot } from '../../stores/simulationStore'
import type { AppNode } from '../../types'

const INSIGHT_DURATION_MS = 8000

function generateInsight(nodes: AppNode[], snapshot: FinalSnapshot): string | null {
  const { completedCount, droppedCount, metrics } = snapshot

  let maxQueue = 0
  let bottleneckLabel = ''
  for (const node of nodes) {
    const m = metrics.get(node.id)
    if (m && m.queueDepth > maxQueue) {
      maxQueue = m.queueDepth
      bottleneckLabel = node.data.label
    }
  }

  if (maxQueue > 3 && bottleneckLabel) {
    return `${bottleneckLabel} was your bottleneck — queue hit ${maxQueue} at peak. In production this is where you'd add replicas.`
  }

  const total = completedCount + droppedCount
  if (total > 10 && droppedCount / total > 0.15) {
    const pct = Math.round((droppedCount / total) * 100)
    return `${pct}% of requests were dropped. Check routing rules or add a load balancer to spread the load.`
  }

  const cacheNode = nodes.find(n => n.data.nodeType === 'cache')
  if (cacheNode && completedCount > 30) {
    return `Cache absorbed traffic before it reached the DB. Remove it and re-run to see the difference.`
  }

  if (completedCount > 0) {
    return `${completedCount} requests completed, nothing dropped. Try raising client RPS to find the saturation point.`
  }

  return null
}

export function SimInsight() {
  const finalSnapshot = useSimulationStore(s => s.finalSnapshot)
  const nodes = useGraphStore(s => s.nodes)
  const [visible, setVisible] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a ref to nodes so the snapshot effect stays stable without re-running on node changes
  const nodesRef = useRef(nodes)
  useEffect(() => { nodesRef.current = nodes })

  useEffect(() => {
    if (!finalSnapshot || finalSnapshot.completedCount === 0) return

    const text = generateInsight(nodesRef.current, finalSnapshot)
    if (!text) return

    if (timerRef.current) clearTimeout(timerRef.current)

    startTransition(() => {
      setInsight(text)
      setVisible(true)
    })

    timerRef.current = setTimeout(() => {
      startTransition(() => setVisible(false))
    }, INSIGHT_DURATION_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [finalSnapshot])

  return (
    <AnimatePresence>
      {visible && insight && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[300px] max-w-[calc(100vw-2rem)]"
        >
          <div
            className="bg-surface border border-ui rounded-xl px-3.5 py-3 shadow-xl cursor-pointer"
            style={{ borderLeft: '2px solid #7C6AF7' }}
            onClick={() => startTransition(() => setVisible(false))}
          >
            <p className="text-[9px] text-3 font-mono uppercase tracking-wider mb-1.5">After this run</p>
            <p className="text-[12px] font-medium leading-snug" style={{ color: 'var(--text-1)' }}>{insight}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
