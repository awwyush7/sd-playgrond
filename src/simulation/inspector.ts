import type { AppNode, AppEdge, TraceStep, ClientConfig } from '../types'
import { routeRequest, resetRouterState } from './router'
import { nanoid } from 'nanoid'

export function buildTrace(
  nodes: AppNode[],
  edges: AppEdge[],
  clientNodeId: string
): TraceStep[] {
  resetRouterState()

  const clientNode = nodes.find(n => n.id === clientNodeId)
  if (!clientNode || clientNode.data.nodeType !== 'client') {
    throw new Error('buildTrace: invalid client node')
  }

  const cfg = clientNode.data.config as ClientConfig
  const packet = {
    id: nanoid(6),
    sourceNodeId: clientNodeId,
    currentNodeId: clientNodeId,
    currentEdgeId: null as string | null,
    progress: 0,
    status: 'in-flight' as const,
    method: cfg.method,
    path: cfg.path,
    startTime: Date.now(),
    completedAt: null,
    hops: [],
  }

  const steps: TraceStep[] = []
  let currentNodeId = clientNodeId
  let cumulativeLatency = 0
  const visited = new Set<string>()
  let stepIndex = 0

  // Safety limit to prevent infinite loops
  const MAX_STEPS = 20

  while (stepIndex < MAX_STEPS) {
    if (visited.has(currentNodeId)) {
      steps.push({
        stepIndex,
        nodeId: currentNodeId,
        edgeId: null,
        decision: 'Cycle detected — stopping trace',
        latencyMs: 0,
        cumulativeLatencyMs: cumulativeLatency,
        outcome: 'dropped',
      })
      break
    }
    visited.add(currentNodeId)

    const node = nodes.find(n => n.id === currentNodeId)
    if (!node) break

    const result = routeRequest(packet, node, edges, nodes, true)
    cumulativeLatency += result.latencyMs

    switch (result.outcome) {
      case 'forwarded': {
        steps.push({
          stepIndex,
          nodeId: currentNodeId,
          edgeId: result.edgeId,
          decision: result.decision,
          latencyMs: result.latencyMs,
          cumulativeLatencyMs: cumulativeLatency,
          outcome: 'forwarded',
        })
        packet.currentEdgeId = result.edgeId
        currentNodeId = result.targetNodeId
        stepIndex++
        break
      }

      case 'cache-miss': {
        steps.push({
          stepIndex,
          nodeId: currentNodeId,
          edgeId: result.edgeId,
          decision: result.decision,
          latencyMs: result.latencyMs,
          cumulativeLatencyMs: cumulativeLatency,
          outcome: 'cache-miss',
        })
        packet.currentEdgeId = result.edgeId
        currentNodeId = result.nextNodeId
        stepIndex++
        break
      }

      case 'cache-hit': {
        steps.push({
          stepIndex,
          nodeId: currentNodeId,
          edgeId: null,
          decision: result.decision,
          latencyMs: result.latencyMs,
          cumulativeLatencyMs: cumulativeLatency,
          outcome: 'cache-hit',
        })
        return steps
      }

      case 'processed': {
        steps.push({
          stepIndex,
          nodeId: currentNodeId,
          edgeId: null,
          decision: result.decision,
          latencyMs: result.latencyMs,
          cumulativeLatencyMs: cumulativeLatency,
          outcome: 'processed',
        })
        return steps
      }

      case 'error': {
        steps.push({
          stepIndex,
          nodeId: currentNodeId,
          edgeId: null,
          decision: result.decision,
          latencyMs: result.latencyMs,
          cumulativeLatencyMs: cumulativeLatency,
          outcome: 'error',
        })
        return steps
      }

      case 'dropped': {
        steps.push({
          stepIndex,
          nodeId: currentNodeId,
          edgeId: null,
          decision: result.reason,
          latencyMs: 0,
          cumulativeLatencyMs: cumulativeLatency,
          outcome: 'dropped',
        })
        return steps
      }
    }
  }

  return steps
}
