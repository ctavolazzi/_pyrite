# Experiments Summary

This directory contains experimental tools and generated data from exploring the Mission Control dashboard system.

## Generated Tools

### 1. `generate-test-data.js`
**Purpose:** Analyzes real work efforts and generates realistic test scenarios

**What it does:**
- Parses actual repository to find real patterns
- Analyzes status distribution, ticket counts, format types
- Generates test scenarios matching real data patterns
- Creates JSON files with complete test data

**Output:**
- `generated-test-data/scenario-*.json` - Test scenario files
- Analysis of real work effort patterns

**Example Output:**
```
📊 Found 26 work efforts
Status Distribution: { completed: 17, active: 8, in_progress: 1 }
Average Tickets per WE: 8
Max Tickets in a WE: 34
```

### 2. `run-data-flow-experiment.js`
**Purpose:** Traces complete data flow through the system

**What it does:**
- Follows data from file system → parser → server → client → events
- Documents each transformation step
- Generates detailed trace reports
- Creates both markdown and JSON outputs

**Output:**
- `experiment-results/data-flow-trace-*.md` - Markdown report
- `experiment-results/data-flow-trace-*.json` - JSON trace data

**Example Output:**
```
Step 1: Parsing repository... ✅ Parsed 26 work efforts
Step 2: Calculating statistics... ✅ Stats: 26 WEs, 207 tickets
Step 3: Creating server state... ✅ Server state created
Step 4: Creating WebSocket message... ✅ WebSocket message created (67139 bytes)
Step 5: Processing client state... ✅ Client state updated
Step 6: Analyzing events... ✅ 1 events emitted: system:connected
```

### 3. `event-bus-stress-test.js`
**Purpose:** Tests event bus performance under various conditions

**What it does:**
- Rapid fire event emission (1000+ events)
- Wildcard subscription testing (100+ subscribers)
- Middleware chain performance
- Realistic work effort scenario simulation
- Event history tracking analysis

**Output:**
- `experiment-results/event-bus-stress-test-*.md` - Performance report

**Example Results:**
```
Test 1: Rapid Fire Events (1000 events)... ✅ 1000 events in 2ms
Test 2: Wildcard Subscriptions (100 subscribers)... ✅ 3334 handlers called
Test 3: Middleware Chain (10 middleware)... ✅ Avg middleware time: 0ms
Test 4: Realistic Work Effort Scenario... ✅ 53 events emitted in 2ms
```

### 4. `visualize-data-flow.js`
**Purpose:** Creates ASCII art visualizations of data flow

**What it does:**
- Generates flow diagrams showing each step
- Creates statistics visualizations with progress bars
- Shows event flow patterns
- Creates processing timeline

**Output:**
- `experiment-results/data-flow-visualization-*.txt` - ASCII visualization
- `experiment-results/data-flow-visualization-*.md` - Markdown version

**Example Output:**
```
┌─ Step 1: File System ──────────────────────────────┐
│ Read markdown files from _work_efforts directory        │
│ Input:  File system (markdown files)                      │
│ Output: 26 work effort files                              │
└─────────────────────────────────────────────────────────┘
    │
    ▼
```

## Generated Data

### Test Scenarios
Located in `generated-test-data/`:
- `scenario-01-typical-active-work-effort.json` - Single active WE with 2-3 tickets
- `scenario-02-multiple-work-efforts.json` - Multiple WEs matching real distribution
- `scenario-03-mixed-status-work-efforts.json` - Various statuses
- `scenario-04-large-work-effort.json` - Large WE with max tickets (34)

### Experiment Results
Located in `experiment-results/`:
- Data flow traces (JSON + Markdown)
- Event bus stress test reports
- Data flow visualizations (ASCII + Markdown)

## Key Findings

### From Real Data Analysis
- **26 work efforts** in the repository
- **Status distribution:** 17 completed, 8 active, 1 in_progress
- **Average tickets per WE:** 8
- **Max tickets in a WE:** 34
- **All work efforts use MCP format** (no Johnny Decimal found)

### From Performance Tests
- **Event bus is fast:** 1000 events in ~2ms
- **Wildcard subscriptions work well:** 100 subscribers, 3334 handlers called efficiently
- **Middleware is lightweight:** 10 middleware functions, ~0ms overhead
- **Realistic scenarios:** 53 events for 10 work efforts with 39 tickets in 2ms

### From Data Flow Analysis
- **Complete flow:** File System → Parser → Stats → Server → WebSocket → Client → Events → UI
- **8 transformation steps** in the pipeline
- **67KB serialized** WebSocket message for 26 work efforts
- **207 total tickets** across all work efforts

## Usage

Run any experiment:

```bash
# Generate test data from real patterns
node tests/experiments/generate-test-data.js

# Trace data flow
node tests/experiments/run-data-flow-experiment.js

# Stress test event bus
node tests/experiments/event-bus-stress-test.js

# Visualize data flow
node tests/experiments/visualize-data-flow.js
```

## Next Experiments

Potential future experiments:
1. **Performance benchmarking** - Compare parser performance with different file sizes
2. **Memory profiling** - Track memory usage through data flow
3. **Concurrency testing** - Test multiple simultaneous updates
4. **Error scenario testing** - Test behavior with malformed data
5. **Scale testing** - Test with 100+ work efforts, 1000+ tickets

