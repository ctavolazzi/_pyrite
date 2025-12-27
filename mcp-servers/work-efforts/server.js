#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

const server = new Server(
  { name: 'work-efforts', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

// Get next available number in a subcategory
async function getNextNumber(subcategoryDir) {
  try {
    const files = await fs.readdir(subcategoryDir);
    const numbers = files
      .filter(f => f.match(/^\d+\.\d+/))
      .map(f => parseInt(f.match(/^\d+\.(\d+)/)?.[1] || '0'))
      .filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch {
    return 1;
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_work_effort',
      description: 'Create a new work effort with Johnny Decimal numbering',
      inputSchema: {
        type: 'object',
        properties: {
          repo_path: { type: 'string', description: 'Repository path' },
          title: { type: 'string', description: 'Work effort title' },
          category: { type: 'string', description: 'Category like "00-09"' },
          subcategory: { type: 'string', description: 'Subcategory like "00"' },
          objective: { type: 'string', description: 'What needs to be done' },
          tasks: { type: 'array', items: { type: 'string' }, description: 'Task list' }
        },
        required: ['repo_path', 'title', 'category', 'subcategory', 'objective']
      }
    },
    {
      name: 'list_work_efforts',
      description: 'List all work efforts in a repo',
      inputSchema: {
        type: 'object',
        properties: {
          repo_path: { type: 'string', description: 'Repository path' },
          status: { type: 'string', enum: ['active', 'paused', 'completed', 'all'], default: 'all' }
        },
        required: ['repo_path']
      }
    },
    {
      name: 'update_work_effort',
      description: 'Update status or add progress to a work effort',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Full path to work effort file' },
          status: { type: 'string', enum: ['active', 'paused', 'completed'] },
          progress: { type: 'string', description: 'Progress note to add' }
        },
        required: ['file_path']
      }
    },
    {
      name: 'search_work_efforts',
      description: 'Search work efforts by keyword in title or content',
      inputSchema: {
        type: 'object',
        properties: {
          repo_path: { type: 'string', description: 'Repository path' },
          query: { type: 'string', description: 'Search keyword' },
          case_sensitive: { type: 'boolean', description: 'Case sensitive search', default: false }
        },
        required: ['repo_path', 'query']
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'create_work_effort') {
      const { repo_path, title, category, subcategory, objective, tasks = [] } = args;

      const categoryDir = path.join(repo_path, '_work_efforts', `${category}_category`);
      const subcategoryDir = path.join(categoryDir, `${subcategory}_subcategory`);
      await fs.mkdir(subcategoryDir, { recursive: true });

      const nextNum = await getNextNumber(subcategoryDir);
      const docId = `${subcategory}.${String(nextNum).padStart(2, '0')}`;

      const timestamp = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filename = `${docId}_${timestamp}_${slug}.md`;
      const filepath = path.join(subcategoryDir, filename);

      const now = new Date().toISOString();
      const taskList = tasks.map(t => `- [ ] ${t}`).join('\n') || '- [ ] Define tasks';

      const content = `---
title: "${title}"
status: "active"
created: "${now}"
last_updated: "${now}"
---

# Work Effort: ${title}

## Objective
${objective}

## Tasks
${taskList}

## Progress
- Created ${new Date().toLocaleDateString()}

## Next Steps
1. Review and begin work
`;

      await fs.writeFile(filepath, content);

      return {
        content: [{
          type: 'text',
          text: `✅ Created: ${docId} - ${title}\nPath: ${filepath}`
        }]
      };
    }

    if (name === 'list_work_efforts') {
      const { repo_path, status = 'all' } = args;
      const workEffortsDir = path.join(repo_path, '_work_efforts');

      const results = [];
      const categories = await fs.readdir(workEffortsDir).catch(() => []);

      for (const cat of categories) {
        const catPath = path.join(workEffortsDir, cat);
        if (!(await fs.stat(catPath)).isDirectory()) continue;

        const subcats = await fs.readdir(catPath);
        for (const sub of subcats) {
          const subPath = path.join(catPath, sub);
          if (!(await fs.stat(subPath)).isDirectory()) continue;

          const files = await fs.readdir(subPath);
          for (const file of files) {
            if (!file.endsWith('.md') || file.includes('index')) continue;

            const content = await fs.readFile(path.join(subPath, file), 'utf-8');
            const titleMatch = content.match(/^title:\s*"(.+)"/m);
            const statusMatch = content.match(/^status:\s*"(.+)"/m);

            const effortStatus = statusMatch?.[1] || 'unknown';
            if (status !== 'all' && effortStatus !== status) continue;

            const id = file.match(/^\d+\.\d+/)?.[0];
            results.push(`• ${id} - ${titleMatch?.[1]} [${effortStatus}]`);
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: results.length > 0 ? results.join('\n') : 'No work efforts found'
        }]
      };
    }

    if (name === 'update_work_effort') {
      const { file_path, status, progress } = args;
      let content = await fs.readFile(file_path, 'utf-8');

      if (status) {
        content = content.replace(/^status:\s*".*"/m, `status: "${status}"`);
      }

      if (progress) {
        const date = new Date().toLocaleDateString();
        const progressLine = `- ${date}: ${progress}`;
        content = content.replace(/(## Progress\n)/, `$1${progressLine}\n`);
      }

      const now = new Date().toISOString();
      content = content.replace(/^last_updated:\s*".*"/m, `last_updated: "${now}"`);

      await fs.writeFile(file_path, content);

      return {
        content: [{
          type: 'text',
          text: `✅ Updated: ${path.basename(file_path)}`
        }]
      };
    }

    if (name === 'search_work_efforts') {
      const { repo_path, query, case_sensitive = false } = args;
      const workEffortsDir = path.join(repo_path, '_work_efforts');
      const searchQuery = case_sensitive ? query : query.toLowerCase();

      const results = [];
      const categories = await fs.readdir(workEffortsDir).catch(() => []);

      for (const cat of categories) {
        const catPath = path.join(workEffortsDir, cat);
        if (!(await fs.stat(catPath)).isDirectory()) continue;

        const subcats = await fs.readdir(catPath);
        for (const sub of subcats) {
          const subPath = path.join(catPath, sub);
          if (!(await fs.stat(subPath)).isDirectory()) continue;

          const files = await fs.readdir(subPath);
          for (const file of files) {
            if (!file.endsWith('.md') || file.includes('index')) continue;

            const filePath = path.join(subPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const searchContent = case_sensitive ? content : content.toLowerCase();

            if (searchContent.includes(searchQuery)) {
              const titleMatch = content.match(/^title:\s*"(.+)"/m);
              const statusMatch = content.match(/^status:\s*"(.+)"/m);
              const id = file.match(/^\d+\.\d+/)?.[0];
              results.push(`• ${id} - ${titleMatch?.[1]} [${statusMatch?.[1] || 'unknown'}]\n  Path: ${filePath}`);
            }
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: results.length > 0 
            ? `Found ${results.length} result(s) for "${query}":\n\n${results.join('\n\n')}`
            : `No work efforts found matching "${query}"`
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

// Run server
const transport = new StdioServerTransport();
await server.connect(transport);
