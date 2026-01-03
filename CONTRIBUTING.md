# Contributing to _pyrite

Thank you for your interest in contributing!

## Overview

_pyrite is a cross-repository workspace for AI-assisted development. It's experimental by nature - not everything will work, and that's okay.

## How to Contribute

### Reporting Issues

1. Check existing issues first
2. Use the issue templates
3. Provide clear reproduction steps
4. Include relevant context (OS, tools, versions)

### Branching Strategy

This project uses **Git Flow**:

- `main` - Production/stable code
- `develop` - Development integration branch
- `feature/*` - Feature branches (e.g., `feature/WE-260102-xxxx-work-effort`)

**Workflow:**
1. Create feature branches from `develop`
2. Work on features, commit changes
3. Merge feature branches back to `develop` for integration
4. Merge `develop` → `main` when ready for production

### Pull Requests

1. Fork the repository
2. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   ```
3. Follow existing code style and conventions
4. Update documentation as needed
5. Submit a PR targeting `develop` (or `main` for hotfixes)

### Work Efforts

This project uses the Johnny Decimal system for task tracking:

```
_work_efforts/
├── 00-09_meta/           # Project-level items
├── 10-19_development/    # Active development
├── 20-29_features/       # Feature work
└── devlog.md             # Chronological log
```

When contributing:
1. Check existing work efforts
2. Create or update relevant work effort
3. Update devlog with progress

## Code of Conduct

- Be respectful and constructive
- Focus on the work, not the person
- Welcome newcomers
- Assume good intent

## Questions?

Open an issue or check the documentation in `docs/`.
