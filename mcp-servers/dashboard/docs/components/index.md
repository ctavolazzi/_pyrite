# Component Library Documentation

## Overview

The Mission Control V3 component library provides a consistent, accessible set of UI components built with CSS custom properties and BEM-like naming conventions.

## Design System

| Layer | File | Description |
|-------|------|-------------|
| Tokens | `styles/tokens.css` | Design tokens (colors, spacing, typography) |
| Reset | `styles/reset.css` | CSS reset and base styles |
| Typography | `styles/typography.css` | Font definitions and text utilities |
| Layout | `styles/layout.css` | Grid system and layout utilities |

## Components

| Component | File | Documentation |
|-----------|------|---------------|
| Buttons | `styles/components/buttons.css` | [buttons.md](./buttons.md) |
| Cards | `styles/components/cards.css` | [cards.md](./cards.md) |
| Indicators | `styles/components/indicators.css` | [indicators.md](./indicators.md) |
| Navigation | `styles/components/nav.css` | - |
| Sidebar | `styles/components/sidebar.css` | - |
| Command Center | `styles/components/command-center.css` | - |

## Layout Documentation

See [layout.md](./layout.md) for:
- Application shell structure
- Grid and flex utilities
- Spacing utilities
- Responsive breakpoints

---

## Quick Reference

### Colors
```css
/* Backgrounds */
--bg-deep, --bg-primary, --bg-secondary, --bg-elevated, --bg-card, --bg-hover, --bg-active

/* Text */
--text-primary, --text-secondary, --text-muted, --text-dim

/* Accent */
--accent, --accent-bright, --accent-muted, --accent-glow

/* Status */
--status-active, --status-in-progress, --status-completed, --status-pending, --status-paused, --status-blocked
```

### Spacing (fluid)
```css
--space-3xs  /* 2-3px */
--space-2xs  /* 3-5px */
--space-xs   /* 4-7px */
--space-sm   /* 6-10px */
--space-md   /* 8-14px */
--space-lg   /* 12-20px */
--space-xl   /* 16-28px */
--space-2xl  /* 24-40px */
```

### Border Radius
```css
--radius-sm   /* 4px */
--radius-md   /* 8px */
--radius-lg   /* 12px */
--radius-xl   /* 16px */
--radius-full /* 9999px */
```

### Breakpoints (mobile-first)
```css
@media (min-width: 480px)  { /* sm: large phones */ }
@media (min-width: 640px)  { /* md: tablets */ }
@media (min-width: 1024px) { /* lg: desktops */ }
@media (min-width: 1280px) { /* xl: large desktops */ }
```

---

## Naming Conventions

### BEM-like Structure
```css
.block { }              /* Component */
.block--modifier { }    /* Variant */
.block__element { }     /* Child element */
.block.is-state { }     /* State class */
```

### Examples
```css
.btn { }                /* Base button */
.btn--primary { }       /* Primary variant */
.btn__icon { }          /* Icon within button */
.btn.is-loading { }     /* Loading state */

.card { }               /* Base card */
.card--stat { }         /* Stat card variant */
.card__content { }      /* Card content area */
.card.is-highlighted { } /* Highlighted state */
```

---

## Accessibility

All components follow WCAG 2.1 guidelines:

- ✅ Minimum 44px touch targets
- ✅ Visible focus states
- ✅ Color contrast ratios
- ✅ Reduced motion support
- ✅ Semantic HTML structure
- ✅ ARIA attributes where needed

---

## Import Order

```css
/* Foundation */
@import url('./tokens.css');
@import url('./reset.css');
@import url('./typography.css');

/* Layout */
@import url('./layout.css');

/* Components */
@import url('./components/nav.css');
@import url('./components/sidebar.css');
@import url('./components/cards.css');
@import url('./components/buttons.css');
@import url('./components/indicators.css');
@import url('./components/command-center.css');
```

---

## Migration from V2

V2 class names are supported for backwards compatibility:

| V2 Class | V3 Class |
|----------|----------|
| `.stat-card` | `.card--stat` |
| `.queue-item` | `.queue-card` |
| `.queue-indicator` | `.indicator` |
| `.queue-badge` | `.badge` |

Legacy styles in `styles.css` have been commented out and should be removed once migration is complete.

