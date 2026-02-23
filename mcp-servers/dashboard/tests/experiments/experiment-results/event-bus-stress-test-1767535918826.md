# Event Bus Stress Test Report

**Generated:** 2026-01-04T14:11:58.822Z

## Test Results

### Rapid Fire

- **Event Count:** 1000
- **Duration:** 2ms

### Wildcard Subscriptions

- **Event Count:** 100
- **Subscribers:** 100
- **Total Handlers Called:** 3334

### Middleware Chain

- **Event Count:** 100
- **Middleware:** 10

### Realistic Scenario

- **Event Count:** 53
- **Duration:** 2ms
- **Event Breakdown:**
  - `workeffort:created`: 10
  - `ticket:created`: 39
  - `workeffort:updated`: 4

### Event History

- **Event Count:** 5000

## Summary

- **Total Tests:** 5
- **Total Events Emitted:** 6253
- **Total Duration:** 4ms
- **Average Events per Test:** 1251

