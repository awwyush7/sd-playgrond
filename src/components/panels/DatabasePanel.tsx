import { useGraphStore } from '../../stores/graphStore'
import type { DatabaseConfig } from '../../types'
import { Field, NumberInput } from './ClientPanel'

export function DatabasePanel({ nodeId }: { nodeId: string }) {
  const node = useGraphStore(s => s.nodes.find(n => n.id === nodeId))
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  if (!node || node.data.nodeType !== 'database') return null
  const cfg = node.data.config as DatabaseConfig

  function update(patch: Partial<DatabaseConfig>) {
    updateNodeConfig(nodeId, { ...cfg, ...patch })
  }

  return (
    <div className="space-y-3">
      <Field label="Query Latency (ms)">
        <NumberInput
          defaultValue={cfg.queryLatencyMs}
          min={1}
          max={5000}
          onCommit={v => update({ queryLatencyMs: v })}
        />
      </Field>

      <Field label="Connection Pool Size">
        <NumberInput
          defaultValue={cfg.connectionPoolSize}
          min={1}
          max={500}
          onCommit={v => update({ connectionPoolSize: v })}
        />
      </Field>

      <Field label="Max Throughput (req/s)">
        <NumberInput
          defaultValue={cfg.maxThroughput}
          min={1}
          max={10000}
          onCommit={v => update({ maxThroughput: v })}
        />
      </Field>
    </div>
  )
}
