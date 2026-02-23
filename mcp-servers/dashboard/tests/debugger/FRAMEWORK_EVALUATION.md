# Testing Framework Evaluation

## Existing Frameworks Considered

### 1. Playwright

**What it is:**
- End-to-end testing framework
- Browser automation
- Cross-browser testing
- Network interception
- Screenshot/Video capture

**Pros:**
- ✅ Excellent browser automation
- ✅ Built-in screenshot/video
- ✅ Network interception
- ✅ Performance metrics
- ✅ Already mentioned in roadmap
- ✅ Great for E2E testing
- ✅ Auto-waiting for elements
- ✅ Multi-browser support

**Cons:**
- ❌ Not designed for component-level testing
- ❌ Requires browser context (slower)
- ❌ Can't directly access component internals
- ❌ Heavier than unit testing

**Verdict:** ✅ **USE IT** for E2E, visual regression, and browser-based testing

### 2. @testing-library/dom (Testing Library)

**What it is:**
- DOM querying utilities
- User-centric testing
- Accessibility-first queries
- Framework agnostic

**Pros:**
- ✅ Perfect for component testing
- ✅ Accessibility-focused
- ✅ User-centric queries
- ✅ Lightweight
- ✅ Framework agnostic
- ✅ Encourages best practices

**Cons:**
- ❌ Requires test runner (Jest, Vitest, etc.)
- ❌ Not a full framework
- ❌ No visual regression built-in

**Verdict:** ✅ **USE IT** for component interaction testing

### 3. Vitest

**What it is:**
- Fast test runner (Vite-based)
- Jest-compatible API
- Native ESM support
- Built-in coverage

**Pros:**
- ✅ Very fast
- ✅ Modern (ESM)
- ✅ Jest-compatible
- ✅ Built-in coverage
- ✅ Great DX

**Cons:**
- ❌ Newer (less ecosystem)
- ❌ Node.js only (no browser)

**Verdict:** ⚠️ **CONSIDER** as test runner, but we might use Node.js test runner

### 4. Percy / Chromatic (Visual Regression)

**What it is:**
- Visual regression testing
- Screenshot comparison
- Cloud-based storage
- CI/CD integration

**Pros:**
- ✅ Professional visual testing
- ✅ Cloud storage
- ✅ Great UI
- ✅ CI/CD ready

**Cons:**
- ❌ Paid service (expensive)
- ❌ External dependency
- ❌ We want self-hosted (PocketBase)

**Verdict:** ❌ **SKIP** - We'll build our own with PocketBase

### 5. axe-core (Accessibility)

**What it is:**
- Accessibility testing engine
- WCAG compliance checking
- Rule-based testing

**Pros:**
- ✅ Industry standard
- ✅ Comprehensive rules
- ✅ Free and open source
- ✅ Can be integrated

**Cons:**
- ❌ Only accessibility (not full testing)

**Verdict:** ✅ **USE IT** for accessibility testing

### 6. Lighthouse CI

**What it is:**
- Performance auditing
- Best practices checking
- SEO analysis
- Accessibility scoring

**Pros:**
- ✅ Comprehensive metrics
- ✅ Performance focused
- ✅ Free and open source
- ✅ Can be automated

**Cons:**
- ❌ Heavier (full browser)
- ❌ More for page-level than component

**Verdict:** ⚠️ **CONSIDER** for performance, but might be overkill

## Recommended Stack

### Core Testing Stack

1. **Playwright** - E2E, visual regression, browser automation
2. **@testing-library/dom** - Component interaction testing
3. **axe-core** - Accessibility testing
4. **Node.js test runner** - Test execution (already in use)
5. **Custom TheOracle** - Our intelligent debugger

### Why This Stack?

- **Playwright:** Best-in-class browser automation, already planned
- **Testing Library:** Perfect for component testing, user-centric
- **axe-core:** Industry standard for accessibility
- **Node.js test runner:** Already in use, no new dependency
- **Custom debugger:** Gives us full control, learning capabilities

### What We Build Ourselves

1. **TheOracle** - Core intelligent debugger
2. **Visual Regression** - Using Playwright screenshots + PocketBase
3. **CSS Analysis** - Custom CSS property extraction
4. **Pattern Learning** - Custom ML/pattern recognition
5. **Reporting** - Custom reports with PocketBase data

## Integration Plan

```
TheOracle (Our Core)
    ↓
    ├─→ Playwright (Browser automation)
    ├─→ Testing Library (Component queries)
    ├─→ axe-core (Accessibility)
    └─→ PocketBase (Data storage)
```

## Dependencies to Add

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/dom": "^9.3.0",
    "axe-core": "^4.8.0",
    "pocketbase": "^0.20.0"
  }
}
```

## Decision Summary

| Framework | Decision | Reason |
|-----------|----------|--------|
| Playwright | ✅ Use | Best E2E, visual regression |
| Testing Library | ✅ Use | Perfect for components |
| axe-core | ✅ Use | Industry standard a11y |
| Vitest | ⚠️ Consider | Fast, but Node.js test runner works |
| Percy/Chromatic | ❌ Skip | Want self-hosted solution |
| Lighthouse CI | ⚠️ Consider | Might be overkill |

**Final Stack:** Playwright + Testing Library + axe-core + Custom TheOracle + PocketBase

