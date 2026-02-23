# CSS Audit - Mission Control V2 (styles.css)

**Total Lines:** 5,044
**Date:** 2025-12-31

## Section Breakdown

| Lines | Section | Keep/Refactor | Notes |
|-------|---------|---------------|-------|
| 1-69 | **Design Tokens (:root)** | REFACTOR | Make spacing fluid, add breakpoint vars |
| 71-94 | **Reset & Base** | REFACTOR | Modernize reset |
| 96-258 | **Site Navigation** | REFACTOR | Make responsive hamburger |
| 260-268 | **Layout Structure** | REWRITE | Need CSS Grid shell |
| 270-480 | **Sidebar** | REWRITE | Drawer on mobile |
| 482-596 | **Search** | KEEP | Minor tweaks |
| 598-708 | **Tree Navigation** | KEEP | Touch targets |
| 710-749 | **Sidebar Footer** | KEEP | Minor tweaks |
| 751-761 | **Main Content** | REWRITE | Responsive zones |
| 763-812 | **Top Bar** | REFACTOR | Mobile layout |
| 814-1053 | **Notification Bell** | KEEP | Works well |
| 1055-1147 | **Activity Indicator** | KEEP | Minor tweaks |
| 1149-1169 | **Views** | REFACTOR | Responsive states |
| 1171-1244 | **Stats Section** | REWRITE | Fluid grid |
| 1246-1319 | **Queue Section** | REFACTOR | Responsive |
| 1321-1440 | **Queue Item** | REFACTOR | Touch friendly |
| 1442-2388 | **Detail View** | REWRITE | Bottom sheet on mobile |
| 2390-2621 | **Toast Notifications** | KEEP | Works well |
| 2623-2787 | **Animations** | KEEP | Performance review |
| 2789-2905 | **Modal** | REFACTOR | Full screen on mobile |
| 2907-2935 | **Utilities** | KEEP | Extend |
| 2937-2967 | **Scrollbar** | KEEP | Minor tweaks |
| 2968-2999 | **Responsive** | DELETE | Will rewrite |
| 3000-3180 | **Add Repository** | REFACTOR | Touch friendly |
| 3182-3267 | **Hero Banner** | REFACTOR | Hide/scale on mobile |
| 3269-3361 | **Site Footer** | KEEP | Minor tweaks |
| 3363-3482 | **About Modal** | REFACTOR | Full screen mobile |
| 3484-3684 | **Section Headers & Test Button** | KEEP | Minor tweaks |
| 3686-3916 | **Demo Button & Panel** | KEEP | Minor tweaks |
| 3918-4196 | **Charts** | KEEP | SVG scales |
| 4198-4570 | **Detail Dashboard** | REWRITE | Responsive layout |
| 4572-5044 | **Responsive Design** | DELETE | Will rewrite from scratch |

## Summary

| Category | Lines | Percentage |
|----------|-------|------------|
| KEEP (minor tweaks) | ~1,800 | 36% |
| REFACTOR (significant changes) | ~1,400 | 28% |
| REWRITE (from scratch) | ~1,400 | 28% |
| DELETE (replace entirely) | ~400 | 8% |

## Existing Design Tokens to Preserve

```css
/* Colors - KEEP ALL */
--bg-deep: #0a0806;
--bg-primary: #12100e;
--bg-secondary: #1a1714;
--bg-elevated: #221f1b;
--bg-card: #2a2622;
--accent: #ff9d3d;
--accent-bright: #ffb86c;
--text-primary: #f5f0e6;
--text-secondary: #c9bfab;
--status-active: #ff9d3d;
--status-completed: #10b981;
--status-blocked: #ef4444;

/* Typography - KEEP */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-display: 'Space Grotesk', system-ui, sans-serif;

/* Spacing - REFACTOR TO FLUID */
--space-xs: 0.25rem;   /* → clamp(0.125rem, 0.5vw, 0.25rem) */
--space-sm: 0.5rem;    /* → clamp(0.25rem, 1vw, 0.5rem) */
--space-md: 1rem;      /* → clamp(0.5rem, 2vw, 1rem) */
--space-lg: 1.5rem;    /* → clamp(0.75rem, 3vw, 1.5rem) */
--space-xl: 2rem;      /* → clamp(1rem, 4vw, 2rem) */

/* Layout - REFACTOR TO RESPONSIVE */
--sidebar-width: 280px;     /* → responsive, drawer on mobile */
--sidebar-collapsed: 60px;  /* → hide on mobile */
--topbar-height: 56px;      /* → keep but touch-friendly min */

/* Motion - KEEP */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 400ms ease;
```

## Current Responsive Approach (lines 4572-5044)

Uses `max-width` (desktop-first) - **WRONG**
Should use `min-width` (mobile-first) - **NEED TO REWRITE**

Current breakpoints:
- 1200px (large desktop)
- 1024px (desktop)
- 768px (tablet)
- 640px (mobile)
- 480px (small phone)

**New approach:** Mobile-first with fewer breakpoints:
- 640px (tablet up)
- 1024px (desktop up)
- 1280px (large desktop up)

