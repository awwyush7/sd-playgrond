import { useState } from 'react'
import { LEARN_CONTENT } from '../../data/learnContent'
import type { NodeType } from '../../types'

const NODE_COLOR: Record<NodeType, string> = {
  client:          '#3B82F6',
  gateway:         '#8B5CF6',
  'load-balancer': '#F97316',
  service:         '#22C55E',
  cache:           '#EF4444',
  database:        '#F59E0B',
}

const ExternalIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

interface Props {
  nodeType: NodeType
}

export function LearnPanel({ nodeType }: Props) {
  const content = LEARN_CONTENT[nodeType]
  const color = NODE_COLOR[nodeType]
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null)

  if (!content) return null

  return (
    <div className="space-y-4 pb-4">

      {/* Tagline */}
      <p className="text-[11px] text-white/60 leading-relaxed">
        {content.tagline}
      </p>

      {/* Why section */}
      <Section label="Why it exists" color={color}>
        <p className="text-[10.5px] text-white/50 leading-relaxed">
          {content.why}
        </p>
      </Section>

      {/* Insight callout */}
      <div
        className="rounded-xl p-2.5 border"
        style={{
          background: `${color}0d`,
          borderColor: `${color}25`,
        }}
      >
        {content.insightLabel && (
          <span
            className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5"
            style={{ background: `${color}22`, color }}
          >
            {content.insightLabel}
          </span>
        )}
        <p className="text-[10px] leading-relaxed" style={{ color: `${color}cc` }}>
          {content.insight}
        </p>
      </div>

      {/* Key concepts */}
      <Section label="Key Concepts" color={color}>
        <div className="flex flex-wrap gap-1.5">
          {content.concepts.map(c => (
            <button
              key={c.label}
              onClick={() => setExpandedConcept(expandedConcept === c.label ? null : c.label)}
              className="text-[9px] px-2 py-1 rounded-lg border transition-all duration-150 text-left"
              style={
                expandedConcept === c.label
                  ? { background: `${color}20`, borderColor: `${color}50`, color }
                  : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }
              }
            >
              {c.label}
            </button>
          ))}
        </div>
        {/* Expanded concept explanation */}
        {expandedConcept && (
          <div
            className="mt-2 rounded-lg p-2.5 text-[10px] leading-relaxed border"
            style={{
              background: `${color}0a`,
              borderColor: `${color}20`,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {content.concepts.find(c => c.label === expandedConcept)?.tip}
          </div>
        )}
      </Section>

      {/* Real-world */}
      <Section label="Real-world" color={color}>
        <div className="flex flex-wrap gap-1">
          {content.realWorld.map(item => (
            <span
              key={item}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40 border border-white/[0.07]"
            >
              {item}
            </span>
          ))}
        </div>
      </Section>

      {/* Free resources */}
      <Section label="Free Resources" color={color}>
        <div className="space-y-1.5">
          {content.resources.map(r => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 group rounded-lg p-2 -mx-1 hover:bg-white/[0.04] transition-colors"
            >
              <ExternalIcon />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-white/65 group-hover:text-white/85 transition-colors leading-snug">
                  {r.title}
                </p>
                <p className="text-[9px] text-white/25 font-mono">{r.source}</p>
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* Teaser for paid advanced topics */}
      <div className="rounded-xl border border-dashed border-white/[0.08] p-3 flex items-start gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <p className="text-[9px] text-white/25 leading-relaxed">
          Advanced topics — Kafka, streaming, read replicas, rate limiting, db sharding — coming in Pro.
        </p>
      </div>
    </div>
  )
}

function Section({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/35">{label}</span>
      </div>
      {children}
    </div>
  )
}
