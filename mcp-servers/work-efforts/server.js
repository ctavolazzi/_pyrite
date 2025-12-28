#!/usr/bin/env node
/**
 * WORK EFFORTS MCP SERVER v0.3.0
 * 
 * MCP server for managing work efforts and tickets with date-based IDs.
 * 
 * ID Formats:
 * - Work Effort: WE-YYMMDD-xxxx (date + 4-char random alphanumeric)
 * - Ticket: TKT-xxxx-NNN (parent's suffix + sequential number)
 * 
 * Folder Structure:
 * _work_efforts_/
 * ├── WE-251227-a1b2_title/
 * │   ├── WE-251227-a1b2_index.md
 * │   └── tickets/
 * │       ├── TKT-a1b2-001_task.md
 * │       └── TKT-a1b2-002_task.md
 */

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
function generateSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a Work Effort ID: WE-YYMMDD-xxxx
 */
function generateWorkEffortId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = generateSuffix();
  return `WE-${yy}${mm}${dd}-${suffix}`;
}

/**
 * Extract the suffix from a Work Effort ID
 */
function extractSuffix(weId) {
  const match = weId.match(/WE-\d{6}-(\w{4})/);
  return match ? match[1] : null;
}

/**
 * Get the next ticket number for a work effort
 */
async function getNextTicketNumber(ticketsDir) {
  try {
    const files = await fs.readdir(ticketsDir);
    const numbers = files
      .filter(f => f.match(/^TKT-\w{4}-(\d{3})/))
      .map(f => parseInt(f.match(/^TKT-\w{4}-(\d{3})/)?.[1] || '0'))
      .filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch {
    return 1;
  }
}

/**
 * Create a slug from a title
 */
function createSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Get current username
 */
function getUsername() {
  return os.userInfo().username || 'unknown';
}

/**
 * Get ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Get human-readable date
 */
function getHumanDate() {
  return new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

// ============================================================================
// Template Generators
// ============================================================================

function generateWorkEffortTemplate(id, title, objective, repository, tickets = []) {
  const now = getTimestamp();
  const humanDate = getHumanDate();
  const username = getUsername();
  const suffix = extractSuffix(id);
  const slug = createSlug(title);
  
  const ticketRows = tickets.length > 0
    ? tickets.map((t, i) => `| TKT-${suffix}-${String(i + 1).padStart(3, '0')} | ${t} | pending |`).join('\n')
    : '| (no tickets yet) | | |';

  return `---
id: ${id}
title: "${title}"
status: active
created: ${now}
created_by: ${username}
last_updated: ${now}
branch: feature/${id}-${slug}
repository: ${repository || 'unknown'}
---

# ${id}: ${title}

## Metadata
- **Created**: ${humanDate}
- **Author**: ${username}
- **Repository**: ${repository || 'unknown'}
- **Branch**: feature/${id}-${slug}

## Objective
${objective}

## Tickets

| ID | Title | Status |
|----|-------|--------|
${ticketRows}

## Commits
- (populated as work progresses)

## Related
- Docs: (to be linked)
- PRs: (to be added)
`;
}

function generateTicketTemplate(ticketId, parentId, title, description = '', acceptanceCriteria = []) {
  const now = getTimestamp();
  const humanDate = getHumanDate();
  const username = getUsername();
  
  const criteriaList = acceptanceCriteria.length > 0
    ? acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')
    : '- [ ] (define acceptance criteria)';

  return `---
id: ${ticketId}
parent: ${parentId}
title: "${title}"
status: pending
created: ${now}
created_by: ${username}
assigned_to: null
---

# ${ticketId}: ${title}

## Metadata
- **Created**: ${humanDate}
- **Parent Work Effort**: ${parentId}
- **Author**: ${username}

## Description
${description || '(describe what needs to be done)'}

## Acceptance Criteria
${criteriaList}

## Files Changed
- (populated when complete)

## Implementation Notes
- (decisions, blockers, context)

## Commits
- (populated as work progresses)
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
          repository: { type: 'string', description: 'Repository name for reference' },
          tickets: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'Initial ticket titles to create (optional)' 
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
          acceptance_criteria: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'List of acceptance criteria' 
          }
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
          status: { 
            type: 'string', 
            enum: ['active', 'paused', 'completed', 'all'], 
            default: 'all',
            description: 'Filter by status'
          }
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
          status: { 
            type: 'string', 
            enum: ['pending', 'in_progress', 'completed', 'blocked', 'all'], 
            default: 'all',
            description: 'Filter by status'
          }
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
          status: { type: 'string', enum: ['active', 'paused', 'completed'] },
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
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked'] },
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
          include_tickets: { type: 'boolean', description: 'Also search within tickets', default: true }
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
    // ========================================================================
    // CREATE WORK EFFORT
    // ========================================================================
    if (name === 'create_work_effort') {
      const { repo_path, title, objective, repository, tickets = [] } = args;
      
      const weId = generateWorkEffortId();
      const suffix = extractSuffix(weId);
      const slug = createSlug(title);
      const folderName = `${weId}_${slug}`;
      
      const workEffortsDir = path.join(repo_path, '_work_efforts_');
      const weDir = path.join(workEffortsDir, folderName);
      const ticketsDir = path.join(weDir, 'tickets');
      
      // Create directories
      await fs.mkdir(ticketsDir, { recursive: true });
      
      // Create index file
      const indexContent = generateWorkEffortTemplate(weId, title, objective, repository, tickets);
      const indexPath = path.join(weDir, `${weId}_index.md`);
      await fs.writeFile(indexPath, indexContent);
      
      // Create initial tickets if provided
      for (let i = 0; i < tickets.length; i++) {
        const ticketNum = String(i + 1).padStart(3, '0');
        const ticketId = `TKT-${suffix}-${ticketNum}`;
        const ticketSlug = createSlug(tickets[i]);
        const ticketFilename = `${ticketId}_${ticketSlug}.md`;
        const ticketContent = generateTicketTemplate(ticketId, weId, tickets[i]);
        await fs.writeFile(path.join(ticketsDir, ticketFilename), ticketContent);
      }
      
      return {
        content: [{
          type: 'text',
          text: `✅ Created Work Effort: ${weId}
📁 Path: ${weDir}
📝 Title: ${title}
🎫 Tickets: ${tickets.length} created
🌿 Branch: feature/${weId}-${slug}`
        }]
      };
    }

    // ========================================================================
    // CREATE TICKET
    // ========================================================================
    if (name === 'create_ticket') {
      const { work_effort_path, title, description, acceptance_criteria = [] } = args;
      
      // Extract WE ID from path
      const weDirName = path.basename(work_effort_path);
      const weIdMatch = weDirName.match(/^(WE-\d{6}-\w{4})/);
      if (!weIdMatch) {
        throw new Error('Invalid work effort path - cannot extract WE ID');
      }
      const weId = weIdMatch[1];
      const suffix = extractSuffix(weId);
      
      const ticketsDir = path.join(work_effort_path, 'tickets');
      await fs.mkdir(ticketsDir, { recursive: true });
      
      const nextNum = await getNextTicketNumber(ticketsDir);
      const ticketNum = String(nextNum).padStart(3, '0');
      const ticketId = `TKT-${suffix}-${ticketNum}`;
      const ticketSlug = createSlug(title);
      const ticketFilename = `${ticketId}_${ticketSlug}.md`;
      
      const ticketContent = generateTicketTemplate(ticketId, weId, title, description, acceptance_criteria);
      const ticketPath = path.join(ticketsDir, ticketFilename);
      await fs.writeFile(ticketPath, ticketContent);
      
      return {
        content: [{
          type: 'text',
          text: `✅ Created Ticket: ${ticketId}
📁 Path: ${ticketPath}
📝 Title: ${title}
🔗 Parent: ${weId}`
        }]
      };
    }

    // ========================================================================
    // LIST WORK EFFORTS
    // ========================================================================
    if (name === 'list_work_efforts') {
      const { repo_path, status = 'all' } = args;
      const workEffortsDir = path.join(repo_path, '_work_efforts_');
      
      const results = [];
      
      try {
        const entries = await fs.readdir(workEffortsDir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          if (!entry.name.match(/^WE-\d{6}-\w{4}/)) continue;
          
          const weDir = path.join(workEffortsDir, entry.name);
          const indexFiles = (await fs.readdir(weDir)).filter(f => f.endsWith('_index.md'));
          
          if (indexFiles.length === 0) continue;
          
          const indexPath = path.join(weDir, indexFiles[0]);
          const content = await fs.readFile(indexPath, 'utf-8');
          
          const idMatch = content.match(/^id:\s*(.+)$/m);
          const titleMatch = content.match(/^title:\s*"(.+)"/m);
          const statusMatch = content.match(/^status:\s*(\w+)/m);
          
          const weStatus = statusMatch?.[1] || 'unknown';
          if (status !== 'all' && weStatus !== status) continue;
          
          // Count tickets
          const ticketsDir = path.join(weDir, 'tickets');
          let ticketCount = 0;
          try {
            const tickets = await fs.readdir(ticketsDir);
            ticketCount = tickets.filter(t => t.endsWith('.md')).length;
          } catch {}
          
          results.push(`• ${idMatch?.[1] || entry.name} - ${titleMatch?.[1] || 'Untitled'} [${weStatus}] (${ticketCount} tickets)`);
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          return { content: [{ type: 'text', text: 'No _work_efforts_ directory found' }] };
        }
        throw err;
      }
      
      return {
        content: [{
          type: 'text',
          text: results.length > 0 ? results.join('\n') : 'No work efforts found'
        }]
      };
    }

    // ========================================================================
    // LIST TICKETS
    // ========================================================================
    if (name === 'list_tickets') {
      const { work_effort_path, status = 'all' } = args;
      const ticketsDir = path.join(work_effort_path, 'tickets');
      
      const results = [];
      
      try {
        const files = await fs.readdir(ticketsDir);
        
        for (const file of files) {
          if (!file.endsWith('.md')) continue;
          
          const ticketPath = path.join(ticketsDir, file);
          const content = await fs.readFile(ticketPath, 'utf-8');
          
          const idMatch = content.match(/^id:\s*(.+)$/m);
          const titleMatch = content.match(/^title:\s*"(.+)"/m);
          const statusMatch = content.match(/^status:\s*(\w+)/m);
          
          const ticketStatus = statusMatch?.[1] || 'unknown';
          if (status !== 'all' && ticketStatus !== status) continue;
          
          results.push(`• ${idMatch?.[1] || file} - ${titleMatch?.[1] || 'Untitled'} [${ticketStatus}]`);
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          return { content: [{ type: 'text', text: 'No tickets directory found' }] };
        }
        throw err;
      }
      
      return {
        content: [{
          type: 'text',
          text: results.length > 0 ? results.join('\n') : 'No tickets found'
        }]
      };
    }

    // ========================================================================
    // UPDATE WORK EFFORT
    // ========================================================================
    if (name === 'update_work_effort') {
      const { work_effort_path, status, progress, commit } = args;
      
      // Find index file
      const files = await fs.readdir(work_effort_path);
      const indexFile = files.find(f => f.endsWith('_index.md'));
      if (!indexFile) throw new Error('No index file found in work effort');
      
      const indexPath = path.join(work_effort_path, indexFile);
      let content = await fs.readFile(indexPath, 'utf-8');
      
      // Update status
      if (status) {
        content = content.replace(/^status:\s*\w+/m, `status: ${status}`);
      }
      
      // Update last_updated
      content = content.replace(/^last_updated:\s*.+$/m, `last_updated: ${getTimestamp()}`);
      
      // Add progress note
      if (progress) {
        const date = new Date().toLocaleDateString();
        content = content.replace(
          /(## Commits\n)/,
          `## Progress\n- ${date}: ${progress}\n\n$1`
        );
      }
      
      // Add commit
      if (commit) {
        content = content.replace(
          /(## Commits\n)/,
          `$1- \`${commit}\`\n`
        );
      }
      
      await fs.writeFile(indexPath, content);
      
      return {
        content: [{
          type: 'text',
          text: `✅ Updated: ${path.basename(work_effort_path)}`
        }]
      };
    }

    // ========================================================================
    // UPDATE TICKET
    // ========================================================================
    if (name === 'update_ticket') {
      const { ticket_path, status, files_changed, notes, commit } = args;
      
      let content = await fs.readFile(ticket_path, 'utf-8');
      
      // Update status
      if (status) {
        content = content.replace(/^status:\s*\w+/m, `status: ${status}`);
      }
      
      // Add files changed
      if (files_changed && files_changed.length > 0) {
        const filesSection = files_changed.map(f => `- \`${f}\``).join('\n');
        content = content.replace(
          /## Files Changed\n[^#]*/,
          `## Files Changed\n${filesSection}\n\n`
        );
      }
      
      // Add notes
      if (notes) {
        const date = new Date().toLocaleDateString();
        content = content.replace(
          /(## Implementation Notes\n)/,
          `$1- ${date}: ${notes}\n`
        );
      }
      
      // Add commit
      if (commit) {
        content = content.replace(
          /(## Commits\n)/,
          `$1- \`${commit}\`\n`
        );
      }
      
      await fs.writeFile(ticket_path, content);
      
      return {
        content: [{
          type: 'text',
          text: `✅ Updated: ${path.basename(ticket_path)}`
        }]
      };
    }

    // ========================================================================
    // SEARCH WORK EFFORTS
    // ========================================================================
    if (name === 'search_work_efforts') {
      const { repo_path, query, include_tickets = true } = args;
      const workEffortsDir = path.join(repo_path, '_work_efforts_');
      const searchQuery = query.toLowerCase();
      
      const results = [];
      
      try {
        const entries = await fs.readdir(workEffortsDir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          if (!entry.name.match(/^WE-\d{6}-\w{4}/)) continue;
          
          const weDir = path.join(workEffortsDir, entry.name);
          const indexFiles = (await fs.readdir(weDir)).filter(f => f.endsWith('_index.md'));
          
          if (indexFiles.length === 0) continue;
          
          const indexPath = path.join(weDir, indexFiles[0]);
          const content = await fs.readFile(indexPath, 'utf-8');
          
          // Search in WE content
          if (content.toLowerCase().includes(searchQuery)) {
            const idMatch = content.match(/^id:\s*(.+)$/m);
            const titleMatch = content.match(/^title:\s*"(.+)"/m);
            const statusMatch = content.match(/^status:\s*(\w+)/m);
            results.push(`📁 ${idMatch?.[1]} - ${titleMatch?.[1]} [${statusMatch?.[1]}]\n   Path: ${weDir}`);
          }
          
          // Search in tickets
          if (include_tickets) {
            const ticketsDir = path.join(weDir, 'tickets');
            try {
              const tickets = await fs.readdir(ticketsDir);
              for (const ticket of tickets) {
                if (!ticket.endsWith('.md')) continue;
                const ticketPath = path.join(ticketsDir, ticket);
                const ticketContent = await fs.readFile(ticketPath, 'utf-8');
                
                if (ticketContent.toLowerCase().includes(searchQuery)) {
                  const idMatch = ticketContent.match(/^id:\s*(.+)$/m);
                  const titleMatch = ticketContent.match(/^title:\s*"(.+)"/m);
                  const statusMatch = ticketContent.match(/^status:\s*(\w+)/m);
                  results.push(`🎫 ${idMatch?.[1]} - ${titleMatch?.[1]} [${statusMatch?.[1]}]\n   Path: ${ticketPath}`);
                }
              }
            } catch {}
          }
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          return { content: [{ type: 'text', text: 'No _work_efforts_ directory found' }] };
        }
        throw err;
      }
      
      return {
        content: [{
          type: 'text',
          text: results.length > 0 
            ? `Found ${results.length} result(s) for "${query}":\n\n${results.join('\n\n')}`
            : `No results found for "${query}"`
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
// Run Server
// ============================================================================

const transport = new StdioServerTransport();
await server.connect(transport);
