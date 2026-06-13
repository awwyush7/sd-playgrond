import type { NodeType } from '../../types'

interface PaletteItem {
  type: NodeType
  label: string
  description: string
  color: string
  icon: React.ReactNode
}

const MonitorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
  </svg>
)
const GatewayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
)
const LBIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 10.49L8.59 6.51" />
  </svg>
)
const ServiceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
    <path d="M6 6h.01M6 18h.01" />
  </svg>
)
const CacheIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)
const DBIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'client',
    label: 'Client',
    description: 'Generates traffic at configured RPS',
    color: '#3B82F6',
    icon: <MonitorIcon />,
  },
  {
    type: 'gateway',
    label: 'API Gateway',
    description: 'Routes requests by method + path rules',
    color: '#8B5CF6',
    icon: <GatewayIcon />,
  },
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    description: 'Distributes traffic across services',
    color: '#F97316',
    icon: <LBIcon />,
  },
  {
    type: 'service',
    label: 'Service',
    description: 'Processes requests with latency + error rate',
    color: '#22C55E',
    icon: <ServiceIcon />,
  },
  {
    type: 'cache',
    label: 'Cache (Redis)',
    description: 'Returns cached responses at hit rate',
    color: '#EF4444',
    icon: <CacheIcon />,
  },
  {
    type: 'database',
    label: 'Database',
    description: 'Processes queries with pool limits',
    color: '#F59E0B',
    icon: <DBIcon />,
  },
]

export function Palette() {
  function handleDragStart(e: React.DragEvent, nodeType: NodeType) {
    e.dataTransfer.setData('application/sd-playground-nodetype', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="p-3 space-y-1.5">
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono px-1 mb-2">
        Components
      </p>
      {PALETTE_ITEMS.map(item => (
        <div
          key={item.type}
          draggable
          onDragStart={e => handleDragStart(e, item.type)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/[0.04] cursor-grab active:cursor-grabbing transition-all duration-150 group"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
            style={{ background: `${item.color}22`, color: item.color }}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/70 font-medium leading-tight">{item.label}</p>
            <p className="text-[10px] text-white/30 leading-tight truncate">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
