import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useWalkthroughStore, TOUR_STEPS } from '../../stores/walkthroughStore'

const TIP_W = 296
const PAD = 8

type Rect = { x: number; y: number; w: number; h: number }

export function Walkthrough() {
  const { active, step, next, prev, skip } = useWalkthroughStore()
  const [rect, setRect] = useState<Rect | null>(null)

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const isFirst = step === 0

  // Measure target element position
  useEffect(() => {
    if (!active) return
    if (!current.target) { setRect(null); return }

    function measure() {
      const el = document.querySelector(current.target!)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active, step, current.target])

  // Keyboard shortcuts
  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') skip()
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); isLast ? skip() : next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, isLast, next, prev, skip])

  if (!active) return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  // Compute tooltip position
  let tipStyle: React.CSSProperties = { position: 'fixed', width: TIP_W, zIndex: 602 }

  if (!rect || current.placement === 'center') {
    tipStyle = { ...tipStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  } else if (current.placement === 'right') {
    const left = rect.x + rect.w + 16
    const top = Math.max(12, Math.min(rect.y + rect.h / 2 - 100, vh - 240))
    tipStyle = left + TIP_W > vw - 12
      ? { ...tipStyle, right: vw - rect.x + 12, top }
      : { ...tipStyle, left, top }
  } else if (current.placement === 'bottom') {
    const top = rect.y + rect.h + 12
    const left = Math.max(12, Math.min(rect.x + rect.w / 2 - TIP_W / 2, vw - TIP_W - 12))
    tipStyle = { ...tipStyle, top, left }
  } else if (current.placement === 'top') {
    const bottom = vh - rect.y + 12
    const left = Math.max(12, Math.min(rect.x + rect.w / 2 - TIP_W / 2, vw - TIP_W - 12))
    tipStyle = { ...tipStyle, bottom, left }
  } else if (current.placement === 'left') {
    const left = Math.max(12, rect.x - TIP_W - 16)
    const top = Math.max(12, Math.min(rect.y + rect.h / 2 - 100, vh - 240))
    tipStyle = { ...tipStyle, left, top }
  }

  const advance = isLast ? skip : next

  return (
    <>
      {/* Spotlight: 4-panel approach cuts a hole around the target */}
      {rect ? (
        <>
          <div className="fixed inset-x-0 top-0 bg-black/55 z-[600] cursor-default" style={{ height: Math.max(0, rect.y) }} onClick={advance} />
          <div className="fixed inset-x-0 bottom-0 bg-black/55 z-[600] cursor-default" style={{ top: rect.y + rect.h }} onClick={advance} />
          <div className="fixed left-0 bg-black/55 z-[600] cursor-default" style={{ top: rect.y, height: rect.h, width: Math.max(0, rect.x) }} onClick={advance} />
          <div className="fixed right-0 bg-black/55 z-[600] cursor-default" style={{ top: rect.y, height: rect.h, left: rect.x + rect.w }} onClick={advance} />
          {/* Violet ring around the spotlit element */}
          <div
            className="fixed pointer-events-none z-[601] rounded-xl transition-all duration-300"
            style={{
              top: rect.y, left: rect.x, width: rect.w, height: rect.h,
              boxShadow: '0 0 0 2px rgba(139,92,246,0.75), 0 0 32px rgba(139,92,246,0.2)',
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/55 z-[600] cursor-default" onClick={advance} />
      )}

      {/* Tooltip card */}
      <div
        style={tipStyle}
        className="bg-surface border border-ui rounded-2xl shadow-2xl p-4 select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Step progress bar */}
        <div className="flex items-center gap-1 mb-3">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className="h-[3px] rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 7,
                background: i < step
                  ? 'rgba(139,92,246,0.4)'
                  : i === step
                    ? 'rgb(139,92,246)'
                    : 'var(--border)',
              }}
            />
          ))}
        </div>

        <p className="text-[9px] text-3 font-mono uppercase tracking-wider mb-1.5">
          {step + 1} / {TOUR_STEPS.length}
        </p>
        <h3 className="text-[13px] font-semibold text-1 leading-snug mb-1.5">{current.title}</h3>
        <p className="text-[11px] text-2 leading-relaxed mb-4">{current.body}</p>

        <div className="flex items-center justify-between">
          {!isLast ? (
            <button onClick={skip} className="text-[10px] text-3 hover:text-2 transition-colors font-mono">
              Skip tour
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="px-3 py-1.5 rounded-lg text-[11px] text-2 hover:text-1 hover:bg-lift transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={advance}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-all flex items-center gap-1.5"
            >
              {isLast ? 'Done' : 'Next'}
              {!isLast && <ArrowRight size={10} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
