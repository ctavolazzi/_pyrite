/**
 * @fileoverview Dual-format work effort parser
 *
 * Supports parsing both work effort formats:
 * - MCP v0.3.0: WE-YYMMDD-xxxx directories with TKT-xxxx-NNN tickets
 * - Johnny Decimal: XX-XX_category/XX_subcategory/XX.XX_document.md
 *
 * @author _pyrite
 * @version 0.6.2
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

/**
 * @typedef {Object} Ticket
 * @property {string} id - Ticket ID (TKT-xxxx-NNN format)
 * @property {string} title - Ticket title
 * @property {string} status - Current status
 * @property {string} path - Absolute path to ticket file
 * @property {string} parent - Parent work effort ID
 */

/**
 * @typedef {Object} WorkEffort
 * @property {string} id - Work effort ID
 * @property {string} format - Format type ('mcp' or 'jd')
 * @property {string} title - Work effort title
 * @property {string} status - Current status
 * @property {string} path - Absolute path to work effort
 * @property {string|null} created - ISO timestamp of creation
 * @property {Ticket[]} [tickets] - Child tickets (MCP format only)
 * @property {string|null} [branch] - Git branch (MCP format only)
 * @property {string} [category] - Category name (JD format only)
 */

/**
 * @typedef {Object} ParseResult
 * @property {WorkEffort[]} workEfforts - Parsed work efforts
 * @property {string} [error] - Error message if parsing failed
 */

/**
 * Parse a repository's _work_efforts folder.
 * Supports both Johnny Decimal and MCP v0.3.0 formats.
 * Handles both '_work_efforts' and '_work_efforts_' naming conventions.
 *
 * @param {string|{path: string}} repoConfig - Repository path or config object
 * @returns {Promise<ParseResult>} Parsed work efforts and any error
 */
export async function parseRepo(repoConfig) {
  // Handle both string paths and config objects
  const repoPath = typeof repoConfig === 'string' ? repoConfig : repoConfig.path;
  const workEfforts = [];

  // Try both naming conventions
  let workEffortsDir = null;
  for (const dirName of ['_work_efforts', '_work_efforts_']) {
    const tryPath = path.join(repoPath, dirName);
    try {
      await fs.access(tryPath);
      workEffortsDir = tryPath;
      break;
    } catch {
      // Try next
    }
  }

  if (!workEffortsDir) {
    return { workEfforts: [], error: 'No _work_efforts folder found' };
  }

  try {
    const entries = await fs.readdir(workEffortsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        // Skip files at root level (like devlog.md)
        continue;
      }

      const dirName = entry.name;
      const dirPath = path.join(workEffortsDir, dirName);

      if (dirName.startsWith('WE-')) {
        // MCP v0.3.0 format: WE-YYMMDD-xxxx_slug
        const we = await parseMCPWorkEffort(dirPath, dirName);
        if (we) workEfforts.push(we);
      } else if (/^\d{2}-\d{2}_/.test(dirName)) {
        // Johnny Decimal category: XX-XX_name
        const jdWorkEfforts = await parseJohnnyDecimalCategory(dirPath, dirName);
        workEfforts.push(...jdWorkEfforts);
      }
    }
  } catch (error) {
    return { workEfforts: [], error: error.message };
  }

  return { workEfforts };
}

/**
 * Parse MCP v0.3.0 format work effort.
 *
 * Directory structure:
 * ```
 * WE-YYMMDD-xxxx_slug/
 * ├── WE-YYMMDD-xxxx_index.md
 * └── tickets/
 *     ├── TKT-xxxx-001_task.md
 *     └── TKT-xxxx-002_task.md
 * ```
 *
 * @param {string} dirPath - Absolute path to work effort directory
 * @param {string} dirName - Directory name (WE-YYMMDD-xxxx_slug)
 * @returns {Promise<WorkEffort|null>} Parsed work effort or null if invalid
 * @private
 */
async function parseMCPWorkEffort(dirPath, dirName) {
  try {
    const files = await fs.readdir(dirPath);
    const indexFile = files.find(f => f.endsWith('_index.md'));

    if (!indexFile) return null;

    const indexPath = path.join(dirPath, indexFile);
    const content = await fs.readFile(indexPath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Extract WE ID from directory name
    const idMatch = dirName.match(/^(WE-\d{6}-[a-z0-9]{4})/);
    const id = frontmatter.id || (idMatch ? idMatch[1] : dirName);

    // Parse tickets
    const tickets = await parseMCPTickets(dirPath, id);

    return {
      id,
      format: 'mcp',
      title: frontmatter.title || extractTitleFromBody(body) || 'Untitled',
      status: frontmatter.status || 'unknown',
      path: dirPath,
      created: frontmatter.created || null,
      tickets,
      branch: frontmatter.branch || null,
      repository: frontmatter.repository || null
    };
  } catch (error) {
    console.error(`Error parsing MCP work effort ${dirPath}:`, error.message);
    return null;
  }
}

/**
 * Parse tickets within an MCP format work effort.
 * Looks for TKT-xxxx-NNN_*.md files in the tickets/ subdirectory.
 *
 * @param {string} weDirPath - Path to work effort directory
 * @param {string} parentId - Parent work effort ID
 * @returns {Promise<Ticket[]>} Array of parsed tickets
 * @private
 */
async function parseMCPTickets(weDirPath, parentId) {
  const ticketsDir = path.join(weDirPath, 'tickets');
  const tickets = [];

  try {
    const files = await fs.readdir(ticketsDir);

    for (const file of files) {
      if (!file.startsWith('TKT-') || !file.endsWith('.md')) continue;

      const ticketPath = path.join(ticketsDir, file);
      const content = await fs.readFile(ticketPath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      const idMatch = file.match(/^(TKT-[a-z0-9]{4}-\d{3})/);
      const id = frontmatter.id || (idMatch ? idMatch[1] : file.replace('.md', ''));

      tickets.push({
        id,
        title: frontmatter.title || extractTitleFromBody(body) || 'Untitled',
        status: frontmatter.status || 'pending',
        path: ticketPath,
        parent: parentId
      });
    }
  } catch {
    // No tickets directory or empty
  }

  return tickets;
}

/**
 * Parse Johnny Decimal category directory.
 *
 * Structure:
 * ```
 * XX-XX_category/
 * └── XX_subcategory/
 *     ├── XX.XX_document.md
 *     └── XX.XX_other.md
 * ```
 *
 * @param {string} categoryPath - Path to category directory
 * @param {string} categoryName - Category name (XX-XX_name)
 * @returns {Promise<WorkEffort[]>} Array of parsed work efforts
 * @private
 */
async function parseJohnnyDecimalCategory(categoryPath, categoryName) {
  const workEfforts = [];

  try {
    const subcategories = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const subcat of subcategories) {
      if (!subcat.isDirectory()) continue;

      const subcatPath = path.join(categoryPath, subcat.name);
      const files = await fs.readdir(subcatPath);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        if (file.includes('index')) continue; // Skip index files

        const filePath = path.join(subcatPath, file);
        const we = await parseJohnnyDecimalFile(filePath, file, categoryName);
        if (we) workEfforts.push(we);
      }
    }
  } catch (error) {
    console.error(`Error parsing JD category ${categoryPath}:`, error.message);
  }

  return workEfforts;
}

/**
 * Parse a single Johnny Decimal markdown file as a work effort.
 *
 * @param {string} filePath - Absolute path to markdown file
 * @param {string} fileName - File name (XX.XX_name.md)
 * @param {string} categoryName - Parent category name
 * @returns {Promise<WorkEffort|null>} Parsed work effort or null if invalid
 * @private
 */
async function parseJohnnyDecimalFile(filePath, fileName, categoryName) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Extract ID from filename: XX.XX_name.md -> XX.XX
    const idMatch = fileName.match(/^(\d{2}\.\d{2})/);
    const id = idMatch ? idMatch[1] : fileName.replace('.md', '');

    // Try to extract status from content
    const statusMatch = body.match(/##?\s*Status[:\s]*(\w+)/i) ||
                        body.match(/\*\*Status\*\*[:\s]*(\w+)/i);

    return {
      id,
      format: 'jd',
      title: frontmatter.title || extractTitleFromBody(body) || fileName.replace('.md', ''),
      status: frontmatter.status || (statusMatch ? statusMatch[1].toLowerCase() : 'unknown'),
      path: filePath,
      created: frontmatter.created || frontmatter.date || null,
      category: categoryName,
      content: body.slice(0, 500) // First 500 chars as preview
    };
  } catch (error) {
    console.error(`Error parsing JD file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract title from markdown body.
 * Looks for first H1 or H2 heading.
 *
 * @param {string} body - Markdown content
 * @returns {string|null} Extracted title or null
 * @private
 */
function extractTitleFromBody(body) {
  const match = body.match(/^#\s+(.+)$/m) || body.match(/^##\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * @typedef {Object} RepoStats
 * @property {number} total - Total work efforts
 * @property {Object.<string, number>} byFormat - Count by format (mcp, jd)
 * @property {Object.<string, number>} byStatus - Count by status
 * @property {number} totalTickets - Total tickets across all work efforts
 * @property {Object.<string, number>} ticketsByStatus - Ticket count by status
 */

/**
 * Calculate summary statistics for parsed work efforts.
 *
 * @param {WorkEffort[]} workEfforts - Array of parsed work efforts
 * @returns {RepoStats} Summary statistics
 */
export function getRepoStats(workEfforts) {
  const stats = {
    total: workEfforts.length,
    byFormat: { mcp: 0, jd: 0 },
    byStatus: {},
    totalTickets: 0,
    ticketsByStatus: {}
  };

  for (const we of workEfforts) {
    stats.byFormat[we.format]++;
    stats.byStatus[we.status] = (stats.byStatus[we.status] || 0) + 1;

    if (we.tickets) {
      stats.totalTickets += we.tickets.length;
      for (const ticket of we.tickets) {
        stats.ticketsByStatus[ticket.status] = (stats.ticketsByStatus[ticket.status] || 0) + 1;
      }
    }
  }

  return stats;
}

