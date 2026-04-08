import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hentMeldekortDataFraArena } from '../../clients/arena';
import type { ArenaMeldekortData } from '../../../types/meldekort';

// Mock helpers
vi.mock('../../helpers', () => ({
  hentMeldekortData: vi.fn(),
  validerArenaMeldekortData: vi.fn((_data): _data is ArenaMeldekortData => true),
}));

describe('arena', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalProcessEnv,
      MELDEKORT_API_URL: 'https://arena-test.nav.no',
      MELDEKORT_API_AUDIENCE: 'test:arena:api',
    };
  });

  describe('hentMeldekortDataFraArena', () => {
    it('should call hentMeldekortData with correct config', async () => {
      const { hentMeldekortData } = await import('../../helpers');
      const mockData: ArenaMeldekortData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://arena.nav.no',
        meldegruppe: 'ARBS',
      };

      vi.mocked(hentMeldekortData).mockResolvedValue(mockData);

      const result = await hentMeldekortDataFraArena('test-token');

      expect(hentMeldekortData).toHaveBeenCalledWith('test-token', {
        apiUrl: 'https://arena-test.nav.no',
        audience: 'test:arena:api',
        path: '/person/meldekortstatus',
        serviceName: 'Arena',
        validator: expect.any(Function),
      });
      expect(result).toEqual(mockData);
    });

    it('should return undefined when no data is available', async () => {
      const { hentMeldekortData } = await import('../../helpers');

      vi.mocked(hentMeldekortData).mockResolvedValue(undefined);

      const result = await hentMeldekortDataFraArena('test-token');

      expect(result).toBeUndefined();
    });
  });
});
