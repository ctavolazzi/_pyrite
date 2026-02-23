# The Oracle - Architecture Document

**Theme:** "Bug's Life" meets "The Matrix"
**Name:** `TheOracle`
**Purpose:** Comprehensive, intelligent debugging and testing system

*Like the Oracle in The Matrix, this debugger sees patterns, predicts bugs, and learns from every test run.*

## Core Concept

A self-learning, self-improving debugging system that:
1. **Observes** everything (like Neo seeing the code)
2. **Learns** from patterns (like the Oracle predicting bugs)
3. **Stores** knowledge in PocketBase (like the Matrix database)
4. **Uses** NovaSystem patterns (file-based, Git-backed, indexed)
5. **Applies** all relevant patterns and algorithms

## Architecture Layers

### Layer 1: The Oracle (Core Debugger)

**Class:** `TheOracle`

**Responsibilities:**
- Component discovery and analysis
- CSS property extraction and validation
- DOM structure analysis
- Event flow tracing
- State mutation tracking
- Performance profiling
- Accessibility auditing

**Patterns Used:**
- **Observer Pattern:** Watches all component changes
- **Strategy Pattern:** Different analysis strategies per component type
- **Command Pattern:** Test commands as executable objects
- **Factory Pattern:** Creates test runners for different component types
- **Chain of Responsibility:** Analysis pipeline

### Layer 2: The Agents (Test Runners)

**Classes:**
- `ComponentAgent` - Tests individual components
- `LayoutAgent` - Tests layout and positioning
- `StyleAgent` - Tests CSS and styling
- `InteractionAgent` - Tests user interactions
- `AccessibilityAgent` - Tests a11y compliance
- `PerformanceAgent` - Tests performance metrics

**Patterns Used:**
- **Agent Pattern:** Each agent is autonomous
- **Mediator Pattern:** Agents communicate through debugger
- **Template Method:** Common test execution flow

### Layer 3: The Matrix (Data Storage)

**Technology:** PocketBase

**Collections:**
- `debug_sessions` - Debugging session metadata
- `component_tests` - Individual component test results
- `css_analysis` - CSS property analysis
- `dom_snapshots` - DOM structure snapshots
- `event_traces` - Event flow traces
- `performance_metrics` - Performance data
- `bug_reports` - Discovered bugs
- `learned_patterns` - Patterns learned from analysis
- `test_artifacts` - Screenshots, logs, reports

**Patterns Used:**
- **Repository Pattern:** Data access abstraction
- **Unit of Work:** Transaction management
- **Snapshot Pattern:** State snapshots for comparison

### Layer 4: The Code (NovaSystem Integration)

**Uses NovaSystem Patterns:**
- **File-based storage:** Test results as files
- **Git integration:** Version test results
- **FIFO Queue:** Sequential test execution
- **Sidecar Index:** Fast test result lookup
- **Atomic operations:** Test isolation

### Layer 5: The Architect (Analysis Engine)

**Responsibilities:**
- Pattern recognition
- Anomaly detection
- Regression detection
- Performance degradation detection
- CSS drift detection

**Algorithms:**
- **Tree Traversal:** DOM analysis (DFS/BFS)
- **Graph Algorithms:** Dependency analysis
- **Clustering:** Group similar bugs
- **Regression Analysis:** Detect trends
- **Diff Algorithms:** Compare states
- **A* Search:** Find optimal test paths

## Data Structures

### Component Tree
```javascript
{
  id: string,
  type: 'element' | 'component' | 'module',
  tag: string,
  attributes: Map<string, string>,
  css: CSSProperties,
  computed: ComputedStyles,
  children: ComponentTree[],
  events: EventHandler[],
  state: StateSnapshot,
  tests: TestResult[]
}
```

### CSS Analysis
```javascript
{
  property: string,
  value: string,
  computed: string,
  source: string, // file:line
  specificity: number,
  mediaQuery: string | null,
  pseudoClass: string | null,
  inheritance: boolean,
  conflicts: Conflict[]
}
```

### Test Result
```javascript
{
  id: string,
  componentId: string,
  testType: string,
  status: 'pass' | 'fail' | 'skip',
  duration: number,
  assertions: Assertion[],
  screenshots: Screenshot[],
  logs: LogEntry[],
  metrics: Metrics,
  timestamp: Date
}
```

## Design Patterns Used

### Creational
- **Factory:** Create test runners
- **Builder:** Build test configurations
- **Singleton:** Debugger instance

### Structural
- **Adapter:** Integrate with PocketBase
- **Decorator:** Add analysis layers
- **Facade:** Simplify complex operations
- **Proxy:** Intercept component access

### Behavioral
- **Observer:** Watch component changes
- **Strategy:** Analysis strategies
- **Command:** Test commands
- **Chain of Responsibility:** Analysis pipeline
- **Mediator:** Agent communication
- **Memento:** State snapshots
- **State:** Test execution states
- **Template Method:** Test execution flow
- **Visitor:** Component traversal

## Algorithms Used

1. **Tree Traversal:**
   - DFS for deep analysis
   - BFS for breadth-first discovery

2. **Graph Algorithms:**
   - Dependency graph construction
   - Cycle detection
   - Topological sort

3. **String Algorithms:**
   - CSS parsing
   - Selector matching
   - Diff computation

4. **Optimization:**
   - Memoization for repeated analysis
   - Lazy evaluation for large DOMs
   - Parallel processing for independent tests

5. **Machine Learning:**
   - Pattern recognition
   - Anomaly detection
   - Regression prediction

## Integration Points

### PocketBase Schema

```javascript
// debug_sessions
{
  id: string,
  name: string,
  started: Date,
  ended: Date | null,
  status: 'running' | 'completed' | 'failed',
  components_tested: number,
  bugs_found: number,
  config: object
}

// component_tests
{
  id: string,
  session_id: string,
  component_id: string,
  component_type: string,
  test_type: string,
  status: string,
  duration: number,
  assertions: object[],
  screenshots: string[],
  logs: object[],
  metrics: object,
  created: Date
}

// css_analysis
{
  id: string,
  component_id: string,
  property: string,
  value: string,
  computed: string,
  source: string,
  specificity: number,
  conflicts: object[],
  created: Date
}

// bug_reports
{
  id: string,
  session_id: string,
  component_id: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  category: string,
  description: string,
  reproduction: string,
  screenshots: string[],
  fixed: boolean,
  created: Date
}

// learned_patterns
{
  id: string,
  pattern_type: string,
  pattern_data: object,
  confidence: number,
  occurrences: number,
  first_seen: Date,
  last_seen: Date
}
```

## Testing Framework Integration

### Playwright
- Browser automation
- Screenshot capture
- Network interception
- Performance metrics

### Testing Library (concept)
- Component querying
- User interaction simulation
- Accessibility testing

### Custom Visual Regression
- Pixel-by-pixel comparison
- Layout shift detection
- Color drift detection

## Execution Flow

```
1. Initialize TheOracle
   ↓
2. Connect to PocketBase
   ↓
3. Discover Components (DFS/BFS)
   ↓
4. For each component:
   a. Extract CSS properties
   b. Analyze DOM structure
   c. Test interactions
   d. Check accessibility
   e. Measure performance
   ↓
5. Store results in PocketBase
   ↓
6. Analyze patterns
   ↓
7. Generate reports
   ↓
8. Learn from results
```

## Next Steps

1. Create base `TheOracle` class
2. Implement PocketBase integration
3. Build component discovery
4. Implement CSS analysis
5. Add test runners
6. Create reporting system

