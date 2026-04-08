import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hentMeldekortDataFraDP } from '../../clients/dagpenger';
import type { MeldekortData } from '../../../types/meldekort';

// Mock helpers
vi.mock('../../helpers', () => ({
  hentMeldekortData: vi.fn(),
  validerMeldekortData: vi.fn((_data): _data is MeldekortData => true),
}));

describe('dagpenger', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalProcessEnv,
      DP_API_URL: 'https://dp-test.nav.no',
      DP_API_AUDIENCE: 'test:dp:api',
    };
  });

  describe('hentMeldekortDataFraDP', () => {
    it('should call hentMeldekortData with correct config', async () => {
      const { hentMeldekortData } = await import('../../helpers');
      const mockData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://dp.nav.no',
      };

      vi.mocked(hentMeldekortData).mockResolvedValue(mockData);

      const result = await hentMeldekortDataFraDP('test-token');

      expect(hentMeldekortData).toHaveBeenCalledWith('test-token', {
        apiUrl: 'https://dp-test.nav.no',
        audience: 'test:dp:api',
        path: '/meldekortstatus',
        serviceName: 'DP',
        validator: expect.any(Function),
      });
      expect(result).toEqual(mockData);
    });

    it('should return undefined when no data is available', async () => {
      const { hentMeldekortData } = await import('../../helpers');

      vi.mocked(hentMeldekortData).mockResolvedValue(undefined);

      const result = await hentMeldekortDataFraDP('test-token');

      expect(result).toBeUndefined();
    });
  });
});
