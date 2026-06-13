export interface Concept {
  label: string
  tip: string
}

export interface Resource {
  title: string
  source: string
  url: string
}

export interface NodeLearnContent {
  tagline: string
  why: string
  insight: string         // the "aha" moment — one sentence
  insightLabel?: string   // optional label like "Pro Tip" or "The Catch"
  concepts: Concept[]
  realWorld: string[]
  resources: Resource[]
}

export const LEARN_CONTENT: Record<string, NodeLearnContent> = {
  client: {
    tagline: 'Simulates end users sending HTTP requests to your system at a sustained rate.',
    why: "Traffic doesn't come from thin air. In production every request originates from a client — a browser, mobile app, or upstream service. Understanding how many requests hit your system (throughput) and what they look like (method, path) is the starting point of every capacity decision.",
    insight: 'At 10 RPS for 24h your system handles 864,000 requests/day — plan accordingly.',
    insightLabel: 'Scale math',
    concepts: [
      { label: 'RPS', tip: 'Requests per second — the primary unit of throughput. 10 RPS = 600 req/min = 36k req/hr.' },
      { label: 'P50 / P99', tip: 'Latency percentiles. P99 = the slowest 1% of requests. At 100 RPS that\'s 1 user/sec having a bad experience.' },
      { label: 'HTTP Methods', tip: 'GET reads, POST creates, PUT replaces, PATCH updates, DELETE removes. Gateways route on these.' },
      { label: 'Keep-Alive', tip: 'Reusing TCP connections across requests. Without it every request pays the TCP handshake tax (~1 RTT).' },
    ],
    realWorld: ['Browser', 'iOS / Android app', 'CLI tool', 'k6 / JMeter (load tests)', 'Internal service'],
    resources: [
      { title: 'HTTP: An Overview', source: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' },
      { title: 'Latency vs Throughput', source: 'AWS', url: 'https://aws.amazon.com/compare/the-difference-between-throughput-and-latency/' },
      { title: 'Load Testing 101', source: 'Grafana k6', url: 'https://k6.io/docs/get-started/running-k6/' },
    ],
  },

  gateway: {
    tagline: 'The single front door for all client requests — routes, authenticates, and protects your backend.',
    why: "Without a gateway every client must know the address of every service. When you restructure services you update every client. Auth logic gets duplicated. The gateway centralises all that: one endpoint, one place for rate limiting, one place for auth. Clients stay blissfully ignorant of your internal topology.",
    insight: 'Every rule fires in order — earlier rules shadow later ones. Put specific paths before broad ones.',
    insightLabel: 'Rule ordering',
    concepts: [
      { label: 'Routing rules', tip: 'Match on HTTP method + path prefix in order. First match wins. /api/users before /api covers the specific case.' },
      { label: 'Rate limiting', tip: 'Block clients exceeding N req/s. Protects services from abuse and accidental DDoS.' },
      { label: 'Auth / AuthZ', tip: 'Validate tokens once at the gateway instead of in every service. Single responsibility.' },
      { label: 'SSL termination', tip: 'Decrypt HTTPS at the gateway; services speak plain HTTP internally. Simpler certificates management.' },
    ],
    realWorld: ['AWS API Gateway', 'Kong', 'Traefik', 'Nginx', 'Apigee', 'Envoy'],
    resources: [
      { title: 'API Gateway Pattern', source: 'microservices.io', url: 'https://microservices.io/patterns/apigateway.html' },
      { title: 'API Gateway — Build vs Buy', source: 'The New Stack', url: 'https://thenewstack.io/api-gateway-use-cases-and-how-to-choose/' },
      { title: 'Rate Limiting Algorithms', source: 'Cloudflare Blog', url: 'https://blog.cloudflare.com/counting-things-a-lot-of-different-things/' },
    ],
  },

  'load-balancer': {
    tagline: 'Spreads traffic across service replicas so no single instance becomes the bottleneck.',
    why: "A single server can handle X requests/sec. When traffic grows to 3X you have two choices: scale up (bigger server, expensive, has a ceiling) or scale out (three identical servers, the LB routes to each). Scaling out is how every large system grows. The LB makes it invisible to clients — they see one address.",
    insight: 'Round-robin ignores server health. Least-connections adapts to varying request durations — use it when your service latency varies widely.',
    insightLabel: 'Which algorithm?',
    concepts: [
      { label: 'Round-robin', tip: 'Cycle through all instances in order. Simple and effective when requests are uniform in cost.' },
      { label: 'Least-connections', tip: 'Send to the instance with fewest active connections. Better for long or slow requests.' },
      { label: 'Health checks', tip: 'LB periodically pings each instance. Unhealthy instances stop receiving traffic automatically.' },
      { label: 'Layer 4 vs 7', tip: 'L4 routes on TCP/IP (fast, no HTTP awareness). L7 routes on URL/headers (smarter, slightly more overhead).' },
      { label: 'Sticky sessions', tip: 'Always route a given user to the same instance. Needed for server-side sessions, but breaks horizontal scaling benefits.' },
    ],
    realWorld: ['AWS ALB (L7)', 'AWS NLB (L4)', 'HAProxy', 'Nginx', 'Cloudflare', 'GCP Load Balancing'],
    resources: [
      { title: 'Load Balancing Explained', source: 'Nginx', url: 'https://www.nginx.com/resources/glossary/load-balancing/' },
      { title: 'System Design: Horizontal Scaling', source: 'ByteByteGo', url: 'https://blog.bytebytego.com/p/a-crash-course-in-scaling' },
      { title: 'Load Balancing Algorithms', source: 'Kemp', url: 'https://kemptechnologies.com/load-balancer/load-balancing-algorithms-techniques/' },
    ],
  },

  service: {
    tagline: 'The unit of business logic — handles requests, applies processing time and error rates.',
    why: "Services encapsulate a single capability (authentication, payments, user profiles). When one service is slow or failing it doesn't bring down the entire system — other services keep working. This isolation is the core value of service-oriented and microservice architectures.",
    insight: 'P99 = 500ms means 1 in 100 users waits half a second. At 1000 RPS that\'s 10 users/sec experiencing slow responses.',
    insightLabel: 'P99 matters',
    concepts: [
      { label: 'Latency', tip: 'Processing time per request. Includes CPU work, serialisation, internal calls. Does NOT include network or queue wait.' },
      { label: 'Error rate', tip: '% of requests that fail. Even 0.1% at 1000 RPS = 1 failed request/sec hitting your users.' },
      { label: 'P99 latency', tip: '99th percentile — the worst 1% experience. SLAs are often written as "P99 < 200ms".' },
      { label: 'Circuit breaker', tip: 'After N consecutive failures, stop calling the dependency and return an error immediately. Prevents cascading failures.' },
      { label: 'Retry + backoff', tip: 'Retry failed requests with exponential delay. Without backoff retries can amplify the problem.' },
    ],
    realWorld: ['Node.js / Express', 'Go HTTP handler', 'Python FastAPI', 'Java Spring Boot', 'Rust Axum'],
    resources: [
      { title: 'Microservices', source: 'Martin Fowler', url: 'https://martinfowler.com/articles/microservices.html' },
      { title: 'Circuit Breaker Pattern', source: 'Martin Fowler', url: 'https://martinfowler.com/bliki/CircuitBreaker.html' },
      { title: 'SLOs, SLIs, Error Budgets', source: 'Google SRE Book', url: 'https://sre.google/sre-book/service-level-objectives/' },
    ],
  },

  cache: {
    tagline: 'In-memory store that serves reads in microseconds — skipping the database for frequently-accessed data.',
    why: "Databases are optimised for durability, not speed. Every DB query touches disk, parses SQL, and acquires locks. A cache trades durability (data is lost on restart) for pure read speed. At 75% hit rate your database handles 4× less read load — it's the single biggest leverage point in read-heavy systems.",
    insight: '"There are only two hard things in CS: cache invalidation and naming things." — Phil Karlton. When data changes, stale cache entries are the enemy.',
    insightLabel: 'The hard part',
    concepts: [
      { label: 'Hit rate', tip: '% of reads served from cache. 75% = 75 of every 100 reads never touch the DB. The higher the better.' },
      { label: 'Cache-aside', tip: 'App checks cache first; on miss reads DB and populates cache. Most common pattern. You control what gets cached.' },
      { label: 'Write-through', tip: 'On every DB write, also update cache. Cache is always fresh. Higher write latency.' },
      { label: 'TTL', tip: 'Time-to-live: auto-expire entries after N seconds. Simplest cache invalidation — data gets stale but eventually corrects.' },
      { label: 'Eviction (LRU)', tip: 'When cache is full, evict the Least Recently Used entry. LFU (least frequently used) is better for skewed access patterns.' },
      { label: 'Thundering herd', tip: 'Cache entry expires → all concurrent requests miss → flood the DB simultaneously. Use lock-based or probabilistic early expiration.' },
    ],
    realWorld: ['Redis', 'Memcached', 'DynamoDB DAX', 'CDN edge cache', 'Varnish'],
    resources: [
      { title: 'Caching Best Practices', source: 'AWS', url: 'https://aws.amazon.com/caching/best-practices/' },
      { title: 'Redis Documentation', source: 'redis.io', url: 'https://redis.io/docs/get-started/' },
      { title: 'A Guide to Cache Invalidation', source: 'Cloudflare', url: 'https://www.cloudflare.com/learning/cdn/what-is-caching/' },
    ],
  },

  database: {
    tagline: 'Durable, ACID-compliant persistent storage — the ground truth of your system.',
    why: "Everything else can restart and lose state — services, caches, load balancers. The database is where data actually lives. This durability guarantee (write acknowledged = write persisted) comes at the cost of latency. Disk is ~100,000× slower than RAM. That's why everything else in this diagram exists: to minimise how often you hit the database.",
    insight: 'Connection pool exhaustion (Queue > 0 for sustained periods) is the most common DB-related production incident. Monitor it.',
    insightLabel: 'Watch the queue',
    concepts: [
      { label: 'Connection pool', tip: 'DB has a max connections limit (~100–200). Your app holds a pool of persistent connections and reuses them. Pool exhausted → queries queue.' },
      { label: 'Query latency', tip: 'Time from query sent to result received. Dominated by disk I/O. An index turns a full table scan (ms–seconds) into a B-tree lookup (sub-ms).' },
      { label: 'ACID', tip: 'Atomicity + Consistency + Isolation + Durability. What makes a relational DB safe for financial/critical data.' },
      { label: 'Index', tip: 'Pre-sorted B-tree on a column. Turns O(n) full scan into O(log n) lookup. Missing index = the most common perf bug.' },
      { label: 'Replication', tip: 'Primary accepts writes; replicas stay in sync. Replicas serve reads → scale read throughput. Primary fails → replica promoted.' },
      { label: 'Sharding', tip: 'Split data across multiple DB instances by a key (user ID % 4). Each shard handles a subset. Massive scale — massive operational complexity.' },
    ],
    realWorld: ['PostgreSQL', 'MySQL', 'MongoDB', 'DynamoDB', 'CockroachDB', 'Cassandra'],
    resources: [
      { title: 'Use The Index, Luke (free book)', source: 'use-the-index-luke.com', url: 'https://use-the-index-luke.com/' },
      { title: 'PostgreSQL Docs', source: 'postgresql.org', url: 'https://www.postgresql.org/docs/current/' },
      { title: 'Designing Data-Intensive Applications', source: 'DDIA summary', url: 'https://www.databass.dev/' },
    ],
  },
}
