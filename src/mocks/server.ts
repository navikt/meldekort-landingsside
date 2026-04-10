import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW-server for Node.js (testmiljø)
 *
 * Setter opp en mock-server som fanger opp HTTP-forespørsler i tester.
 */
export const server = setupServer(...handlers);
