# /create-work-effort

Creates a new work effort with automatic tool bag setup.

## Purpose

This command creates a complete work effort structure including essential tracking and verification tools. It combines work effort creation with tool bag setup to ensure consistency.

## Usage

```
/create-work-effort
```

The AI will then:
1. Ask for work effort details (ID, description)
2. Create work effort folder structure
3. Set up tool bag automatically
4. Customize tools for the work effort
5. Provide next steps

## What Gets Created

After running this command, you'll have:

```
_work_efforts/WE-YYMMDD-xxxx_description/
├── README.md                    # Work effort overview
└── tools/                      # Tool bag (automatically created)
    ├── README.md               # Tool documentation
    ├── work_effort_tracker.md  # Progress tracking
    └── verification_checklist.md # Quality verification
```

## Command Workflow

The AI will:

1. **Gather Information**
   - Work effort ID (e.g., WE-260110-xxxx)
   - Description
   - Optional tools needed

2. **Create Structure**
   - Create work effort folder
   - Create basic README

3. **Set Up Tool Bag** (Automatic)
   - Run `python scripts/setup_work_effort_tools.py`
   - Copy essential tools from template
   - Customize tools with work effort info

4. **Verify Setup**
   - Check all files created
   - Verify customization
   - Confirm structure

5. **Provide Next Steps**
   - How to use tools
   - Where to add optional tools
   - What to do next

## Essential Tools Included

Every work effort gets these tools automatically:

1. **Work Effort Tracker** (`work_effort_tracker.md`)
   - Track tasks and progress
   - Document decisions
   - Manage blockers
   - Track milestones

2. **Verification Checklist** (`verification_checklist.md`)
   - Quality verification
   - Testing checklist
   - Documentation verification
   - Deployment readiness

3. **Tool Bag README** (`README.md`)
   - Tool documentation
   - Usage instructions
   - How to add optional tools

## Optional Tools

After creation, you can add optional tools:

- **Decision Matrix** - Evaluate options systematically
- **Priority Matrix** - Prioritize tasks
- **Analysis Template** - Structured analysis
- **Custom Tools** - Project-specific tools

Copy from other work efforts as needed:
```bash
cp _work_efforts/WE-YYMMDD-source/tools/tool_name.md \
   _work_efforts/WE-YYMMDD-target/tools/
```

## Benefits

This command ensures:
- ✅ Consistent structure across all work efforts
- ✅ Essential tools always available
- ✅ No manual setup required
- ✅ Immediate productivity
- ✅ Self-contained work efforts

## Example Session

```
User: /create-work-effort

AI: I'll help you create a new work effort with a complete tool bag.

What is the work effort ID? (e.g., WE-260110-xxxx)
User: WE-260110-new_feature

AI: What is the description?
User: Implementation of new user authentication feature

AI: Creating work effort structure...
✅ Created _work_efforts/WE-260110-new_feature/
✅ Created README.md
✅ Setting up tool bag...
✅ Tool bag complete!

Your work effort is ready:
- Path: _work_efforts/WE-260110-new_feature/
- Tools: tools/ (3 essential tools included)

Next steps:
1. Update tools/work_effort_tracker.md with tasks
2. Customize tools/verification_checklist.md
3. Start working!
```

## Related Commands

- **`/engineering`** - Full engineering workflow
- **`/verify`** - Verify work effort completion
- **`/checkpoint`** - Create checkpoint/snapshot

## Related Procedures

- **CMD-002** - Create Work Effort with Tools (detailed procedure)
- **ENG-001** - Engineering Workflow

## Manual Alternative

To create a work effort manually:

```bash
# 1. Create folder
mkdir -p _work_efforts/WE-YYMMDD-xxxx_description

# 2. Set up tool bag
python scripts/setup_work_effort_tools.py _work_efforts/WE-YYMMDD-xxxx_description

# 3. Customize tools as needed
```

## Documentation

For more information:
- **Standard**: `_work_efforts/WORK_EFFORT_TOOL_BAG_STANDARD.md`
- **Guide**: `_work_efforts/WORK_EFFORT_CREATION_GUIDE.md`
- **Procedure**: `.cursor/procedures/CMD-002_create_work_effort_with_tools.md`

---

**Category**: Work Management
**Version**: 1.0
**Status**: Active
