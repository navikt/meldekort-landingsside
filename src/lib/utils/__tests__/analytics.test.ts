import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAnalytics,
  hasAnalyticsConsent,
  trackEvent,
  trackPageView,
  trackYtelseNavigasjon,
  trackKortVisning,
  trackSprakEndret,
} from '../analytics';

// Mock nav-dekoratoren-moduler
vi.mock('@navikt/nav-dekoratoren-moduler', () => ({
  getAnalyticsInstance: vi.fn(),
  getCurrentConsent: vi.fn(),
}));

describe('analytics', () => {
  const mockLogger = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window
    global.window = {} as Window & typeof globalThis;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAnalytics', () => {
    it('skal returnere undefined når window ikke er definert', () => {
      // @ts-expect-error - Testing undefined window
      global.window = undefined;
      expect(getAnalytics()).toBeUndefined();
    });

    it('skal returnere analytics instance fra dekoratøren', async () => {
      const { getAnalyticsInstance } = await import('@navikt/nav-dekoratoren-moduler');
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      const result = getAnalytics();

      expect(getAnalyticsInstance).toHaveBeenCalledWith('meldekort-landingsside');
      expect(result).toBe(mockLogger);
    });
  });

  describe('hasAnalyticsConsent', () => {
    it('skal returnere false når window ikke er definert', () => {
      // @ts-expect-error - Testing undefined window
      global.window = undefined;
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it('skal returnere true når bruker har samtykket', async () => {
      const { getCurrentConsent } = await import('@navikt/nav-dekoratoren-moduler');
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });

      expect(hasAnalyticsConsent()).toBe(true);
    });

    it('skal returnere false når bruker ikke har samtykket', async () => {
      const { getCurrentConsent } = await import('@navikt/nav-dekoratoren-moduler');
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: false, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });

      expect(hasAnalyticsConsent()).toBe(false);
    });

    it('skal returnere false når consent er undefined', async () => {
      const { getCurrentConsent } = await import('@navikt/nav-dekoratoren-moduler');
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: undefined as unknown as { analytics: boolean; surveys: boolean },
        userActionTaken: false,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });

      expect(hasAnalyticsConsent()).toBe(false);
    });

    it('skal returnere false når getCurrentConsent kaster feil', async () => {
      const { getCurrentConsent } = await import('@navikt/nav-dekoratoren-moduler');
      vi.mocked(getCurrentConsent).mockImplementation(() => {
        throw new Error('Consent not available');
      });

      expect(hasAnalyticsConsent()).toBe(false);
    });
  });

  describe('trackEvent', () => {
    it('skal ikke tracke når bruker ikke har samtykket', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: false, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackEvent('test event');

      expect(mockLogger).not.toHaveBeenCalled();
    });

    it('skal ikke tracke når logger ikke er tilgjengelig', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      // @ts-expect-error - Testing undefined logger
      vi.mocked(getAnalyticsInstance).mockReturnValue(undefined);

      trackEvent('test event');

      expect(mockLogger).not.toHaveBeenCalled();
    });

    it('skal tracke event med skjemanavn når bruker har samtykket', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackEvent('test event', { foo: 'bar' });

      expect(mockLogger).toHaveBeenCalledWith('test event', {
        skjemanavn: 'meldekort-landingsside',
        foo: 'bar',
      });
    });

    it('skal tracke event uten props', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackEvent('test event');

      expect(mockLogger).toHaveBeenCalledWith('test event', {
        skjemanavn: 'meldekort-landingsside',
      });
    });
  });

  describe('trackPageView', () => {
    beforeEach(() => {
      Object.defineProperty(global.window, 'location', {
        value: {
          pathname: '/test/path',
          search: '?foo=bar',
        },
        writable: true,
      });
    });

    it('skal tracke sidevisning med default URL', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackPageView();

      expect(mockLogger).toHaveBeenCalledWith('sidevisning', {
        skjemanavn: 'meldekort-landingsside',
        url: '/test/path?foo=bar',
      });
    });

    it('skal tracke sidevisning med custom URL', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackPageView('/custom/url');

      expect(mockLogger).toHaveBeenCalledWith('sidevisning', {
        skjemanavn: 'meldekort-landingsside',
        url: '/custom/url',
      });
    });
  });

  describe('trackYtelseNavigasjon', () => {
    it('skal tracke navigasjon til ytelse med kortType', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackYtelseNavigasjon('dagpenger', 'sende', 'https://www.nav.no/dagpenger/meldekort');

      expect(mockLogger).toHaveBeenCalledWith('navigere', {
        skjemanavn: 'meldekort-landingsside',
        ytelse: 'dagpenger',
        kortType: 'sende',
        url: 'https://www.nav.no/dagpenger/meldekort',
      });
    });

    it('skal tracke navigasjon til AAP', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackYtelseNavigasjon('aap', 'se', 'https://www.nav.no/aap/meldekort');

      expect(mockLogger).toHaveBeenCalledWith('navigere', {
        skjemanavn: 'meldekort-landingsside',
        ytelse: 'aap',
        kortType: 'se',
        url: 'https://www.nav.no/aap/meldekort',
      });
    });

    it('skal tracke navigasjon til tiltakspenger', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackYtelseNavigasjon(
        'tiltakspenger',
        'fyllUt',
        'https://www.nav.no/tiltakspenger/meldekort',
      );

      expect(mockLogger).toHaveBeenCalledWith('navigere', {
        skjemanavn: 'meldekort-landingsside',
        ytelse: 'tiltakspenger',
        kortType: 'fyllUt',
        url: 'https://www.nav.no/tiltakspenger/meldekort',
      });
    });
  });

  describe('trackKortVisning', () => {
    it('skal tracke kort-visning med unike ytelser', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackKortVisning({
        se: ['dagpenger'],
        sende: ['aap', 'tiltakspenger'],
        fyllUt: [],
      });

      expect(mockLogger).toHaveBeenCalledWith('kort vist', {
        skjemanavn: 'meldekort-landingsside',
        antallSe: 1,
        antallSende: 2,
        antallFyllUt: 0,
        ytelser: 'dagpenger,aap,tiltakspenger',
      });
    });

    it('skal fjerne duplikate ytelser', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackKortVisning({
        se: ['dagpenger'],
        sende: ['dagpenger', 'aap'],
        fyllUt: ['aap'],
      });

      expect(mockLogger).toHaveBeenCalledWith('kort vist', {
        skjemanavn: 'meldekort-landingsside',
        antallSe: 1,
        antallSende: 2,
        antallFyllUt: 1,
        ytelser: 'dagpenger,aap',
      });
    });

    it('skal håndtere tom visning', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackKortVisning({
        se: [],
        sende: [],
        fyllUt: [],
      });

      expect(mockLogger).toHaveBeenCalledWith('kort vist', {
        skjemanavn: 'meldekort-landingsside',
        antallSe: 0,
        antallSende: 0,
        antallFyllUt: 0,
        ytelser: '',
      });
    });
  });

  describe('trackSprakEndret', () => {
    it('skal tracke språkendring', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackSprakEndret('nb', 'en');

      expect(mockLogger).toHaveBeenCalledWith('språk endret', {
        skjemanavn: 'meldekort-landingsside',
        gammeltSprak: 'nb',
        nyttSprak: 'en',
      });
    });

    it('skal tracke språkendring fra engelsk til norsk', async () => {
      const { getCurrentConsent, getAnalyticsInstance } = await import(
        '@navikt/nav-dekoratoren-moduler'
      );
      vi.mocked(getCurrentConsent).mockReturnValue({
        consent: { analytics: true, surveys: false },
        userActionTaken: true,
        meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: 1 },
      });
      vi.mocked(getAnalyticsInstance).mockReturnValue(mockLogger);

      trackSprakEndret('en', 'nb');

      expect(mockLogger).toHaveBeenCalledWith('språk endret', {
        skjemanavn: 'meldekort-landingsside',
        gammeltSprak: 'en',
        nyttSprak: 'nb',
      });
    });
  });
});
