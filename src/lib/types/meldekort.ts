export interface MeldekortTilUtfylling {
  kanSendesFra: string;
  kanFyllesUtFra: string | null;
  fristForInnsending: string;
}

export interface MeldekortData {
  innsendteMeldekort: boolean;
  meldekortTilUtfylling: MeldekortTilUtfylling[];
  url: string;
}

export interface AlleMeldekortData {
  dagpenger?: MeldekortData;
  aap?: MeldekortData;
  tiltakspenger?: MeldekortData;
}

export type Ytelse = "dagpenger" | "aap" | "tiltakspenger";

export interface LenkeInfo {
  url: string;
  ytelse: Ytelse;
  dato: string | undefined;
}

export interface LenkeVisning {
  se?: LenkeInfo;
  sende?: LenkeInfo & { harOgsaInnsendte: boolean };
  fyllUt?: LenkeInfo;
}
