# The Oracle

**Theme:** "Bug's Life" meets "The Matrix" + 80s/90s/2000s Pop Culture
**Tagline:** "I need to consult The Oracle"

*Like the Oracle in The Matrix, this debugger sees patterns, predicts bugs, and learns from every test run. With references from your favorite 80s, 90s, and early 2000s movies throughout.*

**"There is no spoon... but there are bugs, and we will find them all."**

## Overview

A comprehensive, self-learning debugging and testing system that:
- 🔍 **Observes** everything (like Neo seeing the code)
- 🧠 **Learns** from patterns (like the Oracle predicting bugs)
- 💾 **Stores** knowledge in PocketBase (like the Matrix database)
- 🔄 **Uses** NovaSystem patterns (file-based, Git-backed, indexed)
- 🎯 **Applies** all relevant patterns and algorithms

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete architecture documentation.

### Core Components

1. **TheOracle** - Main orchestrator class
2. **Agents** - Specialized test runners (Component, Layout, Style, Interaction, A11y, Performance)
3. **Discovery** - Component discovery system
4. **Analysis** - CSS and DOM analysis
5. **Learning** - Pattern recognition and learning
6. **Queue** - FIFO test execution queue
7. **Storage** - PocketBase integration

## Framework Evaluation

See [FRAMEWORK_EVALUATION.md](./FRAMEWORK_EVALUATION.md) for detailed analysis.

### Recommended Stack

✅ **Playwright** - E2E, visual regression, browser automation
✅ **@testing-library/dom** - Component interaction testing
✅ **axe-core** - Accessibility testing
✅ **PocketBase** - Self-hosted data storage
✅ **Custom TheOracle** - Our intelligent debugger

### Why These Choices?

- **Playwright:** Best-in-class browser automation, already in roadmap
- **Testing Library:** Perfect for component testing, user-centric approach
- **axe-core:** Industry standard for accessibility (WCAG compliance)
- **PocketBase:** Self-hosted, lightweight, perfect for our needs
- **Custom debugger:** Full control, learning capabilities, themed experience

### What We Build Ourselves

1. **TheOracle** - Core intelligent debugger
2. **Visual Regression** - Using Playwright + PocketBase
3. **CSS Analysis** - Custom CSS property extraction
4. **Pattern Learning** - Custom ML/pattern recognition
5. **Reporting** - Custom reports with PocketBase data

## Design Patterns Used

### Creational
- Factory, Builder, Singleton

### Structural
- Adapter, Decorator, Facade, Proxy

### Behavioral
- Observer, Strategy, Command, Chain of Responsibility, Mediator, Memento, State, Template Method, Visitor

## Algorithms Used

- Tree Traversal (DFS/BFS)
- Graph Algorithms (dependency analysis, cycle detection)
- String Algorithms (CSS parsing, selector matching)
- Optimization (memoization, lazy evaluation, parallel processing)
- Machine Learning (pattern recognition, anomaly detection)

## Data Structures

- Component Tree (hierarchical DOM representation)
- CSS Analysis Map (property → computed value)
- Test Result Graph (dependencies between tests)
- Pattern Knowledge Base (learned patterns)

## Pop Culture References

The Oracle is filled with references from classic 80s, 90s, and early 2000s movies:
- **The Matrix:** "There is no spoon" - Seeing the code
- **Back to the Future:** "Great Scott!" - CSS analysis
- **Ghostbusters:** "Who you gonna call? BugBusters!" - Bug detection
- **Terminator:** "I'll be back" - Relentless testing
- **Jurassic Park:** "Life finds a way" - Component discovery
- **The Shawshank Redemption:** "Get busy testing" - Reporting
- **Lord of the Rings:** "One does not simply debug" - Knowledge storage
- **The Sixth Sense:** "I see dead code" - Pattern learning

See [POP_CULTURE_REFERENCES.md](./POP_CULTURE_REFERENCES.md) for the complete list!

## Getting Started

### Prerequisites

1. **PocketBase** - Install and run locally
   ```bash
   # Download from https://pocketbase.io/docs/
   ./pocketbase serve
   ```

2. **Dependencies** - Install testing frameworks
   ```bash
   cd mcp-servers/dashboard-v3
   npm install --save-dev @playwright/test @testing-library/dom axe-core pocketbase
   ```

### Basic Usage

```javascript
import { TheOracle } from './tests/debugger/TheOracle.js';

// "I need to consult The Oracle"
const oracle = new TheOracle({
  pocketbaseUrl: 'http://127.0.0.1:8090',
  pocketbaseAdminEmail: 'admin@example.com',
  pocketbaseAdminPassword: 'password',
  targetUrl: 'http://localhost:3848'
});

await oracle.initialize();
const results = await oracle.run(); // "Consult The Oracle"
```

## Implementation Status

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed progress.

### Current Status: Phase 1 Complete ✅

- ✅ Folder structure created
- ✅ Architecture documented
- ✅ Framework evaluation complete
- ✅ Base TheOracle class created

### Next Steps: Phase 2

- [ ] PocketBase setup and integration
- [ ] Component discovery implementation
- [ ] Test queue implementation
- [ ] First agent (ComponentAgent)

## File Structure

```
debugger/
├── TheOracle.js               # Main class
├── ARCHITECTURE.md            # Architecture documentation
├── FRAMEWORK_EVALUATION.md    # Framework analysis
├── IMPLEMENTATION_PLAN.md     # Implementation roadmap
├── README.md                  # This file
├── agents/                    # Test agent classes
│   ├── ComponentAgent.js
│   ├── LayoutAgent.js
│   ├── StyleAgent.js
│   ├── InteractionAgent.js
│   ├── AccessibilityAgent.js
│   └── PerformanceAgent.js
├── discovery/                 # Component discovery
│   └── ComponentDiscovery.js
├── analysis/                  # Analysis engines
│   └── CSSAnalyzer.js
├── learning/                  # Pattern learning
│   └── PatternLearner.js
├── queue/                     # Test queue
│   └── TestQueue.js
└── storage/                   # PocketBase integration
    └── ResultRepository.js
```

## Contributing

This is a comprehensive testing system. When adding new features:

1. Follow the architecture patterns
2. Use the established design patterns
3. Store results in PocketBase
4. Learn from patterns
5. Document everything

## License

Part of the _pyrite project.

