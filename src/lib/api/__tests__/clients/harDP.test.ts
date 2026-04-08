import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hentHarDP } from '../../clients/harDP';
import type { requestTokenxOboToken } from '@navikt/oasis';

type TokenResult = Awaited<ReturnType<typeof requestTokenxOboToken>>;

// Mock @navikt/oasis
vi.mock('@navikt/oasis', () => ({
  requestTokenxOboToken: vi.fn(),
}));

// Mock helpers
vi.mock('../../helpers', () => ({
  shouldUseMockData: vi.fn(),
  fetchWithTimeout: vi.fn((url, options) => global.fetch(url, options)),
}));

// Mock logger
vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('harDP', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env = { ...originalProcessEnv };
  });

  describe('hentHarDP', () => {
    it('should return false when using mock data', async () => {
      const { shouldUseMockData } = await import('../../helpers');
      vi.mocked(shouldUseMockData).mockReturnValue(true);

      const result = await hentHarDP('token');

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false when API config is missing', async () => {
      const { shouldUseMockData } = await import('../../helpers');
      vi.mocked(shouldUseMockData).mockReturnValue(false);

      process.env.MELDEKORT_API_URL = undefined;
      process.env.MELDEKORT_API_AUDIENCE = undefined;

      const result = await hentHarDP('token');

      expect(result).toBe(false);
    });

    it('should return false when token exchange fails', async () => {
      const { shouldUseMockData } = await import('../../helpers');
      const { requestTokenxOboToken } = await import('@navikt/oasis');

      vi.mocked(shouldUseMockData).mockReturnValue(false);
      process.env.MELDEKORT_API_URL = 'https://test.nav.no';
      process.env.MELDEKORT_API_AUDIENCE = 'test:audience';

      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: false,
        error: { message: 'Token exchange failed' },
      } as TokenResult);

      const result = await hentHarDP('token');

      expect(result).toBe(false);
    });

    it('should return false when API returns non-ok status', async () => {
      const { shouldUseMockData } = await import('../../helpers');
      const { requestTokenxOboToken } = await import('@navikt/oasis');

      vi.mocked(shouldUseMockData).mockReturnValue(false);
      process.env.MELDEKORT_API_URL = 'https://test.nav.no';
      process.env.MELDEKORT_API_AUDIENCE = 'test:audience';

      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'obo-token',
      } as TokenResult);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await hentHarDP('token');

      expect(result).toBe(false);
    });

    it('should return true when API returns ok status', async () => {
      const { shouldUseMockData } = await import('../../helpers');
      const { requestTokenxOboToken } = await import('@navikt/oasis');

      vi.mocked(shouldUseMockData).mockReturnValue(false);
      process.env.MELDEKORT_API_URL = 'https://test.nav.no';
      process.env.MELDEKORT_API_AUDIENCE = 'test:audience';

      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'obo-token',
      } as TokenResult);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
      } as Response);

      const result = await hentHarDP('token');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.nav.no/harDP',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer obo-token',
          }),
        }),
      );
    });

    it('should return false when fetch throws error', async () => {
      const { shouldUseMockData } = await import('../../helpers');
      const { requestTokenxOboToken } = await import('@navikt/oasis');

      vi.mocked(shouldUseMockData).mockReturnValue(false);
      process.env.MELDEKORT_API_URL = 'https://test.nav.no';
      process.env.MELDEKORT_API_AUDIENCE = 'test:audience';

      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'obo-token',
      } as TokenResult);

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const result = await hentHarDP('token');

      expect(result).toBe(false);
    });
  });
});
