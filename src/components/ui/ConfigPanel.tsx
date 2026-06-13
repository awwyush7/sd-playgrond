import { useState } from 'react'
import { useGraphStore, EMPTY_ERRORS } from '../../stores/graphStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { ClientPanel } from '../panels/ClientPanel'
import { GatewayPanel } from '../panels/GatewayPanel'
import { LoadBalancerPanel } from '../panels/LoadBalancerPanel'
import { ServicePanel } from '../panels/ServicePanel'
import { CachePanel } from '../panels/CachePanel'
import { DatabasePanel } from '../panels/DatabasePanel'
import { LearnPanel } from './LearnPanel'

type Tab = 'config' | 'learn'

export function ConfigPanel() {
  const [tab, setTab] = useState<Tab>('config')

  const selectedId       = useGraphStore(s => s.selectedNodeId)
  const node             = useGraphStore(s => s.nodes.find(n => n.id === selectedId))
  const validationErrors = useGraphStore(s =>
    s.validationErrorsByNodeId.get(selectedId ?? '__none__') ?? EMPTY_ERRORS
  )
  const removeNode       = useGraphStore(s => s.removeNode)
  const updateNodeLabel  = useGraphStore(s => s.updateNodeLabel)
  const simStatus        = useSimulationStore(s => s.status)
  const isActive         = simStatus !== 'idle'

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <p className="text-[10px] text-white/20 font-mono leading-relaxed">
          Click a node to configure it<br />or tap Learn to explore concepts
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Node header ─────────────────────────────────────────────── */}
      <div className="px-3 py-2.5 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-white/25 uppercase tracking-widest font-mono">
            {node.data.nodeType.replace('-', ' ')}
          </span>
          {!isActive && (
            <button
              onClick={() => removeNode(node.id)}
              className="text-[9px] text-white/20 hover:text-red-400/80 transition-colors font-mono"
            >
              Delete
            </button>
          )}
        </div>
        <input
          key={node.id}
          defaultValue={node.data.label}
          onBlur={e => updateNodeLabel(node.id, e.target.value.trim() || node.data.label)}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
          className="w-full bg-transparent text-[13px] font-semibold text-white/85 focus:outline-none focus:bg-white/[0.04] rounded px-1 -mx-1 py-0.5"
          placeholder="Node name…"
        />
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.06] flex-shrink-0">
        <TabBtn active={tab === 'config'} onClick={() => setTab('config')}>
          Configure
        </TabBtn>
        <TabBtn active={tab === 'learn'} onClick={() => setTab('learn')}>
          Learn
        </TabBtn>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {tab === 'config' ? (
          <>
            {isActive ? (
              <p className="text-[10px] text-white/25 font-mono text-center py-6">
                Stop the simulation to edit config
              </p>
            ) : (
              <>
                {node.data.nodeType === 'client'        && <ClientPanel       nodeId={node.id} />}
                {node.data.nodeType === 'gateway'       && <GatewayPanel      nodeId={node.id} />}
                {node.data.nodeType === 'load-balancer' && <LoadBalancerPanel nodeId={node.id} />}
                {node.data.nodeType === 'service'       && <ServicePanel      nodeId={node.id} />}
                {node.data.nodeType === 'cache'         && <CachePanel        nodeId={node.id} />}
                {node.data.nodeType === 'database'      && <DatabasePanel     nodeId={node.id} />}
              </>
            )}
          </>
        ) : (
          <LearnPanel nodeType={node.data.nodeType} />
        )}
      </div>

      {/* ── Validation errors ───────────────────────────────────────── */}
      {validationErrors.length > 0 && (
        <div className="border-t border-white/[0.06] px-3 py-2 space-y-1.5 flex-shrink-0">
          {validationErrors.map(err => (
            <div
              key={err.id}
              className={`flex items-start gap-1.5 text-[10px] font-mono ${
                err.type === 'error' ? 'text-red-400/75' : 'text-yellow-400/65'
              }`}
            >
              <span className="flex-shrink-0 mt-px">{err.type === 'error' ? '✗' : '⚠'}</span>
              <span className="leading-relaxed">{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-[11px] font-medium transition-all duration-150 ${
        active
          ? 'text-white/80 border-b-2 border-white/40 -mb-px'
          : 'text-white/30 hover:text-white/55 border-b-2 border-transparent -mb-px'
      }`}
    >
      {children}
    </button>
  )
}
