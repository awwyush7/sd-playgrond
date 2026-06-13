import { useRef } from 'react'
import { useGraphStore } from '../../stores/graphStore'
import type { ClientConfig, HttpMethod } from '../../types'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export function ClientPanel({ nodeId }: { nodeId: string }) {
  const node = useGraphStore(s => s.nodes.find(n => n.id === nodeId))
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  if (!node || node.data.nodeType !== 'client') return null
  const cfg = node.data.config as ClientConfig

  function update(patch: Partial<ClientConfig>) {
    updateNodeConfig(nodeId, { ...cfg, ...patch })
  }

  return (
    <div className="space-y-3">
      <Field label="Requests per second">
        <NumberInput
          defaultValue={cfg.rps}
          min={1}
          max={500}
          onCommit={v => update({ rps: v })}
        />
      </Field>

      <Field label="HTTP Method">
        <select
          defaultValue={cfg.method}
          onChange={e => update({ method: e.target.value as HttpMethod })}
          className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white/80 font-mono focus:outline-none focus:border-white/30"
        >
          {METHODS.map(m => (
            <option key={m} value={m} className="bg-[#1a1a24]">{m}</option>
          ))}
        </select>
      </Field>

      <Field label="Path">
        <TextInput
          defaultValue={cfg.path}
          placeholder="/api/..."
          onCommit={v => update({ path: v })}
        />
      </Field>
    </div>
  )
}

// ─── Shared form primitives ───────────────────────────────────────────────────

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-white/40 uppercase tracking-wide font-mono">{label}</label>
      {children}
    </div>
  )
}

export function NumberInput({
  defaultValue,
  min,
  max,
  onCommit,
}: {
  defaultValue: number
  min?: number
  max?: number
  onCommit: (v: number) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <input
      ref={ref}
      type="number"
      defaultValue={defaultValue}
      min={min}
      max={max}
      onBlur={() => {
        const v = parseFloat(ref.current?.value ?? '')
        if (!isNaN(v)) onCommit(v)
      }}
      onKeyDown={e => { if (e.key === 'Enter') ref.current?.blur() }}
      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white/80 font-mono focus:outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}

export function TextInput({
  defaultValue,
  placeholder,
  onCommit,
}: {
  defaultValue: string
  placeholder?: string
  onCommit: (v: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <input
      ref={ref}
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      onBlur={() => { if (ref.current) onCommit(ref.current.value) }}
      onKeyDown={e => { if (e.key === 'Enter') ref.current?.blur() }}
      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white/80 font-mono focus:outline-none focus:border-white/30 placeholder:text-white/20"
    />
  )
}
