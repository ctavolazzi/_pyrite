# Enhancement Tier Roadmap (Tier 2)

## Vision

Transform validated markdown files into a rich, interconnected knowledge base using AI and automation.

**Prerequisites**: Files must have `linter_status: validated` from Tier 1 tools.

---

## Phase 1: Auto-Indexing (v0.7.0)

### Core Features

**1. Index Generation**
```python
# Auto-generate index files with proper structure
python3 tools/obsidian-linter/enhance.py --generate-indexes --scope _work_efforts
```

**What it does:**
- Scans directory structure
- Creates/updates `_index.md` files in each folder
- Adds proper frontmatter with metadata
- Lists all files in folder with descriptions
- Maintains backlinks to parent indexes
- Updates timestamps on changes

**Example Output:**
```markdown
---
id: WE-251227-abcd_index
type: index
title: Mission Control Dashboard
parent: [[00.00_index]]
children: 5
last_indexed: 2026-01-01T12:00:00Z
linter_status: validated
---

# Mission Control Dashboard

## Overview
*Auto-generated summary from child files*

## Files in this Work Effort
- [[WE-251227-abcd_spec]] - Technical specification
- [[TKT-abcd-001_server]] - Build dashboard server
- [[TKT-abcd-002_ui]] - Build dashboard UI
...

## Related Work Efforts
*AI-suggested connections*
- [[WE-251228-efgh]] - Related dashboard work
```

**2. Backlink Automation**
- Auto-add `related: []` field to frontmatter
- Scan content for mentions of other files
- Add bidirectional links automatically
- Maintain link graph consistency

---

## Phase 2: Framework Support (v0.8.0)

### Zettelkasten Implementation

**Features:**
- Atomic note validation (one idea per file)
- Connection maps between notes
- MOC (Map of Content) generation
- Literature notes vs permanent notes distinction
- Auto-tagging by concept

**Usage:**
```bash
python3 tools/obsidian-linter/enhance.py --framework zettelkasten --scope notes/
```

**Frontmatter Additions:**
```yaml
note_type: permanent  # or: literature, fleeting
concepts: [knowledge-management, automation]
connections:
  - [[note-123]] - Expands on this idea
  - [[note-456]] - Contradicts this approach
moc: [[MOC_Knowledge_Management]]
atomic: true
```

### GTD (Getting Things Done)

**Features:**
- Context tagging (@home, @work, @errands)
- Energy level tagging (high, medium, low)
- Time estimation
- Priority scoring
- Next actions identification

**Usage:**
```bash
python3 tools/obsidian-linter/enhance.py --framework gtd --scope tasks/
```

**Frontmatter Additions:**
```yaml
gtd_context: ["@work", "@computer"]
gtd_energy: medium
gtd_time: 30min
gtd_priority: high
gtd_next_action: true
gtd_waiting_for: null
gtd_someday: false
```

### PARA Method

**Features:**
- Auto-categorization (Project/Area/Resource/Archive)
- Lifecycle management (active → archived)
- Cross-references between categories
- Archive date tracking

**Usage:**
```bash
python3 tools/obsidian-linter/enhance.py --framework para --scope vault/
```

**Frontmatter Additions:**
```yaml
para_category: project  # or: area, resource, archive
para_active: true
para_archived_date: null
para_area: development
para_outcome: "Ship v1.0"
```

---

## Phase 3: AI Integration (v0.9.0)

### Smart Linking

**Feature**: AI-suggested connections between notes

```bash
python3 tools/obsidian-linter/enhance.py --suggest-links --scope _work_efforts
```

**What it does:**
- Analyzes note content using embeddings
- Finds semantically similar notes
- Suggests new wikilinks with context
- User approves before adding

**Example:**
```markdown
<!-- AI Suggestion -->
This note discusses event systems. Related notes:
- [[WE-251227-8w5z]] - Event bus implementation (90% similarity)
- [[TKT-fwmv-003]] - Real-time updates (75% similarity)

Add these links? [y/n]
```

### Summary Generation

**Feature**: AI-generated abstracts and TL;DR sections

```bash
python3 tools/obsidian-linter/enhance.py --generate-summaries --scope docs/
```

**Frontmatter Additions:**
```yaml
summary: "AI-generated one-sentence summary"
tldr: "Quick 2-3 sentence overview"
key_points:
  - Main concept 1
  - Main concept 2
  - Main concept 3
```

### Auto-Tagging

**Feature**: AI suggests tags based on content

```bash
python3 tools/obsidian-linter/enhance.py --auto-tag --scope vault/
```

**What it does:**
- Analyzes document content
- Suggests relevant tags from existing taxonomy
- Creates new tags for novel concepts
- Maintains tag hierarchy

---

## Phase 4: Knowledge Graph (v1.0.0)

### Graph Features

**1. Relationship Mapping**
```yaml
relationships:
  - type: implements
    target: [[WE-251227-spec]]
  - type: depends_on
    target: [[library-xyz]]
  - type: supersedes
    target: [[old-approach]]
```

**2. Graph Queries**
```bash
# Find all notes related to "authentication" within 2 hops
python3 tools/obsidian-linter/enhance.py --graph-query "authentication" --depth 2

# Find orphaned notes (no incoming or outgoing links)
python3 tools/obsidian-linter/enhance.py --find-orphans

# Find hub notes (highly connected)
python3 tools/obsidian-linter/enhance.py --find-hubs --min-connections 10
```

**3. Graph Visualization**
- Export graph to JSON for Obsidian Graph View
- Generate D3.js visualization
- Highlight clusters and communities
- Show connection strength (by # of links)

---

## Technical Architecture

### Core Components

```python
# tools/obsidian-linter/tier2/enhance.py

class Enhancer:
    def __init__(self, framework=None):
        self.framework = self._load_framework(framework)
        self.ai_client = AIClient()

    def enhance_file(self, file_path):
        # Gate: Check Tier 1 validation status
        if not self._is_validated(file_path):
            raise ValidationError("File must pass Tier 1 first")

        # Apply framework enhancements
        if self.framework:
            self.framework.enhance(file_path)

        # Add auto-indexing
        self._update_indexes(file_path)

        # AI enhancements (optional)
        if self.ai_enabled:
            self._suggest_links(file_path)
            self._generate_summary(file_path)
            self._auto_tag(file_path)

        # Update frontmatter
        self._set_enhanced_status(file_path)
```

### Framework Plugin System

```python
# tools/obsidian-linter/tier2/frameworks/base.py

class Framework(ABC):
    @abstractmethod
    def enhance(self, file_path):
        """Apply framework-specific enhancements"""
        pass

    @abstractmethod
    def validate_structure(self, file_path):
        """Check if file fits framework rules"""
        pass

# tools/obsidian-linter/tier2/frameworks/zettelkasten.py
class Zettelkasten(Framework):
    def enhance(self, file_path):
        self._ensure_atomic(file_path)
        self._add_connections(file_path)
        self._assign_to_moc(file_path)
```

### AI Integration

**Options:**
1. **OpenAI API** - GPT-4 for summaries and suggestions
2. **Local Embeddings** - sentence-transformers for similarity
3. **Ollama** - Local LLM for privacy-focused users
4. **Anthropic Claude** - Alternative to OpenAI

**Configuration:**
```yaml
# .obsidian-linter.yml
ai:
  provider: openai  # or: anthropic, ollama, local
  model: gpt-4
  api_key: ${OPENAI_API_KEY}
  features:
    summaries: true
    link_suggestions: true
    auto_tagging: true
```

---

## User Journey

### Scenario: New User Adopts Zettelkasten

**Step 1: Validate Existing Notes**
```bash
# Run Tier 1 on existing notes
python3 tools/obsidian-linter/lint.py --scope notes/ --fix
```

**Step 2: Enable Zettelkasten Framework**
```bash
# Configure framework
python3 tools/obsidian-linter/enhance.py --setup-framework zettelkasten
```

**Step 3: Enhance Notes**
```bash
# Run enhancement
python3 tools/obsidian-linter/enhance.py --framework zettelkasten --scope notes/
```

**Step 4: Review Changes**
```bash
# See what was added
git diff

# Review AI suggestions
python3 tools/obsidian-linter/enhance.py --review-suggestions
```

**Step 5: Iterate**
```bash
# Approve/reject suggestions
python3 tools/obsidian-linter/enhance.py --apply-approved

# Re-run to catch new connections
python3 tools/obsidian-linter/enhance.py --framework zettelkasten --scope notes/
```

---

## Success Metrics

### Tier 1 → Tier 2 Conversion
- % of files with `linter_status: validated`
- Time to full vault validation
- Error reduction over time

### Enhancement Quality
- User approval rate for AI suggestions
- # of auto-generated indexes
- # of new connections discovered
- Graph density improvements

### User Adoption
- Active users per framework
- Features most commonly used
- Time saved vs manual approach

---

## Pricing & Business Model

### Free Tier (Local Only)
- All Tier 1 features
- Basic auto-indexing
- Local embeddings for similarity
- Framework templates

### Pro Tier (AI-Powered)
- GPT-4 summaries
- AI link suggestions
- Auto-tagging
- Advanced graph analytics

### Enterprise
- Custom frameworks
- Team collaboration features
- Shared knowledge graphs
- API access

---

## Timeline

| Version | Features | Target Date | Status |
|---------|----------|-------------|--------|
| v0.6.1 | Tier 1 Complete | 2026-01-01 | ✅ Done |
| v0.7.0 | Auto-Indexing | 2026-02-01 | 🚧 Next |
| v0.8.0 | Framework Support | 2026-03-01 | 📋 Planned |
| v0.9.0 | AI Integration | 2026-04-01 | 📋 Planned |
| v1.0.0 | Knowledge Graph | 2026-05-01 | 📋 Planned |

---

## Next Steps

1. **Create Task File**: `_coordination/tasks/TASK_tier2_auto_indexing.md`
2. **Prototype Indexing**: Build basic index generator
3. **Test on _work_efforts**: Validate approach on real data
4. **Add Framework Choice**: Let user select Zettelkasten/GTD/PARA
5. **Gather Feedback**: Iterate on design before AI integration

---

**Last Updated**: 2026-01-01
**Status**: Planning Phase
**Owner**: claude_code
**Dependencies**: Tier 1 validation (v0.6.1) ✅
