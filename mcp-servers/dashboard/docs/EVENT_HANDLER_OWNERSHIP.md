# Event Handler Ownership System

## Overview

To prevent conflicts from duplicate event handlers, we use an **EventHandlerRegistry** system that tracks which modules own which event handlers.

## The Problem

Previously, both `app.js` and `responsive.js` were attaching click handlers to `mobileMenuBtn`, causing conflicts where:
- One handler would open the menu
- The other handler would immediately close it
- Result: Menu appeared to be "stuck" and couldn't be closed

## The Solution

### EventHandlerRegistry

A global registry (`window.EventHandlerRegistry`) tracks all event handler attachments:

```javascript
// Register a handler (returns false if conflict detected)
EventHandlerRegistry.register('mobileMenuBtn', 'click', 'responsive.js');

// Check if handler exists
const existing = EventHandlerRegistry.check('mobileMenuBtn', 'click');
if (existing) {
  console.log(`Already registered by ${existing.owner}`);
}

// Get all handlers for an element
const handlers = EventHandlerRegistry.getHandlersForElement('mobileMenuBtn');
```

### Handler Ownership

Each UI element has a **single owner** that manages its event handlers:

| Element | Owner | Purpose |
|---------|-------|---------|
| `mobileMenuBtn` | `responsive.js` | Opens/closes mobile drawer |
| `sidebarClose` | `responsive.js` | Closes mobile drawer |
| `drawerBackdrop` | `responsive.js` | Closes drawer on outside click |
| `sidebarToggle` | `responsive.js` (primary) | Toggles sidebar (coordinates with app.js) |
| Escape key | `responsive.js` | Closes drawer |

### Usage Pattern

**Before attaching a handler:**

```javascript
// ✅ GOOD: Check registry first
if (EventHandlerRegistry.register('myButton', 'click', 'my-module.js')) {
  myButton.addEventListener('click', handleClick);
} else {
  const existing = EventHandlerRegistry.check('myButton', 'click');
  console.warn(`Handler already registered by ${existing.owner}`);
}

// ❌ BAD: Attach without checking
myButton.addEventListener('click', handleClick); // May conflict!
```

### Documentation Requirements

When a module owns handlers, document it clearly:

1. **In the module's file header:**
   ```javascript
   /**
    * OWNERSHIP: This module owns:
    * - mobileMenuBtn (click)
    * - sidebarClose (click)
    */
   ```

2. **At the handler attachment point:**
   ```javascript
   // mobileMenuBtn - OWNED BY responsive.js
   if (EventHandlerRegistry.register('mobileMenuBtn', 'click', 'responsive.js')) {
     mobileMenuBtn.addEventListener('click', handleClick);
   }
   ```

3. **In this documentation file** (update the ownership table)

## Adding New Handlers

1. Check if the element is already owned by another module
2. If not, register your ownership
3. Document the ownership in:
   - Module header comment
   - Handler attachment comment
   - This documentation file

## Debugging Conflicts

If you see warnings like:
```
[EventHandlerRegistry] CONFLICT DETECTED: Element "mobileMenuBtn" already has a "click" handler...
```

1. Check which modules are trying to attach handlers
2. Determine which module should own the handler
3. Remove duplicate handlers from the non-owning module
4. Update documentation

## Benefits

- ✅ Prevents silent conflicts
- ✅ Clear ownership documentation
- ✅ Console warnings when conflicts occur
- ✅ Easy to debug handler issues
- ✅ Self-documenting code

