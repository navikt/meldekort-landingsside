import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hentMeldekortDataFraDP } from '../../clients/dagpenger';
import type { MeldekortData } from '../../../types/meldekort';

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

describe('dagpenger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('DP_API_URL', 'https://dp-test.nav.no');
    vi.stubEnv('DP_API_AUDIENCE', 'test:teamdagpenger:dp-rapportering');
    vi.stubEnv('ENFORCE_LOGIN', 'true');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('hentMeldekortDataFraDP', () => {
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
        url: 'https://dagpenger.nav.no',
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

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(requestTokenxOboToken).toHaveBeenCalledWith(
        'test-obo-token',
        'test:teamdagpenger:dp-rapportering',
      );
      expect(fetch).toHaveBeenCalledWith(
        'https://dp-test.nav.no/meldekortstatus',
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

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('DP token exchange failed');
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

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DP API returned 500');
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

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DP API returned invalid data structure');
    });

    it('returnerer success uten data når bruker har ingen aktive meldekort', async () => {
      const mockEmptyData: MeldekortData = {
        innsendteMeldekort: false,
        meldekortTilUtfylling: [],
        url: 'https://dagpenger.nav.no',
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

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('returnerer feil når API config mangler', async () => {
      vi.stubEnv('DP_API_URL', '');

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing DP API configuration');
    });

    it('returnerer mock data når ENFORCE_LOGIN er false', async () => {
      vi.stubEnv('ENFORCE_LOGIN', 'false');

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.innsendteMeldekort).toBe(true);
      expect(result.data?.meldekortTilUtfylling).toHaveLength(0);
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

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error fetching DP data');
    });

    it('håndterer network error fra fetch', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'test-token',
      });

      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await hentMeldekortDataFraDP('test-obo-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});
