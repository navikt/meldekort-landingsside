import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server for Node.js (Test Environment)
 *
 * Dette setter opp en mock server som intercepter HTTP requests i tester.
 */
export const server = setupServer(...handlers);
