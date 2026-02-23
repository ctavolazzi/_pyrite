# HTML Audit - Mission Control V2 (index.html)

**Total Lines:** 604
**Date:** 2025-12-31

## Current Structure

```
<html data-theme="dark">
├── <head> (1-15)
│   └── Meta, fonts, single styles.css
├── <body.has-sidebar> (16-604)
│   ├── #site-nav (17-18) - injected component
│   ├── .app (20-592) - main app shell
│   │   ├── aside.sidebar#sidebar (22-77) - LEFT PANEL
│   │   │   ├── .sidebar-header (23-37) - brand + toggle
│   │   │   ├── .brand-tagline (40-43) - description + info btn
│   │   │   ├── .search-container (46-53) - search box + results
│   │   │   ├── nav.tree-nav (56-63) - repo/WE tree
│   │   │   └── .sidebar-footer (66-76) - add repo, status, version
│   │   └── main.main-content (80-468) - RIGHT CONTENT AREA
│   │       ├── header.topbar (82-119) - breadcrumb, notif, activity
│   │       ├── .view.dashboard-view (122-212) - DASHBOARD
│   │       │   ├── .hero-banner (124-139) - ASCII banner
│   │       │   ├── .stats-section (142-185) - 6 stat cards
│   │       │   ├── .queue-section (188-208) - work queue
│   │       │   └── #site-footer (211) - injected
│   │       └── .view.detail-view (215-467) - WORK EFFORT DETAIL
│   │           ├── .detail-header (217-239) - title, status
│   │           └── .detail-body (242-466) - THREE COLUMNS
│   │               ├── aside.detail-panel-left (244-326) - stats
│   │               ├── main.detail-panel-center (329-378) - tabs
│   │               └── aside.detail-panel-right (381-465) - actions
│   ├── .toast-container (471)
│   ├── .demo-panel (474-485)
│   ├── .test-results (488-500)
│   ├── .modal-overlay (about) (503-549)
│   ├── .modal-overlay (quick view) (552-564)
│   ├── .modal-overlay (add repo) (567-591)
│   └── scripts (594-602)
```

## Responsive Issues Identified

### Critical (Must Fix)

1. **Detail View 3-Column Layout** (lines 242-466)
   - Uses flexbox with fixed widths
   - On mobile: NEEDS to become single column with tabs/accordion
   - Recommendation: CSS Grid with `grid-template-areas` that reflow

2. **Sidebar** (lines 22-77)
   - Currently: toggle button just collapses
   - On mobile: NEEDS drawer overlay with touch gestures
   - Add: overlay backdrop element, swipe-to-close

3. **Stats Section** (lines 142-185)
   - 6 cards in flex row
   - On mobile: NEEDS 2-col → 1-col grid
   - Add: proper responsive grid container class

4. **Hero Banner ASCII** (lines 124-139)
   - ASCII art breaks on small screens
   - Recommendation: Hide on mobile, show logo only

### Medium Priority

1. **Top Bar** (lines 82-119)
   - Has `mobile-menu-btn` but layout needs work
   - Notification panel position on mobile

2. **Queue Section** (lines 188-208)
   - Filter buttons wrap awkwardly
   - Need horizontal scroll or dropdown on mobile

3. **Modals** (lines 503-591)
   - Need full-screen treatment on mobile
   - Better touch target sizing

### Low Priority (Keep As-Is Initially)

1. **Search Container** (lines 46-53) - Works okay
2. **Tree Nav** (lines 56-63) - Works okay in drawer
3. **Toast Container** (line 471) - Works with position adjustments

## Required HTML Changes for V3

### 1. Add Layout Data Attributes
```html
<!-- Enable CSS container queries -->
<div class="app" data-layout="sidebar-main">
```

### 2. Add Mobile Drawer Structure
```html
<!-- Add overlay for mobile drawer -->
<div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
<aside class="sidebar" id="sidebar" data-drawer="left">
```

### 3. Restructure Detail View
```html
<!-- Change from flex to grid with named areas -->
<div class="detail-body" data-layout="three-column">
  <aside class="detail-panel" data-area="left">
  <main class="detail-panel" data-area="center">
  <aside class="detail-panel" data-area="right">
```

### 4. Add Responsive Image/Logo
```html
<!-- Replace ASCII with responsive logo -->
<section class="hero-banner" data-show="md-up">
  <picture>
    <source media="(min-width: 768px)" srcset="logo-full.svg">
    <img src="logo-compact.svg" alt="_pyrite">
  </picture>
</section>
```

### 5. Update Stats Grid
```html
<section class="stats-section" data-grid="responsive">
  <!-- Grid handles reflow automatically -->
```

## JavaScript Integration Needed

1. **Drawer Toggle Logic**
   - Add `aria-expanded` state management
   - Add touch gesture handlers (hammer.js or vanilla)
   - Add keyboard navigation (Escape to close)

2. **Breakpoint Observers**
   - `matchMedia` listeners for state sync
   - Trigger layout switches at breakpoints

3. **Focus Management**
   - Trap focus in drawer when open
   - Return focus on close

## Accessibility Additions

```html
<!-- Add ARIA landmarks -->
<aside role="complementary" aria-label="Repository navigation">
<main role="main" aria-labelledby="detailTitle">

<!-- Add skip link -->
<a class="skip-link" href="#mainContent">Skip to main content</a>

<!-- Drawer state -->
<aside aria-hidden="true|false" data-state="open|closed">
```

## New CSS File Requirements

Based on this audit, the styles/ directory needs:

```
styles/
├── tokens.css       # Variables from audit
├── reset.css        # Modern reset
├── typography.css   # Fluid type
├── layout.css       # Grid shell + areas
├── components/
│   ├── nav.css      # Site nav (responsive)
│   ├── sidebar.css  # Drawer system
│   ├── topbar.css   # Header bar
│   ├── cards.css    # Stats + queue cards
│   ├── detail.css   # 3-col detail view
│   ├── modal.css    # Full-screen mobile
│   └── toast.css    # Position responsive
└── main.css         # Imports all
```

