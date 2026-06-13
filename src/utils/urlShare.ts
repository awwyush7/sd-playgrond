import LZString from 'lz-string'
import { nanoid } from 'nanoid'
import type { AppNode, AppEdge } from '../types'

interface SerializedGraph {
  nodes: AppNode[]
  edges: AppEdge[]
}

export function serializeGraph(nodes: AppNode[], edges: AppEdge[]): string {
  const data: SerializedGraph = { nodes, edges }
  const json = JSON.stringify(data)
  return LZString.compressToEncodedURIComponent(json)
}

// Migrate older graph formats to current format (routes with per-route rps)
function migrateGraph(graph: SerializedGraph): SerializedGraph {
  const nodes = graph.nodes.map(node => {
    if (node.data.nodeType !== 'client') return node
    const cfg = node.data.config as unknown as Record<string, unknown>

    // Phase 1: { rps, method, path } — no routes array
    if (!('routes' in cfg)) {
      const method = (cfg['method'] as string) ?? 'GET'
      const path = (cfg['path'] as string) ?? '/api'
      const rps = (cfg['rps'] as number) ?? 5
      const migratedCfg = { nodeType: 'client' as const, routes: [{ id: nanoid(6), method, path, rps }] }
      return { ...node, data: { ...node.data, config: migratedCfg } } as typeof node
    }

    const routes = cfg['routes'] as Array<Record<string, unknown>>

    // Phase 2a: { rps, routes[{ weight }] } — weight-based, rps at top level
    if (routes.length > 0 && 'weight' in routes[0]) {
      const topRps = (cfg['rps'] as number) ?? 10
      const totalWeight = routes.reduce((s, r) => s + ((r['weight'] as number) ?? 1), 0)
      const migratedRoutes = routes.map(r => ({
        id: (r['id'] as string) ?? nanoid(6),
        method: (r['method'] as string) ?? 'GET',
        path: (r['path'] as string) ?? '/api',
        rps: Math.max(1, Math.round(topRps * ((r['weight'] as number) ?? 1) / totalWeight)),
      }))
      const migratedCfg = { nodeType: 'client' as const, routes: migratedRoutes }
      return { ...node, data: { ...node.data, config: migratedCfg } } as typeof node
    }

    return node  // already current format
  })
  return { nodes, edges: graph.edges }
}

export function deserializeGraph(param: string): SerializedGraph {
  const json = LZString.decompressFromEncodedURIComponent(param)
  if (!json) throw new Error('Invalid share URL: decompression failed')
  const parsed = JSON.parse(json) as unknown
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as SerializedGraph).nodes) ||
    !Array.isArray((parsed as SerializedGraph).edges)
  ) {
    throw new Error('Invalid share URL: malformed graph data')
  }
  return migrateGraph(parsed as SerializedGraph)
}
