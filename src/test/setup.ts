import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server';

/**
 * Test Setup for Vitest
 *
 * Starter MSW server før alle tester og stopper den etter.
 */

// Start MSW server før alle tester
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers etter hver test
afterEach(() => {
  server.resetHandlers();
});

// Stopp MSW server etter alle tester
afterAll(() => {
  server.close();
});
