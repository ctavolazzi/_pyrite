# Pyrite

> "Fool's gold" — shiny, promising, experimental.

## What is this?

Pyrite is a cross-repository workspace for AI-assisted development across the full `/Users/ctavolazzi/Code` codebase. It's where exploratory, integrative, and experimental work happens.

## Philosophy

- **Cross-cutting**: Work that touches multiple repos lives here
- **Experimental**: Not everything will pan out — that's the point
- **Iterative**: Start rough, refine what works
- **Documented**: Track what we try, what works, what doesn't

## Structure

```
_pyrite/
├── README.md           # This file
├── _work_efforts/      # Johnny Decimal task tracking
├── .claude/            # Claude Code configuration
│   └── skills/         # Session start hooks
├── tools/              # Development tools
│   └── github-health-check/  # GitHub integration verification
├── experiments/        # Exploratory code and prototypes
├── integrations/       # Cross-repo integration work
└── docs/               # Plans, decisions, learnings
```

## Active Projects

| Project | Status | Description |
|---------|--------|-------------|
| GitHub Health Check | Active | Session startup verification for GitHub integration |

## Related Repos

This workspace integrates with:
- `cursor-coding-protocols` — versioning and tooling
- `awesome-pocketbase` — PocketBase infrastructure
- `public-apis` — API adapters (arXiv, etc.)
- Others as needed

## Tools

### GitHub Health Check

Automatically runs at session start to verify GitHub integration:
- Authentication status
- API rate limits
- Repository access and permissions
- Branch, PR, and issue operations

See [`tools/github-health-check/`](tools/github-health-check/README.md) for details.

## Convention

- Prefix with `_` to sort to top of directory listing
- Use `_work_efforts/` for task tracking (Johnny Decimal)
- Document decisions in `docs/`
- Keep experiments isolated in `experiments/`
- Tools go in `tools/` (standalone utilities)
- Claude Code config in `.claude/` (skills, commands)

---

*Created: 2025-12-20*
