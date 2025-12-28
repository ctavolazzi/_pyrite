# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2025-12-28

### Added
- **Structured Logging**: pino for JSON logs, pino-pretty for dev output, chalk for colored CLI
- **Documentation**: ARCHITECTURE.md, USER-GUIDE.md, expanded README with screenshots
- **Shared Components**: Reusable nav.js and footer.js with mobile support
- **Logger Module**: lib/logger.js with configurable LOG_LEVEL
- **Decision Document**: DECISION-logging-cli-graphics.md

### Changed
- Refactored server.js to use pino logger (~20 console.log calls replaced)
- Refactored lib/watcher.js to use pino logger
- Added JSDoc comments to server.js, app.js, events.js, parser.js
- Updated package.json with pino, pino-pretty, chalk dependencies

### Fixed
- Work effort status inconsistencies (g6nh, hldk marked completed)

### Removed
- Demo work efforts (test data cleanup)
- BACKUP_diamond_animations.css (deprecated)

## [0.2.0] - 2025-12-27

### Added
- Mission Control Dashboard v2
- Real-time WebSocket updates
- Multi-repository support
- Dual format parsing (Johnny Decimal + MCP v0.3.0)
- Event system with EventBus, ToastManager, AnimationController
- Live Demo walkthrough
- Notification center with activity tracking

## [0.1.0] - 2025-12-20

### Added
- Initial project setup
- Johnny Decimal work efforts structure
- Basic documentation
