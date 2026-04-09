export interface MeldekortTilUtfylling {
  kanSendesFra: string; // ISO 8601: YYYY-MM-DDTHH:mm:ss (tolkes som UTC)
  kanFyllesUtFra: string | null; // ISO 8601: YYYY-MM-DDTHH:mm:ss (tolkes som UTC)
  fristForInnsending: string; // ISO 8601: YYYY-MM-DDTHH:mm:ss (tolkes som UTC)
}

export interface MeldekortData {
  harInnsendteMeldekort: boolean;
  meldekortTilUtfylling: MeldekortTilUtfylling[];
  redirectUrl: string;
}

export interface ArenaMeldekortData extends MeldekortData {
  meldegruppe: string;
}

export interface AlleMeldekortData {
  dp?: MeldekortData;
  aap?: MeldekortData;
  ttl?: MeldekortData;
  arena?: ArenaMeldekortData;
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
