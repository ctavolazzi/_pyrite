#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const server = new Server(
  { name: 'work-efforts', version: '0.3.0' },
  { capabilities: { tools: {} } }
);

// ============================================================================
// ID Generation Utilities
// ============================================================================

/**
 * Generate a 4-character random alphanumeric string (a-z, 0-9)
 */
function generateUniqueId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate Work Effort ID: WE-YYMMDD-xxxx
 */
function generateWorkEffortId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const unique = generateUniqueId();
  return `WE-${yy}${mm}${dd}-${unique}`;
}

/**
 * Extract the unique suffix from a Work Effort ID
 * WE-251227-a1b2 -> a1b2
 */
function extractWeSuffix(weId) {
  const match = weId.match(/WE-\d{6}-([a-z0-9]{4})/);
  return match ? match[1] : null;
}

/**
 * Get next ticket number in a work effort
 */
async function getNextTicketNumber(ticketsDir) {
  try {
    const files = await fs.readdir(ticketsDir);
    const numbers = files
      .filter(f => f.match(/^TKT-[a-z0-9]{4}-(\d{3})/))
      .map(f => parseInt(f.match(/^TKT-[a-z0-9]{4}-(\d{3})/)?.[1] || '0'))
      .filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch {
    return 1;
  }
}

/**
 * Generate Ticket ID: TKT-xxxx-NNN
 */
async function generateTicketId(weSuffix, ticketsDir) {
  const nextNum = await getNextTicketNumber(ticketsDir);
  return `TKT-${weSuffix}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Get current username
 */
function getCurrentUser() {
  return os.userInfo().username || 'unknown';
}

/**
 * Get ISO timestamp with timezone
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Create slug from title
 */
function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Find all work effort directories in a repo
 */
async function findWorkEfforts(repoPath) {
  const workEffortsDir = path.join(repoPath, '_work_efforts_');
  const results = [];

  try {
    const entries = await fs.readdir(workEffortsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('WE-')) {
        const weDir = path.join(workEffortsDir, entry.name);
        const indexFile = (await fs.readdir(weDir)).find(f => f.endsWith('_index.md'));

        if (indexFile) {
          const indexPath = path.join(weDir, indexFile);
          const content = await fs.readFile(indexPath, 'utf-8');

          // Parse frontmatter
          const idMatch = content.match(/^id:\s*(.+)$/m);
          const titleMatch = content.match(/^title:\s*"?(.+?)"?$/m);
          const statusMatch = content.match(/^status:\s*(.+)$/m);
          const createdMatch = content.match(/^created:\s*(.+)$/m);
          const branchMatch = content.match(/^branch:\s*(.+)$/m);
          const repoMatch = content.match(/^repository:\s*(.+)$/m);

          results.push({
            id: idMatch?.[1]?.trim() || entry.name.split('_')[0],
            title: titleMatch?.[1]?.trim() || 'Untitled',
            status: statusMatch?.[1]?.trim() || 'unknown',
            created: createdMatch?.[1]?.trim() || '',
            branch: branchMatch?.[1]?.trim() || '',
            repository: repoMatch?.[1]?.trim() || '',
            path: weDir,
            indexPath: indexPath
          });
        }
      }
    }
  } catch (error) {
    // Directory might not exist yet
  }

  return results;
}

/**
 * Find all tickets in a work effort
 */
async function findTickets(weDir) {
  const ticketsDir = path.join(weDir, 'tickets');
  const results = [];

  try {
    const files = await fs.readdir(ticketsDir);

    for (const file of files) {
      if (file.startsWith('TKT-') && file.endsWith('.md')) {
        const ticketPath = path.join(ticketsDir, file);
        const content = await fs.readFile(ticketPath, 'utf-8');

        // Parse frontmatter
        const idMatch = content.match(/^id:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*"?(.+?)"?$/m);
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const parentMatch = content.match(/^parent:\s*(.+)$/m);

        results.push({
          id: idMatch?.[1]?.trim() || file.replace('.md', '').split('_')[0],
          title: titleMatch?.[1]?.trim() || 'Untitled',
          status: statusMatch?.[1]?.trim() || 'pending',
          parent: parentMatch?.[1]?.trim() || '',
          path: ticketPath
        });
      }
    }
  } catch (error) {
    // Tickets directory might not exist
  }

  return results;
}

// ============================================================================
// Template Generators
// ============================================================================

/**
 * Generate Work Effort index.md content
 */
function generateWorkEffortTemplate(id, title, objective, tickets = [], branch = '', repository = '') {
  const now = getTimestamp();
  const user = getCurrentUser();
  const slug = slugify(title);
  const defaultBranch = branch || `feature/${id}-${slug}`;

  const ticketTable = tickets.length > 0
    ? tickets.map(t => `| ${t.id} | ${t.title} | pending |`).join('\n')
    : '| (no tickets yet) | | |';

  return `---
id: ${id}
title: "${title}"
status: active
created: ${now}
created_by: ${user}
last_updated: ${now}
branch: ${defaultBranch}
repository: ${repository}
---

# ${id}: ${title}

## Metadata
- **Created**: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}
- **Author**: ${user}
- **Repository**: ${repository || '(not specified)'}
- **Branch**: ${defaultBranch}

## Objective
${objective}

## Tickets

| ID | Title | Status |
|----|-------|--------|
${ticketTable}

## Commits
(populated as work progresses)

## Related
- Docs: (add links)
- PRs: (add links)
`;
}

/**
 * Generate Ticket .md content
 */
function generateTicketTemplate(id, parentId, title, description = '', acceptanceCriteria = []) {
  const now = getTimestamp();
  const user = getCurrentUser();

  const criteriaList = acceptanceCriteria.length > 0
    ? acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')
    : '- [ ] (define acceptance criteria)';

  return `---
id: ${id}
parent: ${parentId}
title: "${title}"
status: pending
created: ${now}
created_by: ${user}
assigned_to: null
---

# ${id}: ${title}

## Metadata
- **Created**: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}
- **Parent Work Effort**: ${parentId}
- **Author**: ${user}

## Description
${description || '(describe what needs to be done)'}

## Acceptance Criteria
${criteriaList}

## Files Changed
(populated when complete)

## Implementation Notes
(decisions, blockers, context)

## Commits
(populated as work progresses)
`;
}

// ============================================================================
// Tool Definitions
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_work_effort',
      description: 'Create a new work effort with WE-YYMMDD-xxxx ID format. Creates folder, index.md, and tickets/ subfolder.',
      inputSchema: {
        type: 'object',
        properties: {
          repo_path: { type: 'string', description: 'Full path to repository' },
          title: { type: 'string', description: 'Work effort title' },
          objective: { type: 'string', description: 'What needs to be done and why' },
          branch: { type: 'string', description: 'Git branch name (optional, auto-generated if not provided)' },
          repository: { type: 'string', description: 'Repository name for reference' },
          tickets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                acceptance_criteria: { type: 'array', items: { type: 'string' } }
              },
              required: ['title']
            },
            description: 'Initial tickets to create (optional)'
          }
        },
        required: ['repo_path', 'title', 'objective']
      }
    },
    {
      name: 'create_ticket',
      description: 'Create a new ticket (TKT-xxxx-NNN) in an existing work effort',
      inputSchema: {
        type: 'object',
        properties: {
          work_effort_path: { type: 'string', description: 'Full path to work effort directory' },
          title: { type: 'string', description: 'Ticket title' },
          description: { type: 'string', description: 'What needs to be done' },
          acceptance_criteria: { type: 'array', items: { type: 'string' }, description: 'List of acceptance criteria' }
        },
        required: ['work_effort_path', 'title']
      }
    },
    {
      name: 'list_work_efforts',
      description: 'List all work efforts in a repository',
      inputSchema: {
        type: 'object',
        properties: {
          repo_path: { type: 'string', description: 'Full path to repository' },
          status: { type: 'string', enum: ['active', 'paused', 'completed', 'all'], description: 'Filter by status (default: all)' }
        },
        required: ['repo_path']
      }
    },
    {
      name: 'list_tickets',
      description: 'List all tickets in a work effort',
      inputSchema: {
        type: 'object',
        properties: {
          work_effort_path: { type: 'string', description: 'Full path to work effort directory' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked', 'all'], description: 'Filter by status (default: all)' }
        },
        required: ['work_effort_path']
      }
    },
    {
      name: 'update_work_effort',
      description: 'Update a work effort status or add progress notes',
      inputSchema: {
        type: 'object',
        properties: {
          work_effort_path: { type: 'string', description: 'Full path to work effort directory' },
          status: { type: 'string', enum: ['active', 'paused', 'completed'], description: 'New status' },
          progress: { type: 'string', description: 'Progress note to add' },
          commit: { type: 'string', description: 'Commit hash to add to commits list' }
        },
        required: ['work_effort_path']
      }
    },
    {
      name: 'update_ticket',
      description: 'Update a ticket status, files changed, or notes',
      inputSchema: {
        type: 'object',
        properties: {
          ticket_path: { type: 'string', description: 'Full path to ticket file' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked'], description: 'New status' },
          files_changed: { type: 'array', items: { type: 'string' }, description: 'List of files changed' },
          notes: { type: 'string', description: 'Implementation notes to add' },
          commit: { type: 'string', description: 'Commit hash to add' }
        },
        required: ['ticket_path']
      }
    },
    {
      name: 'search_work_efforts',
      description: 'Search work efforts and tickets by keyword',
      inputSchema: {
        type: 'object',
        properties: {
          repo_path: { type: 'string', description: 'Full path to repository' },
          query: { type: 'string', description: 'Search keyword' },
          include_tickets: { type: 'boolean', description: 'Also search within tickets (default: true)' }
        },
        required: ['repo_path', 'query']
      }
    }
  ]
}));

// ============================================================================
// Tool Handlers
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // -------------------------------------------------------------------------
    // CREATE WORK EFFORT
    // -------------------------------------------------------------------------
    if (name === 'create_work_effort') {
      const { repo_path, title, objective, branch, repository, tickets = [] } = args;

      const weId = generateWorkEffortId();
      const slug = slugify(title);
      const folderName = `${weId}_${slug}`;

      const workEffortsDir = path.join(repo_path, '_work_efforts_');
      const weDir = path.join(workEffortsDir, folderName);
      const ticketsDir = path.join(weDir, 'tickets');

      // Create directories
      await fs.mkdir(ticketsDir, { recursive: true });

      // Create index file
      const indexContent = generateWorkEffortTemplate(weId, title, objective, [], branch, repository);
      const indexPath = path.join(weDir, `${weId}_index.md`);
      await fs.writeFile(indexPath, indexContent);

      // Create initial tickets if provided
      const createdTickets = [];
      const weSuffix = extractWeSuffix(weId);

      for (const ticket of tickets) {
        const ticketId = await generateTicketId(weSuffix, ticketsDir);
        const ticketSlug = slugify(ticket.title);
        const ticketFilename = `${ticketId}_${ticketSlug}.md`;
        const ticketPath = path.join(ticketsDir, ticketFilename);

        const ticketContent = generateTicketTemplate(
          ticketId,
          weId,
          ticket.title,
          ticket.description || '',
          ticket.acceptance_criteria || []
        );

        await fs.writeFile(ticketPath, ticketContent);
        createdTickets.push({ id: ticketId, title: ticket.title });
      }

      // Update index with tickets if any were created
      if (createdTickets.length > 0) {
        const updatedIndexContent = generateWorkEffortTemplate(weId, title, objective, createdTickets, branch, repository);
        await fs.writeFile(indexPath, updatedIndexContent);
      }

      const ticketSummary = createdTickets.length > 0
        ? `\nTickets created:\n${createdTickets.map(t => `  • ${t.id}: ${t.title}`).join('\n')}`
        : '';

      return {
        content: [{
          type: 'text',
          text: `✅ Created Work Effort: ${weId}\n📁 Path: ${weDir}\n📄 Index: ${indexPath}${ticketSummary}`
        }]
      };
    }

    // -------------------------------------------------------------------------
    // CREATE TICKET
    // -------------------------------------------------------------------------
    if (name === 'create_ticket') {
      const { work_effort_path, title, description, acceptance_criteria = [] } = args;

      // Find the work effort ID from the directory name or index file
      const weDirName = path.basename(work_effort_path);
      const weIdMatch = weDirName.match(/^(WE-\d{6}-[a-z0-9]{4})/);

      if (!weIdMatch) {
        throw new Error(`Invalid work effort directory: ${weDirName}. Expected format: WE-YYMMDD-xxxx_title`);
      }

      const weId = weIdMatch[1];
      const weSuffix = extractWeSuffix(weId);
      const ticketsDir = path.join(work_effort_path, 'tickets');

      // Ensure tickets directory exists
      await fs.mkdir(ticketsDir, { recursive: true });

      const ticketId = await generateTicketId(weSuffix, ticketsDir);
      const ticketSlug = slugify(title);
      const ticketFilename = `${ticketId}_${ticketSlug}.md`;
      const ticketPath = path.join(ticketsDir, ticketFilename);

      const ticketContent = generateTicketTemplate(ticketId, weId, title, description, acceptance_criteria);
      await fs.writeFile(ticketPath, ticketContent);

      // Update parent WE index with new ticket
      const indexFiles = await fs.readdir(work_effort_path);
      const indexFile = indexFiles.find(f => f.endsWith('_index.md'));

      if (indexFile) {
        const indexPath = path.join(work_effort_path, indexFile);
        let indexContent = await fs.readFile(indexPath, 'utf-8');

        // Add ticket to table
        const newTicketRow = `| ${ticketId} | ${title} | pending |`;
        indexContent = indexContent.replace(
          /(\| ID \| Title \| Status \|\n\|----\|-------\|--------\|\n)/,
          `$1${newTicketRow}\n`
        );

        // Update last_updated
        indexContent = indexContent.replace(
          /^last_updated:.+$/m,
          `last_updated: ${getTimestamp()}`
        );

        await fs.writeFile(indexPath, indexContent);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Created Ticket: ${ticketId}\n📁 Path: ${ticketPath}\n🔗 Parent: ${weId}`
        }]
      };
    }

    // -------------------------------------------------------------------------
    // LIST WORK EFFORTS
    // -------------------------------------------------------------------------
    if (name === 'list_work_efforts') {
      const { repo_path, status = 'all' } = args;

      const workEfforts = await findWorkEfforts(repo_path);

      const filtered = status === 'all'
        ? workEfforts
        : workEfforts.filter(we => we.status === status);

      if (filtered.length === 0) {
        return {
          content: [{
            type: 'text',
            text: status === 'all'
              ? 'No work efforts found in this repository.'
              : `No work efforts with status "${status}" found.`
          }]
        };
      }

      const lines = filtered.map(we =>
        `• ${we.id} - ${we.title} [${we.status}]\n  Path: ${we.path}`
      );

      return {
        content: [{
          type: 'text',
          text: `Found ${filtered.length} work effort(s):\n\n${lines.join('\n\n')}`
        }]
      };
    }

    // -------------------------------------------------------------------------
    // LIST TICKETS
    // -------------------------------------------------------------------------
    if (name === 'list_tickets') {
      const { work_effort_path, status = 'all' } = args;

      const tickets = await findTickets(work_effort_path);

      const filtered = status === 'all'
        ? tickets
        : tickets.filter(t => t.status === status);

      if (filtered.length === 0) {
        return {
          content: [{
            type: 'text',
            text: status === 'all'
              ? 'No tickets found in this work effort.'
              : `No tickets with status "${status}" found.`
          }]
        };
      }

      const lines = filtered.map(t =>
        `• ${t.id} - ${t.title} [${t.status}]`
      );

      return {
        content: [{
          type: 'text',
          text: `Found ${filtered.length} ticket(s):\n\n${lines.join('\n')}`
        }]
      };
    }

    // -------------------------------------------------------------------------
    // UPDATE WORK EFFORT
    // -------------------------------------------------------------------------
    if (name === 'update_work_effort') {
      const { work_effort_path, status, progress, commit } = args;

      const indexFiles = await fs.readdir(work_effort_path);
      const indexFile = indexFiles.find(f => f.endsWith('_index.md'));

      if (!indexFile) {
        throw new Error(`No index file found in ${work_effort_path}`);
      }

      const indexPath = path.join(work_effort_path, indexFile);
      let content = await fs.readFile(indexPath, 'utf-8');

      // Update status if provided
      if (status) {
        content = content.replace(/^status:\s*.+$/m, `status: ${status}`);
      }

      // Update last_updated
      content = content.replace(/^last_updated:.+$/m, `last_updated: ${getTimestamp()}`);

      // Add progress note if provided
      if (progress) {
        const date = new Date().toLocaleDateString();
        const progressNote = `- ${date}: ${progress}`;

        // Add to Commits section or create one
        if (content.includes('## Commits')) {
          content = content.replace(
            /(## Commits\n)/,
            `$1${progressNote}\n`
          );
        }
      }

      // Add commit if provided
      if (commit) {
        const commitLine = `- \`${commit}\``;
        if (content.includes('## Commits')) {
          content = content.replace(
            /(## Commits\n)/,
            `$1${commitLine}\n`
          );
        }
      }

      await fs.writeFile(indexPath, content);

      const updates = [];
      if (status) updates.push(`status → ${status}`);
      if (progress) updates.push(`added progress note`);
      if (commit) updates.push(`added commit ${commit}`);

      return {
        content: [{
          type: 'text',
          text: `✅ Updated: ${path.basename(work_effort_path)}\n${updates.join(', ')}`
        }]
      };
    }

    // -------------------------------------------------------------------------
    // UPDATE TICKET
    // -------------------------------------------------------------------------
    if (name === 'update_ticket') {
      const { ticket_path, status, files_changed, notes, commit } = args;

      let content = await fs.readFile(ticket_path, 'utf-8');

      // Update status if provided
      if (status) {
        content = content.replace(/^status:\s*.+$/m, `status: ${status}`);
      }

      // Add files changed if provided
      if (files_changed && files_changed.length > 0) {
        const filesSection = files_changed.map(f => `- \`${f}\``).join('\n');
        content = content.replace(
          /## Files Changed\n[^#]*/,
          `## Files Changed\n${filesSection}\n\n`
        );
      }

      // Add notes if provided
      if (notes) {
        const notesLine = `- ${new Date().toLocaleDateString()}: ${notes}`;
        content = content.replace(
          /(## Implementation Notes\n)/,
          `$1${notesLine}\n`
        );
      }

      // Add commit if provided
      if (commit) {
        const commitLine = `- \`${commit}\``;
        content = content.replace(
          /(## Commits\n)/,
          `$1${commitLine}\n`
        );
      }

      await fs.writeFile(ticket_path, content);

      const updates = [];
      if (status) updates.push(`status → ${status}`);
      if (files_changed) updates.push(`${files_changed.length} files listed`);
      if (notes) updates.push(`added notes`);
      if (commit) updates.push(`added commit`);

      return {
        content: [{
          type: 'text',
          text: `✅ Updated: ${path.basename(ticket_path)}\n${updates.join(', ')}`
        }]
      };
    }

    // -------------------------------------------------------------------------
    // SEARCH WORK EFFORTS
    // -------------------------------------------------------------------------
    if (name === 'search_work_efforts') {
      const { repo_path, query, include_tickets = true } = args;

      const searchQuery = query.toLowerCase();
      const results = [];

      const workEfforts = await findWorkEfforts(repo_path);

      for (const we of workEfforts) {
        // Check WE title and content
        const indexContent = await fs.readFile(we.indexPath, 'utf-8');

        if (
          we.title.toLowerCase().includes(searchQuery) ||
          we.id.toLowerCase().includes(searchQuery) ||
          indexContent.toLowerCase().includes(searchQuery)
        ) {
          results.push({
            type: 'work_effort',
            id: we.id,
            title: we.title,
            status: we.status,
            path: we.path
          });
        }

        // Search tickets if enabled
        if (include_tickets) {
          const tickets = await findTickets(we.path);

          for (const ticket of tickets) {
            const ticketContent = await fs.readFile(ticket.path, 'utf-8');

            if (
              ticket.title.toLowerCase().includes(searchQuery) ||
              ticket.id.toLowerCase().includes(searchQuery) ||
              ticketContent.toLowerCase().includes(searchQuery)
            ) {
              results.push({
                type: 'ticket',
                id: ticket.id,
                title: ticket.title,
                status: ticket.status,
                parent: we.id,
                path: ticket.path
              });
            }
          }
        }
      }

      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No results found for "${query}"`
          }]
        };
      }

      const lines = results.map(r => {
        if (r.type === 'work_effort') {
          return `📁 ${r.id} - ${r.title} [${r.status}]\n   Path: ${r.path}`;
        } else {
          return `📋 ${r.id} - ${r.title} [${r.status}]\n   Parent: ${r.parent}\n   Path: ${r.path}`;
        }
      });

      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} result(s) for "${query}":\n\n${lines.join('\n\n')}`
        }]
      };
    }

    throw new Error(`Unknown tool: ${name}`);

  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// ============================================================================
// Start Server
// ============================================================================

const transport = new StdioServerTransport();
await server.connect(transport);
