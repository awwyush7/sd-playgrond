import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  SimulationStatus,
  Packet,
  NodeMetrics,
  TraceStep,
  AppNode,
  AppEdge,
} from '../types'
import { createSimulationTick } from '../simulation/engine'
import { buildTrace } from '../simulation/inspector'
import { useGraphStore } from './graphStore'

interface SimulationState {
  status: SimulationStatus
  packets: Map<string, Packet>
  metrics: Map<string, NodeMetrics>
  completedCount: number
  droppedCount: number
  simSpeed: number  // 0.5 = fast, 1.0 = normal, 2.0 = slow
  inspectTrace: TraceStep[] | null
  inspectStepIndex: number
  tickIntervalRef: ReturnType<typeof setInterval> | null
}

interface SimulationActions {
  startSimulation: () => void
  stopSimulation: () => void
  startInspect: () => void
  exitInspect: () => void
  nextStep: () => void
  prevStep: () => void
  setSimSpeed: (speed: number) => void
  _setPackets: (packets: Map<string, Packet>) => void
  _setMetrics: (metrics: Map<string, NodeMetrics>) => void
  _setCounters: (completed: number, dropped: number) => void
}

export type SimulationStore = SimulationState & SimulationActions

export const useSimulationStore = create<SimulationStore>()(
  subscribeWithSelector((set, get) => ({
    status: 'idle',
    packets: new Map(),
    metrics: new Map(),
    completedCount: 0,
    droppedCount: 0,
    simSpeed: 1.0,
    inspectTrace: null,
    inspectStepIndex: 0,
    tickIntervalRef: null,

    startSimulation: () => {
      const existing = get().tickIntervalRef
      if (existing !== null) clearInterval(existing)

      const graphState = useGraphStore.getState()
      const hasErrors = graphState.validationErrors.some(e => e.type === 'error')
      if (hasErrors) return

      const tick = createSimulationTick(
        () => useGraphStore.getState(),
        (packets) => set({ packets }),
        (metrics) => set({ metrics }),
        (completed, dropped) => set({ completedCount: completed, droppedCount: dropped }),
        () => get().simSpeed,
      )

      const intervalId = setInterval(tick, 100)
      set({
        status: 'running',
        tickIntervalRef: intervalId,
        packets: new Map(),
        metrics: new Map(),
        completedCount: 0,
        droppedCount: 0,
      })
    },

    stopSimulation: () => {
      const { tickIntervalRef } = get()
      if (tickIntervalRef !== null) {
        clearInterval(tickIntervalRef)
      }
      set({ status: 'idle', tickIntervalRef: null, packets: new Map(), metrics: new Map(), completedCount: 0, droppedCount: 0 })
    },

    startInspect: () => {
      const { nodes, edges, validationErrors } = useGraphStore.getState()
      const hasErrors = validationErrors.some(e => e.type === 'error')
      if (hasErrors) return

      const clients = nodes.filter((n: AppNode) => n.data.nodeType === 'client')
      if (clients.length === 0) return

      const client = clients[0]
      try {
        const trace = buildTrace(nodes, edges, client.id)
        set({
          status: 'inspecting',
          inspectTrace: trace,
          inspectStepIndex: 0,
          packets: new Map(),
        })
      } catch (err) {
        console.error('Inspect trace failed:', err)
      }
    },

    exitInspect: () => {
      set({ status: 'idle', inspectTrace: null, inspectStepIndex: 0 })
    },

    nextStep: () => {
      const { inspectTrace, inspectStepIndex } = get()
      if (!inspectTrace) return
      const next = Math.min(inspectStepIndex + 1, inspectTrace.length - 1)
      set({ inspectStepIndex: next })
    },

    prevStep: () => {
      const { inspectStepIndex } = get()
      set({ inspectStepIndex: Math.max(inspectStepIndex - 1, 0) })
    },

    setSimSpeed: (speed) => set({ simSpeed: speed }),
    _setPackets: (packets) => set({ packets }),
    _setMetrics: (metrics) => set({ metrics }),
    _setCounters: (completed, dropped) => set({ completedCount: completed, droppedCount: dropped }),
  }))
)

// Cleanup on hot-reload in dev
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    const { tickIntervalRef } = useSimulationStore.getState()
    if (tickIntervalRef !== null) clearInterval(tickIntervalRef)
  })
}

// Helper: get outgoing edge target node IDs for a given node
export function getOutgoingTargets(nodeId: string, edges: AppEdge[]): string[] {
  return edges.filter(e => e.source === nodeId).map(e => e.target)
}
