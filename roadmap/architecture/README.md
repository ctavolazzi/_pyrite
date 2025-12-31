# Pyrite Architecture: Granular Compositional Design

**Purpose**: Define the most fundamental, atomic building blocks and composition patterns for the Pyrite system.

## Philosophy

Pyrite is built on **compositional architecture** - small, pure functions compose into larger systems through well-defined interfaces. Every complex operation is decomposable into atomic primitives.

### Core Principles

1. **Single Responsibility**: Each function does one thing
2. **Pure Functions**: No hidden side effects (except designated I/O boundaries)
3. **Immutable Data**: Data structures are never mutated, only transformed
4. **Explicit State**: All state transitions are traceable
5. **Type Safety**: Every value has a known shape
6. **Fail Fast**: Errors are detected at boundaries, not propagated silently

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Dashboard UI, CLI, VS Code Extension)                     │
│  - Render functions (data → DOM)                            │
│  - Event handlers (user action → command)                   │
│  - View state (derived from domain state)                   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (MCP Servers, API Routes, WebSocket Handlers)              │
│  - Command handlers (validate → execute → respond)          │
│  - Query handlers (fetch → transform → return)              │
│  - Event publishers (action → broadcast)                    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  (Work Effort, Ticket, Analytics)                           │
│  - Entities (identity + behavior)                           │
│  - Value objects (immutable values)                         │
│  - Domain events (what happened)                            │
│  - Business rules (invariants)                              │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  (File I/O, Database, Cache, Network)                       │
│  - Repositories (persistence)                               │
│  - Adapters (external systems)                              │
│  - Services (I/O operations)                                │
└─────────────────────────────────────────────────────────────┘
```

**Dependencies flow downward** - Presentation depends on Application, Application depends on Domain, Domain has no dependencies (except primitives).

## Atomic Components

### 1. Data Primitives

All data in Pyrite is composed from these atomic types:

```typescript
// Scalar primitives
type Scalar = string | number | boolean | null;

// Collection primitives
type List<T> = Array<T>;
type Dict<K extends string, V> = Record<K, V>;
type Set<T> = Set<T>;

// Temporal primitives
type Timestamp = number;  // Unix milliseconds
type Duration = number;   // Milliseconds
type DateString = string; // ISO 8601

// Identity primitives
type WorkEffortId = `WE-${string}`;  // WE-YYMMDD-xxxx
type TicketId = `TKT-${string}`;      // TKT-xxxx-NNN
type UUID = string;                   // v4 UUID

// Enum primitives
type Status = 'planned' | 'in-progress' | 'completed' | 'blocked';
type TicketStatus = 'pending' | 'in-progress' | 'completed';
```

### 2. Functional Primitives

Every operation is one of these atomic patterns:

```typescript
// Pure transformation: A → B
type Transform<A, B> = (input: A) => B;

// Predicate: A → Boolean
type Predicate<A> = (input: A) => boolean;

// Effectful operation: A → IO<B>
type Effect<A, B> = (input: A) => Promise<B>;

// Fold/Reduce: [A] → B
type Fold<A, B> = (list: A[], initial: B) => B;

// Composition: (A → B) + (B → C) = (A → C)
type Compose<A, B, C> = (f: Transform<A, B>, g: Transform<B, C>) => Transform<A, C>;
```

### 3. State Primitives

State management is built on these atomic operations:

```typescript
// Read current state
type Read<S> = () => S;

// Transform state (pure)
type Update<S> = (current: S, change: Partial<S>) => S;

// Subscribe to changes
type Subscribe<S> = (listener: (state: S) => void) => Unsubscribe;
type Unsubscribe = () => void;

// Atomic state container
interface Atom<S> {
  get: Read<S>;
  set: (newState: S) => void;
  update: (fn: Transform<S, S>) => void;
  subscribe: Subscribe<S>;
}
```

## Document Index

### Core Architecture
- [**Primitives**](./primitives/README.md) - Atomic building blocks
- [**Data Flow**](./data-flow/README.md) - How data moves through the system
- [**State Machines**](./state-machines/README.md) - State transitions and lifecycles
- [**Composition**](./composition/README.md) - How primitives combine into systems

### Implementation Details
- [File System Operations](./primitives/filesystem.md)
- [Parser Architecture](./primitives/parser.md)
- [Event System](./primitives/events.md)
- [Cache Implementation](./primitives/cache.md)
- [WebSocket Protocol](./data-flow/websocket.md)
- [Database Transactions](./data-flow/database.md)

### State Management
- [Work Effort Lifecycle](./state-machines/work-effort.md)
- [Ticket State Machine](./state-machines/ticket.md)
- [Cache Invalidation](./state-machines/cache.md)
- [WebSocket Connection](./state-machines/websocket.md)

### Composition Patterns
- [Parser Composition](./composition/parser.md)
- [Event Bus Pattern](./composition/event-bus.md)
- [Repository Pattern](./composition/repository.md)
- [Service Layer](./composition/services.md)

## Fundamental Laws

These invariants must hold throughout the system:

### Law of Identity
```
∀ entity: Entity, entity.id is immutable and unique
```

### Law of State Transitions
```
∀ state transition: S₁ → S₂, ∃ event E that caused transition
```

### Law of Data Flow
```
Data flows unidirectionally: UI ← Application ← Domain ← Infrastructure
Commands flow downward: UI → Application → Domain → Infrastructure
```

### Law of Side Effects
```
Side effects only occur at layer boundaries (I/O, rendering, network)
Domain layer is pure (no I/O)
```

### Law of Composition
```
If f: A → B and g: B → C, then (g ∘ f): A → C
Composition is associative: (h ∘ g) ∘ f = h ∘ (g ∘ f)
```

## Next Steps

1. Start with [**Primitives**](./primitives/README.md) to understand atomic operations
2. Review [**Data Flow**](./data-flow/README.md) to see how data moves
3. Study [**State Machines**](./state-machines/README.md) for lifecycle management
4. Learn [**Composition**](./composition/README.md) patterns for building systems

---

*This architecture is designed to be understandable at every level of abstraction, from individual bytes to complete systems.*
