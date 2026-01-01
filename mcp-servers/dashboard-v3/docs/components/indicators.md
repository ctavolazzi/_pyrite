# Indicators Component Documentation

## Overview

Indicators are visual feedback elements including status dots, badges, progress bars, and loading states. They use `filter: drop-shadow()` instead of `box-shadow` to prevent overflow issues.

## Import

```css
@import url('./components/indicators.css');
```

---

## Status Indicator (Dot)

Small circular indicators showing status.

### Basic Usage
```html
<span class="indicator"></span>
<span class="indicator indicator--active"></span>
<span class="indicator indicator--completed"></span>
```

### Status Variants

| Class | Color | Use Case |
|-------|-------|----------|
| `.indicator--active` | Orange | Active/in-progress |
| `.indicator--in-progress` | Blue (pulsing) | Currently working |
| `.indicator--completed` | Green | Done |
| `.indicator--pending` | Gray | Waiting |
| `.indicator--paused` | Yellow | On hold |
| `.indicator--blocked` | Red | Blocked |

```html
<span class="indicator indicator--active"></span>
<span class="indicator indicator--in-progress"></span>
<span class="indicator indicator--completed"></span>
<span class="indicator indicator--pending"></span>
<span class="indicator indicator--paused"></span>
<span class="indicator indicator--blocked"></span>
```

### Legacy Class Names (for queue items)
```html
<span class="indicator active"></span>
<span class="indicator in_progress"></span>
<span class="indicator completed"></span>
<span class="indicator pending"></span>
<span class="indicator paused"></span>
<span class="indicator blocked"></span>
```

### Sizes
```html
<span class="indicator indicator--sm"></span>  <!-- 8px -->
<span class="indicator"></span>                 <!-- 12px default -->
<span class="indicator indicator--lg"></span>  <!-- 16px -->
```

---

## Activity Indicator

Indicator with label, used in headers.

```html
<div class="activity-indicator">
  <span class="indicator"></span>
  <span class="activity-text">Idle</span>
</div>

<div class="activity-indicator is-active">
  <span class="indicator"></span>
  <span class="activity-text">Working</span>
</div>
```

---

## Badge

Text badges for status labels and counts.

### Basic Badge
```html
<span class="badge">Label</span>
```

### Status Variants
```html
<span class="badge badge--active">Active</span>
<span class="badge badge--in-progress">In Progress</span>
<span class="badge badge--completed">Completed</span>
<span class="badge badge--pending">Pending</span>
<span class="badge badge--paused">Paused</span>
<span class="badge badge--blocked">Blocked</span>
```

### Legacy Class Names
```html
<span class="badge active">Active</span>
<span class="badge in_progress">In Progress</span>
<span class="badge completed">Completed</span>
```

### Semantic Variants
```html
<span class="badge badge--success">Success</span>
<span class="badge badge--warning">Warning</span>
<span class="badge badge--danger">Error</span>
<span class="badge badge--info">Info</span>
<span class="badge badge--accent">Featured</span>
```

### Badge with Dot
```html
<span class="badge badge--dot badge--active">Active</span>
```

### Sizes
```html
<span class="badge badge--sm">Small</span>
<span class="badge">Default</span>
<span class="badge badge--lg">Large</span>
```

---

## Notification Badge

Circular count badge for notifications.

```html
<button class="btn btn--icon">
  🔔
  <span class="notification-badge">3</span>
</button>

<button class="btn btn--icon">
  📧
  <span class="notification-badge">99+</span>
</button>
```

---

## Progress Bar

Linear progress indicator.

### Basic
```html
<div class="progress">
  <div class="progress__bar" style="width: 60%"></div>
</div>
```

### Sizes
```html
<div class="progress progress--sm">
  <div class="progress__bar" style="width: 40%"></div>
</div>

<div class="progress progress--lg">
  <div class="progress__bar" style="width: 80%"></div>
</div>
```

### Status Variants
```html
<div class="progress progress--success">
  <div class="progress__bar" style="width: 100%"></div>
</div>

<div class="progress progress--warning">
  <div class="progress__bar" style="width: 75%"></div>
</div>

<div class="progress progress--danger">
  <div class="progress__bar" style="width: 25%"></div>
</div>
```

### Striped (Animated)
```html
<div class="progress progress--striped progress--animated">
  <div class="progress__bar" style="width: 60%"></div>
</div>
```

---

## Progress Mini

Inline progress with label.

```html
<div class="progress-mini">
  <span class="progress-mini__text">60%</span>
  <div class="progress-mini__bar">
    <div class="progress-mini__fill" style="width: 60%"></div>
  </div>
</div>
```

---

## Progress Ring (Circular)

SVG-based circular progress.

```html
<svg class="progress-ring" viewBox="0 0 120 120">
  <circle class="progress-ring__background" cx="60" cy="60" r="52"></circle>
  <circle class="progress-ring__progress" cx="60" cy="60" r="52"
          style="stroke-dashoffset: calc(326.7 - (326.7 * 0.75))"></circle>
</svg>
```

### Sizes
```html
<svg class="progress-ring progress-ring--sm">...</svg>
<svg class="progress-ring">...</svg>
<svg class="progress-ring progress-ring--lg">...</svg>
```

---

## Loading Spinner

Animated spinning indicator.

```html
<span class="spinner"></span>
<span class="spinner spinner--sm"></span>
<span class="spinner spinner--lg"></span>
```

---

## Skeleton Loading

Placeholder content while loading.

```html
<div class="skeleton skeleton--text" style="width: 80%"></div>
<div class="skeleton skeleton--text" style="width: 60%"></div>
<div class="skeleton skeleton--button" style="width: 120px"></div>
<div class="skeleton skeleton--circle" style="width: 40px; height: 40px"></div>
```

---

## Accessibility

- Animated indicators respect `prefers-reduced-motion`
- Color alone doesn't convey status (use labels)
- Progress has aria attributes for screen readers

```html
<div class="progress" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
  <div class="progress__bar" style="width: 60%"></div>
</div>
```

---

## CSS Custom Properties

```css
:root {
  --indicator-size-sm: 8px;
  --indicator-size-md: 12px;
  --indicator-size-lg: 16px;
  --indicator-glow: 4px;
}
```

