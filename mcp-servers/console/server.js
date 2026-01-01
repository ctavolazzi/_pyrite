#!/usr/bin/env node
/**
 * @fileoverview Pyrite Console - Direct Drive Chat Interface
 * Simple, fast, useful chat with your work efforts
 */

import express from 'express';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tools } from './lib/tools.js';
import chalk from 'chalk';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss'
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// System prompt for the AI
const SYSTEM_PROMPT = `You are Pyrite Console, an AI assistant for managing work efforts in the _pyrite repository.

You have direct access to the file system through tools. You can:
- List work efforts and tickets
- Create new tickets
- Update ticket status
- Search across all work

File Structure:
- Work efforts are in MCP v0.3.0 format: WE-YYMMDD-xxxx
- Tickets are in format: TKT-xxxx-NNN
- All stored as markdown files with YAML frontmatter

Be concise, helpful, and action-oriented. When users ask you to do something, use your tools to actually do it.`;

/**
 * Main chat endpoint
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    logger.info(`Chat request: ${messages[messages.length - 1].content.slice(0, 50)}...`);

    // Create AI SDK stream
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022', { apiKey }),
      system: SYSTEM_PROMPT,
      messages,
      tools,
      maxSteps: 5, // Allow multi-step tool usage
    });

    // Stream response back to client
    result.pipeDataStreamToResponse(res);

  } catch (error) {
    logger.error({ error }, 'Chat error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'pyrite-console' });
});

/**
 * Get basic repo stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const { listWorkEfforts } = await import('./lib/file-ops.js');
    const workEfforts = await listWorkEfforts();

    const stats = {
      totalWorkEfforts: workEfforts.length,
      totalTickets: workEfforts.reduce((sum, we) => sum + we.ticketCount, 0),
      byStatus: {}
    };

    workEfforts.forEach(we => {
      stats.byStatus[we.status] = (stats.byStatus[we.status] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    logger.error({ error }, 'Stats error');
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.cyan(`
╔════════════════════════════════════════╗
║                                        ║
║        🔮 PYRITE CONSOLE 🔮            ║
║                                        ║
║  Direct Drive Chat Interface           ║
║  http://localhost:${PORT}                  ║
║                                        ║
╚════════════════════════════════════════╝
  `));
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
