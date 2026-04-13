import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hentMeldekortDataFraAAP } from '../../clients/arbeidsavklaringspenger';
import type { MeldekortData } from '../../../types/meldekort';

// Mock @navikt/oasis
vi.mock('@navikt/oasis', () => ({
  requestTokenxOboToken: vi.fn(),
}));

// Mock fetch globalt
global.fetch = vi.fn();

describe('arbeidsavklaringspenger', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalProcessEnv,
      AAP_API_URL: 'https://aap-test.nav.no',
      AAP_API_AUDIENCE: 'test:aap:api',
      ENFORCE_LOGIN: 'true',
    };
  });

  describe('hentMeldekortDataFraAAP', () => {
    it('returnerer meldekortdata når API-kallet lykkes', async () => {
      const mockData: MeldekortData = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-31',
            kanFyllesUtFra: '2026-03-10',
            fristForInnsending: '2026-04-07',
          },
        ],
        url: 'https://aap.nav.no',
      };

      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toEqual(mockData);
      expect(requestTokenxOboToken).toHaveBeenCalledWith('test-obo-token', 'test:aap:api');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://aap-test.nav.no/api/meldekort-status',
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer test-token',
          },
        }),
      );
    });

    it('returnerer undefined når TokenX exchange feiler', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: false,
        error: new Error('Token exchange failed'),
      });

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returnerer undefined når API returnerer feilstatus', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toBeUndefined();
    });

    it('returnerer undefined når API returnerer ugyldig data', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'data' }),
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toBeUndefined();
    });

    it('returnerer undefined når bruker har ingen aktive meldekort', async () => {
      const mockEmptyData: MeldekortData = {
        innsendteMeldekort: false,
        meldekortTilUtfylling: [],
        url: 'https://aap.nav.no',
      };

      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockEmptyData,
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toBeUndefined();
    });

    it('returnerer undefined når API config mangler', async () => {
      process.env.AAP_API_URL = undefined;

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toBeUndefined();
    });

    it('returnerer mock data når ENFORCE_LOGIN er false', async () => {
      process.env.ENFORCE_LOGIN = 'false';

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toBeDefined();
      expect(result?.innsendteMeldekort).toBe(false);
      expect(result?.meldekortTilUtfylling).toHaveLength(1);
    });

    it('håndterer fetch timeout', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      const abortError = new Error('Abort');
      abortError.name = 'AbortError';
      vi.mocked(global.fetch).mockRejectedValue(abortError);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result).toBeUndefined();
    });
  });
});
