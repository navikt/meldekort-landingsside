import type { MeldekortData } from '../types/meldekort';

/**
 * Mock data for dagpenger - viser "Se innsendte meldekort"
 */
export const dagpengerMock: MeldekortData = {
  innsendteMeldekort: true,
  meldekortTilUtfylling: [], // Ingen meldekort å fylle ut/sende
  url: 'https://arbeid.intern.dev.nav.no/arbeid/dagpenger/meldekort',
};

/**
 * Mock data for AAP - viser "Fyll ut meldekort"
 */
export const aapMock: MeldekortData = {
  innsendteMeldekort: false,
  meldekortTilUtfylling: [
    {
      kanSendesFra: '2026-03-31', // Kan sendes i fremtiden
      kanFyllesUtFra: '2026-03-10', // Kan fylles ut nå
      fristForInnsending: '2026-04-07',
    },
  ],
  url: 'https://aap-meldekort.ansatt.dev.nav.no/aap/meldekort',
};

/**
 * Mock data for tiltakspenger - viser "Send inn meldekort" + tilleggstekst
 */
export const tiltakspengerMock: MeldekortData = {
  innsendteMeldekort: true, // Har også innsendte meldekort
  meldekortTilUtfylling: [
    {
      kanSendesFra: '2026-03-10', // Kan sendes nå
      kanFyllesUtFra: null,
      fristForInnsending: '2026-03-24',
    },
  ],
  url: 'https://www.ansatt.dev.nav.no/tiltakspenger/meldekort',
};
