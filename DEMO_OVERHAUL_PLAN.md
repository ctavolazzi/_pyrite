# Demo Feature Overhaul Plan
**Branch:** `claude/overhaul-demo-feature-f6Cfy`
**Date:** 2026-01-01
**Status:** Planning Phase

---

## Executive Summary

The current demo feature is a hardcoded 10-step walkthrough that demonstrates Mission Control's capabilities by creating real work efforts and tickets. While functional, it lacks modularity, extensibility, and customization options. This overhaul will transform it into a flexible, scenario-based demonstration system.

---

## Current State Analysis

### Strengths ✓
- **Fully functional** - Creates real files, demonstrates actual system behavior
- **Real-time integration** - Shows WebSocket updates and file system watching
- **Visual feedback** - Step-by-step UI with animated progress
- **Well documented** - References in USER-GUIDE, ARCHITECTURE, README
- **Error handling** - Graceful failure with user notifications

### Pain Points ✗
- **Monolithic code** - 220+ lines embedded in MissionControl class
- **Hardcoded workflow** - Fixed 10 steps, can't customize or extend
- **Dual implementation** - Same code duplicated in dashboard/dashboard-v3
- **Limited scenarios** - Only one demo path available
- **No state persistence** - Can't resume failed demos
- **Timing inflexibility** - Fixed 2.67s pauses, no user control
- **No analytics** - Can't track completion rates or popular scenarios

---

## Proposed Architecture

### 1. Modular Service Layer

**New Files:**
```
mcp-servers/dashboard-v3/services/
├── DemoOrchestrator.js       # Main demo coordination service
├── DemoScenarioLoader.js     # Loads and validates demo scenarios
├── DemoStateManager.js       # Manages demo state and persistence
└── DemoAnalytics.js          # Tracks demo usage and metrics
```

**Responsibilities:**
- **DemoOrchestrator**: Executes scenarios, manages step lifecycle
- **DemoScenarioLoader**: Parses JSON/YAML scenario definitions
- **DemoStateManager**: Saves progress, enables resume functionality
- **DemoAnalytics**: Logs events, tracks completion rates

---

### 2. Scenario-Based Configuration

**Demo Scenarios Directory:**
```
mcp-servers/dashboard-v3/demos/
├── scenarios/
│   ├── quick-tour.json           # 5-minute overview (default)
│   ├── full-walkthrough.json     # Current 10-step demo
│   ├── advanced-features.json    # Power user features
│   └── troubleshooting.json      # Common issues resolution
├── templates/
│   └── scenario-template.json    # Template for creating new scenarios
└── README.md                     # How to create custom scenarios
```

**Scenario Schema:**
```json
{
  "id": "quick-tour",
  "name": "Quick Tour",
  "description": "5-minute overview of Mission Control",
  "duration": "~5 minutes",
  "difficulty": "beginner",
  "tags": ["onboarding", "quick-start"],
  "config": {
    "stepPause": 2000,
    "autoCleanup": true,
    "celebrationAnimation": true
  },
  "steps": [
    {
      "id": "init",
      "title": "Initialize Demo",
      "icon": "◌",
      "action": "delay",
      "params": { "ms": 500 },
      "details": "Preparing demonstration..."
    },
    {
      "id": "create-we",
      "title": "Create Work Effort",
      "icon": "📁",
      "action": "api",
      "params": {
        "method": "POST",
        "endpoint": "/api/demo/work-effort",
        "body": {
          "title": "Quick Tour Demo",
          "objective": "Demonstrate core features"
        }
      },
      "details": "Creating work effort...",
      "storeAs": "workEffort"
    }
    // ... more steps
  ]
}
```

---

### 3. Enhanced UI Components

**New Frontend Structure:**
```
public/
├── js/
│   ├── components/
│   │   ├── DemoController.js      # UI orchestration
│   │   ├── DemoSelector.js        # Scenario selection UI
│   │   ├── DemoProgress.js        # Step visualization
│   │   └── DemoSettings.js        # Customization panel
│   └── utils/
│       └── demoHelpers.js         # Shared utilities
```

**UI Enhancements:**
1. **Scenario Selector**: Dropdown/modal to choose demo type
2. **Speed Control**: Slider to adjust step pause duration (0.5x - 3x)
3. **Skip/Pause Controls**: User can pause or skip steps
4. **Progress Indicator**: Visual progress bar with step count
5. **Replay Button**: Restart demo from beginning
6. **Resume Prompt**: Auto-detect incomplete demos on page load

---

### 4. API Enhancements

**New Endpoints:**
```
GET    /api/demo/scenarios              # List available scenarios
GET    /api/demo/scenarios/:id          # Get scenario definition
POST   /api/demo/start                  # Start demo with scenario ID
POST   /api/demo/pause                  # Pause current demo
POST   /api/demo/resume                 # Resume paused demo
POST   /api/demo/skip-step              # Skip current step
GET    /api/demo/state                  # Get current demo state
DELETE /api/demo/reset                  # Reset demo state
GET    /api/demo/analytics              # Get demo usage stats
```

**Enhanced Existing Endpoints:**
- Add validation for all inputs
- Return structured error responses
- Include operation timing metadata

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
**Goal:** Extract demo logic into modular services

- [ ] Create `DemoOrchestrator.js` service
- [ ] Move step execution logic from `MissionControl.runLiveDemo()`
- [ ] Create `DemoStateManager.js` for state persistence
- [ ] Add localStorage support for demo state
- [ ] Write unit tests for core services

**Success Criteria:**
- Demo runs with same behavior via new orchestrator
- State persists across page refreshes
- Zero regression in functionality

---

### Phase 2: Scenario System (Days 3-4)
**Goal:** Implement configuration-based scenarios

- [ ] Create `DemoScenarioLoader.js`
- [ ] Design and validate scenario JSON schema
- [ ] Convert current demo to `full-walkthrough.json`
- [ ] Create `quick-tour.json` (simplified version)
- [ ] Add scenario validation and error reporting
- [ ] Update backend to serve scenario files

**Success Criteria:**
- Can load multiple scenarios from JSON
- Schema validation catches malformed scenarios
- Backend serves scenario list via API

---

### Phase 3: Enhanced UI (Days 5-6)
**Goal:** Build user-friendly demo controls

- [ ] Create `DemoSelector.js` component
- [ ] Build `DemoSettings.js` for customization
- [ ] Add speed control slider
- [ ] Implement pause/resume buttons
- [ ] Add skip step functionality
- [ ] Create progress bar visualization
- [ ] Update CSS for new components

**Success Criteria:**
- Users can choose from multiple scenarios
- Speed control affects step timing
- Pause/resume works without data loss
- UI is responsive and accessible

---

### Phase 4: Advanced Features (Days 7-8)
**Goal:** Add analytics and error recovery

- [ ] Create `DemoAnalytics.js` service
- [ ] Track demo starts, completions, failures
- [ ] Log step timing and user interactions
- [ ] Implement auto-resume on page load
- [ ] Add error recovery suggestions
- [ ] Create admin dashboard for analytics
- [ ] Add export functionality for usage data

**Success Criteria:**
- Analytics capture key metrics
- Failed demos can be resumed
- Admin can view usage statistics
- Data exports work correctly

---

### Phase 5: Additional Scenarios (Days 9-10)
**Goal:** Create diverse demonstration scenarios

- [ ] Design `advanced-features.json` scenario
- [ ] Design `troubleshooting.json` scenario
- [ ] Create `scenario-template.json` template
- [ ] Write scenario creation guide
- [ ] Add scenario difficulty indicators
- [ ] Implement scenario search/filter
- [ ] Create scenario preview mode

**Success Criteria:**
- At least 4 complete scenarios available
- Documentation enables community scenario creation
- Users can preview scenarios before starting

---

### Phase 6: Polish & Documentation (Days 11-12)
**Goal:** Finalize and document the overhaul

- [ ] Update USER-GUIDE.md with new features
- [ ] Update ARCHITECTURE.md with new design
- [ ] Create DEMO_SCENARIOS.md guide
- [ ] Add JSDoc comments to all new code
- [ ] Write integration tests
- [ ] Perform accessibility audit
- [ ] Create migration guide from old demo
- [ ] Update CHANGELOG.md

**Success Criteria:**
- Documentation is complete and accurate
- All code has proper comments
- Integration tests pass
- Accessibility standards met (WCAG 2.1 AA)

---

## Technical Specifications

### State Management

**Demo State Object:**
```javascript
{
  demoId: "uuid-v4",
  scenarioId: "quick-tour",
  status: "running", // idle, running, paused, completed, failed
  currentStepIndex: 3,
  startTime: 1735689600000,
  pauseTime: null,
  completionTime: null,
  steps: [
    {
      stepId: "init",
      status: "completed",
      startTime: 1735689600000,
      completionTime: 1735689600500,
      error: null
    },
    // ... more steps
  ],
  variables: {
    workEffort: { id: "WE-260101-a1b2", path: "..." },
    tickets: [...]
  },
  config: {
    speed: 1.0,
    autoCleanup: true,
    celebrationAnimation: true
  }
}
```

**Persistence Strategy:**
- Use `localStorage` for state storage
- Key: `missionControl:demo:state:${demoId}`
- Auto-save after each step completion
- Clean up states older than 7 days
- Option to export/import demo state

---

### Action Types

**Built-in Actions:**
```javascript
{
  "delay": { params: { ms: number } },
  "api": { params: { method, endpoint, body, storeAs } },
  "waitFor": { params: { condition, timeout, pollInterval } },
  "updateStatus": { params: { message, type } },
  "conditional": { params: { if, then, else } },
  "parallel": { params: { actions: [] } },
  "custom": { params: { handler: string, args: {} } }
}
```

**Custom Action Registry:**
- Allow registration of custom action handlers
- Enable scenario-specific business logic
- Validate action params against schema

---

### Error Handling

**Error Recovery Strategies:**
1. **Retry Logic**: Auto-retry failed API calls (max 3 attempts)
2. **Skip Option**: Allow users to skip failed steps
3. **Fallback Actions**: Define alternative actions in scenario
4. **State Preservation**: Save state before critical operations
5. **User Notification**: Clear error messages with suggested actions

**Error Types:**
```javascript
{
  NETWORK_ERROR: "Network request failed",
  VALIDATION_ERROR: "Invalid scenario configuration",
  TIMEOUT_ERROR: "Operation exceeded timeout",
  STATE_ERROR: "Invalid demo state transition",
  USER_CANCELLED: "User cancelled the demo"
}
```

---

### Analytics Events

**Tracked Events:**
```javascript
{
  "demo.started": { scenarioId, timestamp, userAgent },
  "demo.step.completed": { scenarioId, stepId, duration },
  "demo.step.failed": { scenarioId, stepId, error },
  "demo.paused": { scenarioId, stepIndex, timestamp },
  "demo.resumed": { scenarioId, stepIndex, pauseDuration },
  "demo.completed": { scenarioId, totalDuration, stepCount },
  "demo.abandoned": { scenarioId, stepIndex, timestamp },
  "demo.speed.changed": { scenarioId, oldSpeed, newSpeed },
  "demo.step.skipped": { scenarioId, stepId, reason }
}
```

**Storage:**
- Store in SQLite database (new `demo_analytics` table)
- Schema: `id, event_type, scenario_id, step_id, timestamp, metadata (JSON)`
- Retention: 90 days of detailed events, aggregated stats forever

---

## Migration Strategy

### Backward Compatibility

**Old Demo Support:**
1. Keep existing `/api/demo/*` endpoints functional
2. Add deprecation notices in response headers
3. Provide 30-day migration window
4. Create compatibility layer for old UI

**Migration Path:**
1. **Week 1**: Deploy new system alongside old
2. **Week 2**: Show migration banner to users
3. **Week 3**: Auto-migrate users to new UI
4. **Week 4**: Deprecate old endpoints (still functional)
5. **Month 2**: Remove old code

---

## Testing Strategy

### Unit Tests
- Test each service in isolation
- Mock API calls and DOM interactions
- Achieve >90% code coverage
- Use Jest + Testing Library

### Integration Tests
- Test end-to-end scenario execution
- Validate API endpoint responses
- Test state persistence across sessions
- Use Playwright for E2E tests

### Manual Testing Checklist
- [ ] All scenarios load and execute
- [ ] Pause/resume works correctly
- [ ] Speed control affects timing
- [ ] Error recovery functions properly
- [ ] Analytics data is accurate
- [ ] UI is responsive on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Demo cleanup removes all files

---

## Success Metrics

**Quantitative:**
- Demo completion rate > 80%
- Average demo duration < 10 minutes
- Error rate < 5%
- User abandonment rate < 15%
- Scenario diversity: 4+ active scenarios

**Qualitative:**
- User feedback score > 4/5
- Positive comments on flexibility
- Developers can create custom scenarios
- Documentation is clear and helpful

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Breaking existing functionality | High | Comprehensive testing, feature flags, gradual rollout |
| Performance degradation | Medium | Profile before/after, optimize hot paths, lazy loading |
| Complex scenarios fail | Medium | Robust error handling, validation, fallback scenarios |
| User confusion with new UI | Medium | User testing, tooltips, onboarding guide |
| State corruption | Low | Schema validation, regular cleanup, export/import |
| Analytics privacy concerns | Low | Anonymize data, clear privacy policy, opt-out option |

---

## Future Enhancements (Post-Launch)

1. **Interactive Scenarios**: Allow users to make choices during demo
2. **Video Narration**: Add optional voice-over explanations
3. **Branching Paths**: Different outcomes based on user choices
4. **Community Scenarios**: User-submitted scenario marketplace
5. **Demo Templates**: Common patterns as reusable templates
6. **Real-time Collaboration**: Multi-user demo sessions
7. **A/B Testing**: Compare scenario effectiveness
8. **Localization**: Multi-language scenario support
9. **Accessibility Modes**: High contrast, screen reader optimized
10. **Demo Recording**: Export demo as video or GIF

---

## Dependencies

**New NPM Packages:**
- `uuid` (v9.x) - Generate unique demo IDs
- `ajv` (v8.x) - JSON schema validation
- `date-fns` (v3.x) - Timestamp formatting
- `better-sqlite3` (v9.x) - Analytics storage (optional)

**Existing Dependencies:**
- Express.js - API endpoints
- Node.js fs/promises - File operations
- WebSocket - Real-time updates

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Foundation | 2 days | Modular services, state management |
| Scenario System | 2 days | JSON-based scenarios, loader |
| Enhanced UI | 2 days | Selector, controls, progress visualization |
| Advanced Features | 2 days | Analytics, error recovery |
| Additional Scenarios | 2 days | 4+ scenarios, templates, guides |
| Polish & Docs | 2 days | Documentation, tests, audit |
| **Total** | **12 days** | **Production-ready demo overhaul** |

---

## Sign-Off

**Ready for Implementation:** ✓
**Next Steps:**
1. Review this plan with stakeholders
2. Set up feature branch environment
3. Begin Phase 1 implementation
4. Schedule daily progress check-ins

**Branch:** `claude/overhaul-demo-feature-f6Cfy`
**Estimated Completion:** 2026-01-13 (12 working days)

---

## Questions for Stakeholders

1. Should we support custom action handlers for enterprise users?
2. Is SQLite acceptable for analytics, or should we use external service?
3. What's the priority order for new scenarios?
4. Should we include demo templates in the open-source repo?
5. Any specific accessibility requirements beyond WCAG 2.1 AA?
6. Should demos support multi-tenancy (different org configurations)?

---

*Document Version: 1.0*
*Last Updated: 2026-01-01*
*Author: Claude (Anthropic)*
