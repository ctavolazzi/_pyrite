/**
 * @fileoverview Test Fixture Generators
 *
 * Reusable functions to generate test data for work efforts, tickets, and repositories.
 * These fixtures match the actual data structures used by the parser and server.
 *
 * @example
 * ```javascript
 * import { createWorkEffortFixture, createTicketFixture } from './helpers/fixtures.js';
 *
 * const we = createWorkEffortFixture('WE-260102-test', 'Test Work', 'active');
 * const ticket = createTicketFixture('TKT-test-001', 'Test Ticket', 'pending');
 * ```
 */

/**
 * Create a work effort fixture object
 *
 * @param {string} id - Work effort ID (e.g., 'WE-260102-test')
 * @param {string} title - Work effort title
 * @param {string} status - Status ('active', 'paused', 'completed')
 * @param {Object} [options] - Additional options
 * @param {Array} [options.tickets] - Array of ticket objects
 * @param {string} [options.created] - ISO date string
 * @param {string} [options.format] - Format type ('mcp' or 'jd')
 * @returns {Object} Work effort object
 */
export function createWorkEffortFixture(id, title, status, options = {}) {
  const {
    tickets = [],
    created = new Date().toISOString(),
    format = 'mcp',
    branch = `feature/${id}-slug`,
    repository = '_pyrite'
  } = options;

  return {
    id,
    title,
    status,
    format,
    created,
    branch,
    repository,
    tickets,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Create a ticket fixture object
 *
 * @param {string} id - Ticket ID (e.g., 'TKT-test-001')
 * @param {string} title - Ticket title
 * @param {string} status - Status ('pending', 'in_progress', 'completed', 'blocked')
 * @param {Object} [options] - Additional options
 * @param {string} [options.workEffortId] - Parent work effort ID
 * @param {string} [options.created] - ISO date string
 * @returns {Object} Ticket object
 */
export function createTicketFixture(id, title, status, options = {}) {
  const {
    workEffortId = null,
    created = new Date().toISOString()
  } = options;

  return {
    id,
    title,
    status,
    workEffortId,
    created,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Create a repository stats fixture
 *
 * @param {Object} [options] - Stats options
 * @param {number} [options.totalWorkEfforts] - Total work efforts
 * @param {number} [options.activeWorkEfforts] - Active work efforts
 * @param {number} [options.totalTickets] - Total tickets
 * @param {number} [options.completedTickets] - Completed tickets
 * @returns {Object} Repository stats object
 */
export function createRepoStatsFixture(options = {}) {
  const {
    totalWorkEfforts = 0,
    activeWorkEfforts = 0,
    totalTickets = 0,
    completedTickets = 0
  } = options;

  return {
    totalWorkEfforts,
    activeWorkEfforts,
    totalTickets,
    completedTickets,
    pendingTickets: totalTickets - completedTickets
  };
}

/**
 * Create a complete repository state fixture
 *
 * @param {string} repoName - Repository name
 * @param {Array} workEfforts - Array of work effort objects
 * @param {Object} [options] - Additional options
 * @param {Object} [options.stats] - Repository stats (auto-calculated if not provided)
 * @param {string} [options.error] - Error message
 * @returns {Object} Repository state object
 */
export function createRepoStateFixture(repoName, workEfforts = [], options = {}) {
  const { stats, error = null } = options;

  // Auto-calculate stats if not provided
  const calculatedStats = stats || {
    totalWorkEfforts: workEfforts.length,
    activeWorkEfforts: workEfforts.filter(we => we.status === 'active').length,
    totalTickets: workEfforts.reduce((sum, we) => sum + (we.tickets?.length || 0), 0),
    completedTickets: workEfforts.reduce((sum, we) => {
      return sum + (we.tickets?.filter(t => t.status === 'completed').length || 0);
    }, 0)
  };

  return {
    workEfforts,
    stats: calculatedStats,
    error,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Create a WebSocket message fixture
 *
 * @param {string} type - Message type ('init', 'update', 'repo_change', 'error')
 * @param {Object} payload - Message payload
 * @returns {Object} WebSocket message object
 */
export function createWebSocketMessageFixture(type, payload) {
  return {
    type,
    ...payload,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an init message fixture
 *
 * @param {Object} repos - Repository states object
 * @returns {Object} Init message
 */
export function createInitMessageFixture(repos) {
  return createWebSocketMessageFixture('init', { repos });
}

/**
 * Create an update message fixture
 *
 * @param {string} repo - Repository name
 * @param {Array} workEfforts - Work efforts array
 * @param {Object} stats - Repository stats
 * @returns {Object} Update message
 */
export function createUpdateMessageFixture(repo, workEfforts, stats) {
  return createWebSocketMessageFixture('update', {
    repo,
    workEfforts,
    stats
  });
}

/**
 * Create a test scenario with multiple work efforts and tickets
 *
 * @param {Object} [options] - Scenario options
 * @param {number} [options.workEffortCount] - Number of work efforts
 * @param {number} [options.ticketsPerWE] - Tickets per work effort
 * @returns {Object} Scenario object with repos, workEfforts, stats
 */
export function createTestScenario(options = {}) {
  const {
    workEffortCount = 3,
    ticketsPerWE = 2,
    repoName = '_pyrite'
  } = options;

  const workEfforts = [];

  for (let i = 0; i < workEffortCount; i++) {
    const weId = `WE-260102-test${String(i + 1).padStart(2, '0')}`;
    const tickets = [];

    for (let j = 0; j < ticketsPerWE; j++) {
      const ticketId = `TKT-test${String(i + 1).padStart(2, '0')}-${String(j + 1).padStart(3, '0')}`;
      tickets.push(createTicketFixture(
        ticketId,
        `Ticket ${j + 1} for WE ${i + 1}`,
        j === 0 ? 'completed' : 'pending',
        { workEffortId: weId }
      ));
    }

    workEfforts.push(createWorkEffortFixture(
      weId,
      `Test Work Effort ${i + 1}`,
      i === 0 ? 'active' : 'paused',
      { tickets }
    ));
  }

  const stats = createRepoStatsFixture({
    totalWorkEfforts: workEfforts.length,
    activeWorkEfforts: workEfforts.filter(we => we.status === 'active').length,
    totalTickets: workEfforts.reduce((sum, we) => sum + (we.tickets?.length || 0), 0),
    completedTickets: workEfforts.reduce((sum, we) => {
      return sum + (we.tickets?.filter(t => t.status === 'completed').length || 0);
    }, 0)
  });

  const repos = {
    [repoName]: createRepoStateFixture(repoName, workEfforts, { stats })
  };

  return {
    repos,
    workEfforts,
    stats,
    initMessage: createInitMessageFixture(repos)
  };
}

