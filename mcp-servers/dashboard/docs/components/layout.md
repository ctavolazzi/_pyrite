# Layout Component Documentation

## Overview

The layout system uses CSS Grid for the main application structure and provides responsive utilities for building consistent interfaces. It follows a mobile-first approach with `min-width` media queries.

## Import

```css
@import url('./layout.css');
```

---

## Application Shell

The main `.app` container creates a CSS Grid layout with sidebar and main content areas.

```html
<div class="app" data-sidebar="expanded">
  <aside class="sidebar">...</aside>
  <div class="topbar">...</div>
  <main class="main">...</main>
</div>
```

### Sidebar States

```html
<!-- Expanded sidebar -->
<div class="app" data-sidebar="expanded">

<!-- Collapsed sidebar -->
<div class="app" data-sidebar="collapsed">

<!-- No sidebar -->
<div class="app">
```

---

## Grid System

### Mobile Layout (Default)
- Single column
- Sidebar hidden (drawer on mobile)
- Full-width content

### Tablet Layout (640px+)
- Sidebar visible if expanded
- Main content takes remaining space

### Desktop Layout (1024px+)
- Fixed sidebar width
- Optimal content width
- Full feature display

---

## Main Content Area

```html
<main class="main">
  <div class="main-content">
    <!-- Content here -->
  </div>
</main>
```

The main area has:
- Container queries enabled
- Overflow handling
- Responsive padding

---

## Container Queries

The layout uses container queries for component-level responsiveness.

```css
/* Stats grid responds to container width */
@container main (width < 400px) {
  .stats-section { grid-template-columns: 1fr; }
}

@container main (width >= 400px) and (width < 700px) {
  .stats-section { grid-template-columns: repeat(2, 1fr); }
}
```

---

## Flex Utilities

### Direction
```html
<div class="flex">Row layout</div>
<div class="flex-col">Column layout</div>
```

### Alignment
```html
<div class="flex items-center">Vertically centered</div>
<div class="flex items-start">Aligned to top</div>
<div class="flex items-end">Aligned to bottom</div>
<div class="flex items-stretch">Stretch to fill</div>
```

### Justification
```html
<div class="flex justify-center">Horizontally centered</div>
<div class="flex justify-between">Space between</div>
<div class="flex justify-end">Aligned to end</div>
```

### Wrapping
```html
<div class="flex flex-wrap">Wraps to multiple lines</div>
<div class="flex flex-nowrap">Single line</div>
```

### Gap
```html
<div class="flex gap-xs">Extra small gap (4-7px)</div>
<div class="flex gap-sm">Small gap (6-10px)</div>
<div class="flex gap-md">Medium gap (8-14px)</div>
<div class="flex gap-lg">Large gap (12-20px)</div>
```

### Grow/Shrink
```html
<div class="flex-1">Flex grow 1</div>
<div class="flex-auto">Flex auto</div>
<div class="shrink-0">Don't shrink</div>
```

---

## Grid Utilities

### Basic Grid
```html
<div class="grid">Single column grid</div>
<div class="grid cols-2">2 columns</div>
<div class="grid cols-3">3 columns</div>
<div class="grid cols-4">4 columns</div>
```

### Gap
```html
<div class="grid gap-xs">...</div>
<div class="grid gap-sm">...</div>
<div class="grid gap-md">...</div>
<div class="grid gap-lg">...</div>
```

---

## Spacing Utilities

### Padding
```html
<div class="p-xs">Padding all sides (4-7px)</div>
<div class="p-sm">Padding all sides (6-10px)</div>
<div class="p-md">Padding all sides (8-14px)</div>
<div class="p-lg">Padding all sides (12-20px)</div>

<div class="px-md">Horizontal padding</div>
<div class="py-md">Vertical padding</div>
```

### Margin
```html
<div class="m-auto">Center with auto margin</div>
<div class="mx-auto">Horizontal center</div>
<div class="my-auto">Vertical center</div>
```

---

## Overflow Utilities

```html
<div class="overflow-hidden">Hidden overflow</div>
<div class="overflow-auto">Auto scrollbars</div>
<div class="overflow-x-auto">Horizontal scroll only</div>
<div class="overflow-y-auto">Vertical scroll only</div>
<div class="scroll-x-hidden">Horizontal scroll, hidden scrollbar</div>
```

---

## Position Utilities

```html
<div class="relative">Position relative</div>
<div class="absolute">Position absolute</div>
<div class="fixed">Position fixed</div>
<div class="sticky">Position sticky (top: 0)</div>
<div class="inset-0">All sides 0</div>
```

---

## Width/Height Utilities

```html
<div class="w-full">Full width</div>
<div class="h-full">Full height</div>
<div class="min-h-screen">Min height viewport</div>
<div class="max-w-screen">Max width viewport</div>
```

---

## Text Utilities

### Alignment
```html
<p class="text-left">Left aligned</p>
<p class="text-center">Centered</p>
<p class="text-right">Right aligned</p>
```

### Truncation
```html
<p class="truncate">Long text that will be truncated...</p>
<p class="line-clamp-2">Text clamped to 2 lines...</p>
<p class="line-clamp-3">Text clamped to 3 lines...</p>
```

---

## Visibility Utilities

```html
<div class="hidden">Hidden (display: none)</div>
<div class="invisible">Invisible (visibility: hidden)</div>
<div class="visible">Visible</div>
```

### Screen Reader Only
```html
<span class="sr-only">Text only for screen readers</span>
```

---

## Breakpoints

| Name | Width | CSS Variable |
|------|-------|--------------|
| sm | 480px | --bp-sm |
| md | 640px | --bp-md |
| lg | 1024px | --bp-lg |
| xl | 1280px | --bp-xl |
| 2xl | 1440px | --bp-2xl |

### Usage in Media Queries
```css
/* Mobile-first approach */
@media (min-width: 640px) {
  /* Tablet and up */
}

@media (min-width: 1024px) {
  /* Desktop and up */
}
```

---

## CSS Custom Properties

```css
:root {
  --sidebar-width: clamp(280px, 24vw, 380px);
  --sidebar-width-collapsed: 64px;
  --sidebar-width-mobile: 90vw;
  --sidebar-max-mobile: 320px;
  --topbar-height: clamp(48px, 5vw, 64px);
  --content-max-width: 1400px;
  --content-padding: var(--space-lg);
}
```

