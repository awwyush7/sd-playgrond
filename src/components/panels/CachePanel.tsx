import { useGraphStore } from '../../stores/graphStore'
import type { CacheConfig } from '../../types'
import { Field, NumberInput } from './ClientPanel'

export function CachePanel({ nodeId }: { nodeId: string }) {
  const node = useGraphStore(s => s.nodes.find(n => n.id === nodeId))
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  if (!node || node.data.nodeType !== 'cache') return null
  const cfg = node.data.config as CacheConfig

  function update(patch: Partial<CacheConfig>) {
    updateNodeConfig(nodeId, { ...cfg, ...patch })
  }

  return (
    <div className="space-y-3">
      <Field label="Cache Hit Rate (%)">
        <NumberInput
          defaultValue={cfg.hitRate}
          min={0}
          max={100}
          onCommit={v => update({ hitRate: Math.min(100, Math.max(0, v)) })}
        />
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400/60 transition-all"
              style={{ width: `${cfg.hitRate}%` }}
            />
          </div>
          <span className="text-[10px] text-white/40 font-mono w-8">{cfg.hitRate}%</span>
        </div>
      </Field>

      <Field label="Hit Latency (ms)">
        <NumberInput
          defaultValue={cfg.hitLatencyMs}
          min={1}
          max={1000}
          onCommit={v => update({ hitLatencyMs: v })}
        />
      </Field>

      <Field label="Miss Latency (ms)">
        <NumberInput
          defaultValue={cfg.missLatencyMs}
          min={1}
          max={1000}
          onCommit={v => update({ missLatencyMs: v })}
        />
      </Field>
    </div>
  )
}
