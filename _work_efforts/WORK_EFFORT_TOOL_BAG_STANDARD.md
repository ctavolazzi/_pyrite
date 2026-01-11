# Work Effort Tool Bag Standard

**Version**: 1.0
**Status**: Active
**Last Updated**: 2026-01-10

---

## Overview

This document defines the standard tool bag system for work efforts. All new work efforts must include a `tools/` folder with essential tracking and verification tools.

---

## Purpose

The tool bag system ensures:
- **Consistency** - All work efforts have the same structure
- **Self-contained** - All tools are in one place
- **Documented** - Clear usage instructions
- **Maintainable** - Version controlled with work effort
- **Effective** - Essential tools always available

---

## Standard Structure

Every work effort must have this structure:

```
_work_efforts/WE-YYMMDD-xxxx_description/
├── README.md                      # Work effort overview
└── tools/                        # Tool bag (REQUIRED)
    ├── README.md                 # Tool documentation
    ├── work_effort_tracker.md    # Progress tracking (REQUIRED)
    ├── verification_checklist.md # Quality verification (REQUIRED)
    └── [optional tools]          # Project-specific tools
```

---

## Essential Tools

These tools are **required** in every work effort:

### 1. README.md
**Location**: `tools/README.md`
**Purpose**: Tool bag documentation

**Content**:
- Tool bag overview
- Essential tools description
- Optional tools available
- Usage instructions
- How to add tools

**Template**: `_work_efforts/.tool_bag_template/README.md`

### 2. Work Effort Tracker
**Location**: `tools/work_effort_tracker.md`
**Purpose**: Track progress, tasks, and milestones

**Content**:
- Current status
- Task lists (completed, in progress, pending)
- Milestones
- Blockers
- Decisions
- Dependencies
- Timeline

**Template**: `_work_efforts/.tool_bag_template/work_effort_tracker.md`

### 3. Verification Checklist
**Location**: `tools/verification_checklist.md`
**Purpose**: Quality verification and testing

**Content**:
- Code quality checks
- Documentation verification
- Integration verification
- Security checks
- Deployment readiness
- Custom criteria

**Template**: `_work_efforts/.tool_bag_template/verification_checklist.md`

---

## Optional Tools

These tools can be added based on work effort needs:

### Decision Matrix
**Source**: `WE-260110-order66_order_66_execution/tools/decision_matrix.md`
**Purpose**: Evaluate options systematically
**When to use**: Multiple options to choose from

### Priority Matrix
**Source**: `WE-260110-order66_order_66_execution/tools/priority_matrix.md`
**Purpose**: Prioritize tasks by impact and effort
**When to use**: Many tasks to prioritize

### Analysis Template
**Source**: `WE-260110-order66_order_66_execution/tools/analysis_template.md`
**Purpose**: Structured analysis of code/architecture
**When to use**: Deep analysis needed

### Custom Tools
**Source**: Create new or copy from other work efforts
**Purpose**: Project-specific needs
**When to use**: Standard tools don't cover specific needs

---

## Setup Process

### Automatic Setup (Recommended)

Use the setup script:

```bash
python scripts/setup_work_effort_tools.py _work_efforts/WE-YYMMDD-xxxx_description
```

This automatically:
1. Creates `tools/` folder
2. Copies essential tools from template
3. Customizes tools with work effort info (ID, description, date)
4. Updates README

### Manual Setup (Not Recommended)

If you must set up manually:

```bash
# Create tools folder
mkdir -p _work_efforts/WE-YYMMDD-xxxx/tools

# Copy templates
cp _work_efforts/.tool_bag_template/* _work_efforts/WE-YYMMDD-xxxx/tools/

# Manually update placeholders in each file:
# - [WORK_EFFORT_ID]
# - [DESCRIPTION]
# - [DATE]
```

**Warning**: Manual setup is error-prone. Use the script.

---

## Template System

### Template Location
`_work_efforts/.tool_bag_template/`

Contains master copies of:
- `README.md`
- `work_effort_tracker.md`
- `verification_checklist.md`

### Template Versioning

Templates are versioned with the work effort. Updates to the template do not affect existing work efforts.

**To update existing work effort tools**:
1. Manually copy updated templates
2. Or keep existing versions (recommended)

### Template Customization

The setup script replaces these placeholders:
- `[WORK_EFFORT_ID]` → Actual work effort ID
- `[DESCRIPTION]` → Work effort description
- `[DATE]` → Current date

---

## Tool Guidelines

### Naming Convention
- Use lowercase with underscores: `tool_name.md`
- Be descriptive: `decision_matrix.md` not `dm.md`
- Use `.md` format for portability

### Content Guidelines
- Start with clear purpose statement
- Include usage instructions
- Provide examples
- Use markdown formatting
- Keep self-contained

### Organization
- Essential tools in root of `tools/`
- Group related optional tools in subfolders if needed
- Document all tools in `tools/README.md`

---

## Integration

### With Commands

**`/create-work-effort`**:
- Creates work effort with automatic tool bag setup
- Customizes tools for work effort
- Verifies setup complete

**`/engineering`**:
- Should create work efforts with tools
- Should use tools during workflow

### With Procedures

**CMD-002** (Create Work Effort with Tools):
- Detailed procedure for work effort creation
- Includes tool bag setup steps
- Provides verification criteria

**ENG-001** (Engineering Workflow):
- Uses work effort tools during workflow
- Updates tracker as work progresses
- Uses verification checklist for quality

### With MCP Server

**Current**: Manual setup after MCP creation
**Future**: MCP could automatically set up tools

---

## Usage Patterns

### During Work Effort Creation

1. Create work effort structure
2. Run setup script (automatic tool bag)
3. Customize tools for specific needs
4. Add optional tools if needed
5. Commit tool bag with work effort

### During Work Effort Execution

1. **Start of session**:
   - Review `work_effort_tracker.md`
   - Update status to current

2. **During work**:
   - Update tracker as tasks complete
   - Document decisions
   - Track blockers

3. **End of session**:
   - Update progress
   - Note what's next
   - Commit changes

4. **Before completion**:
   - Use `verification_checklist.md`
   - Verify all quality gates
   - Sign off on completion

---

## Benefits

### For Individual Work Efforts
- ✅ All tools in one place
- ✅ Clear tracking of progress
- ✅ Quality verification built-in
- ✅ Self-documenting

### For the Project
- ✅ Consistent structure
- ✅ Easy to find tools
- ✅ Standard workflows
- ✅ Knowledge sharing (copy tools between work efforts)

### For Collaboration
- ✅ Clear status visibility
- ✅ Documented decisions
- ✅ Quality standards
- ✅ Easy handoff

---

## Maintenance

### Template Updates

To update the template:

1. Update files in `_work_efforts/.tool_bag_template/`
2. Test with new work effort
3. Document changes
4. Commit to git

**Note**: Existing work efforts keep their current tools.

### Tool Library

Consider creating a shared tool library:

```
_work_efforts/.tool_library/
├── decision_matrix.md
├── priority_matrix.md
├── analysis_template.md
└── [other shared tools]
```

Work efforts can copy from library as needed.

---

## Compliance

### Required for All Work Efforts

All new work efforts **must**:
- ✅ Include `tools/` folder
- ✅ Have all 3 essential tools (README, tracker, checklist)
- ✅ Customize tools for work effort
- ✅ Use tools during work effort lifecycle

### Verification

To verify compliance:

```bash
# Check structure
ls _work_efforts/WE-YYMMDD-xxxx/tools/

# Should show:
# - README.md
# - work_effort_tracker.md
# - verification_checklist.md
```

---

## Migration

### Existing Work Efforts

Existing work efforts can be updated:

```bash
# Add tool bag to existing work effort
python scripts/setup_work_effort_tools.py _work_efforts/WE-YYMMDD-existing
```

**Note**: Optional but recommended for consistency.

---

## Quick Reference

### Commands
```bash
# Create work effort with tools
/create-work-effort

# Or manually:
python scripts/setup_work_effort_tools.py <work_effort_path>
```

### Procedures
- **CMD-002** - Create Work Effort with Tools
- **ENG-001** - Engineering Workflow

### Files
- **Template**: `_work_efforts/.tool_bag_template/`
- **Script**: `scripts/setup_work_effort_tools.py`
- **Guide**: `_work_efforts/WORK_EFFORT_CREATION_GUIDE.md`

---

## Examples

### Example 1: New Feature Work Effort

```
_work_efforts/WE-260110-auth_feature/
├── README.md
├── tools/
│   ├── README.md
│   ├── work_effort_tracker.md
│   ├── verification_checklist.md
│   ├── decision_matrix.md          # Optional: Auth provider choice
│   └── security_checklist.md       # Custom: Security verification
└── src/
    └── [implementation files]
```

### Example 2: Bug Fix Work Effort

```
_work_efforts/WE-260110-fix_login_bug/
├── README.md
└── tools/
    ├── README.md
    ├── work_effort_tracker.md      # Track fix progress
    ├── verification_checklist.md   # Verify bug fixed
    └── bug_analysis.md             # Custom: Root cause analysis
```

---

## Frequently Asked Questions

**Q: Do I have to use the tool bag?**
A: Yes, all new work efforts must include the essential tools.

**Q: Can I modify the tools?**
A: Yes! Customize tools for your specific work effort needs.

**Q: What if I don't need all the sections in the tracker?**
A: Keep the structure, mark sections as "N/A" if not needed.

**Q: Can I add my own tools?**
A: Yes! Add optional or custom tools as needed.

**Q: Do I need to update the template for every work effort?**
A: No, templates are copied and version controlled with each work effort.

**Q: What if the template changes?**
A: Existing work efforts keep their tools. Only new work efforts get updated templates.

---

**Standard Version**: 1.0
**Effective Date**: 2026-01-10
**Maintained By**: Pyrite Development Team
