import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hentMeldekortDataFraAAP } from '../../clients/arbeidsavklaringspenger';
import type { MeldekortData } from '../../../types/meldekort';

// Mock @navikt/oasis
vi.mock('@navikt/oasis', () => ({
  requestTokenxOboToken: vi.fn(),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('arbeidsavklaringspenger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('AAP_API_URL', 'https://aap-test.nav.no');
    vi.stubEnv('AAP_API_AUDIENCE', 'test:aap:api');
    vi.stubEnv('ENFORCE_LOGIN', 'true');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('hentMeldekortDataFraAAP', () => {
    it('returnerer meldekortdata når API-kallet lykkes', async () => {
      const mockData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-31',
            kanFyllesUtFra: '2026-03-10',
            fristForInnsending: '2026-04-07',
          },
        ],
        redirectUrl: 'https://aap.nav.no',
      };

      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(requestTokenxOboToken).toHaveBeenCalledWith('test-obo-token', 'test:aap:api');
      expect(fetch).toHaveBeenCalledWith(
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

      expect(result.success).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returnerer undefined når API returnerer feilstatus', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result.success).toBe(false);
    });

    it('returnerer undefined når API returnerer ugyldig data', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'data' }),
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result.success).toBe(false);
    });

    it('returnerer success uten data når bruker har ingen aktive meldekort', async () => {
      const mockEmptyData: MeldekortData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://aap.nav.no',
      };

      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockEmptyData,
      } as Response);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('returnerer undefined når API config mangler', async () => {
      vi.stubEnv('AAP_API_URL', '');

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result.success).toBe(false);
    });

    it('returnerer mock data når ENFORCE_LOGIN er false', async () => {
      vi.stubEnv('ENFORCE_LOGIN', 'false');

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.harInnsendteMeldekort).toBe(false);
      expect(result.data?.meldekortTilUtfylling).toHaveLength(1);
    });

    it('håndterer AbortError fra fetch', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      const abortError = new Error('Abort');
      abortError.name = 'AbortError';
      vi.mocked(fetch).mockRejectedValue(abortError);

      const result = await hentMeldekortDataFraAAP('test-obo-token');

      expect(result.success).toBe(false);
    });
  });
});
