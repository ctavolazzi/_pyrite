# Cards Component Documentation

## Overview

Cards are flexible containers for grouping related content. They follow a BEM-like naming convention and are touch-friendly with consistent spacing and borders.

## Import

```css
@import url('./components/cards.css');
```

---

## Base Card

The base `.card` class provides a flexible container.

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

### Properties
- Background: --bg-card
- Border: 1px solid --border-subtle
- Border radius: 12px (--radius-lg)
- Padding: 12-16px (--space-md)

---

## Card Variants

### Stat Card (.card--stat / .stat-card)

Displays statistics with icon, value, and label.

```html
<div class="stat-card">
  <div class="stat-icon">📊</div>
  <div class="stat-content">
    <span class="stat-value">42</span>
    <span class="stat-label">Active Tasks</span>
  </div>
</div>
```

**BEM Alternative:**
```html
<div class="card--stat">
  <div class="card__icon">📊</div>
  <div class="card__content">
    <span class="card__value">42</span>
    <span class="card__label">Active Tasks</span>
  </div>
</div>
```

### Highlighted Stat
```html
<div class="stat-card highlight">
  <div class="stat-icon pulsing">🔥</div>
  <div class="stat-content">
    <span class="stat-value">3</span>
    <span class="stat-label">In Progress</span>
  </div>
</div>
```

---

### Queue Card (.queue-card / .queue-item)

Used for work effort items in the queue list.

```html
<div class="queue-card">
  <div class="queue-indicator active"></div>
  <div class="queue-card-content">
    <div class="queue-card-meta">WE-251231-abcd</div>
    <div class="queue-card-title">Feature Implementation</div>
    <div class="queue-card-progress">3/5 tickets completed</div>
  </div>
  <span class="queue-card-status active">Active</span>
  <div class="queue-card-actions">
    <button class="queue-action-btn">👁</button>
    <button class="queue-action-btn success">✓</button>
  </div>
</div>
```

**Legacy Version (used in app.js):**
```html
<div class="queue-item">
  <div class="queue-indicator active"></div>
  <div class="queue-info">
    <div class="queue-id">WE-251231-abcd</div>
    <div class="queue-title">Feature Implementation</div>
    <div class="queue-meta">3/5 tickets completed</div>
  </div>
  <span class="queue-badge active">Active</span>
  <div class="queue-actions">
    <button class="queue-action-btn">👁</button>
  </div>
</div>
```

---

### Action Card (.stat-card.action-card)

Used for test and demo buttons.

```html
<div class="stat-card test-card">
  <button class="test-btn">
    <span class="test-icon">🧪</span>
    <span class="test-label">Test System</span>
  </button>
</div>

<div class="stat-card demo-card">
  <button class="demo-btn">
    <span class="demo-icon">🎬</span>
    <span class="demo-label">Live Demo</span>
  </button>
</div>
```

---

### Panel Section (.panel-section)

Used in detail view for content sections.

```html
<div class="panel-section">
  <h3 class="panel-title">Overview</h3>
  <p>Panel content here...</p>
</div>

<div class="panel-section stat-highlight">
  <h3 class="panel-title">Key Metrics</h3>
  <div class="stat-row">
    <div class="mini-stat">
      <span class="mini-stat-value">5</span>
      <span class="mini-stat-label">Tickets</span>
    </div>
    <div class="mini-stat">
      <span class="mini-stat-value">60%</span>
      <span class="mini-stat-label">Progress</span>
    </div>
  </div>
</div>
```

---

## Stats Section Grid

Responsive grid for stat cards.

```html
<div class="stats-section">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card test-card">...</div>
  <div class="stat-card demo-card">...</div>
</div>
```

### Responsive Breakpoints
- Mobile (< 400px): 1 column
- Phones (400-640px): 2 columns
- Tablet (640-900px): 3 columns
- Desktop (900-1200px): 4 columns
- Large (> 1200px): 6 columns

---

## Queue Section

Container for queue list with filters.

```html
<div class="queue-section">
  <div class="queue-header">
    <h2>Work Queue</h2>
    <div class="queue-filters">
      <button class="filter-btn active">All</button>
      <button class="filter-btn">Active</button>
      <button class="filter-btn">Pending</button>
    </div>
  </div>
  <div class="queue-list">
    <div class="queue-item">...</div>
    <div class="queue-item">...</div>
  </div>
</div>
```

### Empty State
```html
<div class="queue-empty">
  <span class="empty-icon">📭</span>
  <p>No work efforts found</p>
</div>
```

---

## Card States

### Clickable Card
```html
<div class="card is-clickable">
  Click me
</div>
```

### Active Card
```html
<div class="card is-active">
  Currently selected
</div>
```

### Highlighted Card
```html
<div class="card is-highlighted">
  Featured content
</div>
```

### Completed Card
```html
<div class="card is-completed">
  Completed item (reduced opacity)
</div>
```

---

## Accessibility

- Cards use semantic HTML where possible
- Interactive cards have cursor: pointer
- Focus states visible on keyboard navigation
- Touch targets meet 44px minimum

---

## CSS Custom Properties

```css
:root {
  --card-padding: var(--space-md);
  --card-padding-sm: var(--space-sm);
  --card-padding-lg: var(--space-lg);
  --card-radius: var(--radius-lg);
}
```

