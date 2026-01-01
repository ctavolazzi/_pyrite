# Work Effort Migration Tool

Migrates legacy Johnny Decimal work efforts (`XX.XX_*.md`) to MCP v0.3.0 format (`WE-YYMMDD-xxxx/`).

## Overview

This tool standardizes all work efforts to the new MCP v0.3.0 naming convention, converting:

**FROM (Legacy Johnny Decimal):**
```
_work_efforts/
├── 10-19_category/
│   └── 10_subcategory/
│       └── 10.02_20251221_ci_pipeline_setup.md
```

**TO (MCP v0.3.0):**
```
_work_efforts/
├── WE-251221-a1b2_ci_pipeline_setup/
│   ├── WE-251221-a1b2_index.md
│   └── tickets/
│       ├── TKT-251221-001_task_one.md
│       ├── TKT-251221-002_task_two.md
│       └── TKT-251221-003_task_three.md
```

## Features

### Safety First 🛡️

- ✅ **Dry-run by default** — Shows what will happen without making changes
- ✅ **Automatic backup** — Creates timestamped backup before migration
- ✅ **Rollback capability** — Restore from any backup
- ✅ **Validation** — Verifies all content is preserved
- ✅ **Confirmation prompts** — Prevents accidental execution

### Smart Migration 🧠

- Parses YAML frontmatter
- Extracts markdown checkbox tasks
- Converts tasks to individual ticket files
- Generates deterministic `WE-YYMMDD-xxxx` IDs from creation dates
- Preserves all metadata and content
- Cleans up empty directories

## Installation

```bash
cd tools/work-effort-migrator
pip install -r requirements.txt
```

## Usage

### 1. Scan (Safe - No Changes)

```bash
python3 migrate.py --scan
```

Shows:
- All legacy files found
- Migration plan (source → target)
- Number of tickets per work effort
- Summary statistics

### 2. Migrate (With Backup)

```bash
python3 migrate.py --migrate
```

This will:
1. Show migration plan
2. Ask for confirmation
3. Create backup: `_work_efforts_backup_YYYYMMDD_HHMMSS/`
4. Execute migration
5. Clean up empty directories
6. Show success/failure report

### 3. Rollback (If Needed)

```bash
python3 migrate.py --rollback _work_efforts_backup_20260101_120000
```

Restores work_efforts from the specified backup.

## Migration Details

### What Gets Migrated

**Legacy File Structure:**
```markdown
---
id: "10.02"
title: "CI Pipeline Setup"
status: "completed"
created: "2025-12-21T19:38:11.045Z"
---

## Tasks
- [x] Task one
- [ ] Task two
```

**New File Structure:**

`WE-251221-a1b2_ci_pipeline_setup/WE-251221-a1b2_index.md`:
```markdown
---
id: WE-251221-a1b2
title: CI Pipeline Setup
status: completed
created: 2025-12-21T19:38:11.045Z
last_updated: 2026-01-01T12:00:00.000Z
---

# WE-251221-a1b2: CI Pipeline Setup

## Tickets

| ID | Title | Status |
|----|-------|--------|
| TKT-251221-001 | Task one | completed |
| TKT-251221-002 | Task two | pending |
```

`WE-251221-a1b2_ci_pipeline_setup/tickets/TKT-251221-001_task_one.md`:
```markdown
---
id: TKT-251221-001
parent: WE-251221-a1b2
title: "Task one"
status: completed
created: 2025-12-21T19:38:11.045Z
---

# TKT-251221-001: Task one

**Parent Work Effort**: WE-251221-a1b2
**Status**: completed

## Description

Task one
```

### ID Generation

- **Work Effort ID**: `WE-YYMMDD-xxxx`
  - `YYMMDD` from frontmatter `created` date
  - `xxxx` is deterministic hash (same input = same ID)

- **Ticket ID**: `TKT-YYMMDD-NNN`
  - `YYMMDD` from parent work effort
  - `NNN` is sequential (001, 002, 003...)

### Filename Sanitization

Titles are converted to safe filenames:
- Lowercase
- Special characters removed
- Spaces/hyphens → underscores
- Example: `"CI Pipeline: Setup!"` → `ci_pipeline_setup`

## Testing

Run unit tests:

```bash
python3 test_migrate.py
```

Tests cover:
- Frontmatter parsing
- Task extraction
- ID generation
- Filename sanitization
- Migration plan structure

## Example Session

```bash
$ python3 migrate.py --scan

🔍 Scanning for legacy work effort files...

  ✓ Found: 10-19_category/10_subcategory/10.02_20251221_ci_pipeline_setup.md
  ✓ Found: 10-19_category/10_subcategory/10.03_20251221_stage_2_testing.md
  ⊘ Skipping index file: 00-09_meta/00_index/00.00_index.md

Found 2 legacy work effort files

📋 Creating migration plan...

  ✓ 10.02_20251221_ci_pipeline_setup.md
    → WE-251221-a1b2_ci_pipeline_setup/
    → 4 tasks → 4 tickets

  ✓ 10.03_20251221_stage_2_testing.md
    → WE-251221-c3d4_stage_2_testing_infrastructure/
    → 3 tasks → 3 tickets

============================================================
Migration Summary
============================================================

📁 CI Pipeline Setup
   Source: 10-19_category/10_subcategory/10.02_20251221_ci_pipeline_setup.md
   Target: WE-251221-a1b2_ci_pipeline_setup/
   Tickets: 4

📁 Stage 2 Testing Infrastructure
   Source: 10-19_category/10_subcategory/10.03_20251221_stage_2_testing.md
   Target: WE-251221-c3d4_stage_2_testing_infrastructure/
   Tickets: 3

Total: 2 work efforts, 7 tickets

This was a dry-run. Use --migrate to execute.
```

```bash
$ python3 migrate.py --migrate

[... same scan output ...]

============================================================
Proceed with migration? (yes/no): yes

💾 Creating backup...
  ✓ Backup created: _work_efforts_backup_20260101_120000

🚀 Executing migration...

  ✓ Migrated: CI Pipeline Setup
  ✓ Migrated: Stage 2 Testing Infrastructure
  🗑  Removing empty dir: 10-19_category/10_subcategory
  🗑  Removing empty dir: 10-19_category

✅ Migration complete!

Migration completed successfully!
Backup saved at: _work_efforts_backup_20260101_120000
```

## Troubleshooting

### "No frontmatter found"
Legacy file missing YAML frontmatter. Add it manually or skip the file.

### Migration failed mid-way
Use `--rollback` with your backup directory to restore original state.

### Empty directories remain
The tool should clean these up automatically. If not, remove them manually.

## Design Principles

This tool follows clean code and DRY principles:

- **Single Responsibility**: Each method does one thing
- **No Side Effects**: Dry-run mode truly makes no changes
- **Idempotent**: Running multiple times on same data is safe
- **Testable**: Pure functions separated from I/O
- **Defensive**: Validates input, handles errors gracefully
- **Transparent**: Colored output shows exactly what's happening

## Files

```
tools/work-effort-migrator/
├── README.md           # This file
├── migrate.py          # Main migration script
├── test_migrate.py     # Unit tests
└── requirements.txt    # PyYAML dependency
```

## License

Part of the _pyrite project. Same license applies.
