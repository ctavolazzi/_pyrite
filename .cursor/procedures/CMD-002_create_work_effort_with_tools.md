# CMD-002: Create Work Effort with Tool Bag

**Shortcode**: `/CMD-002` or `/create-work-effort`
**Category**: Command Operations
**Version**: 1.0
**Status**: Active

---

## Purpose

Standardized procedure for creating a new work effort with automatic tool bag setup. Ensures all work efforts have essential tracking and verification tools from creation.

---

## When to Use

Use this procedure when:
- Creating a new work effort
- Need standardized tracking and verification tools
- Want consistent work effort structure
- Starting a new project or feature

---

## Prerequisites

- Work effort structure already created (folder exists)
- Access to `scripts/setup_work_effort_tools.py`
- Template exists at `_work_efforts/.tool_bag_template/`

---

## Procedure

### Step 1: Create Work Effort Structure

Create the work effort folder:

```bash
mkdir -p _work_efforts/WE-YYMMDD-xxxx_description
```

**Example**:
```bash
mkdir -p _work_efforts/WE-260110-new_feature_implementation
```

### Step 2: Create Basic README (Optional)

Create a basic README for the work effort:

```bash
touch _work_efforts/WE-YYMMDD-xxxx_description/README.md
```

Add initial content describing the work effort.

### Step 3: Set Up Tool Bag (Required)

Run the setup script to create the tool bag:

```bash
python scripts/setup_work_effort_tools.py _work_efforts/WE-YYMMDD-xxxx_description
```

**Example**:
```bash
python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-new_feature_implementation
```

**Optional**: Include optional tools flag:
```bash
python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-new_feature_implementation --optional
```

### Step 4: Verify Tool Bag Setup

Check that tools were created:

```bash
ls -la _work_efforts/WE-YYMMDD-xxxx_description/tools/
```

**Expected files**:
- `README.md` - Tool bag documentation
- `work_effort_tracker.md` - Progress tracking
- `verification_checklist.md` - Quality verification

### Step 5: Customize Tools

Update the tools for your specific work effort:

1. **Work Effort Tracker** (`tools/work_effort_tracker.md`)
   - Set goal and success criteria
   - Add initial tasks
   - Define milestones

2. **Verification Checklist** (`tools/verification_checklist.md`)
   - Add custom verification criteria
   - Define quality gates
   - Set testing requirements

3. **Tool Bag README** (`tools/README.md`)
   - Already customized with work effort info
   - Add project-specific notes if needed

### Step 6: Add Optional Tools (If Needed)

Copy useful tools from other work efforts:

```bash
# Example: Copy decision matrix from Order 66
cp _work_efforts/WE-260110-order66_order_66_execution/tools/decision_matrix.md \
   _work_efforts/WE-YYMMDD-xxxx_description/tools/
```

**Common optional tools**:
- Decision matrix (from Order 66)
- Priority matrix (from Order 66)
- Analysis template (from Order 66)
- Custom project tools

### Step 7: Commit Tool Bag

Commit the tool bag setup:

```bash
git add _work_efforts/WE-YYMMDD-xxxx_description/tools/
git commit -m "feat: Set up tool bag for WE-YYMMDD-xxxx"
```

---

## Success Criteria

Work effort is ready when:
- ✅ Work effort folder exists
- ✅ Tool bag setup complete (3 essential files)
- ✅ Tools customized for work effort
- ✅ Optional tools added if needed
- ✅ Changes committed to git

---

## Expected Outcome

After completing this procedure, you will have:

1. **Work Effort Structure**:
   ```
   _work_efforts/WE-YYMMDD-xxxx_description/
   ├── README.md (optional)
   └── tools/
       ├── README.md
       ├── work_effort_tracker.md
       ├── verification_checklist.md
       └── [optional tools]
   ```

2. **Essential Tools Ready**:
   - Progress tracking system
   - Verification checklist
   - Tool documentation

3. **Customized for Work Effort**:
   - Work effort ID populated
   - Description filled in
   - Date stamps added

---

## Common Issues

### Issue: Template not found

**Symptom**: Script reports "Template not found"

**Solution**: Run script from project root:
```bash
cd /home/user/_pyrite
python scripts/setup_work_effort_tools.py _work_efforts/WE-YYMMDD-xxxx
```

### Issue: Work effort path not found

**Symptom**: Script reports "Work effort path does not exist"

**Solution**: Create work effort folder first:
```bash
mkdir -p _work_efforts/WE-YYMMDD-xxxx_description
python scripts/setup_work_effort_tools.py _work_efforts/WE-YYMMDD-xxxx_description
```

### Issue: Tools already exist

**Symptom**: Tools folder already has files

**Solution**:
- Backup existing tools if needed
- Delete tools folder and re-run script
- Or manually update existing tools

---

## Quick Reference

**Command**:
```bash
python scripts/setup_work_effort_tools.py <work_effort_path> [--optional]
```

**Template Location**: `_work_efforts/.tool_bag_template/`

**Essential Tools**:
- `README.md` - Tool bag documentation
- `work_effort_tracker.md` - Progress tracking
- `verification_checklist.md` - Verification checklist

**Documentation**:
- Standard: `_work_efforts/WORK_EFFORT_TOOL_BAG_STANDARD.md`
- Guide: `_work_efforts/WORK_EFFORT_CREATION_GUIDE.md`

---

## Related Procedures

- **ENG-001**: Engineering Workflow (comprehensive development workflow)
- **VER-001**: Verification Workflow (quality verification process)

---

## Notes

- Tool bag is now **standard** for all work efforts
- Essential tools are always included
- Optional tools added based on needs
- Tools are version controlled with work effort
- Template updates don't affect existing work efforts

---

**Created**: 2026-01-10
**Last Updated**: 2026-01-10
**Maintained By**: Pyrite Development Team
