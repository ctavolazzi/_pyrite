# Obsidian Linter Architecture

## Vision: Two-Tier System

The Obsidian linter follows a progressive enhancement model with two distinct tiers:

### Tier 1: Standardization & Validation (Current - v0.6.1)
**Foundation tier** - Ensures files meet basic quality standards before enhancement.

**Purpose**: Validate, detect issues, fix formatting
**Status**: ✅ COMPLETE (Phase 2B)

**What it does:**
- Validates frontmatter structure and field values
- Detects broken wikilinks and unlinked references
- Checks Obsidian syntax (callouts, tags, embeds, code blocks, task lists)
- Fixes formatting issues (whitespace, line endings, etc.)
- Auto-converts IDs to wikilinks with proper aliases

**Output**: Clean, valid, standardized markdown files ready for enhancement

---

### Tier 2: Enhancement & Enrichment (Future - v0.7.0+)
**Intelligence tier** - AI-powered features that build on validated foundation.

**Purpose**: Enrich content, automate knowledge management, apply frameworks
**Status**: 🚧 PLANNED (see ROADMAP_ENHANCEMENT.md)

**What it will do:**
- **Auto-Index**: Generate and maintain index files with proper backlinks
- **Zettelkasten**: Implement atomic notes, connection maps, MOCs
- **GTD Framework**: Add context tags, priority levels, due dates
- **PARA Method**: Organize into Projects/Areas/Resources/Archives
- **Smart Linking**: AI-suggested connections between related notes
- **Frontmatter Enhancement**: Auto-populate metadata (tags, categories, related notes)
- **Knowledge Graph**: Build and maintain relationship maps
- **Summary Generation**: AI-generated abstracts and key points
- **Template Application**: Smart template suggestions based on content type

**Requirements**:
- Files MUST pass Tier 1 validation first
- Uses `linter_status: validated` frontmatter flag as gate

---

## Frontmatter Status Tracking

To enable the two-tier progression, files track their validation status:

```yaml
---
id: WE-251231-abcd
title: Example Work Effort
status: active
created: 2025-12-31
linter_status: validated  # Added by Tier 1 tools
linter_last_check: 2025-12-31T18:00:00Z
linter_version: 0.6.1
---
```

### Linter Status Values

| Value | Meaning | Tier 1 | Tier 2 |
|-------|---------|--------|--------|
| `unvalidated` | Never checked | ❌ Run linter | ⛔ Blocked |
| `validated` | Passed all checks | ✅ Clean | ✅ Ready for enhancement |
| `has_warnings` | Minor issues | ⚠️ Optional fixes | ⚠️ Proceed with caution |
| `has_errors` | Critical issues | ❌ Must fix | ⛔ Blocked |

### Implementation Plan

**Phase 1** (This PR - v0.6.1):
- Document the two-tier architecture
- Define frontmatter schema for tracking
- Add `linter_status` field to FRONTMATTER.md guide

**Phase 2** (v0.7.0):
- Implement status tracking in linter
- Add `--set-status` flag to mark files as validated
- Create gating logic for enhancement tier

**Phase 3** (v0.8.0+):
- Build enhancement tier features
- Implement AI integrations
- Add framework templates (Zettelkasten, GTD, PARA)

---

## Architecture Principles

### 1. Progressive Enhancement
Files flow through tiers in order:
```
Raw Markdown → Tier 1 (Validate) → Tier 2 (Enhance)
```

### 2. Non-Destructive
- Tier 1: Only fixes obvious errors, asks permission for structural changes
- Tier 2: Only adds metadata/links, never removes user content

### 3. Idempotent
- Running tools multiple times produces same result
- Safe to run on already-processed files

### 4. Transparent
- All changes logged in frontmatter
- User can see what was changed and when
- Rollback capability via git

### 5. Modular
- Each tier is independent
- Features can be toggled on/off
- Framework support is pluggable

---

## File Organization

```
tools/obsidian-linter/
├── ARCHITECTURE.md          # This file - system design
├── ROADMAP_ENHANCEMENT.md   # Tier 2 feature roadmap
├── FRONTMATTER.md           # Frontmatter schema guide
├── FEATURES.md              # Current feature coverage
├── README.md                # User guide
│
├── tier1/                   # Standardization (current)
│   ├── check.py            # Validation
│   ├── fix-links.py        # Link fixing
│   ├── fix-all.py          # Comprehensive fixer
│   └── validate.py         # Accuracy checks
│
└── tier2/                   # Enhancement (future)
    ├── enhance.py          # Main enhancement engine
    ├── frameworks/         # Framework implementations
    │   ├── zettelkasten.py
    │   ├── gtd.py
    │   └── para.py
    ├── ai/                 # AI integrations
    │   ├── summarize.py
    │   └── link_suggest.py
    └── indexing/           # Auto-indexing
        ├── backlinks.py
        └── graph.py
```

---

## Current State (v0.6.1)

### Tier 1: Complete ✅

**Phase 1** (v0.5.0):
- ✅ Frontmatter validation
- ✅ Wikilink checking
- ✅ Unlinked reference fixing
- ✅ Basic formatting

**Phase 2A** (v0.6.0):
- ✅ Task list validation

**Phase 2B** (v0.6.1):
- ✅ Callout validation
- ✅ Tag validation
- ✅ Embed validation
- ✅ Code block validation

### Tier 2: Planned 🚧

See `ROADMAP_ENHANCEMENT.md` for detailed feature roadmap.

---

## Migration Path

For existing users upgrading from basic linter to enhancement tier:

1. **Baseline**: Run Tier 1 on entire vault
2. **Fix Issues**: Address all errors/warnings
3. **Mark Validated**: Add `linter_status: validated` to frontmatter
4. **Choose Framework**: Select Zettelkasten, GTD, PARA, or custom
5. **Run Enhancement**: Let Tier 2 enrich your validated files
6. **Review**: Check auto-generated metadata and links
7. **Iterate**: Refine and re-run as needed

---

## Design Decisions

### Why Two Tiers?

1. **Safety**: Validation before AI prevents garbage-in-garbage-out
2. **Modularity**: Users can stop at Tier 1 if they want manual control
3. **Performance**: Tier 1 is fast, Tier 2 can be slow (AI calls)
4. **Pricing**: Tier 2 may require API costs for AI features

### Why Frontmatter Tracking?

1. **Gating**: Prevents enhancement on invalid files
2. **Auditing**: Know when files were last checked
3. **Versioning**: Track which linter version validated the file
4. **Debugging**: Identify files that need re-validation

### Why Framework Support?

1. **Flexibility**: Different users prefer different systems
2. **Best Practices**: Codify proven knowledge management methods
3. **Automation**: Let tools handle the tedious parts
4. **Learning**: Templates help users adopt frameworks correctly

---

**Last Updated**: 2026-01-01
**Version**: 0.6.1
**Status**: Tier 1 Complete, Tier 2 Planned
