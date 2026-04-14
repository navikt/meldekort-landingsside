import { getAnalyticsInstance, getCurrentConsent } from '@navikt/nav-dekoratoren-moduler';
import type { DecoratorLocale } from '@navikt/nav-dekoratoren-moduler';

const SKJEMANAVN = 'meldekort-landingsside';

export interface TrackEventProps {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Henter analytics instance fra dekoratøren.
 * Returnerer undefined hvis analytics ikke er tilgjengelig.
 */
export function getAnalytics() {
  if (typeof window === 'undefined') return undefined;
  return getAnalyticsInstance(SKJEMANAVN);
}

/**
 * Sjekker om bruker har samtykket til analytics.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const { consent } = getCurrentConsent();
    return consent?.analytics ?? false;
  } catch {
    return false;
  }
}

/**
 * Tracker et event til Umami via dekoratøren.
 */
export function trackEvent(event: string, props: TrackEventProps = {}) {
  if (!hasAnalyticsConsent()) return;

  const logger = getAnalytics();
  if (!logger) return;

  const data = {
    skjemanavn: SKJEMANAVN,
    ...props,
  };

  logger(event, data);
}

/**
 * Tracker sidevisning.
 */
export function trackPageView(url?: string) {
  trackEvent('sidevisning', {
    url: url ?? window.location.pathname + window.location.search,
  });
}

/**
 * Tracker navigasjon til en ytelse.
 */
export function trackYtelseNavigasjon(
  ytelse: 'dagpenger' | 'aap' | 'tiltakspenger',
  kortType: 'se' | 'sende' | 'fyllUt',
  url: string,
) {
  trackEvent('navigere', {
    ytelse,
    kortType,
    url,
  });
}

/**
 * Tracker hvilke kort som vises på landingssiden.
 */
export function trackKortVisning(visning: {
  se: string[];
  sende: string[];
  fyllUt: string[];
}) {
  // Bruk Set for å unngå duplikater hvis samme ytelse har flere korttyper
  const unikeYtelser = [...new Set([...visning.se, ...visning.sende, ...visning.fyllUt])];

  trackEvent('kort vist', {
    antallSe: visning.se.length,
    antallSende: visning.sende.length,
    antallFyllUt: visning.fyllUt.length,
    ytelser: unikeYtelser.join(','),
  });
}

/**
 * Tracker språkendring.
 */
export function trackSprakEndret(gammeltSprak: DecoratorLocale, nyttSprak: DecoratorLocale) {
  trackEvent('språk endret', {
    gammeltSprak,
    nyttSprak,
  });
}
