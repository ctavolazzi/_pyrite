#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'simple-tools', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

// Random name generator
const ADJECTIVES = ['Happy', 'Clever', 'Swift', 'Bright', 'Bold', 'Calm', 'Wise', 'Cool'];
const NOUNS = ['Panda', 'Eagle', 'Tiger', 'Dolphin', 'Wolf', 'Falcon', 'Lion', 'Bear'];

function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(dateInput, format) {
  const date = dateInput === 'now' || !dateInput ? new Date() : new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateInput}`);
  }

  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'human':
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'filename':
      return date.toISOString().slice(0, 10);
    case 'devlog':
      return `${date.toISOString().slice(0, 10)}_devlog.md`;
    default:
      return date.toISOString();
  }
}

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'generate_random_name',
      description: 'Generate a random name like "HappyPanda123"',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'generate_unique_id',
      description: 'Generate a unique ID with timestamp',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'format_date',
      description: 'Format dates consistently (ISO, human-readable, filename-safe, devlog)',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to format (or "now" for current date)' },
          format: { 
            type: 'string', 
            enum: ['iso', 'human', 'filename', 'devlog'],
            description: 'Output format: iso (full ISO), human (readable), filename (YYYY-MM-DD), devlog (YYYY-MM-DD_devlog.md)',
            default: 'iso'
          }
        },
        required: []
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'generate_random_name') {
    const randomName = generateRandomName();
    return {
      content: [{
        type: 'text',
        text: `🎲 Random Name: ${randomName}`
      }]
    };
  }

  if (name === 'generate_unique_id') {
    const uniqueId = generateUniqueId();
    return {
      content: [{
        type: 'text',
        text: `🆔 Unique ID: ${uniqueId}`
      }]
    };
  }

  if (name === 'format_date') {
    try {
      const { date = 'now', format = 'iso' } = args || {};
      const formatted = formatDate(date, format);
      return {
        content: [{
          type: 'text',
          text: `📅 Formatted Date (${format}): ${formatted}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  return {
    content: [{
      type: 'text',
      text: `Unknown tool: ${name}`
    }],
    isError: true
  };
});

// Run
const transport = new StdioServerTransport();
await server.connect(transport);
