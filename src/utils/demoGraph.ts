import { nanoid } from 'nanoid'
import { useGraphStore } from '../stores/graphStore'

export function loadDemoGraph() {
  const { resetGraph, addNode, onConnect, updateNodeConfig, updateNodeLabel } =
    useGraphStore.getState()

  resetGraph()

  // Add nodes at spread positions
  const clientId = addNode('client', { x: 60, y: 180 })
  const gatewayId = addNode('gateway', { x: 310, y: 180 })
  const lbId = addNode('load-balancer', { x: 560, y: 80 })
  const svcAId = addNode('service', { x: 800, y: 40 })
  const svcBId = addNode('service', { x: 800, y: 200 })
  const cacheId = addNode('cache', { x: 800, y: 360 })
  const dbId = addNode('database', { x: 1050, y: 180 })

  // Update labels
  updateNodeLabel(clientId, 'Web Client')
  updateNodeLabel(gatewayId, 'API Gateway')
  updateNodeLabel(lbId, 'Load Balancer')
  updateNodeLabel(svcAId, 'Service A')
  updateNodeLabel(svcBId, 'Service B')
  updateNodeLabel(cacheId, 'Redis Cache')
  updateNodeLabel(dbId, 'Postgres DB')

  // Wire edges: Client → Gateway
  onConnect({ source: clientId, target: gatewayId, sourceHandle: null, targetHandle: null })
  // Gateway → LB  (for /api/*)
  onConnect({ source: gatewayId, target: lbId, sourceHandle: null, targetHandle: null })
  // Gateway → Cache (for /cache/*)
  onConnect({ source: gatewayId, target: cacheId, sourceHandle: null, targetHandle: null })
  // LB → Service A, LB → Service B
  onConnect({ source: lbId, target: svcAId, sourceHandle: null, targetHandle: null })
  onConnect({ source: lbId, target: svcBId, sourceHandle: null, targetHandle: null })
  // Service A → DB, Service B → DB
  onConnect({ source: svcAId, target: dbId, sourceHandle: null, targetHandle: null })
  onConnect({ source: svcBId, target: dbId, sourceHandle: null, targetHandle: null })
  // Cache → DB (on miss)
  onConnect({ source: cacheId, target: dbId, sourceHandle: null, targetHandle: null })

  // Configure gateway routing rules
  updateNodeConfig(gatewayId, {
    nodeType: 'gateway',
    rules: [
      {
        id: nanoid(6),
        method: 'GET',
        pathPrefix: '/api',
        targetNodeId: lbId,
      },
      {
        id: nanoid(6),
        method: 'GET',
        pathPrefix: '/cache',
        targetNodeId: cacheId,
      },
    ],
  })

  // Configure client
  updateNodeConfig(clientId, {
    nodeType: 'client',
    routes: [{ id: nanoid(6), method: 'GET', path: '/api/users', rps: 10 }],
  })

  // Configure services
  updateNodeConfig(svcAId, {
    nodeType: 'service',
    latencyMs: 40,
    errorRate: 2,
  })
  updateNodeConfig(svcBId, {
    nodeType: 'service',
    latencyMs: 55,
    errorRate: 0,
  })

  // Configure cache
  updateNodeConfig(cacheId, {
    nodeType: 'cache',
    hitRate: 75,
    hitLatencyMs: 4,
    missLatencyMs: 12,
  })
}
