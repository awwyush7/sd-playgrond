import { useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type Node,
} from '@xyflow/react'

import { useGraphStore } from './stores/graphStore'
import { useSimulationStore } from './stores/simulationStore'

import { ClientNode } from './components/nodes/ClientNode'
import { GatewayNode } from './components/nodes/GatewayNode'
import { LoadBalancerNode } from './components/nodes/LoadBalancerNode'
import { ServiceNode } from './components/nodes/ServiceNode'
import { CacheNode } from './components/nodes/CacheNode'
import { DatabaseNode } from './components/nodes/DatabaseNode'

import { Toolbar } from './components/ui/Toolbar'
import { Palette } from './components/ui/Palette'
import { ConfigPanel } from './components/ui/ConfigPanel'
import { MetricsBar } from './components/ui/MetricsBar'
import { InspectPanel } from './components/ui/InspectPanel'
import { PacketOverlay } from './components/ui/PacketOverlay'

import type { NodeType, AppNode, AppEdge } from './types'

// Node types registered once outside render (useMemo handles referential stability inside)
const NODE_TYPE_MAP = {
  client: ClientNode,
  gateway: GatewayNode,
  'load-balancer': LoadBalancerNode,
  service: ServiceNode,
  cache: CacheNode,
  database: DatabaseNode,
} as const

function Canvas() {
  const { screenToFlowPosition } = useReactFlow()

  const nodes = useGraphStore(s => s.nodes)
  const edges = useGraphStore(s => s.edges)
  const onNodesChange = useGraphStore(s => s.onNodesChange)
  const onEdgesChange = useGraphStore(s => s.onEdgesChange)
  const onConnect = useGraphStore(s => s.onConnect)
  const setSelectedNode = useGraphStore(s => s.setSelectedNode)
  const addNode = useGraphStore(s => s.addNode)

  const simStatus = useSimulationStore(s => s.status)
  const inspectTrace = useSimulationStore(s => s.inspectTrace)
  const inspectStepIndex = useSimulationStore(s => s.inspectStepIndex)

  const nodeTypes = useMemo<NodeTypes>(() => NODE_TYPE_MAP, [])
  const edgeTypes = useMemo<EdgeTypes>(() => ({}), [])

  // Load from URL on mount
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('g')
    if (param) {
      useGraphStore.getState().loadFromURL(param)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const nodeType = e.dataTransfer.getData('application/sd-playground-nodetype') as NodeType
      if (!nodeType) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(nodeType, position)
    },
    [screenToFlowPosition, addNode]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id)
    },
    [setSelectedNode]
  )

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection)
    },
    [onConnect]
  )

  // Compute which edge is highlighted during inspect
  const highlightedEdgeId = useMemo(() => {
    if (simStatus !== 'inspecting' || !inspectTrace) return null
    return inspectTrace[inspectStepIndex]?.edgeId ?? null
  }, [simStatus, inspectTrace, inspectStepIndex])

  // Inject highlight class on edge
  const styledEdges: AppEdge[] = useMemo(() =>
    edges.map(e => ({
      ...e,
      className: e.id === highlightedEdgeId ? 'react-flow__edge--highlighted' : '',
    })),
    [edges, highlightedEdgeId]
  )

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Elite gradient background — rendered behind ReactFlow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 90% 70% at 70% 20%, rgba(88,28,235,0.055) 0%, transparent 65%)',
            'radial-gradient(ellipse 60% 50% at 15% 80%, rgba(37,99,235,0.04) 0%, transparent 55%)',
            'radial-gradient(ellipse 50% 40% at 85% 75%, rgba(16,185,129,0.025) 0%, transparent 50%)',
            '#080810',
          ].join(', '),
        }}
      />

      <ReactFlow
        nodes={nodes as AppNode[]}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        minZoom={0.15}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1.5 },
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color="rgba(255,255,255,0.1)"
        />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>

      {/* Packet animation canvas overlay */}
      <PacketOverlay />

      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
          <div className="flex items-center gap-3 opacity-20">
            {['#3B82F6','#8B5CF6','#22C55E','#F59E0B'].map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ background: `${c}22`, border: `1px solid ${c}44` }} />
                {i < 3 && <div className="w-4 h-px" style={{ background: c + '33' }} />}
              </div>
            ))}
          </div>
          <p className="text-sm text-white/20 font-mono">Drag components from the sidebar</p>
          <p className="text-xs text-white/10 font-mono">or click Load Demo to see a working example</p>
        </div>
      )}
    </div>
  )
}

function App() {
  const simStatus = useSimulationStore(s => s.status)
  const isInspecting = simStatus === 'inspecting'
  const isRunning = simStatus === 'running'

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0F] text-white overflow-hidden">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: palette + config panel */}
        <aside className="w-[220px] flex-shrink-0 border-r border-white/8 flex flex-col bg-[#0A0A0F] overflow-hidden">
          <Palette />
          <div className="flex-1 border-t border-white/8 overflow-hidden">
            <ConfigPanel />
          </div>
        </aside>

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ReactFlowProvider>
            <div className="flex-1 relative overflow-hidden">
              <Canvas />
            </div>
          </ReactFlowProvider>

          {/* Bottom panel: metrics or inspect */}
          {isInspecting ? (
            <InspectPanel />
          ) : (isRunning && (
            <MetricsBar />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
