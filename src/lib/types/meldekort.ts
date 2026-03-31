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

export interface AlleMeldekortData {
  dp?: MeldekortData;
  aap?: MeldekortData;
  ttl?: MeldekortData;
  arena?: MeldekortData;
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
