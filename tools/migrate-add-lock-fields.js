#!/usr/bin/env node
/**
 * Migration Script: Add Lock Fields to Work Effort Frontmatter
 *
 * Adds new locking/assignment fields to all existing WE index files:
 * - last_modified_by
 * - assigned_to, assigned_at, assignment_expires
 * - locked_by, locked_at, lock_session, lock_expires
 *
 * Usage:
 *   node tools/migrate-add-lock-fields.js [--dry-run] [--backup]
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const WORK_EFFORTS_DIR = path.join(__dirname, '..', '_work_efforts');
const BACKUP_DIR = path.join(__dirname, '..', '_work_efforts_backup');
const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP = process.argv.includes('--backup');

// New fields to add (with default values)
const NEW_FIELDS = {
  last_modified_by: null,
  assigned_to: null,
  assigned_at: null,
  assignment_expires: null,
  locked_by: null,
  locked_at: null,
  lock_session: null,
  lock_expires: null
};

/**
 * Find all WE index files
 */
async function findWorkEffortFiles() {
  const entries = await fs.readdir(WORK_EFFORTS_DIR, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith('WE-')) continue;

    const dirPath = path.join(WORK_EFFORTS_DIR, entry.name);
    const dirFiles = await fs.readdir(dirPath);
    const indexFile = dirFiles.find(f => f.endsWith('_index.md'));

    if (indexFile) {
      files.push({
        weId: entry.name.match(/^(WE-\d{6}-[a-z0-9]{4})/)?.[1] || entry.name,
        dirName: entry.name,
        indexPath: path.join(dirPath, indexFile)
      });
    }
  }

  return files;
}

/**
 * Migrate a single WE file
 */
async function migrateFile(file) {
  console.log(`\n📄 ${file.weId}`);

  // Read file
  const content = await fs.readFile(file.indexPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Check which fields are missing
  const missingFields = [];
  for (const [field, defaultValue] of Object.entries(NEW_FIELDS)) {
    if (!(field in frontmatter)) {
      missingFields.push(field);
      frontmatter[field] = defaultValue;
    }
  }

  if (missingFields.length === 0) {
    console.log('  ✓ Already has all lock fields');
    return { updated: false, fields: [] };
  }

  console.log(`  + Adding fields: ${missingFields.join(', ')}`);

  // Update frontmatter
  const newContent = matter.stringify(body, frontmatter);

  if (!DRY_RUN) {
    // Write updated file
    await fs.writeFile(file.indexPath, newContent, 'utf-8');
    console.log('  ✓ Updated');
  } else {
    console.log('  ⚠ DRY RUN - not writing');
  }

  return { updated: true, fields: missingFields };
}

/**
 * Create backup of _work_efforts directory
 */
async function createBackup() {
  console.log(`\n📦 Creating backup: ${BACKUP_DIR}`);

  // Remove old backup if exists
  try {
    await fs.rm(BACKUP_DIR, { recursive: true });
  } catch (e) {
    // Doesn't exist, that's fine
  }

  // Copy directory
  await fs.cp(WORK_EFFORTS_DIR, BACKUP_DIR, { recursive: true });
  console.log('  ✓ Backup created');
}

/**
 * Main migration
 */
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  Work Effort Lock Fields Migration            ║');
  console.log('╚════════════════════════════════════════════════╝');

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No files will be modified\n');
  }

  // Create backup if requested
  if (BACKUP && !DRY_RUN) {
    await createBackup();
  }

  // Find all WE files
  console.log('\n🔍 Finding work effort files...');
  const files = await findWorkEffortFiles();
  console.log(`   Found ${files.length} work efforts`);

  // Migrate each file
  let updatedCount = 0;
  let skippedCount = 0;
  const fieldCounts = {};

  for (const file of files) {
    const result = await migrateFile(file);

    if (result.updated) {
      updatedCount++;
      for (const field of result.fields) {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      }
    } else {
      skippedCount++;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  Migration Summary                             ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n  Total files:     ${files.length}`);
  console.log(`  Updated:         ${updatedCount}`);
  console.log(`  Already current: ${skippedCount}`);

  if (Object.keys(fieldCounts).length > 0) {
    console.log('\n  Fields added:');
    for (const [field, count] of Object.entries(fieldCounts)) {
      console.log(`    - ${field}: ${count} files`);
    }
  }

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Migration complete!');
    if (BACKUP) {
      console.log(`   Backup saved: ${BACKUP_DIR}`);
    }
  }

  console.log('\n  Next steps:');
  console.log('    1. Review the changes: git diff _work_efforts/');
  console.log('    2. Test the system with new fields');
  console.log('    3. Commit changes: git add _work_efforts/ && git commit -m "Add lock fields to WE frontmatter"');
  console.log('');
}

// Run migration
main().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
