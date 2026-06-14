import { useState, useRef, useEffect } from 'react'
import {
  Play, Square, ScanSearch, Share2, Trash2, ChevronDown,
  Save, LayoutTemplate, AlertCircle, Sun, Moon, BookmarkPlus,
} from 'lucide-react'
import { useGraphStore } from '../../stores/graphStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { useThemeStore } from '../../stores/themeStore'
import { loadTemplate, TEMPLATES } from '../../utils/templates'
import { cn } from '../../utils/cn'
import type { SavedGraph } from '../../stores/graphStore'

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

export function Toolbar() {
  const validationErrors = useGraphStore(s => s.validationErrors)
  const resetGraph       = useGraphStore(s => s.resetGraph)
  const serializeToURL   = useGraphStore(s => s.serializeToURL)
  const saveToLocal      = useGraphStore(s => s.saveToLocal)
  const loadFromLocal    = useGraphStore(s => s.loadFromLocal)
  const deleteSaved      = useGraphStore(s => s.deleteSaved)
  const listSaved        = useGraphStore(s => s.listSaved)
  const nodeCount        = useGraphStore(s => s.nodes.length)

  const status          = useSimulationStore(s => s.status)
  const startSimulation = useSimulationStore(s => s.startSimulation)
  const stopSimulation  = useSimulationStore(s => s.stopSimulation)
  const startInspect    = useSimulationStore(s => s.startInspect)
  const exitInspect     = useSimulationStore(s => s.exitInspect)
  const simSpeed        = useSimulationStore(s => s.simSpeed)
  const setSimSpeed     = useSimulationStore(s => s.setSimSpeed)

  const theme       = useThemeStore(s => s.theme)
  const toggleTheme = useThemeStore(s => s.toggleTheme)

  const templateDD = useDropdown()
  const saveDD     = useDropdown()

  const [shareToast,  setShareToast]  = useState(false)
  const [savePrompt,  setSavePrompt]  = useState(false)
  const [saveName,    setSaveName]    = useState('')
  const [savedGraphs, setSavedGraphs] = useState<SavedGraph[]>([])

  const errorCount   = validationErrors.filter(e => e.type === 'error').length
  const isRunning    = status === 'running'
  const isInspect    = status === 'inspecting'
  const isActive     = isRunning || isInspect
  const canRun       = errorCount === 0 && nodeCount > 0
  const blockReasons = validationErrors.filter(e => e.type === 'error').map(e => e.message).slice(0, 3)

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
    { label: '0.5×', value: 0.5 },
    { label: '1×',   value: 1.0 },
    { label: '2×',   value: 2.0 },
  ]

  return (
    <div className="relative flex items-center gap-1 h-11 px-3 border-b border-ui bg-surface/95 backdrop-blur-md flex-shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-1.5 select-none flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.3)]">
          <LayoutTemplate size={12} color="white" strokeWidth={2} />
        </div>
        <span className="text-[13px] font-semibold text-1 tracking-tight hidden sm:block">SD Playground</span>
      </div>

      <div className="w-px h-4 bg-ui mx-1" />

      {/* Templates */}
      <div className="relative" ref={templateDD.ref}>
        <Btn onClick={() => templateDD.setOpen(o => !o)} variant="ghost">
          <LayoutTemplate size={11} />
          <span>Templates</span>
          <ChevronDown size={10} />
        </Btn>
        {templateDD.open && (
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-surface border border-ui rounded-xl shadow-2xl z-50 overflow-hidden">
            <p className="text-[9px] text-3 uppercase tracking-widest font-mono px-3 pt-2.5 pb-1">Architectures</p>
            {TEMPLATES.filter(t => t.badge !== 'Scenario').map(t => (
              <button
                key={t.id}
                onClick={() => { if (isActive) stopSimulation(); loadTemplate(t.id); templateDD.setOpen(false) }}
                className="w-full text-left px-3 py-2 hover:bg-lift transition-colors flex items-start gap-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-1 font-medium">{t.name}</span>
                    <span className={cn(
                      'text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide',
                      t.badge === 'Beginner'     && 'bg-emerald-500/15 text-emerald-500',
                      t.badge === 'Intermediate' && 'bg-blue-500/15 text-blue-500',
                      t.badge === 'Advanced'     && 'bg-violet-500/15 text-violet-500',
                    )}>{t.badge}</span>
                  </div>
                  <p className="text-[10px] text-3 font-mono mt-0.5 truncate">{t.description}</p>
                </div>
              </button>
            ))}
            <div className="border-t border-ui mt-1">
              <p className="text-[9px] text-3 uppercase tracking-widest font-mono px-3 pt-2.5 pb-1">Failure Scenarios</p>
              {TEMPLATES.filter(t => t.badge === 'Scenario').map(t => (
                <button
                  key={t.id}
                  onClick={() => { if (isActive) stopSimulation(); loadTemplate(t.id); templateDD.setOpen(false) }}
                  className="w-full text-left px-3 py-2 hover:bg-lift transition-colors flex items-start gap-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-1 font-medium">{t.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide bg-orange-500/15 text-orange-500">Scenario</span>
                    </div>
                    <p className="text-[10px] text-3 font-mono mt-0.5 truncate">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-ui mx-1" />

      {/* Run / Stop */}
      <div className="relative group">
        <Btn onClick={handleRunToggle} disabled={!isRunning && !canRun} variant={isRunning ? 'danger' : 'primary'}>
          {isRunning ? <Square size={10} /> : <Play size={10} />}
          <span>{isRunning ? 'Stop' : 'Run'}</span>
          {!isRunning && errorCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500/80 text-[8px] font-bold flex items-center justify-center flex-shrink-0 text-white">
              {errorCount}
            </span>
          )}
        </Btn>
        {!isRunning && !canRun && blockReasons.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-64 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            <div className="bg-surface border border-red-500/20 rounded-xl p-3 shadow-xl">
              <p className="text-[9px] text-red-500 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertCircle size={10} /> Blocking issues
              </p>
              <div className="space-y-1">
                {blockReasons.map((msg, i) => (
                  <p key={i} className="text-[10px] text-2 font-mono leading-relaxed">• {msg}</p>
                ))}
              </div>
              <p className="text-[9px] text-3 mt-2 border-t border-ui pt-2">Fix in the config panel, or load a Template</p>
            </div>
          </div>
        )}
        {!isRunning && nodeCount === 0 && (
          <div className="absolute top-full left-0 mt-2 w-52 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            <div className="bg-surface border border-ui rounded-xl p-3 shadow-xl">
              <p className="text-[10px] text-2 font-mono">Drag components onto the canvas, or pick a Template to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Inspect */}
      <Btn onClick={handleInspectToggle} disabled={!isInspect && (!canRun || isRunning)} variant={isInspect ? 'warning' : 'ghost'}>
        <ScanSearch size={11} />
        <span>{isInspect ? 'Exit Inspect' : 'Inspect'}</span>
      </Btn>

      {/* Speed control */}
      {isRunning && (
        <>
          <div className="w-px h-4 bg-ui mx-1" />
          <div className="flex items-center gap-1 bg-lift rounded-lg px-1 py-1 border border-ui">
            {SPEEDS.map(s => (
              <button
                key={s.value}
                onClick={() => setSimSpeed(s.value)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono transition-all',
                  simSpeed === s.value ? 'bg-elevated text-1' : 'text-3 hover:text-2'
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
          <Save size={11} />
          <span>Saved</span>
          <ChevronDown size={10} />
        </Btn>
        {saveDD.open && (
          <div className="absolute top-full right-0 mt-1.5 w-60 bg-surface border border-ui rounded-xl shadow-2xl z-50 overflow-hidden">
            {nodeCount > 0 && (
              <div className="p-2.5 border-b border-ui">
                {savePrompt ? (
                  <div className="flex gap-1.5">
                    <input
                      autoFocus
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSavePrompt(false) }}
                      placeholder="Graph name…"
                      className="flex-1 bg-field border border-ui rounded-lg px-2 py-1 text-[11px] text-1 placeholder-text-3 focus:outline-none focus:border-violet-500/50"
                    />
                    <button onClick={handleSave} className="px-2 py-1 bg-violet-600/60 hover:bg-violet-600/80 text-white/90 rounded-lg text-[10px] font-medium transition-colors">Save</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSavePrompt(true)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-lift text-[11px] text-2 hover:text-1 transition-colors flex items-center gap-2"
                  >
                    <BookmarkPlus size={12} /> Save current graph…
                  </button>
                )}
              </div>
            )}
            {savedGraphs.length === 0 ? (
              <p className="text-[10px] text-3 font-mono text-center py-4">No saved graphs yet</p>
            ) : (
              <div className="max-h-52 overflow-y-auto">
                <p className="text-[9px] text-3 uppercase tracking-widest font-mono px-3 pt-2 pb-1">Your Graphs</p>
                {savedGraphs.map((g, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 hover:bg-lift group">
                    <button
                      onClick={() => { loadFromLocal(i); saveDD.setOpen(false); if (isActive) stopSimulation() }}
                      className="flex-1 text-left"
                    >
                      <p className="text-[11px] text-1 font-medium">{g.name}</p>
                      <p className="text-[9px] text-3 font-mono">
                        {new Date(g.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                    <button
                      onClick={() => { deleteSaved(i); setSavedGraphs(listSaved()) }}
                      className="opacity-0 group-hover:opacity-100 text-3 hover:text-red-500 transition-all p-1"
                    >
                      <Trash2 size={11} />
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
        <Share2 size={11} />
        <span>{shareToast ? 'Copied!' : 'Share'}</span>
      </Btn>

      {/* Clear */}
      <Btn onClick={() => { if (isActive) stopSimulation(); resetGraph() }} variant="ghost" disabled={nodeCount === 0}>
        <Trash2 size={11} />
        <span>Clear</span>
      </Btn>

      <div className="w-px h-4 bg-ui mx-1" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-2 hover:text-1 hover:bg-lift transition-all"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
      </button>
    </div>
  )
}

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
        variant === 'primary' && 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
        variant === 'danger'  && 'bg-red-500/12 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20',
        variant === 'warning' && 'bg-violet-500/12 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20',
        variant === 'ghost'   && 'text-2 hover:text-1 hover:bg-lift',
      )}
    >
      {children}
    </button>
  )
}
