# Work Effort Tool Bag

**Work Effort**: [WORK_EFFORT_ID]
**Description**: [DESCRIPTION]
**Created**: [DATE]

---

## Purpose

This folder contains essential tools and templates for tracking, analyzing, and verifying work in this work effort. All tools are self-contained and portable.

---

## Essential Tools

### 1. Work Effort Tracker (`work_effort_tracker.md`)
**Purpose**: Track progress, tasks, and milestones

**Usage**:
- Update status as work progresses
- Mark tasks as completed
- Track blockers and dependencies
- Document key decisions

### 2. Verification Checklist (`verification_checklist.md`)
**Purpose**: Ensure work meets quality standards

**Usage**:
- Check off items as they're verified
- Add custom verification criteria
- Document test results
- Track quality gates

---

## Optional Tools

These tools can be copied from other work efforts as needed:

### Decision Matrix
**Source**: `WE-260110-order66_order_66_execution/tools/decision_matrix.md`
**Purpose**: Evaluate and compare options systematically

### Priority Matrix
**Source**: `WE-260110-order66_order_66_execution/tools/priority_matrix.md`
**Purpose**: Prioritize tasks based on impact and effort

### Analysis Template
**Source**: `WE-260110-order66_order_66_execution/tools/analysis_template.md`
**Purpose**: Structured analysis of code, architecture, or systems

---

## Adding Tools

To add optional tools to this work effort:

1. **Copy from another work effort**:
   ```bash
   cp _work_efforts/WE-YYMMDD-xxxx/tools/tool_name.md tools/
   ```

2. **Create custom tool**:
   - Add new `.md` file to `tools/` folder
   - Document purpose and usage
   - Update this README

3. **Update this README**:
   - Add tool to "Optional Tools" section
   - Provide usage instructions
   - Link to source if applicable

---

## Tool Organization

### Naming Convention
- Use lowercase with underscores: `tool_name.md`
- Be descriptive: `decision_matrix.md` not `dm.md`
- Use markdown format for portability

### Structure
```
tools/
├── README.md                    # This file
├── work_effort_tracker.md      # Essential: Progress tracking
├── verification_checklist.md   # Essential: Quality verification
├── decision_matrix.md          # Optional: Decision making
├── priority_matrix.md          # Optional: Task prioritization
└── [custom_tool].md            # Optional: Project-specific tools
```

---

## Best Practices

1. **Keep tools self-contained** - Each tool should work independently
2. **Document usage** - Include clear instructions in each tool
3. **Update regularly** - Keep tracker and checklist current
4. **Version control** - Commit tool updates with your work
5. **Share patterns** - Copy useful tools to other work efforts

---

## Tool Updates

When updating tools in the template (`_work_efforts/.tool_bag_template/`), existing work efforts are not affected. To update an existing work effort's tools:

1. Manually copy updated templates
2. Or re-run setup script with `--update` flag (if implemented)
3. Or keep using current versions (tools are versioned with work effort)

---

## Questions?

- See: `_work_efforts/WORK_EFFORT_TOOL_BAG_STANDARD.md` for complete standard
- See: `_work_efforts/WORK_EFFORT_CREATION_GUIDE.md` for quick start
- Run: `python scripts/setup_work_effort_tools.py --help` for script usage

---

**Tool Bag Version**: 1.0
**Last Updated**: [DATE]
