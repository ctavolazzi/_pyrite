# Dashboard V3 Architecture Proposal

## The Problem

The current dashboard has **3,243 lines in app.js** doing everything:
- State management
- DOM manipulation
- Event handling
- Business logic
- Rendering
- WebSocket
- Keyboard shortcuts
- Notifications
- Modals
- Search
- etc.

Each "component" (like `work-queue.js`) is a mini-monolith that:
- Mixes state + rendering + DOM + events
- Is a singleton on `window`
- Has hardcoded DOM IDs
- Can't be tested without a browser
- Can't be instantiated twice
- Has demo data baked in

## The Seed Strategy Solution

Separate **Capabilities** from **Intelligence** from **Presentation**.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SEED ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ CAPABILITIES │    │    STATE     │    │  RENDERERS   │       │
│  │  (Hands)     │    │  (Memory)    │    │   (Body)     │       │
│  │              │    │              │    │              │       │
│  │ Pure funcs   │    │ Reactive     │    │ Pure funcs   │       │
│  │ No DOM       │    │ Observable   │    │ No state     │       │
│  │ No state     │    │ emit/sub     │    │ Return HTML  │       │
│  │              │    │              │    │              │       │
│  │ TicketOps    │    │ queueStore   │    │ QueueView    │       │
│  │ RepoOps      │    │ repoStore    │    │ TreeView     │       │
│  │ SearchOps    │    │ uiStore      │    │ DetailView   │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │   CONTROLLERS   │                          │
│                    │    (Spine)      │                          │
│                    │                 │                          │
│                    │ Wire up layers  │                          │
│                    │ Mount to DOM    │                          │
│                    │ Bind events     │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │      APP        │                          │
│                    │  (Entry Point)  │                          │
│                    │                 │                          │
│                    │ Create stores   │                          │
│                    │ Init WebSocket  │                          │
│                    │ Mount ctrls     │                          │
│                    └─────────────────┘                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Proposed Directory Structure

```
dashboard-v3/
├── public/
│   ├── capabilities/           # THE "HANDS" - Pure logic
│   │   ├── tickets.js          # groupBy, filter, sort, stats
│   │   ├── work-efforts.js     # CRUD operations
│   │   ├── repos.js            # Repository operations
│   │   ├── search.js           # Search/filter logic
│   │   └── index.js            # Export all
│   │
│   ├── state/                  # THE "MEMORY" - Reactive stores
│   │   ├── store.js            # Base store factory
│   │   ├── queue-store.js      # Tickets, filter, selection
│   │   ├── repo-store.js       # Repos, work efforts
│   │   ├── ui-store.js         # View state, modals, panels
│   │   └── index.js            # Export all
│   │
│   ├── renderers/              # THE "BODY" - Pure view functions
│   │   ├── queue.js            # QueueRenderer.render(data)
│   │   ├── tree.js             # TreeRenderer.render(data)
│   │   ├── detail.js           # DetailRenderer.render(data)
│   │   ├── stats.js            # StatsRenderer.render(data)
│   │   ├── modal.js            # ModalRenderer.render(data)
│   │   └── index.js            # Export all
│   │
│   ├── controllers/            # THE "SPINE" - Wire-up
│   │   ├── queue.js            # createQueueController()
│   │   ├── tree.js             # createTreeController()
│   │   ├── detail.js           # createDetailController()
│   │   └── index.js            # Export all
│   │
│   ├── lib/                    # Infrastructure
│   │   ├── websocket.js        # WebSocket connection
│   │   ├── event-bus.js        # Internal messaging
│   │   ├── keyboard.js         # Keyboard shortcuts
│   │   └── utils.js            # Helpers
│   │
│   ├── styles/                 # Scoped CSS (already started)
│   │   ├── tokens.css
│   │   ├── components/
│   │   └── ...
│   │
│   └── app.js                  # Entry point (< 200 lines)
```

## Migration Path

### Phase 1: Extract Capabilities (Day 1)
Extract pure logic from `app.js`:
- `TicketCapabilities` - already demoed
- `WorkEffortCapabilities` - CRUD, grouping
- `SearchCapabilities` - filter, match

**Result:** ~300 lines moved, testable without DOM

### Phase 2: Create Stores (Day 2)
Replace scattered state:
- `queueStore` - tickets, filter, selection
- `repoStore` - repos, work efforts
- `uiStore` - view state, panels, modals

**Result:** Single source of truth, reactive updates

### Phase 3: Extract Renderers (Day 3-4)
Convert render methods to pure functions:
- `QueueRenderer.render(data) → HTML`
- `TreeRenderer.render(data) → HTML`
- `DetailRenderer.render(data) → HTML`

**Result:** ~800 lines moved, testable

### Phase 4: Create Controllers (Day 5)
Wire everything together:
- Mount renderers to containers
- Subscribe to store changes
- Delegate events

**Result:** Clean separation, composable

### Phase 5: Cleanup (Day 6)
- Delete legacy `styles.css`
- Remove dead code from `app.js`
- Final testing

**Target:** `app.js` < 200 lines

## Why This Enables AI Integration

The **Seed Strategy** says: separate Capabilities from Intelligence.

```javascript
// HUMAN TRIGGER
button.onclick = () => {
  TicketCapabilities.updateStatus(ticket, 'completed');
};

// AI TRIGGER (same capability!)
const result = await ai.streamText({
  tools: {
    completeTicket: {
      execute: ({ ticketId }) => {
        TicketCapabilities.updateStatus(
          store.get().tickets.find(t => t.id === ticketId),
          'completed'
        );
      }
    }
  }
});
```

The **same capability** works whether triggered by human click or AI command.

When you're ready to add AI:
1. Keep Capabilities (the "Hands")
2. Keep Renderers (the "Body")
3. Swap the trigger (human → AI)

## Next Steps

1. Review `lib/seed-architecture-example.js` for the pattern
2. Choose first component to migrate (recommend: Queue)
3. Validate pattern works before migrating more
4. Iterate

## Questions?

- Should we use ES6 modules or keep bundleless?
- Should stores be shared across components or isolated?
- What's the minimum viable first migration?

