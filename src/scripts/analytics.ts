import { awaitDecoratorData } from '@navikt/nav-dekoratoren-moduler';
import { trackPageView, trackKortVisning } from '../lib/utils/analytics';

declare global {
  interface Window {
    __MELDEKORT_VISNING__?: {
      visning: {
        se: Array<{ ytelse: string }>;
        sende: Array<{ ytelse: string }>;
        fyllUt: Array<{ ytelse: string }>;
      };
      harKort: boolean;
      apiFeil: boolean;
    };
  }
}

/**
 * Tracker sidevisning og kort-visning når siden lastes.
 * Venter på at dekoratøren er klar før tracking.
 */
async function initializeAnalytics() {
  try {
    // Vent på at dekoratøren er ferdig lastet
    await awaitDecoratorData();

    // Track initial page view
    trackPageView();

    // Track kort-visning hvis kort vises (ikke API-feil)
    const meldekortVisning = window.__MELDEKORT_VISNING__;
    if (meldekortVisning && !meldekortVisning.apiFeil && meldekortVisning.harKort) {
      const { visning } = meldekortVisning;
      trackKortVisning({
        se: visning.se.map((v) => v.ytelse),
        sende: visning.sende.map((v) => v.ytelse),
        fyllUt: visning.fyllUt.map((v) => v.ytelse),
      });
    }
  } catch (error) {
    // Feil i analytics skal ikke påvirke brukeropplevelsen
    console.error('Analytics initialization failed:', error);
  }
}

// Start analytics når DOM er klar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnalytics);
} else {
  initializeAnalytics();
}
