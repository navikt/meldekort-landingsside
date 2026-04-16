import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hentMeldekortDataFraArena } from '../../clients/arena';
import type { ArenaMeldekortResponse } from '../../../types/meldekort';

// Mock @navikt/oasis
vi.mock('@navikt/oasis', () => ({
  requestTokenxOboToken: vi.fn(),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('arena', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('ARENA_API_URL', 'https://arena-test.nav.no');
    vi.stubEnv('ARENA_API_AUDIENCE', 'test:meldekort:api');
    vi.stubEnv('ENFORCE_LOGIN', 'true');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('hentMeldekortDataFraArena', () => {
    it('returnerer meldekortdata når API-kallet lykkes', async () => {
      const mockData: ArenaMeldekortResponse = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            fraOgMed: '2026-03-01',
            tilOgMed: '2026-03-14',
            uke: '10-11',
            kanSendesFra: '2026-03-15T00:00:00',
            kanFyllesUtFra: '2026-03-10T00:00:00',
            fristForInnsending: '2026-03-22T00:00:00',
            etterregistrering: false,
          },
        ],
        redirectUrl: '/felles-meldekort',
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

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(requestTokenxOboToken).toHaveBeenCalledWith('test-obo-token', 'test:meldekort:api');
      expect(fetch).toHaveBeenCalledWith(
        'https://arena-test.nav.no/person/meldekortstatus',
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer test-token',
          },
        }),
      );
    });

    it('returnerer feil når TokenX exchange feiler', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: false,
        error: new Error('Token exchange failed'),
      });

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Arena token exchange failed');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returnerer feil når API returnerer feilstatus', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Arena API returned 500');
    });

    it('returnerer feil når API returnerer ugyldig data', async () => {
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

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Arena API returned invalid data structure');
    });

    it('returnerer feil når API config mangler', async () => {
      vi.stubEnv('ARENA_API_URL', '');

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing Arena API configuration');
    });

    it('returnerer mock data når ENFORCE_LOGIN er false', async () => {
      vi.stubEnv('ENFORCE_LOGIN', 'false');

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.redirectUrl).toBe('/felles-meldekort');
      expect(result.data?.harInnsendteMeldekort).toBe(false);
      expect(result.data?.meldekortTilUtfylling).toEqual([]);
    });

    it('returnerer success med tom redirectUrl når arena ikke har redirect', async () => {
      const mockData: ArenaMeldekortResponse = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [],
        redirectUrl: '',
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

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.data?.redirectUrl).toBe('');
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

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error fetching Arena data');
    });

    it('håndterer network error fra fetch', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await hentMeldekortDataFraArena('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});
