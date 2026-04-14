import { useCallback } from 'react';
import { trackEvent, trackYtelseNavigasjon, type TrackEventProps } from '../lib/utils/analytics';

/**
 * React hook for analytics tracking.
 * Kan brukes i client-side React komponenter.
 */
export function useAnalytics() {
  const handleYtelseNavigasjon = useCallback(
    (
      ytelse: 'dagpenger' | 'aap' | 'tiltakspenger',
      kortType: 'se' | 'sende' | 'fyllUt',
      url: string,
    ) => {
      trackYtelseNavigasjon(ytelse, kortType, url);
    },
    [],
  );

  const handleEvent = useCallback((event: string, props: TrackEventProps = {}) => {
    trackEvent(event, props);
  }, []);

  return {
    trackYtelseNavigasjon: handleYtelseNavigasjon,
    trackEvent: handleEvent,
  };
}
