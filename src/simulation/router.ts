import type {
  AppNode,
  AppEdge,
  Packet,
  RouteResult,
  GatewayConfig,
  LoadBalancerConfig,
  ServiceConfig,
  CacheConfig,
  DatabaseConfig,
  ClientConfig,
} from '../types'

// Seeded PRNG for deterministic inspect mode
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

let _rrCounters: Map<string, number> = new Map()
let _leastConns: Map<string, number> = new Map()
let _seedCounter = 0

export function resetRouterState(): void {
  _rrCounters = new Map()
  _leastConns = new Map()
  _seedCounter = 0
}

export function incrementLeastConn(nodeId: string): void {
  _leastConns.set(nodeId, (_leastConns.get(nodeId) ?? 0) + 1)
}

export function decrementLeastConn(nodeId: string): void {
  const v = _leastConns.get(nodeId) ?? 0
  _leastConns.set(nodeId, Math.max(0, v - 1))
}

export function routeRequest(
  packet: Packet,
  node: AppNode,
  edges: AppEdge[],
  _nodes: AppNode[],
  deterministic = false
): RouteResult {
  const outgoing = edges.filter(e => e.source === node.id)

  switch (node.data.nodeType) {
    case 'client': {
      const cfg = node.data.config as ClientConfig
      const edge = outgoing[0]
      if (!edge) {
        return { outcome: 'dropped', reason: 'Client has no outgoing connection', latencyMs: 0 }
      }
      return {
        outcome: 'forwarded',
        targetNodeId: edge.target,
        edgeId: edge.id,
        decision: `Client → ${cfg.method} ${cfg.path}`,
        latencyMs: 0,
      }
    }

    case 'gateway': {
      const cfg = node.data.config as GatewayConfig
      for (const rule of cfg.rules) {
        if (
          rule.method === packet.method &&
          packet.path.startsWith(rule.pathPrefix)
        ) {
          const edge = outgoing.find(e => e.target === rule.targetNodeId)
          if (!edge) {
            return {
              outcome: 'dropped',
              reason: `Rule matched (${rule.method} ${rule.pathPrefix}) but no edge to target "${rule.targetNodeId}"`,
              latencyMs: 0,
            }
          }
          return {
            outcome: 'forwarded',
            targetNodeId: edge.target,
            edgeId: edge.id,
            decision: `Gateway matched rule: ${rule.method} ${rule.pathPrefix} → ${rule.targetNodeId}`,
            latencyMs: 0,
          }
        }
      }
      return {
        outcome: 'dropped',
        reason: `No matching route for ${packet.method} ${packet.path}`,
        latencyMs: 0,
      }
    }

    case 'load-balancer': {
      const cfg = node.data.config as LoadBalancerConfig
      if (outgoing.length === 0) {
        return { outcome: 'dropped', reason: 'Load Balancer has no targets', latencyMs: 0 }
      }

      let selectedEdge = outgoing[0]
      if (cfg.algorithm === 'round-robin') {
        const idx = (_rrCounters.get(node.id) ?? 0) % outgoing.length
        selectedEdge = outgoing[idx]
        _rrCounters.set(node.id, idx + 1)
      } else {
        // least-connections
        let minConns = Infinity
        for (const edge of outgoing) {
          const conns = _leastConns.get(edge.target) ?? 0
          if (conns < minConns) {
            minConns = conns
            selectedEdge = edge
          }
        }
      }

      return {
        outcome: 'forwarded',
        targetNodeId: selectedEdge.target,
        edgeId: selectedEdge.id,
        decision: `LB (${cfg.algorithm}) → ${selectedEdge.target}`,
        latencyMs: 0,
      }
    }

    case 'service': {
      const cfg = node.data.config as ServiceConfig
      const rand = deterministic ? seededRandom(++_seedCounter) : Math.random()
      if (rand < cfg.errorRate / 100) {
        return {
          outcome: 'error',
          latencyMs: cfg.latencyMs,
          decision: `Service errored (${cfg.errorRate}% error rate)`,
        }
      }

      // If service has outgoing edges, forward to first dependency (cache or DB)
      if (outgoing.length > 0) {
        const edge = outgoing[0]
        return {
          outcome: 'forwarded',
          targetNodeId: edge.target,
          edgeId: edge.id,
          decision: `Service processed (${cfg.latencyMs}ms) → dependency`,
          latencyMs: cfg.latencyMs,
        }
      }

      return {
        outcome: 'processed',
        latencyMs: cfg.latencyMs,
        decision: `Service processed request (${cfg.latencyMs}ms)`,
      }
    }

    case 'cache': {
      const cfg = node.data.config as CacheConfig
      const rand = deterministic ? seededRandom(++_seedCounter) : Math.random()
      const isHit = rand < cfg.hitRate / 100

      if (isHit) {
        return {
          outcome: 'cache-hit',
          latencyMs: cfg.hitLatencyMs,
          decision: `Cache HIT (${cfg.hitRate}% hit rate, ${cfg.hitLatencyMs}ms)`,
        }
      }

      const dbEdge = outgoing[0]
      if (!dbEdge) {
        return {
          outcome: 'cache-hit',
          latencyMs: cfg.missLatencyMs,
          decision: `Cache MISS but no DB connected — treating as processed`,
        }
      }
      return {
        outcome: 'cache-miss',
        nextNodeId: dbEdge.target,
        edgeId: dbEdge.id,
        latencyMs: cfg.missLatencyMs,
        decision: `Cache MISS (${cfg.hitRate}% hit rate) → DB`,
      }
    }

    case 'database': {
      const cfg = node.data.config as DatabaseConfig
      return {
        outcome: 'processed',
        latencyMs: cfg.queryLatencyMs,
        decision: `DB query completed (${cfg.queryLatencyMs}ms)`,
      }
    }
  }
}
