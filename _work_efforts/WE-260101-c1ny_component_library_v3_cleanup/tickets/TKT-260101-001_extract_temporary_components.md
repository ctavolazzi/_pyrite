---
id: TKT-260101-001
parent: WE-260101-c1ny
title: Extract temporary components from main.css
status: pending
created: 2026-01-01 15:44:00+00:00
created_by: Claude (claude-sonnet-4-5)
assigned_to: null
---

# TKT-c1ny-001: Extract temporary components from main.css

## Metadata
- **Created**: 2026-01-01 15:44 UTC
- **Parent Work Effort**: [[_work_efforts/WE-260101-c1ny_component_library_v3_cleanup/WE-260101-c1ny_index|WE-260101-c1ny]]
- **Author**: Claude (claude-sonnet-4-5)

## Description

Extract ~600 lines of temporary/legacy components from `main.css` into dedicated component files. The TEMPORARY section currently contains production components that should be in their own modular files following the V3 component architecture.

**Components to Extract:**
1. **Hero Banner** (~90 lines) → `components/hero.css`
2. **Section Headers** (~25 lines) → Either `layout.css` or `components/headers.css`
3. **Toast Notifications** (~115 lines) → `components/toasts.css`
4. **Modals** (~103 lines) → `components/modals.css`
5. **Buttons** (~62 lines) → DUPLICATE! Already have `buttons.css`, remove from main.css
6. **Activity Indicator** (~27 lines) → Move to `indicators.css`
7. **Notification Bell** (~72 lines) → `components/notifications.css`
8. **Test Results Panel** (~46 lines) → `components/panels.css` or with modals
9. **Footer** (~69 lines) → `components/footer.css`

## Acceptance Criteria

- [ ] Create `components/hero.css` with hero banner styles
- [ ] Create `components/toasts.css` with toast notification system
- [ ] Create `components/modals.css` with modal overlay system
- [ ] Create `components/notifications.css` with notification bell/panel
- [ ] Create `components/footer.css` with site footer styles
- [ ] Move Activity Indicator to existing `indicators.css`
- [ ] Remove duplicate button styles from main.css (already in buttons.css)
- [ ] Decide on section headers: add to layout.css or create headers.css
- [ ] Update `main.css` imports to include new component files
- [ ] Remove TEMPORARY section comment from main.css
- [ ] `main.css` reduced to < 100 lines (just imports and minimal glue code)
- [ ] No visual regressions in dashboard
- [ ] All components still render correctly

## Files Changed

**To Create:**
- `mcp-servers/dashboard-v3/public/styles/components/hero.css`
- `mcp-servers/dashboard-v3/public/styles/components/toasts.css`
- `mcp-servers/dashboard-v3/public/styles/components/modals.css`
- `mcp-servers/dashboard-v3/public/styles/components/notifications.css`
- `mcp-servers/dashboard-v3/public/styles/components/footer.css`

**To Modify:**
- `mcp-servers/dashboard-v3/public/styles/main.css` (remove ~600 lines, add imports)
- `mcp-servers/dashboard-v3/public/styles/components/indicators.css` (add activity indicator)
- `mcp-servers/dashboard-v3/public/styles/layout.css` (possibly add section headers)

## Implementation Notes

**Design Decisions:**
- Follow BEM-like naming convention established in cards.css and buttons.css
- Use design tokens from tokens.css (no hardcoded values)
- Ensure mobile-first responsive design (min-width media queries)
- Include WCAG 2.1 compliant touch targets (44px minimum)
- Document component variants and states in CSS comments

**Order of Extraction:**
1. Start with footer (simplest, lowest risk)
2. Then hero banner (self-contained)
3. Then toasts (well-defined system)
4. Then modals (more complex, test thoroughly)
5. Activity Indicator → indicators.css (easy merge)
6. Notification bell → notifications.css
7. Remove duplicate buttons
8. Finally, section headers (decide placement)

**Testing Strategy:**
- After each extraction, verify component still renders
- Check responsive behavior at all breakpoints
- Test interactive states (hover, active, focus)
- Ensure no console errors

## Commits

- (to be populated as work progresses)

## Blockers

None identified yet.
