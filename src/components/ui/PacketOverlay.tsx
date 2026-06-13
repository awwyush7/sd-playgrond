import { useEffect, useRef } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'
import type { Packet, PacketStatus } from '../../types'

const STATUS_COLOR: Record<PacketStatus, string> = {
  pending: '#94a3b8',
  'in-flight': '#22C55E',
  completed: '#22C55E',
  failed: '#EF4444',
  dropped: '#F97316',
}

// Colors for terminal burst rings
const BURST_COLOR: Partial<Record<PacketStatus, string>> = {
  completed: '#22C55E',
  failed:    '#EF4444',
  dropped:   '#F97316',
}

const BURST_DURATION = 700  // ms

type Point = { x: number; y: number }
interface Burst { pos: Point; color: string; startTime: number }

export function PacketOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const packetsRef = useRef<Map<string, Packet>>(new Map())
  const prevStatusRef = useRef<Map<string, PacketStatus>>(new Map())
  const burstsRef = useRef<Burst[]>([])

  const packets = useSimulationStore(s => s.packets)

  useEffect(() => {
    packetsRef.current = packets
  }, [packets])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resizeCanvas() {
      if (!canvas) return
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = `${parent.clientWidth}px`
      canvas.style.height = `${parent.clientHeight}px`
    }

    resizeCanvas()
    const ro = new ResizeObserver(resizeCanvas)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    function getEdgePoint(edgeId: string, t: number): Point | null {
      const pathEl = canvas?.parentElement?.querySelector<SVGPathElement>(
        `.react-flow__edge[data-id="${edgeId}"] .react-flow__edge-path`
      )
      if (!pathEl) return null
      try {
        const len = pathEl.getTotalLength()
        if (len === 0) return null
        const svgPt = pathEl.getPointAtLength(len * Math.max(0, Math.min(1, t)))
        const ctm = pathEl.getScreenCTM()
        if (!ctm) return null
        const screenPt = svgPt.matrixTransform(ctm)
        const cr = canvas!.getBoundingClientRect()
        const dpr = window.devicePixelRatio
        return { x: (screenPt.x - cr.left) * dpr, y: (screenPt.y - cr.top) * dpr }
      } catch { return null }
    }

    function getNodeCenter(nodeId: string): Point | null {
      const el = canvas?.parentElement?.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${nodeId}"]`
      )
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const cr = canvas!.getBoundingClientRect()
      const dpr = window.devicePixelRatio
      return {
        x: (rect.left + rect.width / 2 - cr.left) * dpr,
        y: (rect.top + rect.height / 2 - cr.top) * dpr,
      }
    }

    function drawDot(ctx: CanvasRenderingContext2D, pos: Point, color: string, alpha: number) {
      const dpr = window.devicePixelRatio
      const r = 4.5 * dpr
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.shadowColor = color
      ctx.shadowBlur = 10 * dpr
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = alpha * 0.9
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, r * 0.38, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    function drawBurst(ctx: CanvasRenderingContext2D, burst: Burst, now: number) {
      const dpr = window.devicePixelRatio
      const age = now - burst.startTime
      const progress = age / BURST_DURATION  // 0→1
      if (progress >= 1) return

      const alpha = Math.max(0, 1 - progress)
      const baseR = 5 * dpr
      const r = baseR * (1 + progress * 4)  // expand from 5px to 25px

      ctx.save()
      ctx.globalAlpha = alpha * 0.7
      ctx.strokeStyle = burst.color
      ctx.lineWidth = 1.5 * dpr * (1 - progress * 0.5)
      ctx.shadowColor = burst.color
      ctx.shadowBlur = 8 * dpr * (1 - progress)
      ctx.beginPath()
      ctx.arc(burst.pos.x, burst.pos.y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const now = Date.now()

      // Detect newly terminal packets → spawn burst
      for (const [id, packet] of packetsRef.current) {
        const prev = prevStatusRef.current.get(id)
        if (
          prev === 'in-flight' &&
          (packet.status === 'completed' || packet.status === 'failed' || packet.status === 'dropped')
        ) {
          const pos = getNodeCenter(packet.currentNodeId)
          const color = BURST_COLOR[packet.status] ?? '#94a3b8'
          if (pos) burstsRef.current.push({ pos, color, startTime: now })
        }
      }
      // Update previous status snapshot
      const newPrev = new Map<string, PacketStatus>()
      for (const [id, p] of packetsRef.current) newPrev.set(id, p.status)
      prevStatusRef.current = newPrev

      // Draw + prune bursts
      burstsRef.current = burstsRef.current.filter(b => now - b.startTime < BURST_DURATION)
      for (const burst of burstsRef.current) drawBurst(ctx, burst, now)

      // Draw in-flight / failed / dropped dots
      for (const packet of packetsRef.current.values()) {
        if (packet.status === 'pending' || packet.status === 'completed') continue

        const color = STATUS_COLOR[packet.status]
        let pos: Point | null = null
        let alpha = 1.0

        if (packet.status === 'in-flight' && packet.currentEdgeId) {
          const elapsed = now - packet.transitStartTime
          const t = elapsed / Math.max(1, packet.transitMs)
          pos = getEdgePoint(packet.currentEdgeId, t)
        }

        if (!pos && packet.currentNodeId) pos = getNodeCenter(packet.currentNodeId)
        if (!pos) continue

        if (packet.status === 'failed' || packet.status === 'dropped') {
          const age = packet.completedAt ? now - packet.completedAt : 0
          alpha = Math.max(0, 1 - age / 600)
          if (alpha <= 0) continue
        }

        drawDot(ctx, pos, color, alpha)
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
    />
  )
}
