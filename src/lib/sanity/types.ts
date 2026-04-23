import type { PortableTextBlock } from '@portabletext/types';

interface MeldekortLink {
  tittel: string;
  beskrivelse: string;
}

export interface Ytelser {
  dagpenger: string;
  aap: string;
  tiltakspenger: string;
}

export interface MeldekortLandingsside {
  _id: string;
  tittel: string;
  emptyStateTekst: PortableTextBlock[];
  bunntekst: PortableTextBlock[];
  ytelser: Ytelser;
  linkForASe: MeldekortLink;
  linkForASende: MeldekortLink & {
    fristTag: string | null;
    tilleggstekstVedInnsendteMeldekort: string;
  };
  linkForAFylleUt: MeldekortLink & {
    kanSendesFraTag: string | null;
  };
}
