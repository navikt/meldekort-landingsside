import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  harAktiveMeldekort,
  validerMeldekortData,
  fetchWithTimeout,
  handleMeldekortResponse,
} from '../helpers';
import type { MeldekortData } from '../../types/meldekort';

describe('helpers', () => {
  describe('harAktiveMeldekort', () => {
    it('skal returnere false når data er undefined', () => {
      expect(harAktiveMeldekort(undefined)).toBe(false);
    });

    it('skal returnere true når innsendteMeldekort er true', () => {
      const data: MeldekortData = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [],
        url: 'https://example.com',
      };
      expect(harAktiveMeldekort(data)).toBe(true);
    });

    it('skal returnere true når meldekortTilUtfylling har elementer', () => {
      const data: MeldekortData = {
        innsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
        ],
        url: 'https://example.com',
      };
      expect(harAktiveMeldekort(data)).toBe(true);
    });

    it('skal returnere false når både innsendteMeldekort er false og meldekortTilUtfylling er tom', () => {
      const data: MeldekortData = {
        innsendteMeldekort: false,
        meldekortTilUtfylling: [],
        url: 'https://example.com',
      };
      expect(harAktiveMeldekort(data)).toBe(false);
    });

    it('skal returnere true når både innsendteMeldekort er true og meldekortTilUtfylling har elementer', () => {
      const data: MeldekortData = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
        ],
        url: 'https://example.com',
      };
      expect(harAktiveMeldekort(data)).toBe(true);
    });
  });

  describe('validerMeldekortData', () => {
    it('skal returnere false når data er null', () => {
      expect(validerMeldekortData(null)).toBe(false);
    });

    it('skal returnere false når data er undefined', () => {
      expect(validerMeldekortData(undefined)).toBe(false);
    });

    it('skal returnere false når data ikke er et objekt', () => {
      expect(validerMeldekortData('string')).toBe(false);
      expect(validerMeldekortData(123)).toBe(false);
      expect(validerMeldekortData(true)).toBe(false);
    });

    it('skal returnere false når innsendteMeldekort mangler', () => {
      const data = {
        meldekortTilUtfylling: [],
        url: 'https://example.com',
      };
      expect(validerMeldekortData(data)).toBe(false);
    });

    it('skal returnere false når innsendteMeldekort ikke er boolean', () => {
      const data = {
        innsendteMeldekort: 'true',
        meldekortTilUtfylling: [],
        url: 'https://example.com',
      };
      expect(validerMeldekortData(data)).toBe(false);
    });

    it('skal returnere false når meldekortTilUtfylling mangler', () => {
      const data = {
        innsendteMeldekort: true,
        url: 'https://example.com',
      };
      expect(validerMeldekortData(data)).toBe(false);
    });

    it('skal returnere false når meldekortTilUtfylling ikke er array', () => {
      const data = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: 'not-an-array',
        url: 'https://example.com',
      };
      expect(validerMeldekortData(data)).toBe(false);
    });

    it('skal returnere false når url mangler', () => {
      const data = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [],
      };
      expect(validerMeldekortData(data)).toBe(false);
    });

    it('skal returnere false når url ikke er string', () => {
      const data = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [],
        url: 123,
      };
      expect(validerMeldekortData(data)).toBe(false);
    });

    it('skal returnere true når data har alle required fields med riktige typer', () => {
      const data = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [],
        url: 'https://example.com',
      };
      expect(validerMeldekortData(data)).toBe(true);
    });

    it('skal returnere true når data har ekstra felter', () => {
      const data = {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
        ],
        url: 'https://example.com',
        extraField: 'should-be-ignored',
      };
      expect(validerMeldekortData(data)).toBe(true);
    });
  });

  describe('fetchWithTimeout', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('skal returnere response når fetch lykkes', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await fetchWithTimeout('https://example.com', {}, 5000);

      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
        signal: expect.any(AbortSignal),
      });
    });

    it('skal propagere feil når fetch feiler', async () => {
      const networkError = new Error('Network error');
      global.fetch = vi.fn().mockRejectedValue(networkError);

      await expect(fetchWithTimeout('https://example.com', {}, 5000)).rejects.toThrow(
        'Network error',
      );
    });

    it('skal merge options med signal', async () => {
      const mockResponse = new Response('OK');
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const customOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      await fetchWithTimeout('https://example.com', customOptions, 5000);

      expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal),
      });
    });

    it('skal kalle clearTimeout når fetch lykkes', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const mockResponse = new Response('OK');
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await fetchWithTimeout('https://example.com', {}, 5000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('skal kalle setTimeout med riktig timeout-verdi', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      const mockResponse = new Response('OK');
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await fetchWithTimeout('https://example.com', {}, 7500);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 7500);
    });
  });

  describe('handleMeldekortResponse', () => {
    it('skal redirecte når kun 1 ytelse har aktive meldekort', () => {
      const ytelseData = {
        dagpenger: {
          innsendteMeldekort: true,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/dagpenger/meldekort',
        },
        aap: undefined,
        tiltakspenger: undefined,
      };

      const response = handleMeldekortResponse(ytelseData);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('https://www.nav.no/dagpenger/meldekort');
    });

    it('skal kaste error når redirect URL ikke er absolutt', () => {
      const ytelseData = {
        dagpenger: {
          innsendteMeldekort: true,
          meldekortTilUtfylling: [],
          url: '/relative/url',
        },
        aap: undefined,
        tiltakspenger: undefined,
      };

      expect(() => handleMeldekortResponse(ytelseData)).toThrow(
        'Redirect URL must be absolute, got: /relative/url',
      );
    });

    it('skal returnere JSON når 0 ytelser har aktive meldekort', async () => {
      const ytelseData = {
        dagpenger: undefined,
        aap: undefined,
        tiltakspenger: undefined,
      };

      const response = handleMeldekortResponse(ytelseData);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data).toEqual({});
    });

    it('skal returnere JSON når flere enn 1 ytelse har aktive meldekort', async () => {
      const ytelseData = {
        dagpenger: {
          innsendteMeldekort: true,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/dagpenger/meldekort',
        },
        aap: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [
            {
              kanSendesFra: '2026-03-10',
              kanFyllesUtFra: null,
              fristForInnsending: '2026-03-24',
            },
          ],
          url: 'https://www.nav.no/aap/meldekort',
        },
        tiltakspenger: undefined,
      };

      const response = handleMeldekortResponse(ytelseData);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data).toEqual({
        dagpenger: ytelseData.dagpenger,
        aap: ytelseData.aap,
      });
    });

    it('skal kun inkludere ytelser med data i JSON response', async () => {
      const ytelseData = {
        dagpenger: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/dagpenger/meldekort',
        },
        aap: undefined,
        tiltakspenger: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/tiltakspenger/meldekort',
        },
      };

      const response = handleMeldekortResponse(ytelseData);
      const data = await response.json();

      expect(data).toEqual({
        dagpenger: ytelseData.dagpenger,
        tiltakspenger: ytelseData.tiltakspenger,
      });
      expect(data).not.toHaveProperty('aap');
    });

    it('skal redirecte til AAP når kun AAP har aktive meldekort', () => {
      const ytelseData = {
        dagpenger: undefined,
        aap: {
          innsendteMeldekort: true,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/aap/meldekort',
        },
        tiltakspenger: undefined,
      };

      const response = handleMeldekortResponse(ytelseData);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('https://www.nav.no/aap/meldekort');
    });

    it('skal redirecte til tiltakspenger når kun tiltakspenger har aktive meldekort', () => {
      const ytelseData = {
        dagpenger: undefined,
        aap: undefined,
        tiltakspenger: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [
            {
              kanSendesFra: '2026-03-10',
              kanFyllesUtFra: null,
              fristForInnsending: '2026-03-24',
            },
          ],
          url: 'https://www.nav.no/tiltakspenger/meldekort',
        },
      };

      const response = handleMeldekortResponse(ytelseData);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('https://www.nav.no/tiltakspenger/meldekort');
    });

    it('skal ikke redirecte når ytelse har data men ikke aktive meldekort', async () => {
      const ytelseData = {
        dagpenger: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/dagpenger/meldekort',
        },
        aap: undefined,
        tiltakspenger: undefined,
      };

      const response = handleMeldekortResponse(ytelseData);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ dagpenger: ytelseData.dagpenger });
    });

    it('skal redirecte til relativ redirectUrl når ingen ytelser har aktive meldekort', () => {
      const ytelseData = {
        dagpenger: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/dagpenger/meldekort',
        },
        aap: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/aap/meldekort',
        },
        tiltakspenger: {
          innsendteMeldekort: false,
          meldekortTilUtfylling: [],
          url: 'https://www.nav.no/tiltakspenger/meldekort',
        },
        redirectUrl: '/felles-meldekort',
      };

      const response = handleMeldekortResponse(ytelseData);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('/felles-meldekort');
    });

    it('skal kaste error hvis redirectUrl ikke starter med /', () => {
      const ytelseData = {
        dagpenger: undefined,
        aap: undefined,
        tiltakspenger: undefined,
        redirectUrl: 'https://evil.com/phishing',
      };

      expect(() => handleMeldekortResponse(ytelseData)).toThrow(
        'Redirect URL must start with /, got: https://evil.com/phishing',
      );
    });
  });
});
