# Data Flow Visualization

```

┌─────────────────────────────────────────────────────────┐
│           Mission Control Data Flow Diagram              │
└─────────────────────────────────────────────────────────┘

┌─ Step 1: File System ──────────────────────────────┐
│ Read markdown files from _work_efforts directory        │
│                                                         │
│ Input:  File system (markdown files)                      │
│ Output: 26 work effort files                              │
│                                                         │
│ files: 26                                                  │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Step 2: Parser ───────────────────────────────────┐
│ Parse frontmatter and extract structured data           │
│                                                         │
│ Input:  Raw markdown content                              │
│ Output: Structured work effort objects                    │
│                                                         │
│ workEfforts: 26                                                  │
│ tickets: 207                                                 │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Step 3: Statistics ───────────────────────────────┐
│ Calculate repository statistics                         │
│                                                         │
│ Input:  Work effort objects                               │
│ Output: Repository stats object                           │
│                                                         │
│ total: 26                                                  │
│ byFormat: [object Object]                                     │
│ byStatus: [object Object]                                     │
│ totalTickets: 207                                                 │
│ ticketsByStatus: [object Object]                                     │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Step 4: Server State ─────────────────────────────┐
│ Create in-memory server state                           │
│                                                         │
│ Input:  Parsed work efforts + stats                       │
│ Output: Server state object                               │
│                                                         │
│ size: ~67KB serialized                                    │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Step 5: WebSocket ────────────────────────────────┐
│ Serialize and send to clients                           │
│                                                         │
│ Input:  Server state                                      │
│ Output: WebSocket message (JSON)                          │
│                                                         │
│ messageSize: ~67KB                                               │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Step 6: Client State ─────────────────────────────┐
│ Deserialize and update client state                     │
│                                                         │
│ Input:  WebSocket message                                 │
│ Output: Client state object                               │
│                                                         │
│ repos: 1                                                   │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Step 7: Event Bus ────────────────────────────────┐
│ Emit events for UI updates                              │
│                                                         │
│ Input:  State changes                                     │
│ Output: Event bus events                                  │
│                                                         │
│ events: 1                                                   │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Step 8: UI Update ────────────────────────────────┐
│ Render updates to DOM                                   │
│                                                         │
│ Input:  Event bus events                                  │
│ Output: DOM updates                                       │
│                                                         │
│ components: Multiple                                            │
└─────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│              Repository Statistics                       │
└─────────────────────────────────────────────────────────┘

Work Efforts: undefined total, undefined active
[] NaN%

Tickets: 207 total, undefined completed
[] NaN%


┌─────────────────────────────────────────────────────────┐
│              Event Flow Visualization                    │
└─────────────────────────────────────────────────────────┘

SYSTEM Events (1):
  ───────────────────────────────────────────────────────
  • connected            → "N/A"                         


┌─────────────────────────────────────────────────────────┐
│              Processing Timeline                        │
└─────────────────────────────────────────────────────────┘

File System               [██████████████████████████████████████████████████] 100%
Parser                    [██████████████████████████████░░░░░░░░░░░░░░░░░░░░] 60%
Statistics                [█████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 10%
Server State              [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 4%
WebSocket                 [██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 20%
Client State              [█████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 10%
Event Bus                 [███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 6%
UI Update                 [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 40%

```
