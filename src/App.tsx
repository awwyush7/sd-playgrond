import { useCallback, useMemo, useEffect, useState } from 'react'
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
import { SimObserver } from './components/ui/SimObserver'
import { Walkthrough } from './components/ui/Walkthrough'

import { loadTemplate } from './utils/templates'
import type { NodeType, AppNode, AppEdge } from './types'

const STARTER_TEMPLATES = [
  { id: 'three-tier',    name: '3-Tier Web App', badge: 'Beginner',     badgeColor: 'text-emerald-400 bg-emerald-500/10', desc: 'Client → Gateway → Service → DB' },
  { id: 'load-balanced', name: 'Load Balanced',  badge: 'Intermediate', badgeColor: 'text-blue-400 bg-blue-500/10',       desc: 'Two services + Redis cache' },
  { id: 'microservices', name: 'Microservices',  badge: 'Advanced',     badgeColor: 'text-violet-400 bg-violet-500/10',   desc: 'Auth + Product, separate DBs' },
]

const SCENARIO_TEMPLATES = [
  { id: 'db-overload',  name: 'DB Overload',  badge: 'Scenario', badgeColor: 'text-orange-400 bg-orange-500/10', desc: 'Watch Q spike as pool saturates' },
  { id: 'cache-effect', name: 'Cache Effect', badge: 'Scenario', badgeColor: 'text-orange-400 bg-orange-500/10', desc: 'Cache drops DB load by 85%' },
]

function TemplateCard({ id, name, badge, badgeColor, desc }: typeof STARTER_TEMPLATES[0]) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => loadTemplate(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-[155px] text-left rounded-xl border border-ui node-bg hover:bg-lift hover:border-[var(--node-border)] transition-all duration-150 p-3 flex flex-col gap-1.5"
      style={{ transform: hovered ? 'translateY(-2px)' : 'none' }}
    >
      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded self-start ${badgeColor}`}>{badge}</span>
      <p className="text-[12px] font-semibold text-1">{name}</p>
      <p className="text-[10px] text-3 font-mono leading-relaxed">{desc}</p>
    </button>
  )
}

function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 select-none">
      <div className="text-center">
        <p className="text-[11px] text-3 font-mono uppercase tracking-widest mb-1">System Design Playground</p>
        <p className="text-[22px] font-bold text-1 leading-tight">Watch distributed systems come alive.</p>
        <p className="text-[13px] text-2 mt-1">Wire nodes, configure routes, run a simulation — see how real architectures behave.</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[9px] text-3 uppercase tracking-widest font-mono">Start with a template</p>
        <div className="flex items-stretch gap-2.5">
          {STARTER_TEMPLATES.map(t => <TemplateCard key={t.id} {...t} />)}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[9px] text-3 uppercase tracking-widest font-mono">or try a failure scenario</p>
        <div className="flex items-stretch gap-2.5">
          {SCENARIO_TEMPLATES.map(t => <TemplateCard key={t.id} {...t} />)}
        </div>
      </div>

      <p className="text-[10px] text-3 font-mono">or drag any component from the left sidebar to start from scratch</p>
    </div>
  )
}

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

  const highlightedEdgeId = useMemo(() => {
    if (simStatus !== 'inspecting' || !inspectTrace) return null
    return inspectTrace[inspectStepIndex]?.edgeId ?? null
  }, [simStatus, inspectTrace, inspectStepIndex])

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
      {/* Themed gradient background */}
      <div className="canvas-gradient" />

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
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color="rgba(255,255,255,0.08)"
        />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>

      <PacketOverlay />
      <SimObserver />
      <Walkthrough />

      {nodes.length === 0 && <EmptyState />}
    </div>
  )
}

function App() {
  const simStatus = useSimulationStore(s => s.status)
  const isInspecting = simStatus === 'inspecting'
  const isRunning = simStatus === 'running'

  return (
    <div className="flex flex-col h-screen bg-base text-1 overflow-hidden">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] flex-shrink-0 border-r border-ui flex flex-col bg-surface overflow-hidden">
          <div className="flex-shrink-0 overflow-y-auto" style={{ maxHeight: '55%' }}>
            <Palette />
          </div>
          <div className="flex-1 border-t border-ui overflow-hidden min-h-0" data-tour="config-panel">
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
