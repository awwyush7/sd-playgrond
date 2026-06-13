import type { Node, Edge } from '@xyflow/react'

// ─── Enums / Literals ───────────────────────────────────────────────────────

export type NodeType =
  | 'client'
  | 'gateway'
  | 'load-balancer'
  | 'service'
  | 'cache'
  | 'database'

export type NodeStatus = 'idle' | 'active' | 'error' | 'saturated'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type SimulationStatus = 'idle' | 'running' | 'inspecting' | 'paused'

export type PacketStatus = 'pending' | 'in-flight' | 'completed' | 'failed' | 'dropped'

export type TraceOutcome =
  | 'forwarded'
  | 'processed'
  | 'cache-hit'
  | 'cache-miss'
  | 'queued'
  | 'dropped'
  | 'error'

export type LBAlgorithm = 'round-robin' | 'least-connections'

// ─── Node Configs (discriminated by nodeType) ────────────────────────────────

export interface RoutingRule {
  id: string
  method: HttpMethod
  pathPrefix: string
  targetNodeId: string
}

export interface ClientConfig {
  nodeType: 'client'
  rps: number
  method: HttpMethod
  path: string
}

export interface GatewayConfig {
  nodeType: 'gateway'
  rules: RoutingRule[]
}

export interface LoadBalancerConfig {
  nodeType: 'load-balancer'
  algorithm: LBAlgorithm
}

export interface ServiceConfig {
  nodeType: 'service'
  latencyMs: number
  errorRate: number
}

export interface CacheConfig {
  nodeType: 'cache'
  hitRate: number
  hitLatencyMs: number
  missLatencyMs: number
}

export interface DatabaseConfig {
  nodeType: 'database'
  queryLatencyMs: number
  connectionPoolSize: number
  maxThroughput: number
}

export type NodeConfig =
  | ClientConfig
  | GatewayConfig
  | LoadBalancerConfig
  | ServiceConfig
  | CacheConfig
  | DatabaseConfig

// ─── ReactFlow Node Data ─────────────────────────────────────────────────────

export interface AppNodeData extends Record<string, unknown> {
  nodeType: NodeType
  label: string
  config: NodeConfig
  status: NodeStatus
}

export type AppNode = Node<AppNodeData>
export type AppEdge = Edge

// ─── Simulation Types ────────────────────────────────────────────────────────

export interface HopRecord {
  nodeId: string
  edgeId: string | null
  decision: string
  latencyMs: number
  timestamp: number
}

export interface Packet {
  id: string
  sourceNodeId: string
  currentNodeId: string
  currentEdgeId: string | null
  progress: number
  transitMs: number       // duration of current edge transit (for smooth animation)
  transitStartTime: number // wall-clock ms when current edge transit began
  status: PacketStatus
  method: HttpMethod
  path: string
  startTime: number
  completedAt: number | null
  hops: HopRecord[]
}

export interface NodeMetrics {
  throughput: number
  errorRate: number
  p99Latency: number
  queueDepth: number
  totalRequests: number
}

export interface TraceStep {
  stepIndex: number
  nodeId: string
  edgeId: string | null
  decision: string
  latencyMs: number
  cumulativeLatencyMs: number
  outcome: TraceOutcome
}

export interface ValidationError {
  id: string
  type: 'error' | 'warning'
  nodeId?: string
  edgeId?: string
  message: string
}

// ─── Route Result (returned by router.ts) ───────────────────────────────────

export type RouteResult =
  | { outcome: 'forwarded'; targetNodeId: string; edgeId: string; decision: string; latencyMs: 0 }
  | { outcome: 'dropped'; reason: string; latencyMs: 0 }
  | { outcome: 'processed'; latencyMs: number; decision: string }
  | { outcome: 'error'; latencyMs: number; decision: string }
  | { outcome: 'cache-hit'; latencyMs: number; decision: string }
  | { outcome: 'cache-miss'; nextNodeId: string; edgeId: string; latencyMs: number; decision: string }
