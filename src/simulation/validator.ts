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

  return errors
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
