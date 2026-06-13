import LZString from 'lz-string'
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
  return parsed as SerializedGraph
}
