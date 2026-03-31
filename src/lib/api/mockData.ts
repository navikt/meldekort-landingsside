import type { MeldekortData } from '../types/meldekort';

export const dpMock: MeldekortData = {
  harInnsendteMeldekort: true,
  meldekortTilUtfylling: [],
  redirectUrl: 'https://arbeid.intern.dev.nav.no/arbeid/dagpenger/meldekort',
};

export const aapMock: MeldekortData = {
  harInnsendteMeldekort: false,
  meldekortTilUtfylling: [
    {
      kanSendesFra: '2026-03-31T00:00:00',
      kanFyllesUtFra: '2026-03-10T00:00:00',
      fristForInnsending: '2026-04-07T00:00:00',
    },
  ],
  redirectUrl: 'https://aap-meldekort.ansatt.dev.nav.no/aap/meldekort',
};

export const ttlMock: MeldekortData = {
  harInnsendteMeldekort: true,
  meldekortTilUtfylling: [
    {
      kanSendesFra: '2026-03-10T00:00:00',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-03-24T00:00:00',
    },
  ],
  redirectUrl: 'https://www.ansatt.dev.nav.no/tiltakspenger/meldekort',
};

/**
 * Mock data for Arena - brukes kun for redirect til felles-meldekort
 * Skal kun returnere data hvis bruker IKKE har meldekort i de andre systemene
 */
export const arenaMock: MeldekortData = {
  harInnsendteMeldekort: true,
  meldekortTilUtfylling: [
    {
      kanSendesFra: '2026-03-10T00:00:00',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-03-24T00:00:00',
    },
  ],
  redirectUrl: 'https://arbeid.intern.dev.nav.no/arbeid/felles-meldekort',
};
