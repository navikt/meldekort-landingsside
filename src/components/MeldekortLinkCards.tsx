import { LinkCard, Tag } from '@navikt/ds-react';
import type { LenkeInfo, LenkeVisning } from '../lib/types/meldekort';
import { erstattPlassholdere } from '../lib/utils/meldekort';
import type { SUPPORTED_LANGUAGES } from '../lib/language';
import type { Ytelser } from '../lib/sanity';

type Language = (typeof SUPPORTED_LANGUAGES)[number];

interface LinkData {
  tittel: string;
  beskrivelse: string;
  fristTag?: string;
  tilleggstekstVedInnsendteMeldekort?: string;
}

interface LinkContent {
  linkForASe: LinkData | undefined;
  linkForASende: LinkData | undefined;
  linkForAFylleUt: LinkData | undefined;
}

interface MeldekortLinkCardsProps {
  visning: LenkeVisning;
  content: LinkContent;
  ytelser: Ytelser;
  language: Language;
}

interface MeldekortLinkCardProps {
  info: LenkeInfo;
  data: LinkData;
  ytelseNavn: string;
  tilleggstekst?: string;
  language: Language;
}

function MeldekortLinkCard({
  info,
  data,
  ytelseNavn,
  tilleggstekst,
  language,
}: MeldekortLinkCardProps) {
  const erstatt = (tekst: string) => erstattPlassholdere(tekst, ytelseNavn, info.dato, language);

  return (
    <LinkCard size="medium">
      <LinkCard.Title>
        <LinkCard.Anchor href={info.url}>{erstatt(data.tittel)}</LinkCard.Anchor>
      </LinkCard.Title>
      <LinkCard.Description>
        {erstatt(data.beskrivelse)}
        {tilleggstekst && <> {erstatt(tilleggstekst)}</>}
      </LinkCard.Description>
      <LinkCard.Footer>
        {data.fristTag && (
          <Tag variant="info" size="small">
            {erstatt(data.fristTag)}
          </Tag>
        )}
      </LinkCard.Footer>
    </LinkCard>
  );
}

export function MeldekortLinkCards({ visning, content, ytelser, language }: MeldekortLinkCardsProps) {
  return (
    <>
      {visning.se.map((info, index) =>
        content.linkForASe ? (
          <MeldekortLinkCard
            key={`se-${info.ytelse}-${index}`}
            info={info}
            data={content.linkForASe}
            ytelseNavn={ytelser[info.ytelse]}
            language={language}
          />
        ) : null,
      )}
      {visning.sende.map((info, index) =>
        content.linkForASende ? (
          <MeldekortLinkCard
            key={`sende-${info.ytelse}-${index}`}
            info={info}
            data={content.linkForASende}
            ytelseNavn={ytelser[info.ytelse]}
            language={language}
            {...(info.harOgsaInnsendte &&
              content.linkForASende.tilleggstekstVedInnsendteMeldekort && {
                tilleggstekst: content.linkForASende.tilleggstekstVedInnsendteMeldekort,
              })}
          />
        ) : null,
      )}
      {visning.fyllUt.map((info, index) =>
        content.linkForAFylleUt ? (
          <MeldekortLinkCard
            key={`fyllUt-${info.ytelse}-${index}`}
            info={info}
            data={content.linkForAFylleUt}
            ytelseNavn={ytelser[info.ytelse]}
            language={language}
          />
        ) : null,
      )}
    </>
  );
}
