import { useState, useEffect } from 'react';
import { LinkCard, Tag } from '@navikt/ds-react';
import type { LenkeVisning, Ytelse } from '../lib/types/meldekort';
import { erstattPlassholdere } from '../lib/utils/meldekort';
import type { SUPPORTED_LANGUAGES } from '../lib/language';
import type { Ytelser } from '../lib/sanity';

type Language = (typeof SUPPORTED_LANGUAGES)[number];

interface LenkeInfo {
  url: string;
  ytelse: Ytelse;
  dato: string | undefined;
}

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

export function MeldekortLinkCards({ visning, content, ytelser }: MeldekortLinkCardsProps) {
  const [language, setLanguage] = useState<Language>('nb');

  useEffect(() => {
    const lang = (document.documentElement.lang || 'nb') as Language;
    setLanguage(lang);
  }, []);

  return (
    <>
      {visning.se && content.linkForASe && (
        <MeldekortLinkCard
          info={visning.se}
          data={content.linkForASe}
          ytelseNavn={ytelser[visning.se.ytelse]}
          language={language}
        />
      )}
      {visning.sende && content.linkForASende && (
        <MeldekortLinkCard
          info={visning.sende}
          data={content.linkForASende}
          ytelseNavn={ytelser[visning.sende.ytelse]}
          language={language}
          {...(visning.sende.harOgsaInnsendte &&
            content.linkForASende.tilleggstekstVedInnsendteMeldekort && {
              tilleggstekst: content.linkForASende.tilleggstekstVedInnsendteMeldekort,
            })}
        />
      )}
      {visning.fyllUt && content.linkForAFylleUt && (
        <MeldekortLinkCard
          info={visning.fyllUt}
          data={content.linkForAFylleUt}
          ytelseNavn={ytelser[visning.fyllUt.ytelse]}
          language={language}
        />
      )}
    </>
  );
}
