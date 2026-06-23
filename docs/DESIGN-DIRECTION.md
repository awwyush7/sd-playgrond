# SD Playground — Design Direction

Goal: minimal, elite, non-cartoonish. The feel of a polished dev tool (Linear,
Vercel dashboard) — not a tutorial app or a game.

---

## What was wrong (critique summary)

Five issues the audit found, ordered by impact:

1. **Micro-text floor too low.** Body content rendered at 8–10px (`text-[8px]`,
   `text-[9px]`, `text-[10px]`) — including the SimObserver insight card, the
   LearnPanel prose, and stat labels. Real tools floor at 11px for readable
   content, 9px only for tertiary metadata.

2. **Badge overuse in EmptyState.** Every template card had a badge ("Beginner",
   "Intermediate", "Advanced", "Scenario"), plus three separate section headers
   with `uppercase tracking-widest font-mono` labels. The page read like
   onboarding documentation. Polished tools use a flat grid, not labeled buckets.

3. **Unicode symbols (`✓`, `✕`) in MetricsBar.** Render inconsistently across
   OS/font stacks; look decorative-casual against an otherwise Lucide icon-
   library UI.

4. **`!important` overrides on Handle classnames** competed with the global CSS
   rules in `index.css`, creating brittle specificity conflicts (this already
   caused one bug, fixed in commit `f2f44e1`).

5. **Scattered accent colors.** `violet-400`, `violet-600`, `#8B5CF6`, and
   `rgba(139,92,246,...)` all appeared in different files for the same semantic
   role (selection, focus, inspect highlight). No single source of truth.

---

## Design system

### Type scale

| Role               | Size        | Weight | Notes                        |
|--------------------|-------------|--------|------------------------------|
| Section heading    | 13px        | 600    | letter-spacing: -0.01em      |
| Body / config      | 11px        | 400–500|                              |
| Captions / labels  | 9–10px      | 500    | mono, uppercase OK at 9px    |
| Micro (badges only)| 8px         | 700    | uppercase, very short strings|

Floor: **11px for any text the user is expected to read.** 9px is acceptable for
metric labels and timestamps only.

### Spacing (4px base grid)

| Token   | px  | Primary use                                |
|---------|-----|--------------------------------------------|
| space-1 | 4px | Icon-to-label gap, badge internal padding  |
| space-2 | 8px | Row padding, stat row gaps                 |
| space-3 | 12px| Section padding within panels              |
| space-4 | 16px| Panel interior padding                     |
| space-6 | 24px| Between distinct sections                  |
| space-8 | 32px| Top-level layout gutters                   |

### Color palette (dark mode primary)

The base palette was already strong. Changes:

| Token          | Value                        | Change         |
|----------------|------------------------------|----------------|
| Canvas bg      | `#08080f`                    | no change      |
| Panel bg       | `#0f0f1a`                    | no change      |
| Surface elev.  | `#161625`                    | no change      |
| Border         | `rgba(255,255,255,0.08)`     | no change      |
| Node border    | `rgba(255,255,255,0.07)`     | was 0.10       |
| Text primary   | `rgba(255,255,255,0.88)`     | no change      |
| Text muted     | `rgba(255,255,255,0.52)`     | no change      |
| **Accent**     | **`#7C6AF7`**                | consolidated   |

**Single accent `#7C6AF7`** — muted indigo-violet. Not electric, not neon. Used
for: selection rings, inspect highlight, focused inputs, the SimInsight card left
border, the Inspect/Save button active state. Replaces the prior mix of
`violet-400`, `violet-600`, and `#8B5CF6` scattered across files.

Node status dot colors: `#4ADE80` (active), `#FB923C` (warn/saturated),
`#F87171` (error). Applied in MetricsBar global counters as well.

### Nodes

- Border slightly more recessive (`0.07` alpha vs prior `0.10`).
- Box-shadow added via `.react-flow__node > div`: `0 1px 3px rgba(0,0,0,0.4),
  0 0 0 1px rgba(255,255,255,0.04)` — gives depth without a glow.
- Selection ring uses `#7C6AF7` (unified accent).
- Metric values inside nodes use `tabular-nums` to prevent layout shift during
  live simulation updates.
- Handle `!important` overrides removed; global `.react-flow__handle` rule in
  `index.css` is authoritative.

### Motion

Two places only:

1. **`node-pulse` keyframe** (existing CSS) — signals a live/active node.
2. **`SimInsight` card** — `framer-motion` `AnimatePresence` with
   `{ opacity: 0, y: 8 }` → `{ opacity: 1, y: 0 }`, 200ms easeOut. The one
   and only framer-motion usage.

No other elements animate. Panel open/close, dropdowns, and palette hover use
CSS `transition-all duration-150` only.

---

## Retention hook: SimInsight card

**What it is.** After the user stops a simulation, a floating card appears at the
bottom-center of the canvas for 8 seconds, then fades out. It shows one concrete
insight derived from the final metrics snapshot:

- If a node had sustained queue depth > 3: identifies the bottleneck node and
  says what you'd do in production (add replicas).
- If >15% of requests were dropped: shows the drop percentage and hints at a
  circuit breaker.
- If a cache node was present and completedCount > 30: explains the cache-aside
  pattern was at work, invites comparison.
- Default: confirms the architecture held and suggests raising RPS.

**Why it works.** Most learners stop a simulation, glance at the numbers, and
leave. The insight card does the synthesis for them — it names the pattern, gives
it a real-world frame, and proposes the next experiment. That "I just understood
something" feeling is what makes a user return.

**Implementation.** `src/components/ui/SimInsight.tsx`. The simulation store
captures a `FinalSnapshot` (completedCount, droppedCount, metrics) at the moment
`stopSimulation()` is called, before counters reset. The component watches the
snapshot and generates a single sentence from it.

---

## Changes not made (out of scope)

- LearnPanel prose text: still at `text-[10.5px]`. Should be raised to 11px in a
  follow-up pass over the LearnPanel component.
- Template dropdown badges: still present in the dropdown. The architecture/
  scenario section headers provide sufficient context for the badge to remain.
- Node min-width: left at `min-w-[148px]`. Changing this risks layout shifts in
  saved graphs; deferred.
- Light mode canvas background gradient: unchanged.
