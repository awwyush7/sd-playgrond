import { useGraphStore } from '../../stores/graphStore'
import type { ServiceConfig } from '../../types'
import { Field, NumberInput } from './ClientPanel'

export function ServicePanel({ nodeId }: { nodeId: string }) {
  const node = useGraphStore(s => s.nodes.find(n => n.id === nodeId))
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  if (!node || node.data.nodeType !== 'service') return null
  const cfg = node.data.config as ServiceConfig

  function update(patch: Partial<ServiceConfig>) {
    updateNodeConfig(nodeId, { ...cfg, ...patch })
  }

  return (
    <div className="space-y-3">
      <Field label="Processing Latency (ms)">
        <NumberInput
          defaultValue={cfg.latencyMs}
          min={1}
          max={5000}
          onCommit={v => update({ latencyMs: v })}
        />
      </Field>

      <Field label="Error Rate (%)">
        <NumberInput
          defaultValue={cfg.errorRate}
          min={0}
          max={100}
          onCommit={v => update({ errorRate: Math.min(100, Math.max(0, v)) })}
        />
        {cfg.errorRate > 0 && (
          <p className="text-[10px] text-red-400/60 font-mono">
            {cfg.errorRate}% of requests will fail
          </p>
        )}
      </Field>
    </div>
  )
}
