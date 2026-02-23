# Buttons Component Documentation

## Overview

The button system provides consistent, accessible buttons with various variants, sizes, and states. All buttons are touch-friendly with a minimum 44px interaction area (WCAG 2.1 compliance).

## Import

```css
@import url('./components/buttons.css');
```

---

## Base Button

The base `.btn` class provides the foundation for all buttons.

```html
<button class="btn">Default Button</button>
```

### Properties
- Min height: 44px (touch-friendly)
- Padding: 8-12px vertical, 12-16px horizontal
- Border radius: 8px
- Font: Medium weight, 14px

---

## Variants

### Primary Button
Main call-to-action, uses accent color.

```html
<button class="btn btn--primary">Primary Action</button>
```

### Secondary Button
Outline style for secondary actions.

```html
<button class="btn btn--secondary">Secondary Action</button>
```

### Success Button
For confirmation/completion actions.

```html
<button class="btn btn--success">Complete</button>
```

### Warning Button
For cautionary actions.

```html
<button class="btn btn--warning">Proceed with Caution</button>
```

### Danger Button
For destructive actions.

```html
<button class="btn btn--danger">Delete</button>
```

### Ghost Button
Text-only, minimal chrome.

```html
<button class="btn btn--ghost">Cancel</button>
```

---

## Sizes

### Small (36px)
```html
<button class="btn btn--sm">Small</button>
```

### Medium (44px) - Default
```html
<button class="btn">Medium</button>
```

### Large (56px)
```html
<button class="btn btn--lg">Large</button>
```

### Full Width
```html
<button class="btn btn--full">Full Width</button>
```

---

## Icon Buttons

Square buttons for icon-only use.

```html
<button class="btn btn--icon">
  <span class="btn__icon">⚙️</span>
</button>

<button class="btn btn--icon btn--sm">
  <span class="btn__icon">✕</span>
</button>
```

### With Text
```html
<button class="btn">
  <span class="btn__icon btn__icon--left">📁</span>
  Open File
</button>

<button class="btn">
  Save
  <span class="btn__icon btn__icon--right">→</span>
</button>
```

---

## States

### Disabled
```html
<button class="btn" disabled>Disabled</button>
<button class="btn is-disabled">Disabled</button>
```

### Loading
```html
<button class="btn is-loading">Loading...</button>
```

---

## Button Groups

### Horizontal
```html
<div class="btn-group">
  <button class="btn">Left</button>
  <button class="btn">Center</button>
  <button class="btn">Right</button>
</div>
```

### Vertical
```html
<div class="btn-group btn-group--vertical">
  <button class="btn">Top</button>
  <button class="btn">Middle</button>
  <button class="btn">Bottom</button>
</div>
```

---

## Action Grid

2x2 grid layout for action buttons (used in detail view).

```html
<div class="action-grid">
  <button class="action-btn-grid action-primary">
    <span class="action-icon">▶</span>
    <span class="action-text">Resume</span>
  </button>
  <button class="action-btn-grid action-success">
    <span class="action-icon">✓</span>
    <span class="action-text">Complete</span>
  </button>
  <button class="action-btn-grid">
    <span class="action-icon">📋</span>
    <span class="action-text">View Tickets</span>
  </button>
  <button class="action-btn-grid action-warning">
    <span class="action-icon">⏸</span>
    <span class="action-text">Pause</span>
  </button>
</div>
```

---

## Status Buttons

Used for changing work effort status.

```html
<div class="status-controls">
  <button class="status-btn pending">
    <span class="status-icon">⏳</span>
    <span class="status-label">Pending</span>
  </button>
  <button class="status-btn active is-active">
    <span class="status-icon">▶</span>
    <span class="status-label">Active</span>
  </button>
  <button class="status-btn paused">
    <span class="status-icon">⏸</span>
    <span class="status-label">Paused</span>
  </button>
  <button class="status-btn completed">
    <span class="status-icon">✓</span>
    <span class="status-label">Complete</span>
  </button>
</div>
```

---

## Filter Buttons

Used for filtering lists.

```html
<div class="filter-group">
  <button class="filter-btn active">All</button>
  <button class="filter-btn">Active</button>
  <button class="filter-btn">Pending</button>
  <button class="filter-btn">Completed</button>
</div>
```

---

## Accessibility

- All buttons have minimum 44px touch targets
- Focus states use visible outline
- Loading state uses aria-busy attribute
- Reduced motion support for animations

```html
<button class="btn" aria-busy="true">Saving...</button>
<button class="btn" aria-pressed="true">Toggle On</button>
```

---

## CSS Custom Properties

```css
:root {
  --btn-height-sm: 36px;
  --btn-height-md: 44px;
  --btn-height-lg: 56px;
  --btn-radius: var(--radius-md);
}
```

