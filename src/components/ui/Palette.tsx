import { Monitor, Route, Shuffle, Server, Zap, Database } from 'lucide-react'
import type { NodeType } from '../../types'

interface PaletteItem {
  type: NodeType
  label: string
  description: string
  color: string
  icon: React.ReactNode
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'client',
    label: 'Client',
    description: 'Generates traffic at configured RPS',
    color: '#3B82F6',
    icon: <Monitor size={14} strokeWidth={1.75} />,
  },
  {
    type: 'gateway',
    label: 'API Gateway',
    description: 'Routes requests by method + path rules',
    color: '#8B5CF6',
    icon: <Route size={14} strokeWidth={1.75} />,
  },
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    description: 'Distributes traffic across services',
    color: '#F97316',
    icon: <Shuffle size={14} strokeWidth={1.75} />,
  },
  {
    type: 'service',
    label: 'Service',
    description: 'Processes requests with latency + error rate',
    color: '#22C55E',
    icon: <Server size={14} strokeWidth={1.75} />,
  },
  {
    type: 'cache',
    label: 'Cache (Redis)',
    description: 'Returns cached responses at hit rate',
    color: '#EF4444',
    icon: <Zap size={14} strokeWidth={1.75} />,
  },
  {
    type: 'database',
    label: 'Database',
    description: 'Processes queries with pool limits',
    color: '#F59E0B',
    icon: <Database size={14} strokeWidth={1.75} />,
  },
]

export function Palette() {
  function handleDragStart(e: React.DragEvent, nodeType: NodeType) {
    e.dataTransfer.setData('application/sd-playground-nodetype', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="p-3 space-y-1.5">
      <p className="text-[10px] text-3 uppercase tracking-widest font-mono px-1 mb-2">
        Components
      </p>
      {PALETTE_ITEMS.map(item => (
        <div
          key={item.type}
          draggable
          onDragStart={e => handleDragStart(e, item.type)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-ui hover:bg-lift cursor-grab active:cursor-grabbing transition-all duration-150 group"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
            style={{ background: `${item.color}22`, color: item.color }}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-2 font-medium leading-tight">{item.label}</p>
            <p className="text-[10px] text-3 leading-tight truncate">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
