import { nanoid } from 'nanoid'
import { useGraphStore } from '../stores/graphStore'

export interface Template {
  id: string
  name: string
  description: string
  badge: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'three-tier',
    name: '3-Tier Web App',
    description: 'Client → Gateway → Service → Database',
    badge: 'Beginner',
  },
  {
    id: 'load-balanced',
    name: 'Load Balanced + Cache',
    description: 'Two services, Redis look-aside cache, Postgres',
    badge: 'Intermediate',
  },
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Two independent services with separate databases',
    badge: 'Advanced',
  },
]

function getStore() {
  return useGraphStore.getState()
}

// ─── Template builders ─────────────────────────────────────────────────────────

function loadThreeTier() {
  const { resetGraph, addNode, onConnect, updateNodeConfig, updateNodeLabel } = getStore()
  resetGraph()

  const clientId = addNode('client', { x: 60, y: 200 })
  const gatewayId = addNode('gateway', { x: 300, y: 200 })
  const svcId = addNode('service', { x: 560, y: 200 })
  const dbId = addNode('database', { x: 820, y: 200 })

  updateNodeLabel(clientId, 'Web Client')
  updateNodeLabel(gatewayId, 'API Gateway')
  updateNodeLabel(svcId, 'App Server')
  updateNodeLabel(dbId, 'Postgres')

  onConnect({ source: clientId, target: gatewayId, sourceHandle: null, targetHandle: null })
  onConnect({ source: gatewayId, target: svcId, sourceHandle: null, targetHandle: null })
  onConnect({ source: svcId, target: dbId, sourceHandle: null, targetHandle: null })

  updateNodeConfig(gatewayId, {
    nodeType: 'gateway',
    rules: [{ id: nanoid(6), method: 'GET', pathPrefix: '/api', targetNodeId: svcId }],
  })

  updateNodeConfig(clientId, {
    nodeType: 'client',
    routes: [{ id: nanoid(6), method: 'GET', path: '/api/feed', rps: 8 }],
  })

  updateNodeConfig(svcId, { nodeType: 'service', latencyMs: 45, errorRate: 1 })

  updateNodeConfig(dbId, {
    nodeType: 'database',
    queryLatencyMs: 20,
    connectionPoolSize: 10,
    maxThroughput: 100,
  })
}

function loadLoadBalanced() {
  const { resetGraph, addNode, onConnect, updateNodeConfig, updateNodeLabel } = getStore()
  resetGraph()

  const clientId  = addNode('client',        { x: 60,  y: 260 })
  const gatewayId = addNode('gateway',        { x: 300, y: 260 })
  const lbId      = addNode('load-balancer',  { x: 540, y: 260 })
  const svcAId    = addNode('service',        { x: 780, y: 120 })
  const svcBId    = addNode('service',        { x: 780, y: 400 })
  const cacheId   = addNode('cache',          { x: 1020, y: 260 })
  const dbId      = addNode('database',       { x: 1260, y: 260 })

  updateNodeLabel(clientId,  'Web Client')
  updateNodeLabel(gatewayId, 'API Gateway')
  updateNodeLabel(lbId,      'Load Balancer')
  updateNodeLabel(svcAId,    'Service A')
  updateNodeLabel(svcBId,    'Service B')
  updateNodeLabel(cacheId,   'Redis Cache')
  updateNodeLabel(dbId,      'Postgres')

  // Topology: Client → GW → LB → Services → Redis → Postgres
  onConnect({ source: clientId,  target: gatewayId, sourceHandle: null, targetHandle: null })
  onConnect({ source: gatewayId, target: lbId,      sourceHandle: null, targetHandle: null })
  onConnect({ source: lbId,      target: svcAId,    sourceHandle: null, targetHandle: null })
  onConnect({ source: lbId,      target: svcBId,    sourceHandle: null, targetHandle: null })
  // Services forward to Redis (look-aside cache)
  onConnect({ source: svcAId,   target: cacheId, sourceHandle: null, targetHandle: null })
  onConnect({ source: svcBId,   target: cacheId, sourceHandle: null, targetHandle: null })
  // Cache → DB on miss
  onConnect({ source: cacheId,  target: dbId, sourceHandle: null, targetHandle: null })

  updateNodeConfig(gatewayId, {
    nodeType: 'gateway',
    rules: [{ id: nanoid(6), method: 'GET', pathPrefix: '/api', targetNodeId: lbId }],
  })

  updateNodeConfig(clientId, {
    nodeType: 'client',
    routes: [
      { id: nanoid(6), method: 'GET',  path: '/api/users',  rps: 8 },
      { id: nanoid(6), method: 'POST', path: '/api/orders', rps: 2 },
    ],
  })

  updateNodeConfig(svcAId, { nodeType: 'service', latencyMs: 40, errorRate: 2 })
  updateNodeConfig(svcBId, { nodeType: 'service', latencyMs: 55, errorRate: 0 })

  updateNodeConfig(cacheId, {
    nodeType: 'cache',
    hitRate: 75,
    hitLatencyMs: 4,
    missLatencyMs: 12,
  })

  updateNodeConfig(dbId, {
    nodeType: 'database',
    queryLatencyMs: 20,
    connectionPoolSize: 20,
    maxThroughput: 200,
  })
}

function loadMicroservices() {
  const { resetGraph, addNode, onConnect, updateNodeConfig, updateNodeLabel } = getStore()
  resetGraph()

  // Correct microservices pattern: gateway routes each request TYPE to its own service.
  // A load balancer only makes sense behind a single service for horizontal scaling.
  const clientId    = addNode('client',   { x: 60,  y: 220 })
  const gatewayId   = addNode('gateway',  { x: 280, y: 220 })
  const authSvcId   = addNode('service',  { x: 520, y: 90  })
  const prodSvcId   = addNode('service',  { x: 520, y: 360 })
  const authDbId    = addNode('database', { x: 760, y: 90  })
  const prodCacheId = addNode('cache',    { x: 760, y: 360 })
  const prodDbId    = addNode('database', { x: 1000, y: 360 })

  updateNodeLabel(clientId,    'Mobile App')
  updateNodeLabel(gatewayId,   'API Gateway')
  updateNodeLabel(authSvcId,   'Auth Service')
  updateNodeLabel(prodSvcId,   'Product Service')
  updateNodeLabel(authDbId,    'User DB')
  updateNodeLabel(prodCacheId, 'Product Cache')
  updateNodeLabel(prodDbId,    'Product DB')

  onConnect({ source: clientId,    target: gatewayId,   sourceHandle: null, targetHandle: null })
  onConnect({ source: gatewayId,   target: authSvcId,   sourceHandle: null, targetHandle: null })
  onConnect({ source: gatewayId,   target: prodSvcId,   sourceHandle: null, targetHandle: null })
  onConnect({ source: authSvcId,   target: authDbId,    sourceHandle: null, targetHandle: null })
  onConnect({ source: prodSvcId,   target: prodCacheId, sourceHandle: null, targetHandle: null })
  onConnect({ source: prodCacheId, target: prodDbId,    sourceHandle: null, targetHandle: null })

  // Gateway routes each path prefix to its dedicated service — no LB needed here.
  // A LB would go BEHIND a single service if you wanted to scale it horizontally.
  updateNodeConfig(gatewayId, {
    nodeType: 'gateway',
    rules: [
      { id: nanoid(6), method: 'GET',  pathPrefix: '/api/products', targetNodeId: prodSvcId },
      { id: nanoid(6), method: 'POST', pathPrefix: '/api/auth',     targetNodeId: authSvcId },
    ],
  })

  updateNodeConfig(clientId, {
    nodeType: 'client',
    routes: [
      { id: nanoid(6), method: 'GET',  path: '/api/products', rps: 9 },
      { id: nanoid(6), method: 'POST', path: '/api/auth',     rps: 3 },
    ],
  })

  updateNodeConfig(authSvcId,   { nodeType: 'service', latencyMs: 30, errorRate: 1 })
  updateNodeConfig(prodSvcId,   { nodeType: 'service', latencyMs: 60, errorRate: 0 })
  updateNodeConfig(prodCacheId, { nodeType: 'cache', hitRate: 80, hitLatencyMs: 3, missLatencyMs: 10 })
  updateNodeConfig(authDbId,    { nodeType: 'database', queryLatencyMs: 15, connectionPoolSize: 5, maxThroughput: 50 })
  updateNodeConfig(prodDbId,    { nodeType: 'database', queryLatencyMs: 25, connectionPoolSize: 15, maxThroughput: 150 })
}

export function loadTemplate(templateId: string) {
  switch (templateId) {
    case 'three-tier':      return loadThreeTier()
    case 'load-balanced':   return loadLoadBalanced()
    case 'microservices':   return loadMicroservices()
  }
}
