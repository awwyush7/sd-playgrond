import { useState, useRef, useEffect } from 'react'
import { useGraphStore } from '../../stores/graphStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { loadTemplate, TEMPLATES } from '../../utils/templates'
import { cn } from '../../utils/cn'
import type { SavedGraph } from '../../stores/graphStore'

// ─── Icons ───────────────────────────────────────────────────────────────────

const PlayIcon     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
const StopIcon     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
const InspectIcon  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v3l2 2" /></svg>
const ShareIcon    = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 10.49L8.59 6.51" /></svg>
const TrashIcon    = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
const ChevronIcon  = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
const SaveIcon     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
const LayersIcon   = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
const WarnIcon     = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 7v6M12 17v.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>

// ─── Dropdown helper ─────────────────────────────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])
  return { open, setOpen, ref }
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

export function Toolbar() {
  const validationErrors = useGraphStore(s => s.validationErrors)
  const resetGraph       = useGraphStore(s => s.resetGraph)
  const serializeToURL   = useGraphStore(s => s.serializeToURL)
  const saveToLocal      = useGraphStore(s => s.saveToLocal)
  const loadFromLocal    = useGraphStore(s => s.loadFromLocal)
  const deleteSaved      = useGraphStore(s => s.deleteSaved)
  const listSaved        = useGraphStore(s => s.listSaved)
  const nodeCount        = useGraphStore(s => s.nodes.length)

  const status           = useSimulationStore(s => s.status)
  const startSimulation  = useSimulationStore(s => s.startSimulation)
  const stopSimulation   = useSimulationStore(s => s.stopSimulation)
  const startInspect     = useSimulationStore(s => s.startInspect)
  const exitInspect      = useSimulationStore(s => s.exitInspect)
  const simSpeed         = useSimulationStore(s => s.simSpeed)
  const setSimSpeed      = useSimulationStore(s => s.setSimSpeed)

  const templateDD = useDropdown()
  const saveDD     = useDropdown()

  const [shareToast, setShareToast] = useState(false)
  const [savePrompt, setSavePrompt] = useState(false)
  const [saveName, setSaveName]     = useState('')
  const [savedGraphs, setSavedGraphs] = useState<SavedGraph[]>([])

  const errorCount = validationErrors.filter(e => e.type === 'error').length
  const isRunning  = status === 'running'
  const isInspect  = status === 'inspecting'
  const isActive   = isRunning || isInspect
  const canRun     = errorCount === 0 && nodeCount > 0

  const blockReasons = validationErrors.filter(e => e.type === 'error').map(e => e.message).slice(0, 3)

  // Refresh saved list when save dropdown opens
  useEffect(() => {
    if (saveDD.open) setSavedGraphs(listSaved())
  }, [saveDD.open, listSaved])

  async function handleShare() {
    const param = serializeToURL()
    const url = `${window.location.origin}${window.location.pathname}?g=${param}`
    try {
      await navigator.clipboard.writeText(url)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    } catch {
      window.prompt('Copy this URL:', url)
    }
  }

  function handleRunToggle() {
    if (isRunning) stopSimulation()
    else if (canRun) startSimulation()
  }

  function handleInspectToggle() {
    if (isInspect) exitInspect()
    else if (canRun && !isRunning) startInspect()
  }

  function handleSave() {
    const name = saveName.trim() || `Graph ${new Date().toLocaleTimeString()}`
    saveToLocal(name)
    setSaveName('')
    setSavePrompt(false)
    setSavedGraphs(listSaved())
  }

  const SPEEDS = [
    { label: '0.5×', value: 0.5, hint: 'Fast' },
    { label: '1×',   value: 1.0, hint: 'Normal' },
    { label: '2×',   value: 2.0, hint: 'Slow' },
  ]

  return (
    <div className="relative flex items-center gap-1 h-11 px-3 border-b border-white/[0.06] bg-[#080810]/95 backdrop-blur-md flex-shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-1.5 select-none flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.35)]">
          <LayersIcon />
        </div>
        <span className="text-[13px] font-semibold text-white/70 tracking-tight hidden sm:block">SD Playground</span>
      </div>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Templates dropdown */}
      <div className="relative" ref={templateDD.ref}>
        <Btn onClick={() => templateDD.setOpen(o => !o)} variant="ghost">
          <LayersIcon />
          <span>Templates</span>
          <ChevronIcon />
        </Btn>
        {templateDD.open && (
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#13131f] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono px-3 pt-2.5 pb-1">Architectures</p>
            {TEMPLATES.filter(t => t.badge !== 'Scenario').map(t => (
              <button
                key={t.id}
                onClick={() => {
                  if (isActive) stopSimulation()
                  loadTemplate(t.id)
                  templateDD.setOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors flex items-start gap-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-white/80 font-medium">{t.name}</span>
                    <span className={cn(
                      'text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide',
                      t.badge === 'Beginner'     && 'bg-emerald-500/15 text-emerald-400',
                      t.badge === 'Intermediate' && 'bg-blue-500/15 text-blue-400',
                      t.badge === 'Advanced'     && 'bg-violet-500/15 text-violet-400',
                    )}>{t.badge}</span>
                  </div>
                  <p className="text-[10px] text-white/35 font-mono mt-0.5 truncate">{t.description}</p>
                </div>
              </button>
            ))}
            <div className="border-t border-white/[0.06] mt-1">
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono px-3 pt-2.5 pb-1">Failure Scenarios</p>
              {TEMPLATES.filter(t => t.badge === 'Scenario').map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (isActive) stopSimulation()
                    loadTemplate(t.id)
                    templateDD.setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors flex items-start gap-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-white/80 font-medium">{t.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide bg-orange-500/15 text-orange-400">{t.badge}</span>
                    </div>
                    <p className="text-[10px] text-white/35 font-mono mt-0.5 truncate">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Run / Stop */}
      <div className="relative group">
        <Btn onClick={handleRunToggle} disabled={!isRunning && !canRun} variant={isRunning ? 'danger' : 'primary'}>
          {isRunning ? <StopIcon /> : <PlayIcon />}
          <span>{isRunning ? 'Stop' : 'Run'}</span>
          {!isRunning && errorCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500/80 text-[8px] font-bold flex items-center justify-center flex-shrink-0">
              {errorCount}
            </span>
          )}
        </Btn>
        {!isRunning && !canRun && blockReasons.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-64 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            <div className="bg-[#1a1a2a] border border-red-500/20 rounded-xl p-3 shadow-xl">
              <p className="text-[9px] text-red-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <WarnIcon /> Blocking issues
              </p>
              <div className="space-y-1">
                {blockReasons.map((msg, i) => (
                  <p key={i} className="text-[10px] text-white/45 font-mono leading-relaxed">• {msg}</p>
                ))}
              </div>
              <p className="text-[9px] text-white/25 mt-2 border-t border-white/[0.06] pt-2">
                Fix in the config panel, or load a Template
              </p>
            </div>
          </div>
        )}
        {!isRunning && nodeCount === 0 && (
          <div className="absolute top-full left-0 mt-2 w-52 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            <div className="bg-[#1a1a2a] border border-white/10 rounded-xl p-3 shadow-xl">
              <p className="text-[10px] text-white/40 font-mono">Drag components onto the canvas, or pick a Template to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Inspect */}
      <Btn onClick={handleInspectToggle} disabled={!isInspect && (!canRun || isRunning)} variant={isInspect ? 'warning' : 'ghost'}>
        <InspectIcon />
        <span>{isInspect ? 'Exit Inspect' : 'Inspect'}</span>
      </Btn>

      {/* Speed control — only visible when running */}
      {isRunning && (
        <>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg px-1 py-1 border border-white/[0.07]">
            {SPEEDS.map(s => (
              <button
                key={s.value}
                onClick={() => setSimSpeed(s.value)}
                title={s.hint}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono transition-all',
                  simSpeed === s.value
                    ? 'bg-white/15 text-white/90'
                    : 'text-white/35 hover:text-white/60 hover:bg-white/[0.05]'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Save / Load */}
      <div className="relative" ref={saveDD.ref}>
        <Btn onClick={() => saveDD.setOpen(o => !o)} variant="ghost" disabled={nodeCount === 0 && savedGraphs.length === 0}>
          <SaveIcon />
          <span>Saved</span>
          <ChevronIcon />
        </Btn>
        {saveDD.open && (
          <div className="absolute top-full right-0 mt-1.5 w-60 bg-[#13131f] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Save current */}
            {nodeCount > 0 && (
              <div className="p-2.5 border-b border-white/[0.06]">
                {savePrompt ? (
                  <div className="flex gap-1.5">
                    <input
                      autoFocus
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSavePrompt(false) }}
                      placeholder="Graph name…"
                      className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white/80 placeholder-white/25 focus:outline-none focus:border-violet-500/50"
                    />
                    <button onClick={handleSave} className="px-2 py-1 bg-violet-600/60 hover:bg-violet-600/80 text-white/90 rounded-lg text-[10px] font-medium transition-colors">Save</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSavePrompt(true)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-[11px] text-white/55 hover:text-white/80 transition-colors flex items-center gap-2"
                  >
                    <SaveIcon /> Save current graph…
                  </button>
                )}
              </div>
            )}

            {/* Saved list */}
            {savedGraphs.length === 0 ? (
              <p className="text-[10px] text-white/25 font-mono text-center py-4">No saved graphs yet</p>
            ) : (
              <div className="max-h-52 overflow-y-auto">
                <p className="text-[9px] text-white/25 uppercase tracking-widest font-mono px-3 pt-2 pb-1">Your Graphs</p>
                {savedGraphs.map((g, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 hover:bg-white/[0.04] group">
                    <button
                      onClick={() => { loadFromLocal(i); saveDD.setOpen(false); if (isActive) stopSimulation() }}
                      className="flex-1 text-left"
                    >
                      <p className="text-[11px] text-white/70 font-medium">{g.name}</p>
                      <p className="text-[9px] text-white/25 font-mono">
                        {new Date(g.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                    <button
                      onClick={() => { deleteSaved(i); setSavedGraphs(listSaved()) }}
                      className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all p-1"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share */}
      <Btn onClick={handleShare} variant="ghost" disabled={nodeCount === 0}>
        <ShareIcon />
        <span>{shareToast ? 'Copied!' : 'Share'}</span>
      </Btn>

      {/* Clear */}
      <Btn onClick={() => { if (isActive) stopSimulation(); resetGraph() }} variant="ghost" disabled={nodeCount === 0}>
        <TrashIcon />
        <span>Clear</span>
      </Btn>
    </div>
  )
}

// ─── Tiny button primitive ────────────────────────────────────────────────────

interface BtnProps {
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost' | 'danger' | 'warning'
  children: React.ReactNode
}

function Btn({ onClick, disabled, variant = 'ghost', children }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 select-none flex-shrink-0',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 hover:border-emerald-400/40',
        variant === 'danger'  && 'bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25 hover:border-red-400/40',
        variant === 'warning' && 'bg-violet-500/15 text-violet-300 border border-violet-500/25 hover:bg-violet-500/25',
        variant === 'ghost'   && 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]',
      )}
    >
      {children}
    </button>
  )
}
