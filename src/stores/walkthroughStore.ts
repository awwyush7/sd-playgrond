import { create } from 'zustand'

export interface TourStep {
  target: string | null
  title: string
  body: string
  placement: 'center' | 'right' | 'bottom' | 'top' | 'left'
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Welcome to SD Playground',
    body: 'Simulate distributed systems in your browser — no code, no servers. Wire components, configure routing, and watch HTTP requests flow through your architecture in real time.',
    placement: 'center',
  },
  {
    target: '[data-tour="palette"]',
    title: 'Component Palette',
    body: 'Drag any node from here onto the canvas. Each one simulates real infrastructure — with configurable latency, error rates, queue limits, and routing rules.',
    placement: 'right',
  },
  {
    target: '[data-tour="toolbar-templates"]',
    title: 'Start with a Template',
    body: 'Not sure where to begin? Load a pre-built architecture in one click — 3-Tier Web App, Microservices, or a failure scenario to watch things break intentionally.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="toolbar-run"]',
    title: 'Run the Simulation',
    body: 'Click Run to animate live traffic. The moving dots are HTTP requests. Queue depths, error rates, and P99 latency update every second — watch for the orange bottleneck indicator.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="toolbar-inspect"]',
    title: 'Inspect Mode',
    body: 'Captures a single request and lets you step through each hop — which routing rule matched, which node handled it, and the total latency accumulated along the way.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="config-panel"]',
    title: 'Configure & Learn',
    body: 'Click any node on the canvas to edit its settings here — latency, error rate, routing rules. Switch to the Learn tab for a deep dive into the concept behind each node type.',
    placement: 'right',
  },
  {
    target: null,
    title: "You're all set!",
    body: 'Start with the 3-Tier Web App template, crank up the client RPS, then watch what breaks first. That\'s the fastest way to build real systems intuition.',
    placement: 'center',
  },
]

interface WalkthroughStore {
  active: boolean
  step: number
  start: () => void
  next: () => void
  prev: () => void
  skip: () => void
}

export const useWalkthroughStore = create<WalkthroughStore>((set, get) => ({
  active: false,
  step: 0,
  start: () => set({ active: true, step: 0 }),
  next: () => {
    const { step } = get()
    if (step >= TOUR_STEPS.length - 1) {
      localStorage.setItem('sd-tour-seen', '1')
      set({ active: false, step: 0 })
    } else {
      set({ step: step + 1 })
    }
  },
  prev: () => set(s => ({ step: Math.max(0, s.step - 1) })),
  skip: () => {
    localStorage.setItem('sd-tour-seen', '1')
    set({ active: false, step: 0 })
  },
}))
