import { nanoid } from 'nanoid'
import type { AppNode, AppEdge, ValidationError, GatewayConfig } from '../types'

export function validateGraph(nodes: AppNode[], edges: AppEdge[]): ValidationError[] {
  const errors: ValidationError[] = []
  const nodeIds = new Set(nodes.map(n => n.id))

  // Remove stale edges (source or target node no longer exists)
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push({
        id: nanoid(6),
        type: 'error',
        edgeId: edge.id,
        message: 'Edge references a node that no longer exists',
      })
    }
  }

  for (const node of nodes) {
    const outgoing = edges.filter(e => e.source === node.id)
    const incoming = edges.filter(e => e.target === node.id)

    switch (node.data.nodeType) {
      case 'gateway': {
        const cfg = node.data.config as GatewayConfig
        if (cfg.rules.length === 0) {
          errors.push({
            id: nanoid(6),
            type: 'error',
            nodeId: node.id,
            message: 'Gateway has no routing rules — all requests will be dropped',
          })
        }
        // Each rule must point to a connected target
        for (const rule of cfg.rules) {
          const edgeExists = outgoing.some(e => e.target === rule.targetNodeId)
          if (!edgeExists) {
            errors.push({
              id: nanoid(6),
              type: 'error',
              nodeId: node.id,
              message: `Rule "${rule.method} ${rule.pathPrefix}" targets a node with no edge — remove or reconnect`,
            })
          }
        }
        break
      }

      case 'load-balancer': {
        if (outgoing.length === 0) {
          errors.push({
            id: nanoid(6),
            type: 'error',
            nodeId: node.id,
            message: 'Load Balancer has no target services connected',
          })
        } else if (outgoing.length < 2) {
          errors.push({
            id: nanoid(6),
            type: 'warning',
            nodeId: node.id,
            message: 'Load Balancer has only 1 target — no balancing will occur',
          })
        }
        break
      }

      case 'service': {
        if (outgoing.length === 0) {
          // Services with no outgoing edges just terminate — this is valid (no DB/cache deps)
          // but worth noting as a warning
        }
        break
      }

      case 'client':
        // Clients with no outgoing edges cannot send anywhere
        if (outgoing.length === 0) {
          errors.push({
            id: nanoid(6),
            type: 'warning',
            nodeId: node.id,
            message: 'Client has no outgoing connection — requests will not be sent anywhere',
          })
        }
        break

      default:
        break
    }

    // Non-client nodes with no incoming edges are unreachable
    if (node.data.nodeType !== 'client' && incoming.length === 0) {
      errors.push({
        id: nanoid(6),
        type: 'warning',
        nodeId: node.id,
        message: 'This node has no incoming connections — it is unreachable',
      })
    }
  }

  // Cycle detection: DFS from each client
  const clientNodes = nodes.filter(n => n.data.nodeType === 'client')
  for (const client of clientNodes) {
    const visited = new Set<string>()
    const stack = new Set<string>()
    const hasCycle = dfs(client.id, edges, visited, stack)
    if (hasCycle) {
      errors.push({
        id: nanoid(6),
        type: 'error',
        nodeId: client.id,
        message: 'Cycle detected in graph — requests would loop indefinitely',
      })
      break
    }
  }

  errors.push(...checkArchitecturalPatterns(nodes, edges))

  return errors
}

// Non-blocking architectural hints — never prevent simulation, purely educational
function checkArchitecturalPatterns(nodes: AppNode[], edges: AppEdge[]): ValidationError[] {
  const hints: ValidationError[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  for (const edge of edges) {
    const src = nodeMap.get(edge.source)
    const tgt = nodeMap.get(edge.target)
    if (!src || !tgt) continue

    const s = src.data.nodeType
    const t = tgt.data.nodeType

    if (s === 'gateway' && t === 'database') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Gateway → Database direct: no service layer means raw DB calls per request. Add a Service for business logic + connection pooling.' })
    }
    if (s === 'gateway' && t === 'cache') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Gateway → Cache direct: caches are read-aside layers, not request processors. Route through a Service first.' })
    }
    if ((s === 'load-balancer') && t === 'cache') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Load Balancer → Cache: LBs should distribute to Services. Caches are typically behind services, not directly load-balanced.' })
    }
    if ((s === 'load-balancer') && t === 'database') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Load Balancer → Database direct: bypasses service + cache layers. All requests hit DB at full load.' })
    }
    if (s === 'database') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Database has an outgoing edge — DBs are terminal nodes. This edge will never carry traffic.' })
    }
    if (s === 'client' && t === 'service') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Client → Service directly: no API Gateway means no routing, auth, or rate limiting. Fine for simple prototypes.' })
    }
    if (s === 'client' && t === 'database') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Client → Database directly: never expose your DB to clients. In production this is a critical security risk.' })
    }
    if (s === 'client' && t === 'cache') {
      hints.push({ id: nanoid(6), type: 'warning', hint: true, nodeId: src.id,
        message: 'Client → Cache directly: caches should sit between services and databases, not between clients and services.' })
    }
  }

  return hints
}

function dfs(
  nodeId: string,
  edges: AppEdge[],
  visited: Set<string>,
  stack: Set<string>
): boolean {
  visited.add(nodeId)
  stack.add(nodeId)

  const outgoing = edges.filter(e => e.source === nodeId)
  for (const edge of outgoing) {
    if (!visited.has(edge.target)) {
      if (dfs(edge.target, edges, visited, stack)) return true
    } else if (stack.has(edge.target)) {
      return true
    }
  }

  stack.delete(nodeId)
  return false
}
