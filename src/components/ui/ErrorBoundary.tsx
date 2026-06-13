import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : String(err)
    return { hasError: true, message }
  }

  handleReset() {
    // Clear any bad URL param, then reload
    const url = new URL(window.location.href)
    url.searchParams.delete('g')
    window.location.replace(url.toString())
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="max-w-sm w-full mx-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white/80 mb-1">Something went wrong</p>
            <p className="text-[11px] text-white/35 font-mono leading-relaxed">
              The simulation encountered an unexpected error. This is usually caused by a malformed shared graph URL.
            </p>
          </div>
          {this.state.message && (
            <p className="text-[9px] text-red-400/50 font-mono bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 w-full text-left break-all">
              {this.state.message}
            </p>
          )}
          <button
            onClick={() => this.handleReset()}
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[12px] text-white/65 font-medium transition-colors"
          >
            Reset &amp; Start Fresh
          </button>
        </div>
      </div>
    )
  }
}
