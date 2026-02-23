# Component Test Results

This directory stores all test results, artifacts, and reports from component testing runs.

## Directory Structure

```
component-results/
├── screenshots/        # Visual regression screenshots
│   ├── baseline/      # Baseline images
│   ├── current/       # Current test run images
│   └── diff/          # Difference images
├── logs/              # Test execution logs
│   ├── raw/          # Raw log files
│   └── processed/    # Processed/analyzed logs
├── reports/           # Test reports
│   ├── html/         # HTML reports
│   ├── json/         # JSON reports
│   └── junit/        # JUnit XML reports
└── artifacts/         # Test artifacts
    ├── coverage/     # Code coverage reports
    ├── performance/  # Performance metrics
    └── accessibility/ # A11y audit results
```

## Test Run Naming Convention

Test runs are organized by timestamp:
- Format: `YYYY-MM-DD_HH-MM-SS_<test-type>`
- Example: `2026-01-04_14-30-00_component-test`

## Retention Policy

- Screenshots: Keep last 10 runs
- Logs: Keep last 30 days
- Reports: Keep all (indexed in PocketBase)
- Artifacts: Keep last 5 runs

