/**
 * @fileoverview AI SDK tools for work effort management
 * Simple, useful tools that actually work
 */

import { z } from 'zod';
import {
  listWorkEfforts,
  getWorkEffortDetails,
  createTicket,
  updateTicketStatus,
  searchWorkEfforts
} from './file-ops.js';

/**
 * AI SDK tool definitions
 * Each tool is a function the LLM can call
 */
export const tools = {
  /**
   * List all work efforts with basic info
   */
  list_work_efforts: {
    description: 'List all work efforts in the repository with summary stats',
    parameters: z.object({}),
    execute: async () => {
      const workEfforts = await listWorkEfforts();
      return {
        count: workEfforts.length,
        workEfforts: workEfforts.map(we => ({
          id: we.id,
          title: we.title,
          status: we.status,
          tickets: we.ticketCount,
          branch: we.branch || 'none'
        }))
      };
    }
  },

  /**
   * Get detailed info about a specific work effort
   */
  get_work_effort: {
    description: 'Get detailed information about a specific work effort including all tickets',
    parameters: z.object({
      workEffortId: z.string().describe('Work effort ID (e.g., WE-251227-1gku)')
    }),
    execute: async ({ workEffortId }) => {
      const details = await getWorkEffortDetails(workEffortId);
      return {
        id: details.id,
        title: details.title,
        status: details.status,
        created: details.created,
        branch: details.branch,
        tickets: details.tickets.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status
        }))
      };
    }
  },

  /**
   * Create a new ticket
   */
  create_ticket: {
    description: 'Create a new ticket in a work effort',
    parameters: z.object({
      workEffortId: z.string().describe('Parent work effort ID'),
      title: z.string().describe('Ticket title'),
      description: z.string().optional().describe('Ticket description (markdown)'),
      status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending')
    }),
    execute: async ({ workEffortId, title, description = '', status = 'pending' }) => {
      const ticket = await createTicket(workEffortId, title, description, status);
      return {
        success: true,
        ticket: {
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          parent: ticket.parent
        }
      };
    }
  },

  /**
   * Update ticket status
   */
  update_ticket_status: {
    description: 'Update the status of an existing ticket',
    parameters: z.object({
      ticketId: z.string().describe('Ticket ID (e.g., TKT-1gku-001)'),
      status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    }),
    execute: async ({ ticketId, status }) => {
      const result = await updateTicketStatus(ticketId, status);
      return result;
    }
  },

  /**
   * Search work efforts and tickets
   */
  search: {
    description: 'Search work efforts and tickets by keyword',
    parameters: z.object({
      query: z.string().describe('Search query')
    }),
    execute: async ({ query }) => {
      const results = await searchWorkEfforts(query);
      return {
        count: results.length,
        results: results.map(r => ({
          type: r.type,
          id: r.id,
          title: r.title,
          status: r.status,
          parent: r.parent || null
        }))
      };
    }
  }
};
