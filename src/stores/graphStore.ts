import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type XYPosition,
} from '@xyflow/react'
import { nanoid } from 'nanoid'
import type {
  AppNode,
  AppEdge,
  NodeType,
  NodeConfig,
  NodeStatus,
  ValidationError,
  GatewayConfig,
} from '../types'
import { validateGraph } from '../simulation/validator'
import { serializeGraph, deserializeGraph } from '../utils/urlShare'

// Stable empty array — used as default when a node has no errors
// (avoids new [] on every selector call, which would cause infinite re-renders)
export const EMPTY_ERRORS: ValidationError[] = Object.freeze([]) as ValidationError[]

function buildErrorMap(errors: ValidationError[]): Map<string, ValidationError[]> {
  const map = new Map<string, ValidationError[]>()
  for (const error of errors) {
    const key = error.nodeId ?? '__global__'
    const existing = map.get(key)
    if (existing) existing.push(error)
    else map.set(key, [error])
  }
  return map
}

function runValidation(nodes: AppNode[], edges: AppEdge[]) {
  const validationErrors = validateGraph(nodes, edges)
  const validationErrorsByNodeId = buildErrorMap(validationErrors)
  return { validationErrors, validationErrorsByNodeId }
}

function defaultConfig(nodeType: NodeType): NodeConfig {
  switch (nodeType) {
    case 'client':
      return { nodeType: 'client', rps: 5, method: 'GET', path: '/api' }
    case 'gateway':
      return { nodeType: 'gateway', rules: [] }
    case 'load-balancer':
      return { nodeType: 'load-balancer', algorithm: 'round-robin' }
    case 'service':
      return { nodeType: 'service', latencyMs: 50, errorRate: 0 }
    case 'cache':
      return { nodeType: 'cache', hitRate: 70, hitLatencyMs: 5, missLatencyMs: 15 }
    case 'database':
      return { nodeType: 'database', queryLatencyMs: 20, connectionPoolSize: 10, maxThroughput: 100 }
  }
}

function defaultLabel(nodeType: NodeType, existingCount: number): string {
  const labels: Record<NodeType, string> = {
    client: 'Client',
    gateway: 'API Gateway',
    'load-balancer': 'Load Balancer',
    service: 'Service',
    cache: 'Cache',
    database: 'Database',
  }
  return existingCount === 0 ? labels[nodeType] : `${labels[nodeType]} ${existingCount + 1}`
}

interface GraphState {
  nodes: AppNode[]
  edges: AppEdge[]
  selectedNodeId: string | null
  validationErrors: ValidationError[]
  validationErrorsByNodeId: Map<string, ValidationError[]>
}

export interface SavedGraph {
  name: string
  savedAt: number
  data: string  // serialized (same format as URL param)
}

const LS_KEY = 'sd-playground-saved'

function readSaved(): SavedGraph[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
function writeSaved(graphs: SavedGraph[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(graphs))
}

interface GraphActions {
  addNode: (nodeType: NodeType, position: XYPosition) => string
  removeNode: (id: string) => void
  updateNodeConfig: (id: string, config: NodeConfig) => void
  updateNodeStatus: (id: string, status: NodeStatus) => void
  updateNodeLabel: (id: string, label: string) => void
  setSelectedNode: (id: string | null) => void
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void
  onConnect: (connection: Connection) => void
  serializeToURL: () => string
  loadFromURL: (param: string) => void
  resetGraph: () => void
  saveToLocal: (name: string) => void
  loadFromLocal: (index: number) => void
  deleteSaved: (index: number) => void
  listSaved: () => SavedGraph[]
}

export type GraphStore = GraphState & GraphActions

export const useGraphStore = create<GraphStore>()(
  subscribeWithSelector((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    validationErrors: [],
    validationErrorsByNodeId: new Map(),

    addNode: (nodeType, position) => {
      const id = nanoid(8)
      const existingCount = get().nodes.filter(n => n.data.nodeType === nodeType).length
      const newNode: AppNode = {
        id,
        type: nodeType,
        position,
        data: {
          nodeType,
          label: defaultLabel(nodeType, existingCount),
          config: defaultConfig(nodeType),
          status: 'idle',
        },
      }
      set(state => {
        const nodes = [...state.nodes, newNode]
        return { nodes, ...runValidation(nodes, state.edges) }
      })
      return id
    },

    removeNode: (id) => {
      set(state => {
        const nodes = state.nodes.filter(n => n.id !== id)
        const edges = state.edges.filter(e => e.source !== id && e.target !== id)
        const cleanedNodes = nodes.map(n => {
          if (n.data.nodeType !== 'gateway') return n
          const cfg = n.data.config as GatewayConfig
          const rules = cfg.rules.filter(r => r.targetNodeId !== id)
          if (rules.length === cfg.rules.length) return n
          return { ...n, data: { ...n.data, config: { ...cfg, rules } as NodeConfig } }
        })
        return {
          nodes: cleanedNodes,
          edges,
          selectedNodeId: null,
          ...runValidation(cleanedNodes, edges),
        }
      })
    },

    updateNodeConfig: (id, config) => {
      set(state => {
        const nodes = state.nodes.map(n =>
          n.id === id ? { ...n, data: { ...n.data, config } } : n
        )
        return { nodes, ...runValidation(nodes, state.edges) }
      })
    },

    updateNodeStatus: (id, status) => {
      set(state => ({
        nodes: state.nodes.map(n =>
          n.id === id ? { ...n, data: { ...n.data, status } } : n
        ),
      }))
    },

    updateNodeLabel: (id, label) => {
      set(state => ({
        nodes: state.nodes.map(n =>
          n.id === id ? { ...n, data: { ...n.data, label } } : n
        ),
      }))
    },

    setSelectedNode: (id) => set({ selectedNodeId: id }),

    onNodesChange: (changes) => {
      set(state => {
        const nodes = applyNodeChanges(changes, state.nodes)
        return { nodes, ...runValidation(nodes, state.edges) }
      })
    },

    onEdgesChange: (changes) => {
      set(state => {
        const edges = applyEdgeChanges(changes, state.edges)
        const nodes = state.nodes.map(n => {
          if (n.data.nodeType !== 'gateway') return n
          const cfg = n.data.config as GatewayConfig
          const connectedTargets = new Set(edges.filter(e => e.source === n.id).map(e => e.target))
          const rules = cfg.rules.filter(r => connectedTargets.has(r.targetNodeId))
          if (rules.length === cfg.rules.length) return n
          return { ...n, data: { ...n.data, config: { ...cfg, rules } as NodeConfig } }
        })
        return { nodes, edges, ...runValidation(nodes, edges) }
      })
    },

    onConnect: (connection) => {
      set(state => {
        const duplicate = state.edges.some(
          e => e.source === connection.source && e.target === connection.target
        )
        if (duplicate) return state
        const edge: AppEdge = {
          id: nanoid(8),
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
          type: 'default',
          style: { stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1.5 },
        }
        const edges = [...state.edges, edge]
        return { edges, ...runValidation(state.nodes, edges) }
      })
    },

    serializeToURL: () => {
      const { nodes, edges } = get()
      return serializeGraph(nodes, edges)
    },

    loadFromURL: (param) => {
      try {
        const { nodes, edges } = deserializeGraph(param)
        set({ nodes, edges, selectedNodeId: null, ...runValidation(nodes, edges) })
      } catch {
        console.error('Failed to load graph from URL')
      }
    },

    resetGraph: () => {
      set({
        nodes: [],
        edges: [],
        validationErrors: [],
        validationErrorsByNodeId: new Map(),
        selectedNodeId: null,
      })
    },

    saveToLocal: (name) => {
      const { nodes, edges } = get()
      const data = serializeGraph(nodes, edges)
      const graphs = readSaved()
      const existing = graphs.findIndex(g => g.name === name)
      const entry: SavedGraph = { name, savedAt: Date.now(), data }
      if (existing >= 0) graphs[existing] = entry
      else graphs.push(entry)
      writeSaved(graphs)
    },

    loadFromLocal: (index) => {
      const graphs = readSaved()
      const entry = graphs[index]
      if (!entry) return
      try {
        const { nodes, edges } = deserializeGraph(entry.data)
        set({ nodes, edges, selectedNodeId: null, ...runValidation(nodes, edges) })
      } catch {
        console.error('Failed to load saved graph')
      }
    },

    deleteSaved: (index) => {
      const graphs = readSaved()
      graphs.splice(index, 1)
      writeSaved(graphs)
    },

    listSaved: () => readSaved(),
  }))
)
