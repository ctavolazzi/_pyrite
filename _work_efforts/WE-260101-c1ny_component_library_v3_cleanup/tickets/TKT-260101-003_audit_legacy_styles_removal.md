---
id: TKT-260101-003
parent: WE-260101-c1ny
title: Audit legacy styles.css and plan removal
status: completed
created: 2026-01-01 15:44:00+00:00
created_by: Claude (claude-sonnet-4-5)
assigned_to: null
completed: 2026-01-01 17:00:00+00:00
---

# TKT-c1ny-003: Audit legacy styles.css and plan removal

## Metadata
- **Created**: 2026-01-01 15:44 UTC
- **Parent Work Effort**: [[_work_efforts/WE-260101-c1ny_component_library_v3_cleanup/WE-260101-c1ny_index|WE-260101-c1ny]]
- **Author**: Claude (claude-sonnet-4-5)

## Description

Audit the legacy `styles.css` (5,044 lines) to determine:
1. What's duplicated in V3 components (can be removed)
2. What's obsolete/unused (can be deleted)
3. What's still needed but not yet in V3 (must be migrated)
4. Which HTML files are still loading legacy CSS

**Current Problem:**
The HTML may be loading BOTH legacy `styles.css` AND new `styles/main.css`, causing:
- Confusion about which styles are active (whichever loads last wins)
- Bloated page weight (~14KB of CSS loaded unnecessarily)
- Risk of subtle visual bugs from style overrides
- Maintenance nightmare (which file to edit?)

**Known Legacy File Locations:**
- `/home/user/_pyrite/mcp-servers/dashboard-v3/public/styles.css` (5,044 lines)
- `/home/user/_pyrite/mcp-servers/dashboard/public/styles.css` (duplicate)

## Acceptance Criteria

### Phase 1: Audit (This Ticket)
- [x] Check all HTML files to see which load `styles.css` vs `styles/main.css`
- [x] Document current loading behavior in each HTML file
- [x] Categorize legacy CSS into: DUPLICATE, OBSOLETE, NEEDED, UNCERTAIN
- [x] Create detailed breakdown of 5,044 lines by category
- [x] Identify V3 coverage gaps (what's missing from V3)
- [x] Document desktop-first code that needs conversion to mobile-first
- [x] List all browser-specific hacks/prefixes that may be obsolete
- [x] Create migration checklist for NEEDED styles

### Phase 2: Removal Plan (This Ticket)
- [x] Write step-by-step removal plan with risk mitigation
- [x] Identify testing checkpoints for visual regression
- [x] Plan for graceful rollback if issues found
- [x] Document which commits to reference for reverting
- [ ] Create "before" screenshots of all views for comparison

### Phase 3: Execution (Future Ticket)
- [ ] Execute removal plan (create separate ticket: TKT-c1ny-005)

## Files to Audit

**HTML Files:**
- `mcp-servers/dashboard-v3/public/index.html`
- `mcp-servers/dashboard/public/index.html`
- `mcp-servers/dashboard-v3/public/components.html`
- Any other HTML files in dashboard directories

**CSS Files:**
- `mcp-servers/dashboard-v3/public/styles.css` (legacy, 5,044 lines)
- `mcp-servers/dashboard/public/styles.css` (duplicate?)

## Expected Findings

Based on initial analysis, the 5,044-line legacy file likely breaks down as:

| Category | Estimated Lines | % | Action |
|----------|----------------|---|--------|
| **DUPLICATE** (already in V3) | ~2,000 | 40% | Delete immediately |
| **OBSOLETE** (unused/old browser hacks) | ~800 | 16% | Delete after verification |
| **NEEDED** (not yet in V3) | ~1,800 | 36% | Migrate to V3 components |
| **UNCERTAIN** (needs investigation) | ~400 | 8% | Test and categorize |

**Major Duplication Expected:**
- Design tokens (colors, spacing, fonts) - duplicated in `tokens.css`
- Modal styles - duplicated in `main.css` temp section
- Button styles - duplicated in `buttons.css`
- Card styles - duplicated in `cards.css`

**Likely Obsolete:**
- Desktop-first responsive code (max-width media queries)
- IE11 browser hacks and prefixes
- Old hero banner with ASCII art
- Deprecated component variants

**Migration Needed:**
- Components not yet extracted from `main.css` temporary section
- Specialized states/variants not in V3 yet
- Animation keyframes not in V3
- Special utility classes

## Implementation Notes

**Audit Strategy:**
1. Load both HTML files in browser dev tools
2. Check which CSS files are loaded in Network tab
3. Use browser Coverage tool to find unused CSS
4. Compare legacy selectors against V3 component files
5. Search codebase for class usage with grep/glob

**Documentation Format:**
Create `LEGACY_CSS_AUDIT.md` with findings:
- List of HTML files and their CSS loading behavior
- Categorized breakdown of all 5,044 lines
- Migration checklist for NEEDED styles
- Removal plan with testing checkpoints

**Risk Mitigation:**
- Take screenshots before making changes
- Test at all 5 breakpoints after each change
- Keep legacy file commented out initially (not deleted)
- Create "kill switch" commit that can quickly restore legacy
- Test on real devices, not just browser resize

## Audit Results

✅ **AUDIT COMPLETE** - See `LEGACY_CSS_AUDIT.md` for full findings

**Summary:**
- **Total:** 5,044 lines in 34 sections
- **DUPLICATE:** 631 lines (12.5%) - Can delete immediately
- **PARTIAL DUPLICATE:** 926 lines (18.4%) - Need comparison/merge
- **NEEDED:** 2,654 lines (52.6%) - Must migrate to V3
- **NEEDS REVIEW:** 833 lines (16.5%) - Investigate further

**Migration Strategy:** 5 phases, 21-28.5 hours estimated

**Critical finding:** Detail View alone is 1,322 lines across 2 sections

## Commits

- `27f8fe1` - feat: Complete legacy CSS audit with 5-phase migration strategy

## Blockers

None identified yet.

## Follow-up Tickets

After this audit, likely need:
- **TKT-c1ny-005**: Execute legacy CSS removal
- **TKT-c1ny-006**: Migrate remaining needed styles to V3
