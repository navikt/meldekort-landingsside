import type { MeldekortData } from '../types/meldekort';

/**
 * Mock data for dagpenger - viser "Se innsendte meldekort"
 */
export const dagpengerMock: MeldekortData = {
  innsendteMeldekort: true,
  meldekortTilUtfylling: [], // Ingen meldekort å fylle ut/sende
  url: 'https://www.nav.no/dagpenger/meldekort',
};

/**
 * Mock data for AAP - viser "Fyll ut meldekort"
 */
export const aapMock: MeldekortData = {
  innsendteMeldekort: false,
  meldekortTilUtfylling: [
    {
      kanSendesFra: '2026-03-24', // Kan sendes i fremtiden
      kanFyllesUtFra: '2026-03-10', // Kan fylles ut nå
      fristForInnsending: '2026-04-07',
    },
  ],
  url: 'https://www.nav.no/aap/meldekort',
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
  url: 'https://www.nav.no/tiltakspenger/meldekort',
};
