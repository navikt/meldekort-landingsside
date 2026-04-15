import type { MeldekortData } from '../types/meldekort';

/**
 * Mock scenarier for testing av forskjellige tilstander.
 * Brukes med ?scenario=<navn> query parameter i mock mode.
 */

export interface ScenarioData {
  dagpenger?: MeldekortData | undefined;
  aap?: MeldekortData | undefined;
  tiltakspenger?: MeldekortData | undefined;
  redirectUrl?: string;
}

export const scenarios = {
  // Standard mock data (default)
  default: {
    dagpenger: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-10',
          kanFyllesUtFra: null,
          fristForInnsending: '2026-03-24',
        },
      ],
      url: 'https://www.nav.no/dagpenger/meldekort',
    } as MeldekortData,
    aap: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-31',
          kanFyllesUtFra: '2026-03-10',
          fristForInnsending: '2026-04-07',
        },
      ],
      url: 'https://www.nav.no/aap/meldekort',
    } as MeldekortData,
    tiltakspenger: {
      innsendteMeldekort: true,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-10',
          kanFyllesUtFra: null,
          fristForInnsending: '2026-03-24',
        },
      ],
      url: 'https://www.nav.no/tiltakspenger/meldekort',
    } as MeldekortData,
  },

  // Ingen meldekort for noen ytelser (tom landingsside)
  'ingen-meldekort': {
    dagpenger: undefined,
    aap: undefined,
    tiltakspenger: undefined,
  },

  // Kun felles meldekort fra arena (redirect)
  'kun-felles-meldekort': {
    dagpenger: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/dagpenger/meldekort',
    } as MeldekortData,
    aap: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/aap/meldekort',
    } as MeldekortData,
    tiltakspenger: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/tiltakspenger/meldekort',
    } as MeldekortData,
    redirectUrl: '/felles-meldekort',
  },

  // Kun dagpenger har aktive meldekort (skal redirecte)
  'kun-dagpenger': {
    dagpenger: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-10',
          kanFyllesUtFra: null,
          fristForInnsending: '2026-03-24',
        },
      ],
      url: 'https://www.nav.no/dagpenger/meldekort',
    } as MeldekortData,
    aap: undefined,
    tiltakspenger: undefined,
  },

  // Kun AAP har aktive meldekort (skal redirecte)
  'kun-aap': {
    dagpenger: undefined,
    aap: {
      innsendteMeldekort: true,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/aap/meldekort',
    } as MeldekortData,
    tiltakspenger: undefined,
  },

  // Kun tiltakspenger har aktive meldekort (skal redirecte)
  'kun-tp': {
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
    } as MeldekortData,
  },

  // To ytelser har aktive meldekort (landingsside)
  'aap-og-tp': {
    dagpenger: undefined,
    aap: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-31',
          kanFyllesUtFra: '2026-03-10',
          fristForInnsending: '2026-04-07',
        },
      ],
      url: 'https://www.nav.no/aap/meldekort',
    } as MeldekortData,
    tiltakspenger: {
      innsendteMeldekort: true,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/tiltakspenger/meldekort',
    } as MeldekortData,
  },

  // Tre ytelser har aktive meldekort (landingsside)
  'alle-ytelser': {
    dagpenger: {
      innsendteMeldekort: true,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-10',
          kanFyllesUtFra: null,
          fristForInnsending: '2026-03-24',
        },
      ],
      url: 'https://www.nav.no/dagpenger/meldekort',
    } as MeldekortData,
    aap: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-31',
          kanFyllesUtFra: '2026-03-10',
          fristForInnsending: '2026-04-07',
        },
      ],
      url: 'https://www.nav.no/aap/meldekort',
    } as MeldekortData,
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
    } as MeldekortData,
  },

  // Kun innsendte meldekort (ingen til utfylling)
  'kun-innsendte': {
    dagpenger: {
      innsendteMeldekort: true,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/dagpenger/meldekort',
    } as MeldekortData,
    aap: {
      innsendteMeldekort: true,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/aap/meldekort',
    } as MeldekortData,
    tiltakspenger: {
      innsendteMeldekort: true,
      meldekortTilUtfylling: [],
      url: 'https://www.nav.no/tiltakspenger/meldekort',
    } as MeldekortData,
  },

  // Kun meldekort til utfylling (ingen innsendte)
  'kun-utfylling': {
    dagpenger: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-10',
          kanFyllesUtFra: null,
          fristForInnsending: '2026-03-24',
        },
      ],
      url: 'https://www.nav.no/dagpenger/meldekort',
    } as MeldekortData,
    aap: {
      innsendteMeldekort: false,
      meldekortTilUtfylling: [
        {
          kanSendesFra: '2026-03-31',
          kanFyllesUtFra: '2026-03-10',
          fristForInnsending: '2026-04-07',
        },
      ],
      url: 'https://www.nav.no/aap/meldekort',
    } as MeldekortData,
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
    } as MeldekortData,
  },
} as const;

export type ScenarioName = keyof typeof scenarios;

/**
 * Henter scenario basert på navn.
 * Returnerer default scenario hvis navnet ikke finnes.
 */
export function getScenario(name?: string): ScenarioData {
  if (!name || !Object.hasOwn(scenarios, name)) {
    return scenarios.default;
  }
  return scenarios[name as ScenarioName];
}

/**
 * Metadata for scenario-oversikten
 */
export const scenarioMetadata = [
  {
    category: 'Redirect scenarier',
    items: [
      { name: 'kun-felles-meldekort', description: 'Kun felles meldekort fra arena → redirect til /felles-meldekort' },
      { name: 'kun-dagpenger', description: 'Kun dagpenger har aktive meldekort → redirect' },
      { name: 'kun-aap', description: 'Kun AAP har aktive meldekort → redirect' },
      { name: 'kun-tp', description: 'Kun tiltakspenger har aktive meldekort → redirect' },
    ],
  },
  {
    category: 'Landingsside scenarier (flere ytelser)',
    items: [
      { name: 'default', description: 'Standard mock data (alle tre ytelser)' },
      { name: 'aap-og-tp', description: 'To ytelser (AAP og tiltakspenger)' },
      { name: 'alle-ytelser', description: 'Alle tre ytelser har aktive meldekort' },
    ],
  },
  {
    category: 'Spesialtilfeller',
    items: [
      { name: 'ingen-meldekort', description: 'Ingen ytelser har aktive meldekort (empty state)' },
      {
        name: 'kun-innsendte',
        description: 'Alle ytelser har kun innsendte meldekort ("Se innsendte")',
      },
      {
        name: 'kun-utfylling',
        description: 'Alle ytelser har kun meldekort til utfylling ("Send inn" / "Fyll ut")',
      },
    ],
  },
] as const;

const BASE_URL = '/meldekort';
const DEFAULT_SCENARIO_DISPLAY_NAME = 'Standard (ingen scenario parameter)';

export function getScenarioUrl(scenarioName: ScenarioName | (string & {})): string {
  return scenarioName === 'default'
    ? BASE_URL
    : `${BASE_URL}?scenario=${encodeURIComponent(scenarioName)}`;
}

export function getScenarioDisplayName(scenarioName: ScenarioName | (string & {})): string {
  return scenarioName === 'default' ? DEFAULT_SCENARIO_DISPLAY_NAME : scenarioName;
}
