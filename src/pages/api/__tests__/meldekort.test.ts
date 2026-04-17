import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../meldekort';
import type { APIContext } from 'astro';

// Mock all API clients
vi.mock('../../../lib/api/clients/dagpenger', () => ({
  hentMeldekortDataFraDP: vi.fn(),
}));

vi.mock('../../../lib/api/clients/arbeidsavklaringspenger', () => ({
  hentMeldekortDataFraAAP: vi.fn(),
}));

vi.mock('../../../lib/api/clients/tiltakspenger', () => ({
  hentMeldekortDataFraTP: vi.fn(),
}));

vi.mock('../../../lib/api/clients/arena', () => ({
  hentMeldekortDataFraArena: vi.fn(),
}));

// Mock logger
vi.mock('../../../lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock @navikt/oasis
vi.mock('@navikt/oasis', () => ({
  getToken: vi.fn(),
}));

describe('meldekort API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ENFORCE_LOGIN', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('logging when API calls fail', () => {
    it('skal logge error når ett API-kall feiler', async () => {
      const { hentMeldekortDataFraDP } = await import('../../../lib/api/clients/dagpenger');
      const { hentMeldekortDataFraAAP } = await import(
        '../../../lib/api/clients/arbeidsavklaringspenger'
      );
      const { hentMeldekortDataFraTP } = await import('../../../lib/api/clients/tiltakspenger');
      const { getToken } = await import('@navikt/oasis');
      const { logger } = await import('../../../lib/utils/logger');

      vi.mocked(getToken).mockReturnValue('test-token');

      // DP feiler, resten OK
      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue({
        success: false,
        error: 'DP API returned 500',
      });

      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraTP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const mockContext = {
        request: {
          headers: new Headers(),
        },
        url: new URL('http://localhost:4321/api/meldekort'),
      } as unknown as APIContext;

      const response = await GET(mockContext);

      expect(response.status).toBe(503);
      expect(logger.error).toHaveBeenCalledWith(
        'Ett eller flere API-kall til meldekort-tjenester feilet',
        {
          failedServices: ['dagpenger'],
          errors: {
            dagpenger: 'DP API returned 500',
            aap: null,
            tiltakspenger: null,
          },
        },
      );
    });

    it('skal logge error når flere API-kall feiler', async () => {
      const { hentMeldekortDataFraDP } = await import('../../../lib/api/clients/dagpenger');
      const { hentMeldekortDataFraAAP } = await import(
        '../../../lib/api/clients/arbeidsavklaringspenger'
      );
      const { hentMeldekortDataFraTP } = await import('../../../lib/api/clients/tiltakspenger');
      const { getToken } = await import('@navikt/oasis');
      const { logger } = await import('../../../lib/utils/logger');

      vi.mocked(getToken).mockReturnValue('test-token');

      // DP og AAP feiler
      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue({
        success: false,
        error: 'DP API returned 500',
      });

      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue({
        success: false,
        error: 'AAP token exchange failed',
      });

      vi.mocked(hentMeldekortDataFraTP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const mockContext = {
        request: {
          headers: new Headers(),
        },
        url: new URL('http://localhost:4321/api/meldekort'),
      } as unknown as APIContext;

      const response = await GET(mockContext);

      expect(response.status).toBe(503);
      expect(logger.error).toHaveBeenCalledWith(
        'Ett eller flere API-kall til meldekort-tjenester feilet',
        {
          failedServices: ['dagpenger', 'aap'],
          errors: {
            dagpenger: 'DP API returned 500',
            aap: 'AAP token exchange failed',
            tiltakspenger: null,
          },
        },
      );
    });

    it('skal returnere 503 når arena-kall feiler', async () => {
      const { hentMeldekortDataFraDP } = await import('../../../lib/api/clients/dagpenger');
      const { hentMeldekortDataFraAAP } = await import(
        '../../../lib/api/clients/arbeidsavklaringspenger'
      );
      const { hentMeldekortDataFraTP } = await import('../../../lib/api/clients/tiltakspenger');
      const { hentMeldekortDataFraArena } = await import('../../../lib/api/clients/arena');
      const { getToken } = await import('@navikt/oasis');
      const { logger } = await import('../../../lib/utils/logger');

      vi.mocked(getToken).mockReturnValue('test-token');

      // Alle ytelser OK, men ingen har aktive meldekort
      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraTP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      // Arena feiler
      vi.mocked(hentMeldekortDataFraArena).mockResolvedValue({
        success: false,
        error: 'Arena API returned 503',
      });

      const mockContext = {
        request: {
          headers: new Headers(),
        },
        url: new URL('http://localhost:4321/api/meldekort'),
      } as unknown as APIContext;

      const response = await GET(mockContext);

      expect(response.status).toBe(503);
      expect(logger.error).toHaveBeenCalledWith('Arena-kall (meldekort-api) feilet', {
        service: 'arena/meldekort-api',
        error: 'Arena API returned 503',
      });
    });

    it('skal logge info når arena returnerer tom redirectUrl', async () => {
      const { hentMeldekortDataFraDP } = await import('../../../lib/api/clients/dagpenger');
      const { hentMeldekortDataFraAAP } = await import(
        '../../../lib/api/clients/arbeidsavklaringspenger'
      );
      const { hentMeldekortDataFraTP } = await import('../../../lib/api/clients/tiltakspenger');
      const { hentMeldekortDataFraArena } = await import('../../../lib/api/clients/arena');
      const { getToken } = await import('@navikt/oasis');
      const { logger } = await import('../../../lib/utils/logger');

      vi.mocked(getToken).mockReturnValue('test-token');

      // Alle ytelser OK, men ingen har aktive meldekort
      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraTP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      // Arena returnerer tom redirectUrl
      vi.mocked(hentMeldekortDataFraArena).mockResolvedValue({
        success: true,
        data: {
          harInnsendteMeldekort: false,
          meldekortTilUtfylling: [],
          redirectUrl: '',
        },
      });

      const mockContext = {
        request: {
          headers: new Headers(),
        },
        url: new URL('http://localhost:4321/api/meldekort'),
      } as unknown as APIContext;

      const response = await GET(mockContext);

      expect(response.status).toBe(200);
      expect(logger.info).toHaveBeenCalledWith(
        'Arena returnerte tom redirectUrl - ingen redirect tilgjengelig',
      );
    });

    it('skal logge warn når arena returnerer ugyldig redirectUrl', async () => {
      const { hentMeldekortDataFraDP } = await import('../../../lib/api/clients/dagpenger');
      const { hentMeldekortDataFraAAP } = await import(
        '../../../lib/api/clients/arbeidsavklaringspenger'
      );
      const { hentMeldekortDataFraTP } = await import('../../../lib/api/clients/tiltakspenger');
      const { hentMeldekortDataFraArena } = await import('../../../lib/api/clients/arena');
      const { getToken } = await import('@navikt/oasis');
      const { logger } = await import('../../../lib/utils/logger');

      vi.mocked(getToken).mockReturnValue('test-token');

      // Alle ytelser OK, men ingen har aktive meldekort
      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraTP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      // Arena returnerer ugyldig redirectUrl (ikke relativ path)
      vi.mocked(hentMeldekortDataFraArena).mockResolvedValue({
        success: true,
        data: {
          harInnsendteMeldekort: false,
          meldekortTilUtfylling: [],
          redirectUrl: 'https://example.com/redirect',
        },
      });

      const mockContext = {
        request: {
          headers: new Headers(),
        },
        url: new URL('http://localhost:4321/api/meldekort'),
      } as unknown as APIContext;

      const response = await GET(mockContext);

      expect(response.status).toBe(200);
      expect(logger.warn).toHaveBeenCalledWith(
        'Ugyldig redirectUrl fra arena - må være sikker intern NAV URL',
        {
          redirectUrl: 'https://example.com/redirect',
        },
      );
    });

    it('skal akseptere intern NAV URL fra arena', async () => {
      const { hentMeldekortDataFraDP } = await import('../../../lib/api/clients/dagpenger');
      const { hentMeldekortDataFraAAP } = await import(
        '../../../lib/api/clients/arbeidsavklaringspenger'
      );
      const { hentMeldekortDataFraTP } = await import('../../../lib/api/clients/tiltakspenger');
      const { hentMeldekortDataFraArena } = await import('../../../lib/api/clients/arena');
      const { getToken } = await import('@navikt/oasis');
      const { logger } = await import('../../../lib/utils/logger');

      vi.mocked(getToken).mockReturnValue('test-token');

      // Alle ytelser OK, men ingen har aktive meldekort
      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      vi.mocked(hentMeldekortDataFraTP).mockResolvedValue({
        success: true,
        data: undefined,
      });

      // Arena returnerer intern NAV URL
      vi.mocked(hentMeldekortDataFraArena).mockResolvedValue({
        success: true,
        data: {
          harInnsendteMeldekort: false,
          meldekortTilUtfylling: [],
          redirectUrl: 'https://meldekort-frontend-q2.intern.dev.nav.no/felles-meldekort',
        },
      });

      const mockContext = {
        request: {
          headers: new Headers(),
        },
        url: new URL('http://localhost:4321/api/meldekort'),
      } as unknown as APIContext;

      const response = await GET(mockContext);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(
        'https://meldekort-frontend-q2.intern.dev.nav.no/felles-meldekort',
      );
      expect(logger.info).toHaveBeenCalledWith('Arena returnerte gyldig redirectUrl', {
        redirectUrl: 'https://meldekort-frontend-q2.intern.dev.nav.no/felles-meldekort',
        type: 'absolute',
      });
    });
  });
});
