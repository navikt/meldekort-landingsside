export interface MeldekortTilUtfylling {
  kanSendesFra: string;
  kanFyllesUtFra: string | null;
  fristForInnsending: string;
}

export interface MeldekortData {
  harInnsendteMeldekort: boolean;
  meldekortTilUtfylling: MeldekortTilUtfylling[];
  redirectUrl: string;
}

/**
 * Arena-spesifikk type for respons fra meldekort-api.
 * Brukes kun for å hente redirectUrl når ingen ytelser har aktive meldekort.
 */
export interface ArenaMeldekortResponse {
  harInnsendteMeldekort: boolean;
  meldekortTilUtfylling: ArenaMeldekortTilUtfylling[];
  redirectUrl: string;
}

export interface ArenaMeldekortTilUtfylling {
  fraOgMed: string;
  tilOgMed: string;
  uke: string;
  kanSendesFra: string;
  kanFyllesUtFra: string | null;
  fristForInnsending: string;
  etterregistrering: boolean;
}

export interface AlleMeldekortData {
  dagpenger?: MeldekortData;
  aap?: MeldekortData;
  tiltakspenger?: MeldekortData;
}

export type Ytelse = 'dagpenger' | 'aap' | 'tiltakspenger';

export interface LenkeInfo {
  url: string;
  ytelse: Ytelse;
  dato: string | undefined;
}

export interface LenkeVisning {
  se: LenkeInfo[];
  sende: (LenkeInfo & { harOgsaInnsendte: boolean })[];
  fyllUt: LenkeInfo[];
}
