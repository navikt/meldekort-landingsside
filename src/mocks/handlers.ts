import type { RequestHandler } from 'msw';

/**
 * MSW Request Handlers
 *
 * Definer mock API responses her.
 * Disse brukes i tester for å simulere API-kall.
 *
 * Eksempel:
 * export const handlers: RequestHandler[] = [
 *   http.get('/api/endpoint', () => {
 *     return HttpResponse.json({ data: 'mock response' });
 *   }),
 * ];
 */

export const handlers: RequestHandler[] = [];
