# SD Playground

A visual, interactive simulator for distributed systems. Wire up nodes, configure routing rules, hit **Run**, and watch HTTP requests animate through your architecture in real time.

Built for engineers and learners who want to build intuition about how distributed systems behave — not just read about them.

---

## What it does

- **Drag-and-drop canvas** — place Clients, API Gateways, Load Balancers, Services, Caches, and Databases
- **Live packet animation** — dots travel the edges at configurable speed, colored by outcome (green = success, red = error, orange = dropped)
- **Per-node metrics** — RPS, error rate, P99 latency, and queue depth update in real time via a token-bucket simulation engine
- **Routing rules** — configure path-prefix rules on gateways; watch unmatched requests drop
- **Multi-route clients** — each client sends multiple request types (method + path + RPS) independently
- **Inspect mode** — step through a single request hop-by-hop, seeing every routing decision
- **Failure scenarios** — pre-built templates that demonstrate DB connection pool saturation and the before/after effect of a cache layer
- **URL sharing** — every graph serializes to a shareable `?g=` param; graphs load instantly on open
- **Save / load** — local graph storage, no account needed

---

## Templates

| Name | Level | Description |
|---|---|---|
| 3-Tier Web App | Beginner | Client → Gateway → Service → Database |
| Load Balanced + Cache | Intermediate | Two service replicas, Redis look-aside, Postgres |
| Microservices | Advanced | Auth + Product services with separate databases |
| DB Overload | Scenario | 80 RPS vs a 3-connection pool — watch the queue climb |
| Cache Effect | Scenario | Same load with Redis at 85% hit rate — DB queue drops to near zero |

---

## Tech stack

- **React 19** + **TypeScript**
- **@xyflow/react v12** — canvas and node rendering
- **Zustand** — simulation + graph state
- **Tailwind CSS v4**
- **Vite 8**

No backend. No database. Fully client-side — the URL *is* the save format.

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build → dist/
npm run preview # preview the production build locally
```

---

## How the simulation works

The engine runs a 100ms tick loop:

1. **GENERATE** — each client route accumulates `rps / 10` credits per tick (token bucket); emits `floor(credits)` packets and carries the fractional remainder. Gives stable, exact RPS with no variance.
2. **ADVANCE** — in-flight packets move along their edge. Progress uses wall-clock time (`(now - startTime) / transitMs`) for smooth 60fps animation independent of tick rate.
3. **ROUTE** — when a packet arrives at a node, the router runs: gateway matches path-prefix rules, load balancer round-robins, cache probabilistically hits or misses, service applies latency + error rate.
4. **PRUNE** — terminal packets (completed / dropped / failed) are removed after 2 seconds.

Packets generated in a tick are skipped during that same tick's ADVANCE phase to prevent same-tick double-advancement.

---

## Project structure

```
src/
  components/
    nodes/        # ClientNode, GatewayNode, LoadBalancerNode, ServiceNode, CacheNode, DatabaseNode
    panels/       # Config panels for each node type
    ui/           # Toolbar, Palette, ConfigPanel, MetricsBar, PacketOverlay, SimObserver, …
  data/
    learnContent.ts   # Per-node educational content (Learn tab)
  simulation/
    engine.ts     # Tick loop — GENERATE → ADVANCE → PRUNE
    router.ts     # Per-node routing logic
    validator.ts  # Graph validation + architectural hints
    inspector.ts  # Inspect mode trace builder
  stores/
    graphStore.ts       # Node/edge state, validation, save/load
    simulationStore.ts  # Simulation lifecycle, metrics, speed
  types/
    index.ts      # All shared types
  utils/
    templates.ts  # Template graph builders
    urlShare.ts   # Serialize / deserialize graph to URL param
```

---

## License

MIT
