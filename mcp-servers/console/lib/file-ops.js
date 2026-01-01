/**
 * @fileoverview File system operations for work efforts
 * Write operations to complement the parser's read operations
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { parseRepo, invalidateCache } from './parser.js';

/**
 * Get the next ticket number for a work effort
 */
async function getNextTicketNumber(weDirPath, weId) {
  const ticketsDir = path.join(weDirPath, 'tickets');

  try {
    const files = await fs.readdir(ticketsDir);
    const prefix = weId.split('-').slice(-1)[0]; // Get the xxxx part from WE-YYMMDD-xxxx
    const ticketNumbers = files
      .filter(f => f.startsWith(`TKT-${prefix}-`))
      .map(f => {
        const match = f.match(/TKT-[a-z0-9]{4}-(\d{3})/);
        return match ? parseInt(match[1], 10) : 0;
      });

    return ticketNumbers.length > 0 ? Math.max(...ticketNumbers) + 1 : 1;
  } catch {
    // No tickets directory yet
    return 1;
  }
}

/**
 * Create a new ticket in a work effort
 */
export async function createTicket(weId, title, description = '', status = 'pending') {
  const repoPath = '/home/user/_pyrite';
  const weDirPath = path.join(repoPath, '_work_efforts', `${weId}_*`);

  // Find the actual directory (handle slug variations)
  const workEffortsDir = path.join(repoPath, '_work_efforts');
  const dirs = await fs.readdir(workEffortsDir);
  const weDir = dirs.find(d => d.startsWith(weId));

  if (!weDir) {
    throw new Error(`Work effort ${weId} not found`);
  }

  const actualWeDirPath = path.join(workEffortsDir, weDir);
  const ticketsDir = path.join(actualWeDirPath, 'tickets');

  // Ensure tickets directory exists
  await fs.mkdir(ticketsDir, { recursive: true });

  // Generate ticket ID
  const ticketNum = await getNextTicketNumber(actualWeDirPath, weId);
  const prefix = weId.split('-').slice(-1)[0];
  const ticketId = `TKT-${prefix}-${ticketNum.toString().padStart(3, '0')}`;

  // Create slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);

  const filename = `${ticketId}_${slug}.md`;
  const ticketPath = path.join(ticketsDir, filename);

  // Create ticket content
  const frontmatter = {
    id: ticketId,
    title,
    status,
    created: new Date().toISOString(),
    parent: weId
  };

  const content = matter.stringify(description, frontmatter);

  await fs.writeFile(ticketPath, content, 'utf-8');

  // Invalidate cache
  invalidateCache(repoPath);

  return {
    id: ticketId,
    title,
    status,
    path: ticketPath,
    parent: weId
  };
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId, newStatus) {
  const repoPath = '/home/user/_pyrite';

  // Find the ticket file
  const { workEfforts } = await parseRepo(repoPath);

  let ticketPath = null;
  for (const we of workEfforts) {
    const ticket = we.tickets?.find(t => t.id === ticketId);
    if (ticket) {
      ticketPath = ticket.path;
      break;
    }
  }

  if (!ticketPath) {
    throw new Error(`Ticket ${ticketId} not found`);
  }

  // Read, update, write
  const content = await fs.readFile(ticketPath, 'utf-8');
  const parsed = matter(content);
  parsed.data.status = newStatus;
  parsed.data.updated = new Date().toISOString();

  const updated = matter.stringify(parsed.content, parsed.data);
  await fs.writeFile(ticketPath, updated, 'utf-8');

  // Invalidate cache
  invalidateCache(repoPath);

  return { success: true, ticketId, newStatus };
}

/**
 * List all work efforts with summary stats
 */
export async function listWorkEfforts() {
  const repoPath = '/home/user/_pyrite';
  const { workEfforts, error } = await parseRepo(repoPath);

  if (error) {
    throw new Error(error);
  }

  // Return lightweight summary for chat context
  return workEfforts.map(we => ({
    id: we.id,
    title: we.title,
    status: we.status,
    ticketCount: we.tickets?.length || 0,
    branch: we.branch
  }));
}

/**
 * Get detailed info about a specific work effort
 */
export async function getWorkEffortDetails(weId) {
  const repoPath = '/home/user/_pyrite';
  const { workEfforts } = await parseRepo(repoPath, { includeTickets: true });

  const we = workEfforts.find(w => w.id === weId);
  if (!we) {
    throw new Error(`Work effort ${weId} not found`);
  }

  return we;
}

/**
 * Search work efforts and tickets by keyword
 */
export async function searchWorkEfforts(query) {
  const repoPath = '/home/user/_pyrite';
  const { workEfforts } = await parseRepo(repoPath, { includeTickets: true });

  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const we of workEfforts) {
    // Check work effort title
    if (we.title.toLowerCase().includes(lowerQuery)) {
      results.push({ type: 'work_effort', ...we });
    }

    // Check tickets
    for (const ticket of we.tickets || []) {
      if (ticket.title.toLowerCase().includes(lowerQuery) ||
          ticket.content?.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'ticket', ...ticket });
      }
    }
  }

  return results;
}
