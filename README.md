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
├── README.md              # This file
├── _work_efforts/         # Johnny Decimal task tracking
│   └── checkpoints/       # Session journal entries
├── .claude/               # Claude Code configuration
│   └── skills/            # Session start hooks
├── tools/                 # Development tools
│   ├── github-health-check/   # GitHub integration verification
│   ├── obsidian-linter/       # Obsidian markdown validation & fixing
│   └── structure-check/       # Repository structure verification
├── experiments/           # Exploratory code and prototypes
├── integrations/          # Cross-repo integration work
└── docs/                  # Plans, decisions, learnings
```

## Active Projects

| Project | Status | Description |
|---------|--------|-------------|
| Obsidian Linter | **v0.6.0** | Validates & fixes Obsidian-flavored markdown |
| GitHub Health Check | Active | Session startup verification for GitHub integration |
| Structure Check | Active | Repository structure verification |

## Related Repos

This workspace integrates with:
- `cursor-coding-protocols` — versioning and tooling
- `awesome-pocketbase` — PocketBase infrastructure
- `public-apis` — API adapters (arXiv, etc.)
- Others as needed

## Tools

### Obsidian Linter (v0.6.0)

Unified command to check, validate, and fix Obsidian-flavored markdown:

```bash
python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix
```

- **Link fixing**: Auto-converts ticket/work effort IDs to wikilinks
- **Frontmatter validation**: ID formats, status values, dates
- **Task list support**: Validates and fixes `[ ]` and `[x]` syntax
- **Validation**: Detects broken links, duplicates, orphaned files

See [`tools/obsidian-linter/`](tools/obsidian-linter/README.md) for details.

### GitHub Health Check

Automatically runs at session start to verify GitHub integration:
- Authentication status
- API rate limits
- Repository access and permissions
- Branch, PR, and issue operations

See [`tools/github-health-check/`](tools/github-health-check/README.md) for details.

### Structure Check

Verifies repository structure matches expected layout:

```bash
python3 tools/structure-check/check.py --fix
```

See [`tools/structure-check/`](tools/structure-check/README.md) for details.

## Convention

- Prefix with `_` to sort to top of directory listing
- Use `_work_efforts/` for task tracking (Johnny Decimal)
- Document decisions in `docs/`
- Keep experiments isolated in `experiments/`
- Tools go in `tools/` (standalone utilities)
- Claude Code config in `.claude/` (skills, commands)

---

*Created: 2025-12-20* | *Updated: 2025-12-31* | *Version: 0.6.0*
