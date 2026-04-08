import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hentMeldekortDataFraTTL } from '../../clients/tiltakspenger';
import type { MeldekortData } from '../../../types/meldekort';

// Mock helpers
vi.mock('../../helpers', () => ({
  hentMeldekortData: vi.fn(),
  validerMeldekortData: vi.fn((_data): _data is MeldekortData => true),
}));

describe('tiltakspenger', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalProcessEnv,
      TILTAKSPENGER_API_URL: 'https://ttl-test.nav.no',
      TILTAKSPENGER_API_AUDIENCE: 'test:ttl:api',
    };
  });

  describe('hentMeldekortDataFraTTL', () => {
    it('should call hentMeldekortData with correct config', async () => {
      const { hentMeldekortData } = await import('../../helpers');
      const mockData: MeldekortData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2024-01-01T00:00:00',
            kanFyllesUtFra: '2024-01-01T00:00:00',
            fristForInnsending: '2024-01-14T00:00:00',
          },
        ],
        redirectUrl: 'https://ttl.nav.no',
      };

      vi.mocked(hentMeldekortData).mockResolvedValue(mockData);

      const result = await hentMeldekortDataFraTTL('test-token');

      expect(hentMeldekortData).toHaveBeenCalledWith('test-token', {
        apiUrl: 'https://ttl-test.nav.no',
        audience: 'test:ttl:api',
        path: '/landingsside/status',
        serviceName: 'Tiltakspenger',
        validator: expect.any(Function),
      });
      expect(result).toEqual(mockData);
    });

    it('should return undefined when no data is available', async () => {
      const { hentMeldekortData } = await import('../../helpers');

      vi.mocked(hentMeldekortData).mockResolvedValue(undefined);

      const result = await hentMeldekortDataFraTTL('test-token');

      expect(result).toBeUndefined();
    });
  });
});
