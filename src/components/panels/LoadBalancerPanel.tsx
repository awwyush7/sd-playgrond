import { useGraphStore } from '../../stores/graphStore'
import type { LoadBalancerConfig, LBAlgorithm } from '../../types'
import { Field } from './ClientPanel'

export function LoadBalancerPanel({ nodeId }: { nodeId: string }) {
  const node = useGraphStore(s => s.nodes.find(n => n.id === nodeId))
  const edges = useGraphStore(s => s.edges)
  const nodes = useGraphStore(s => s.nodes)
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  if (!node || node.data.nodeType !== 'load-balancer') return null
  const cfg = node.data.config as LoadBalancerConfig

  const targets = edges
    .filter(e => e.source === nodeId)
    .map(e => nodes.find(n => n.id === e.target))
    .filter(Boolean)

  function updateAlgorithm(algorithm: LBAlgorithm) {
    updateNodeConfig(nodeId, { ...cfg, algorithm })
  }

  return (
    <div className="space-y-3">
      <Field label="Algorithm">
        <div className="flex gap-2">
          {(['round-robin', 'least-connections'] as LBAlgorithm[]).map(algo => (
            <button
              key={algo}
              onClick={() => updateAlgorithm(algo)}
              className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono transition-colors ${
                cfg.algorithm === algo
                  ? 'border-orange-400/50 bg-orange-400/10 text-orange-300'
                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {algo === 'round-robin' ? 'Round Robin' : 'Least Conn'}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Target Services (${targets.length})`}>
        {targets.length === 0 ? (
          <p className="text-[10px] text-yellow-400/60 font-mono">
            Connect to services to balance across
          </p>
        ) : (
          <div className="space-y-1">
            {targets.map(t => t && (
              <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.03] border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                <span className="text-[10px] text-white/60 font-mono">{t.data.label}</span>
              </div>
            ))}
          </div>
        )}
      </Field>
    </div>
  )
}
