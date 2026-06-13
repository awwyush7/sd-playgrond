import { useGraphStore } from '../../stores/graphStore'
import type { GatewayConfig, RoutingRule, HttpMethod } from '../../types'
import { Field, TextInput } from './ClientPanel'
import { nanoid } from 'nanoid'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export function GatewayPanel({ nodeId }: { nodeId: string }) {
  const node = useGraphStore(s => s.nodes.find(n => n.id === nodeId))
  const allNodes = useGraphStore(s => s.nodes)
  const edges = useGraphStore(s => s.edges)
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  if (!node || node.data.nodeType !== 'gateway') return null
  const cfg = node.data.config as GatewayConfig

  // Only show nodes that are reachable via outgoing edges
  const outgoingTargetIds = edges.filter(e => e.source === nodeId).map(e => e.target)
  const availableTargets = allNodes.filter(n => outgoingTargetIds.includes(n.id))

  function updateRules(rules: RoutingRule[]) {
    updateNodeConfig(nodeId, { ...cfg, rules })
  }

  function addRule() {
    const newRule: RoutingRule = {
      id: nanoid(6),
      method: 'GET',
      pathPrefix: '/',
      targetNodeId: availableTargets[0]?.id ?? '',
    }
    updateRules([...cfg.rules, newRule])
  }

  function updateRule(ruleId: string, patch: Partial<RoutingRule>) {
    updateRules(cfg.rules.map(r => r.id === ruleId ? { ...r, ...patch } : r))
  }

  function removeRule(ruleId: string) {
    updateRules(cfg.rules.filter(r => r.id !== ruleId))
  }

  return (
    <div className="space-y-3">
      <Field label={`Routing Rules (${cfg.rules.length})`}>
        {availableTargets.length === 0 && (
          <p className="text-[10px] text-yellow-400/60 font-mono">
            Connect this gateway to services first
          </p>
        )}

        <div className="space-y-2">
          {cfg.rules.map(rule => {
            const targetConnected = outgoingTargetIds.includes(rule.targetNodeId)
            return (
              <div
                key={rule.id}
                className={`rounded-lg border p-2 space-y-1.5 ${
                  targetConnected ? 'border-white/10 bg-white/[0.02]' : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex gap-1.5">
                  <select
                    value={rule.method}
                    onChange={e => updateRule(rule.id, { method: e.target.value as HttpMethod })}
                    className="bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-violet-300 focus:outline-none focus:border-white/30 flex-shrink-0"
                  >
                    {METHODS.map(m => (
                      <option key={m} value={m} className="bg-[#1a1a24]">{m}</option>
                    ))}
                  </select>

                  <TextInput
                    defaultValue={rule.pathPrefix}
                    placeholder="/prefix"
                    onCommit={v => updateRule(rule.id, { pathPrefix: v })}
                  />

                  <button
                    onClick={() => removeRule(rule.id)}
                    className="text-white/30 hover:text-red-400 transition-colors text-xs flex-shrink-0"
                    title="Remove rule"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-white/30 font-mono flex-shrink-0">→</span>
                  <select
                    value={rule.targetNodeId}
                    onChange={e => updateRule(rule.id, { targetNodeId: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-white/70 focus:outline-none focus:border-white/30"
                  >
                    {availableTargets.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#1a1a24]">
                        {t.data.label}
                      </option>
                    ))}
                    {!targetConnected && (
                      <option value={rule.targetNodeId} className="bg-[#1a1a24] text-red-400">
                        {rule.targetNodeId} (not connected)
                      </option>
                    )}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={addRule}
          disabled={availableTargets.length === 0}
          className="w-full mt-1 py-1.5 rounded-lg border border-dashed border-white/20 text-[10px] text-white/40 hover:border-violet-400/40 hover:text-violet-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          + Add Rule
        </button>
      </Field>
    </div>
  )
}
