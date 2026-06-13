import { useRef } from 'react'
import { nanoid } from 'nanoid'
import { useGraphStore } from '../../stores/graphStore'
import type { ClientConfig, HttpMethod, RouteEntry } from '../../types'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const METHOD_TEXT: Record<HttpMethod, string> = {
  GET:    '#22C55E',
  POST:   '#3B82F6',
  PUT:    '#F59E0B',
  DELETE: '#EF4444',
  PATCH:  '#A855F7',
}

export function ClientPanel({ nodeId }: { nodeId: string }) {
  const node = useGraphStore(s => s.nodes.find(n => n.id === nodeId))
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  if (!node || node.data.nodeType !== 'client') return null
  const cfg = node.data.config as ClientConfig

  function update(patch: Partial<ClientConfig>) {
    updateNodeConfig(nodeId, { ...cfg, ...patch })
  }

  function updateRoute(routeId: string, patch: Partial<RouteEntry>) {
    update({ routes: cfg.routes.map(r => r.id === routeId ? { ...r, ...patch } : r) })
  }

  function addRoute() {
    update({ routes: [...cfg.routes, { id: nanoid(6), method: 'GET', path: '/api/', rps: 5 }] })
  }

  function removeRoute(routeId: string) {
    if (cfg.routes.length <= 1) return
    update({ routes: cfg.routes.filter(r => r.id !== routeId) })
  }

  const totalRps = cfg.routes.reduce((s, r) => s + (r.rps ?? 0), 0)

  return (
    <div className="space-y-3">
      {/* Total RPS — computed, read-only */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-white/40 uppercase tracking-wide font-mono">Total RPS</span>
        <span className="text-[13px] font-bold font-mono text-white/70">{totalRps}</span>
      </div>

      <Field label={`Routes (${cfg.routes.length})`}>
        <div className="space-y-1.5">
          {cfg.routes.map(route => (
            <div key={route.id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 space-y-1.5">
              {/* Method + Path row */}
              <div className="flex items-center gap-1.5">
                <select
                  value={route.method}
                  onChange={e => updateRoute(route.id, { method: e.target.value as HttpMethod })}
                  className="bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono focus:outline-none focus:border-white/30 flex-shrink-0"
                  style={{ color: METHOD_TEXT[route.method] }}
                >
                  {METHODS.map(m => (
                    <option key={m} value={m} className="bg-[#1a1a24] text-white">{m}</option>
                  ))}
                </select>
                <TextInput
                  key={`path-${route.id}`}
                  defaultValue={route.path}
                  placeholder="/api/..."
                  onCommit={v => updateRoute(route.id, { path: v || '/api/' })}
                />
                {cfg.routes.length > 1 && (
                  <button
                    onClick={() => removeRoute(route.id)}
                    className="text-white/20 hover:text-red-400/70 transition-colors text-[11px] font-mono flex-shrink-0 px-0.5"
                    title="Remove route"
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* RPS row */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/30 font-mono">RPS</span>
                <NumberInput
                  key={`rps-${route.id}`}
                  defaultValue={route.rps}
                  min={1}
                  max={200}
                  onCommit={v => updateRoute(route.id, { rps: Math.min(200, Math.max(1, v)) })}
                />
                <span className="text-[9px] text-white/25 font-mono whitespace-nowrap">
                  {totalRps > 0 ? `${Math.round((route.rps / totalRps) * 100)}%` : '—'}
                </span>
              </div>
            </div>
          ))}

          {/* Add route button */}
          <button
            onClick={addRoute}
            disabled={cfg.routes.length >= 6}
            className="w-full py-1 text-[10px] font-mono text-white/30 hover:text-white/55 border border-dashed border-white/[0.08] hover:border-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Add route
          </button>
        </div>
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
