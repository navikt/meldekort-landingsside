import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hentMeldekortDataFraAAP } from '../../clients/arbeidsavklaringspenger';
import type { MeldekortData } from '../../../types/meldekort';

// Mock helpers
vi.mock('../../helpers', () => ({
  hentMeldekortData: vi.fn(),
  validerMeldekortData: vi.fn((_data): _data is MeldekortData => true),
}));

describe('arbeidsavklaringspenger', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalProcessEnv,
      AAP_API_URL: 'https://aap-test.nav.no',
      AAP_API_AUDIENCE: 'test:aap:api',
    };
  });

  describe('hentMeldekortDataFraAAP', () => {
    it('should call hentMeldekortData with correct config', async () => {
      const { hentMeldekortData } = await import('../../helpers');
      const mockData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://aap.nav.no',
      };

      vi.mocked(hentMeldekortData).mockResolvedValue(mockData);

      const result = await hentMeldekortDataFraAAP('test-token');

      expect(hentMeldekortData).toHaveBeenCalledWith('test-token', {
        apiUrl: 'https://aap-test.nav.no',
        audience: 'test:aap:api',
        path: '/api/meldekort-status',
        serviceName: 'AAP',
        validator: expect.any(Function),
      });
      expect(result).toEqual(mockData);
    });

    it('should return undefined when no data is available', async () => {
      const { hentMeldekortData } = await import('../../helpers');

      vi.mocked(hentMeldekortData).mockResolvedValue(undefined);

      const result = await hentMeldekortDataFraAAP('test-token');

      expect(result).toBeUndefined();
    });
  });
});
