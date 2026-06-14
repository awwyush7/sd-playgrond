import { Monitor, Route, Shuffle, Server, Zap, Database, MessageSquare, Globe, Shield, GitBranch } from 'lucide-react'
import type { NodeType } from '../../types'

interface PaletteItem {
  type: NodeType
  label: string
  description: string
  color: string
  icon: React.ReactNode
}

interface ComingSoonItem {
  label: string
  description: string
  color: string
  icon: React.ReactNode
  tag: string
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

const COMING_SOON: ComingSoonItem[] = [
  {
    label: 'Message Broker',
    description: 'Kafka / RabbitMQ async queuing',
    color: '#EC4899',
    icon: <MessageSquare size={14} strokeWidth={1.75} />,
    tag: 'Kafka',
  },
  {
    label: 'CDN',
    description: 'Edge-cached static asset delivery',
    color: '#06B6D4',
    icon: <Globe size={14} strokeWidth={1.75} />,
    tag: 'CDN',
  },
  {
    label: 'Rate Limiter',
    description: 'Token bucket / sliding window',
    color: '#F59E0B',
    icon: <Shield size={14} strokeWidth={1.75} />,
    tag: 'Throttle',
  },
  {
    label: 'Service Mesh',
    description: 'Sidecar proxy with circuit breaker',
    color: '#8B5CF6',
    icon: <GitBranch size={14} strokeWidth={1.75} />,
    tag: 'Istio',
  },
]

export function Palette() {
  function handleDragStart(e: React.DragEvent, nodeType: NodeType) {
    e.dataTransfer.setData('application/sd-playground-nodetype', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="p-3" data-tour="palette">
      <p className="text-[10px] text-3 uppercase tracking-widest font-mono px-1 mb-2">
        Components
      </p>

      <div className="space-y-1">
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

      {/* Coming soon section */}
      <div className="mt-3 pt-3 border-t border-ui">
        <p className="text-[10px] text-3 uppercase tracking-widest font-mono px-1 mb-2">
          Coming soon
        </p>
        <div className="space-y-1">
          {COMING_SOON.map(item => (
            <div
              key={item.label}
              className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg select-none cursor-not-allowed"
            >
              {/* Blurred content */}
              <div className="flex items-center gap-2.5 w-full blur-[2px] pointer-events-none">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}18`, color: item.color, opacity: 0.6 }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-2 font-medium leading-tight">{item.label}</p>
                  <p className="text-[10px] text-3 leading-tight truncate">{item.description}</p>
                </div>
              </div>
              {/* Coming soon badge overlay */}
              <span className="absolute right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-3 border border-ui flex-shrink-0">
                Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
