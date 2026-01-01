/**
 * @fileoverview Work effort parser (adapted from dashboard)
 * Optimized for chat context with caching and lazy loading
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Parse repository with caching for performance
 */
export async function parseRepo(repoPath, options = {}) {
  const cacheKey = `repo:${repoPath}`;

  // Check cache unless force refresh
  if (!options.forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const workEfforts = [];
  let workEffortsDir = null;

  // Find _work_efforts directory
  for (const dirName of ['_work_efforts', '_work_efforts_']) {
    const tryPath = path.join(repoPath, dirName);
    try {
      await fs.access(tryPath);
      workEffortsDir = tryPath;
      break;
    } catch {
      continue;
    }
  }

  if (!workEffortsDir) {
    return { workEfforts: [], error: 'No _work_efforts folder found' };
  }

  try {
    const entries = await fs.readdir(workEffortsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirName = entry.name;
      const dirPath = path.join(workEffortsDir, dirName);

      if (dirName.startsWith('WE-')) {
        // MCP v0.3.0 format
        const we = await parseMCPWorkEffort(dirPath, dirName, options);
        if (we) workEfforts.push(we);
      }
    }
  } catch (error) {
    return { workEfforts: [], error: error.message };
  }

  const result = { workEfforts };
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Parse MCP work effort with optional lazy ticket loading
 */
async function parseMCPWorkEffort(dirPath, dirName, options = {}) {
  try {
    const files = await fs.readdir(dirPath);
    const indexFile = files.find(f => f.endsWith('_index.md'));
    if (!indexFile) return null;

    const indexPath = path.join(dirPath, indexFile);
    const content = await fs.readFile(indexPath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    const idMatch = dirName.match(/^(WE-\d{6}-[a-z0-9]{4})/);
    const id = frontmatter.id || (idMatch ? idMatch[1] : dirName);

    // Lazy load tickets only if requested
    const tickets = options.includeTickets !== false
      ? await parseMCPTickets(dirPath, id)
      : [];

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
    console.error(`Error parsing ${dirPath}:`, error.message);
    return null;
  }
}

/**
 * Parse tickets within work effort
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
        parent: parentId,
        content: body // Include content for context
      });
    }
  } catch {
    // No tickets directory
  }

  return tickets;
}

/**
 * Extract title from markdown body
 */
function extractTitleFromBody(body) {
  const match = body.match(/^#\s+(.+)$/m) || body.match(/^##\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Invalidate cache for a repository
 */
export function invalidateCache(repoPath) {
  cache.delete(`repo:${repoPath}`);
}
