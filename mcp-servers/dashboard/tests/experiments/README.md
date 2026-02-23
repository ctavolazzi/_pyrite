# Experiments Directory

This directory contains experimental tools for exploring and testing the Mission Control dashboard system.

## Quick Start

```bash
# Generate test data from real patterns
node tests/experiments/generate-test-data.js

# Trace complete data flow
node tests/experiments/run-data-flow-experiment.js

# Stress test event bus
node tests/experiments/event-bus-stress-test.js

# Visualize data flow with ASCII art
node tests/experiments/visualize-data-flow.js

# Run live dashboard simulation
node tests/experiments/live-dashboard-experiment.js
```

## Tools Overview

See [EXPERIMENTS_SUMMARY.md](./EXPERIMENTS_SUMMARY.md) for detailed documentation.

## Generated Outputs

- `generated-test-data/` - Test scenario JSON files
- `experiment-results/` - Reports, traces, and visualizations

## What These Tools Do

These experimental tools:
1. **Explore** the codebase to understand patterns
2. **Generate** realistic test data based on real work efforts
3. **Trace** data flow through all system layers
4. **Test** performance and behavior under load
5. **Visualize** complex data transformations
6. **Simulate** live dashboard updates

All tools use the shared test helpers from `../helpers/` to ensure consistency.
