# Work Effort Creation Guide

**Quick reference for creating work efforts with tool bags**

> [!info] Enhanced Features Available!
> Work efforts now include Obsidian markdown, Zettelkasten linking, GTD workflows, and Johnny Decimal organization!
>
> **Quick References**:
> - [[QUICK_REFERENCE|One-Page Cheatsheet]] ⚡
> - [[OBSIDIAN_FEATURES_GUIDE|Full Features Guide]]
> - [[WORK_EFFORT_TOOL_BAG_STANDARD|Complete Standard]]

---

## Quick Start

### Option 1: Use the Command (Easiest)

```
/create-work-effort
```

The AI will guide you through the process.

### Option 2: Use the Script

```bash
# 1. Create work effort folder
mkdir -p _work_efforts/WE-260110-your_work_effort_name

# 2. Set up tool bag (automatic!)
python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-your_work_effort_name

# 3. Done! Start working.
```

---

## What You Get

After creation, your work effort will have:

```
_work_efforts/WE-260110-your_work_effort_name/
└── tools/
    ├── README.md                    # Tool documentation
    ├── work_effort_tracker.md      # Track progress
    └── verification_checklist.md   # Verify quality
```

---

## Next Steps

### 1. Customize Your Tools

**Update the tracker** (`tools/work_effort_tracker.md`):
- Set your goal and success criteria
- Add initial tasks
- Define milestones

**Update the checklist** (`tools/verification_checklist.md`):
- Add custom quality criteria
- Define testing requirements
- Set completion standards

### 2. Add Optional Tools (If Needed)

Copy useful tools from other work efforts:

```bash
# Decision matrix
cp _work_efforts/WE-260110-order66_order_66_execution/tools/decision_matrix.md tools/

# Priority matrix
cp _work_efforts/WE-260110-order66_order_66_execution/tools/priority_matrix.md tools/

# Custom tools
cp _work_efforts/WE-YYMMDD-other/tools/custom_tool.md tools/
```

### 3. Start Working!

Use the tools throughout your work effort:
- Update tracker as you make progress
- Document decisions
- Track blockers
- Verify quality with checklist

---

## Complete Example

Here's a complete example of creating a new feature work effort:

```bash
# 1. Create folder
mkdir -p _work_efforts/WE-260110-user_authentication

# 2. Set up tools
python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-user_authentication

# Output:
# 📁 Creating tools directory: _work_efforts/WE-260110-user_authentication/tools
# 📋 Copying essential tools...
#    ✅ README.md
#    ✅ work_effort_tracker.md
#    ✅ verification_checklist.md
#
# ✅ Tool bag setup complete!
#    Work Effort: WE-260110
#    Description: User Authentication
#    Tools Path: _work_efforts/WE-260110-user_authentication/tools

# 3. Verify
ls _work_efforts/WE-260110-user_authentication/tools/
# README.md  work_effort_tracker.md  verification_checklist.md

# 4. Customize tools
# Edit tools/work_effort_tracker.md to add your tasks

# 5. Add optional tools (if needed)
cp _work_efforts/WE-260110-order66_order_66_execution/tools/decision_matrix.md \
   _work_efforts/WE-260110-user_authentication/tools/

# 6. Commit
git add _work_efforts/WE-260110-user_authentication/
git commit -m "feat: Create user authentication work effort with tool bag"

# 7. Start working!
```

---

## Naming Convention

Work efforts follow this pattern:

```
WE-YYMMDD-xxxx_description
```

**Examples**:
- `WE-260110-user_authentication`
- `WE-260110-fix_login_bug`
- `WE-260110-refactor_api`

**Components**:
- `WE` = Work Effort
- `YYMMDD` = Date (2 digit year, month, day)
- `xxxx` = Short identifier
- `description` = Descriptive name (use underscores)

---

## Essential Tools

### Work Effort Tracker

**Purpose**: Track progress and tasks

**Use it for**:
- Current status
- Task lists
- Milestones
- Blockers
- Decisions

**Update frequency**: Every session

### Verification Checklist

**Purpose**: Verify quality before completion

**Use it for**:
- Code quality checks
- Testing verification
- Documentation checks
- Security verification
- Deployment readiness

**Update frequency**: Before completion

### Tool Bag README

**Purpose**: Document tools in this work effort

**Use it for**:
- Tool overview
- Usage instructions
- Adding new tools

**Update frequency**: When adding tools

---

## Common Workflows

### Starting a Work Effort

1. Create and set up work effort (command or script)
2. Review `tools/work_effort_tracker.md`
3. Set goal and success criteria
4. Add initial tasks
5. Start working!

### During a Work Effort

1. Check tracker at start of session
2. Update tasks as you complete them
3. Document decisions
4. Track any blockers
5. Update progress

### Completing a Work Effort

1. Use `tools/verification_checklist.md`
2. Verify all quality gates
3. Check off all criteria
4. Sign off on completion
5. Create final summary

---

## Adding Optional Tools

### From Template Library

If a shared library exists:

```bash
cp _work_efforts/.tool_library/tool_name.md tools/
```

### From Other Work Efforts

```bash
cp _work_efforts/WE-YYMMDD-source/tools/tool_name.md tools/
```

### Create Custom Tool

1. Create new `.md` file in `tools/`
2. Add purpose and usage instructions
3. Document in `tools/README.md`

---

## Tips

### Do
- ✅ Always set up tool bag for new work efforts
- ✅ Update tracker regularly
- ✅ Use verification checklist before completion
- ✅ Customize tools for your specific needs
- ✅ Copy useful tools from other work efforts

### Don't
- ❌ Skip tool bag setup
- ❌ Ignore the tracker (keep it updated!)
- ❌ Skip verification checklist
- ❌ Create work efforts without tools

---

## Troubleshooting

### "Template not found" error

**Cause**: Running script from wrong directory

**Solution**: Run from project root:
```bash
cd /home/user/_pyrite
python scripts/setup_work_effort_tools.py <path>
```

### "Work effort path does not exist" error

**Cause**: Folder not created yet

**Solution**: Create folder first:
```bash
mkdir -p _work_efforts/WE-YYMMDD-xxxx
python scripts/setup_work_effort_tools.py _work_efforts/WE-YYMMDD-xxxx
```

### Tools already exist

**Solution**: Either:
- Backup existing tools
- Delete `tools/` folder and re-run script
- Manually update existing tools

---

## Reference

### Commands
- `/create-work-effort` - Create work effort with AI guidance
- `python scripts/setup_work_effort_tools.py <path>` - Manual setup

### Procedures
- **CMD-002** - Create Work Effort with Tools (detailed)
- **ENG-001** - Engineering Workflow

### Documentation
- **Standard**: `WORK_EFFORT_TOOL_BAG_STANDARD.md` (complete reference)
- **This Guide**: `WORK_EFFORT_CREATION_GUIDE.md` (quick start)

### Template
- **Location**: `_work_efforts/.tool_bag_template/`
- **Contents**: README, tracker, checklist

---

## Need Help?

- **Complete standard**: See `WORK_EFFORT_TOOL_BAG_STANDARD.md`
- **Detailed procedure**: See `.cursor/procedures/CMD-002_create_work_effort_with_tools.md`
- **Script help**: `python scripts/setup_work_effort_tools.py --help`
- **Command help**: `/create-work-effort`

---

**Version**: 1.0
**Last Updated**: 2026-01-10
