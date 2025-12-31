# Complete Architecture Index

**Master reference for all Pyrite architectural documentation.**

## Quick Navigation

| Category | Document | What You'll Learn |
|----------|----------|-------------------|
| 🏗️ **Overview** | [Architecture README](./README.md) | System layers, primitives, fundamental laws |
| 👨‍💻 **Build Guide** | [BUILD_GUIDE](./BUILD_GUIDE.md) | How a pro builds this system (TDD, bottom-up) |
| ⚛️ **Primitives** | [Core Primitives](./primitives/README.md) | Every atomic operation with contracts |
| 🔄 **Data Flow** | [Data Flow](./data-flow/README.md) | How data transforms through the system |
| 🎰 **State Machines** | [Work Effort State Machine](./state-machines/work-effort.md) | State transitions and invariants |
| 🧩 **Composition** | [Composition Patterns](./composition/README.md) | Repository, Decorator, Observer patterns |
| 📡 **Events** | [Event-Driven Design](./event-driven/README.md) | Event bus, handlers, event sourcing |
| ⚙️ **Constants** | [Constants & Config](./constants/README.md) | All magic numbers, enums, lookup tables |
| ⏱️ **Async** | [Queues & Event Loops](./queues/README.md) | Job queues, workers, concurrency |
| ❌ **Errors** | [Error Handling](./errors/README.md) | Error taxonomy, Result types, retry logic |

## Learning Paths

### Path 1: New Developer (Start Here)

1. **[Architecture Overview](./README.md)** - Understand the layers
2. **[BUILD_GUIDE](./BUILD_GUIDE.md)** - See the professional workflow
3. **[Core Primitives](./primitives/README.md)** - Learn atomic operations
4. **[Data Flow](./data-flow/README.md)** - Follow data through the system
5. **[Composition Patterns](./composition/README.md)** - See how pieces combine

**Time**: 3-4 hours
**Outcome**: Ready to write first feature with TDD

### Path 2: Understanding Events

1. **[Event-Driven Design](./event-driven/README.md)** - Event architecture
2. **[State Machines](./state-machines/work-effort.md)** - State transitions
3. **[Queues & Async](./queues/README.md)** - Background processing
4. **[Error Handling](./errors/README.md)** - Handling failures

**Time**: 2-3 hours
**Outcome**: Understand event-driven architecture

### Path 3: Production Readiness

1. **[Constants & Configuration](./constants/README.md)** - Configuration management
2. **[Error Handling](./errors/README.md)** - Robust error handling
3. **[Queues & Workers](./queues/README.md)** - Job processing
4. **[BUILD_GUIDE](./BUILD_GUIDE.md)** - CI/CD and quality gates

**Time**: 2-3 hours
**Outcome**: Ready for production deployment

## By Use Case

### "I want to add a new feature"

1. Start: [BUILD_GUIDE](./BUILD_GUIDE.md) - TDD workflow
2. Design: [State Machines](./state-machines/work-effort.md) - State transitions
3. Implement: [Composition Patterns](./composition/README.md) - Design patterns
4. Test: BUILD_GUIDE Phase 1 - Testing strategies

### "I need to understand how data flows"

1. [Data Flow](./data-flow/README.md) - Complete transformation pipeline
2. [Primitives](./primitives/README.md) - Atomic operations
3. [Composition](./composition/README.md) - How primitives combine

### "I'm debugging an issue"

1. [Error Handling](./errors/README.md) - Error taxonomy
2. [Event-Driven Design](./event-driven/README.md) - Event debugging
3. [Queues](./queues/README.md) - Async debugging

### "I want to optimize performance"

1. [Queues](./queues/README.md) - Worker threads, parallelization
2. [Data Flow](./data-flow/README.md) - Caching strategies
3. [Primitives](./primitives/README.md) - Algorithm complexity

### "I need to integrate an external service"

1. [Composition Patterns](./composition/README.md) - Adapter pattern
2. [Event-Driven Design](./event-driven/README.md) - Integration events
3. [Error Handling](./errors/README.md) - Circuit breaker, retry logic

## Complete Documentation Tree

```
roadmap/architecture/
│
├── README.md                          # Architecture overview
├── ARCHITECTURE_INDEX.md              # This file (master index)
├── BUILD_GUIDE.md                     # Professional development workflow
│
├── primitives/
│   └── README.md                      # Atomic operations & contracts
│       • File system primitives (read, write, list)
│       • String operations (parse, tokenize, normalize)
│       • Collections (map, filter, reduce, groupBy, sort)
│       • Objects (clone, merge, pick, omit)
│       • Validation (isType, validate, assert)
│       • Date/time (now, formatDate, addDuration)
│       • ID generation (generateWorkEffortId, randomHash)
│       • Error handling (Result type, tryCatch)
│       • Composition (pipe, compose)
│
├── data-flow/
│   └── README.md                      # Data transformation pipelines
│       • Read path: File → UI (9 steps)
│       • Write path: UI → File (8 steps)
│       • WebSocket real-time updates
│       • Event-driven data flow
│       • Data integrity (atomicity, consistency)
│       • Performance optimization (caching, batching)
│
├── state-machines/
│   └── work-effort.md                 # Formal state machine
│       • States: PLANNED, IN_PROGRESS, BLOCKED, COMPLETED
│       • Transitions and guards
│       • Invariants for each state
│       • Complete implementation
│       • Testing state transitions
│       • Event sourcing alternative
│
├── composition/
│   └── README.md                      # Design patterns
│       • Pipeline (data transformation)
│       • Repository (data access)
│       • Decorator (add behavior)
│       • Observer (pub/sub)
│       • Strategy (pluggable algorithms)
│       • Adapter (interface translation)
│       • Factory (object creation)
│
├── event-driven/
│   └── README.md                      # Event-driven architecture
│       • Event types (Domain, Integration, System)
│       • Event bus implementation
│       • Event middleware
│       • Handler types (Projector, Reactor, Saga, Process Manager)
│       • Event sourcing
│       • Event patterns (CQRS, upcasting, eventual consistency)
│
├── constants/
│   └── README.md                      # Constants & configuration
│       • Domain constants (statuses, transitions, constraints)
│       • Infrastructure constants (cache, DB, HTTP, WebSocket)
│       • Error codes (taxonomy, messages, HTTP mapping)
│       • Configuration management (schema, loader)
│       • Lookup tables (display names, icons, colors)
│       • Conversion tables (duration, bytes, dates)
│
├── queues/
│   └── README.md                      # Async processing
│       • Concurrency model (Node.js event loop)
│       • Async patterns (Promises, iterators, emitters)
│       • Job queue (in-memory & Redis-backed)
│       • Scheduled jobs (cron)
│       • Worker threads (CPU-intensive)
│       • Debouncing & throttling
│       • Backpressure handling
│
└── errors/
    └── README.md                      # Error handling
        • Error hierarchy (Domain, Application, Infrastructure)
        • Custom error classes
        • Error handling patterns (Result type, try-catch)
        • Circuit breaker
        • Retry with exponential backoff
        • Graceful degradation
        • Compensating transactions
        • Dead letter queue
```

## Key Concepts Cross-Reference

### Atomic Operations
- **Defined**: [Primitives](./primitives/README.md)
- **Composed**: [Composition Patterns](./composition/README.md)
- **In Practice**: [BUILD_GUIDE](./BUILD_GUIDE.md) Phase 1

### State Management
- **State Machine**: [State Machines](./state-machines/work-effort.md)
- **State Transitions**: [Work Effort State](./state-machines/work-effort.md#state-transition-table)
- **Invariants**: [State Machines](./state-machines/work-effort.md#states)

### Events
- **Architecture**: [Event-Driven Design](./event-driven/README.md)
- **Domain Events**: [EDD - Domain Events](./event-driven/README.md#1-domain-events-what-happened)
- **Event Bus**: [EDD - Event Bus](./event-driven/README.md#event-bus-implementation)
- **Event Sourcing**: [EDD - Event Sourcing](./event-driven/README.md#event-sourcing)

### Data Transformation
- **Read Path**: [Data Flow - Read Path](./data-flow/README.md#read-path-file--ui)
- **Write Path**: [Data Flow - Write Path](./data-flow/README.md#write-path-ui--file)
- **Caching**: [Data Flow - Optimization](./data-flow/README.md#caching-layer)

### Design Patterns
- **Repository**: [Composition - Repository](./composition/README.md#2-repository-pattern-data-access-abstraction)
- **Decorator**: [Composition - Decorator](./composition/README.md#3-decorator-pattern-adding-behavior)
- **Observer**: [Composition - Observer](./composition/README.md#4-observer-pattern-event-driven)
- **Strategy**: [Composition - Strategy](./composition/README.md#5-strategy-pattern-pluggable-algorithms)

### Async Processing
- **Job Queues**: [Queues - Job Queue](./queues/README.md#job-queue-implementation)
- **Worker Threads**: [Queues - Workers](./queues/README.md#worker-threads-cpu-intensive-tasks)
- **Backpressure**: [Queues - Backpressure](./queues/README.md#backpressure-handling)

### Error Handling
- **Result Type**: [Errors - Result Type](./errors/README.md#1-result-type-functional-error-handling)
- **Circuit Breaker**: [Errors - Circuit Breaker](./errors/README.md#3-circuit-breaker-pattern)
- **Retry Logic**: [Errors - Retry](./errors/README.md#4-retry-logic-with-exponential-backoff)

### Configuration
- **Constants**: [Constants](./constants/README.md#constants)
- **Config Management**: [Constants - Config](./constants/README.md#configuration-management)
- **Lookup Tables**: [Constants - Lookup](./constants/README.md#lookup-tables)

## Code Examples Index

### Complete Implementations

| Pattern/Component | Location | Lines of Code |
|-------------------|----------|---------------|
| LRU Cache | [Primitives](./primitives/README.md) | ~150 |
| Event Bus | [Event-Driven](./event-driven/README.md#core-event-bus) | ~200 |
| Job Queue | [Queues](./queues/README.md#in-memory-queue-simple) | ~150 |
| WorkEffort Entity | [State Machines](./state-machines/work-effort.md#implementation) | ~200 |
| Repository | [BUILD_GUIDE](./BUILD_GUIDE.md#step-2-implement-repository) | ~100 |
| Circuit Breaker | [Errors](./errors/README.md#3-circuit-breaker-pattern) | ~80 |
| Config Loader | [Constants](./constants/README.md#configuration-loader) | ~100 |

### Algorithms

| Algorithm | Location | Complexity |
|-----------|----------|------------|
| Linear Regression | Phase 3 Analytics | O(n) |
| K-Means Clustering | Phase 3 Analytics | O(n × k × i) |
| k-NN Prediction | Phase 3 Analytics | O(n log n) |
| TF-IDF | Phase 3 ML | O(n × m) |
| LRU Eviction | Primitives | O(1) |
| Event Pattern Matching | Event-Driven | O(p) |

## Testing Reference

### Test Examples

- **Unit Tests**: [BUILD_GUIDE Phase 1](./BUILD_GUIDE.md#step-1-write-tests-for-domain-entities)
- **Integration Tests**: [BUILD_GUIDE Phase 2](./BUILD_GUIDE.md#step-1-write-repository-tests)
- **E2E Tests**: Phase 1 Roadmap
- **State Machine Tests**: [State Machines](./state-machines/work-effort.md#testing-state-transitions)
- **Event Tests**: [Event-Driven](./event-driven/README.md#testing-events)

## Performance Reference

### Optimization Techniques

- **Caching Strategies**: [Data Flow - Caching](./data-flow/README.md#caching-layer)
- **Batching**: [Data Flow - Batching](./data-flow/README.md#batching)
- **Parallel Processing**: [Queues - Worker Threads](./queues/README.md#worker-threads-cpu-intensive-tasks)
- **Debouncing**: [Queues - Debouncing](./queues/README.md#debouncing--throttling)

## Glossary

- **Aggregate**: Cluster of domain objects treated as a single unit
- **Domain Event**: Immutable record of something that happened
- **Event Sourcing**: Storing state as a sequence of events
- **Invariant**: Condition that must always be true
- **Saga**: Long-running business process with compensating actions
- **Projection**: Read model built from events
- **Circuit Breaker**: Fail-fast pattern for external services
- **Backpressure**: Flow control to prevent overwhelming downstream
- **Idempotent**: Operation that produces same result when repeated

## Next Steps

1. **New to the project?** Start with [Architecture Overview](./README.md)
2. **Ready to code?** Follow [BUILD_GUIDE](./BUILD_GUIDE.md)
3. **Need specific pattern?** Use this index to jump to relevant section
4. **Implementing a feature?** Check "By Use Case" section above

---

**This index is your map to the entire Pyrite architecture. Bookmark it!**
