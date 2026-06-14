import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
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
      <p className="text-[11px] text-2 leading-relaxed">
        {content.tagline}
      </p>

      {/* Why section */}
      <Section label="Why it exists" color={color}>
        <p className="text-[10.5px] text-2 leading-relaxed">
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
                  : { background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text-2)' }
              }
            >
              {c.label}
            </button>
          ))}
        </div>
        {expandedConcept && (
          <div
            className="mt-2 rounded-lg p-2.5 text-[10px] leading-relaxed border"
            style={{
              background: `${color}0a`,
              borderColor: `${color}20`,
              color: 'var(--text-2)',
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
              className="text-[9px] px-1.5 py-0.5 rounded bg-lift text-3 border border-ui"
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
              className="flex items-start gap-2 group rounded-lg p-2 -mx-1 hover:bg-lift transition-colors"
            >
              <ExternalLink size={9} strokeWidth={2.5} className="text-3 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-2 group-hover:text-1 transition-colors leading-snug">
                  {r.title}
                </p>
                <p className="text-[9px] text-3 font-mono">{r.source}</p>
              </div>
            </a>
          ))}
        </div>
      </Section>

    </div>
  )
}

function Section({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[9px] font-semibold uppercase tracking-widest text-3">{label}</span>
      </div>
      {children}
    </div>
  )
}
