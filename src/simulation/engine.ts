import { nanoid } from 'nanoid'
import type {
  AppNode,
  AppEdge,
  Packet,
  NodeMetrics,
  ClientConfig,
  ServiceConfig,
} from '../types'
import { routeRequest, resetRouterState } from './router'

interface GraphSnapshot {
  nodes: AppNode[]
  edges: AppEdge[]
}

const TICK_MS = 100
const PRUNE_AGE_MS = 2000
const METRICS_WINDOW_MS = 1000

const _inFlight = new Map<string, number>()

function addInFlight(nodeId: string) {
  _inFlight.set(nodeId, (_inFlight.get(nodeId) ?? 0) + 1)
}
function removeInFlight(nodeId: string) {
  _inFlight.set(nodeId, Math.max(0, (_inFlight.get(nodeId) ?? 0) - 1))
}

// speedMultiplier > 1 → slower animation (easier to follow); < 1 → faster
function getTransitMs(node: AppNode, speedMultiplier = 1.0): number {
  const base = (() => {
    switch (node.data.nodeType) {
      case 'service':
        return Math.max(300, (node.data.config as ServiceConfig).latencyMs * 3)
      case 'database': return 500
      case 'cache': return 250
      case 'gateway':
      case 'load-balancer': return 200
      default: return 300
    }
  })()
  return Math.round(base * speedMultiplier)
}

export function createSimulationTick(
  getGraph: () => GraphSnapshot,
  onPacketsUpdate: (packets: Map<string, Packet>) => void,
  onMetricsUpdate: (metrics: Map<string, NodeMetrics>) => void,
  onCountersUpdate: (completed: number, dropped: number) => void,
  getSimSpeed: () => number = () => 1.0,
): () => void {
  resetRouterState()
  _inFlight.clear()

  let packets: Map<string, Packet> = new Map()
  const metrics: Map<string, NodeMetrics> = new Map()
  // Stored as flat triplets: [timestamp, latencyMs, isError(0|1), ...]
  const recentEvents: Map<string, number[]> = new Map()
  let totalCompleted = 0
  let totalDropped = 0

  function getOrInitMetrics(nodeId: string): NodeMetrics {
    if (!metrics.has(nodeId)) {
      metrics.set(nodeId, { throughput: 0, errorRate: 0, p99Latency: 0, queueDepth: 0, totalRequests: 0 })
    }
    return metrics.get(nodeId)!
  }

  // Record any event at a node — used for EVERY node that touches a packet
  function recordEvent(nodeId: string, latencyMs: number, isError: boolean) {
    const now = Date.now()
    if (!recentEvents.has(nodeId)) recentEvents.set(nodeId, [])
    recentEvents.get(nodeId)!.push(now, latencyMs, isError ? 1 : 0)
  }

  function computeMetrics(nodeId: string, inFlightCount: number): NodeMetrics {
    const m = getOrInitMetrics(nodeId)
    const now = Date.now()
    const raw = recentEvents.get(nodeId) ?? []
    const recent: Array<[number, number, number]> = []
    for (let i = 0; i < raw.length; i += 3) {
      if (raw[i] > now - METRICS_WINDOW_MS) {
        recent.push([raw[i], raw[i + 1], raw[i + 2]])
      }
    }
    recentEvents.set(nodeId, recent.flat())

    const latencies = recent.filter(r => r[1] > 0).map(r => r[1]).sort((a, b) => a - b)
    const errors = recent.filter(r => r[2] === 1).length
    const p99 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] ?? latencies[latencies.length - 1] : 0

    return {
      throughput: recent.length,
      errorRate: recent.length > 0 ? (errors / recent.length) * 100 : 0,
      p99Latency: p99,
      queueDepth: inFlightCount,
      totalRequests: m.totalRequests + recent.length - (m.throughput ?? 0),
    }
  }

  return function tick() {
    const { nodes, edges } = getGraph()
    if (nodes.length === 0) return

    const now = Date.now()
    const speed = getSimSpeed()
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const nextPackets: Map<string, Packet> = new Map(packets)

    // 1. GENERATE packets from clients
    for (const node of nodes) {
      if (node.data.nodeType !== 'client') continue
      const cfg = node.data.config as ClientConfig
      const count = Math.max(1, Math.round(cfg.rps / 10))

      for (let i = 0; i < count; i++) {
        const packet: Packet = {
          id: nanoid(8),
          sourceNodeId: node.id,
          currentNodeId: node.id,
          currentEdgeId: null,
          progress: 0,
          transitMs: 0,
          transitStartTime: now,
          status: 'pending',
          method: cfg.method,
          path: cfg.path,
          startTime: now,
          completedAt: null,
          hops: [],
        }

        const result = routeRequest(packet, node, edges, nodes)
        if (result.outcome === 'forwarded') {
          const targetNode = nodeMap.get(result.targetNodeId)
          const tMs = targetNode ? getTransitMs(targetNode, speed) : 300
          packet.currentEdgeId = result.edgeId
          packet.currentNodeId = result.targetNodeId
          packet.status = 'in-flight'
          packet.progress = 0
          packet.transitMs = tMs
          packet.transitStartTime = now
          addInFlight(result.targetNodeId)
          // Record client emit as a throughput event
          recordEvent(node.id, 0, false)
        } else {
          packet.status = 'dropped'
          packet.completedAt = now
          totalDropped++
          recordEvent(node.id, 0, true)
        }
        nextPackets.set(packet.id, packet)
      }
    }

    // 2. ADVANCE in-flight packets
    for (const [id, packet] of nextPackets) {
      if (packet.status !== 'in-flight') continue

      const destNode = nodeMap.get(packet.currentNodeId)
      if (!destNode) {
        nextPackets.set(id, { ...packet, status: 'dropped', completedAt: now })
        totalDropped++
        continue
      }

      const transitMs = packet.transitMs || getTransitMs(destNode, speed)
      const newProgress = packet.progress + TICK_MS / transitMs

      if (newProgress >= 1.0) {
        removeInFlight(packet.currentNodeId)
        const result = routeRequest(packet, destNode, edges, nodes)

        // ── Record throughput for EVERY node that handles a packet ──
        // Uses the actual processing latency from the router result (not transit animation time)
        const isErr = result.outcome === 'error'
        const isDropped = result.outcome === 'dropped'
        if (!isDropped) {
          recordEvent(destNode.id, result.latencyMs, isErr)
        }

        const hopRecord = {
          nodeId: destNode.id,
          edgeId: packet.currentEdgeId,
          decision: 'decision' in result ? result.decision : ('reason' in result ? result.reason : ''),
          latencyMs: result.latencyMs,
          timestamp: now,
        }

        const base = {
          ...packet,
          progress: 0,
          hops: [...packet.hops, hopRecord],
        }

        switch (result.outcome) {
          case 'forwarded': {
            const tNode = nodeMap.get(result.targetNodeId)
            const tMs = tNode ? getTransitMs(tNode, speed) : 300
            addInFlight(result.targetNodeId)
            nextPackets.set(id, {
              ...base,
              currentEdgeId: result.edgeId,
              currentNodeId: result.targetNodeId,
              status: 'in-flight',
              transitMs: tMs,
              transitStartTime: now,
            })
            break
          }

          case 'cache-miss': {
            const tNode = nodeMap.get(result.nextNodeId)
            const tMs = tNode ? getTransitMs(tNode, speed) : 300
            addInFlight(result.nextNodeId)
            nextPackets.set(id, {
              ...base,
              currentEdgeId: result.edgeId,
              currentNodeId: result.nextNodeId,
              status: 'in-flight',
              transitMs: tMs,
              transitStartTime: now,
            })
            break
          }

          case 'processed':
          case 'cache-hit':
            nextPackets.set(id, { ...base, status: 'completed', completedAt: now, currentEdgeId: null })
            totalCompleted++
            break

          case 'error':
            nextPackets.set(id, { ...base, status: 'failed', completedAt: now, currentEdgeId: null })
            totalCompleted++ // errors count as served (just failed)
            break

          case 'dropped':
            nextPackets.set(id, { ...base, status: 'dropped', completedAt: now, currentEdgeId: null })
            totalDropped++
            break
        }
      } else {
        nextPackets.set(id, { ...packet, progress: newProgress })
      }
    }

    // 3. PRUNE old terminal packets
    for (const [id, packet] of nextPackets) {
      if (packet.completedAt !== null && now - packet.completedAt > PRUNE_AGE_MS && packet.status !== 'in-flight') {
        nextPackets.delete(id)
      }
    }

    packets = nextPackets

    // 4. METRICS (per node)
    const updatedMetrics: Map<string, NodeMetrics> = new Map()
    for (const node of nodes) {
      const inFlightCount = Array.from(nextPackets.values()).filter(
        p => p.currentNodeId === node.id && p.status === 'in-flight'
      ).length
      updatedMetrics.set(node.id, computeMetrics(node.id, inFlightCount))
    }

    // 5. COMMIT
    onPacketsUpdate(new Map(nextPackets))
    onMetricsUpdate(updatedMetrics)
    onCountersUpdate(totalCompleted, totalDropped)
  }
}
