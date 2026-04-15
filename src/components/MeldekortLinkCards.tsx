import { LinkCard, Tag } from '@navikt/ds-react';
import type { LenkeInfo, LenkeVisning } from '../lib/types/meldekort';
import { erstattPlassholdere } from '../lib/utils/meldekort';
import type { SUPPORTED_LANGUAGES } from '../lib/language';
import type { Ytelser } from '../lib/sanity';
import { useAnalytics } from '../hooks/useAnalytics';

type Language = (typeof SUPPORTED_LANGUAGES)[number];

interface LinkData {
  tittel: string;
  beskrivelse: string;
  fristTag?: string;
  kanSendesFraTag?: string;
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
  kortType: 'se' | 'sende' | 'fyllUt';
  tilleggstekst?: string;
  language: Language;
  onNavigate: (
    ytelse: 'dagpenger' | 'aap' | 'tiltakspenger',
    kortType: 'se' | 'sende' | 'fyllUt',
    url: string,
  ) => void;
}

function MeldekortLinkCard({
  info,
  data,
  ytelseNavn,
  kortType,
  tilleggstekst,
  language,
  onNavigate,
}: MeldekortLinkCardProps) {
  const erstatt = (tekst: string) => erstattPlassholdere(tekst, ytelseNavn, info.dato, language);
  const tagTekst = data.fristTag || data.kanSendesFraTag;
  // Vis ikke tag hvis dato er undefined (f.eks. tiltakspenger uten frist)
  const visTag = tagTekst && info.dato !== undefined;

  const handleClick = () => {
    onNavigate(info.ytelse, kortType, info.url);
  };

  return (
    <LinkCard size="medium">
      <LinkCard.Title>
        <LinkCard.Anchor href={info.url} onClick={handleClick}>
          {erstatt(data.tittel)}
        </LinkCard.Anchor>
      </LinkCard.Title>
      <LinkCard.Description>
        {erstatt(data.beskrivelse)}
        {tilleggstekst && <> {erstatt(tilleggstekst)}</>}
      </LinkCard.Description>
      <LinkCard.Footer>
        {visTag && (
          <Tag variant="info" size="small">
            {erstatt(tagTekst)}
          </Tag>
        )}
      </LinkCard.Footer>
    </LinkCard>
  );
}

export function MeldekortLinkCards({
  visning,
  content,
  ytelser,
  language,
}: MeldekortLinkCardsProps) {
  const { trackYtelseNavigasjon } = useAnalytics();

  const renderLinkCards = <T extends LenkeInfo>(
    lenker: T[],
    data: LinkData | undefined,
    kortType: 'se' | 'sende' | 'fyllUt',
    getTilleggstekst?: (info: T) => string | undefined,
  ) => {
    if (!data) return null;

    return lenker.map((info, index) => {
      const tilleggstekst = getTilleggstekst?.(info);
      return (
        <MeldekortLinkCard
          key={`${kortType}-${info.ytelse}-${index}`}
          info={info}
          data={data}
          ytelseNavn={ytelser[info.ytelse]}
          kortType={kortType}
          language={language}
          onNavigate={trackYtelseNavigasjon}
          {...(tilleggstekst && { tilleggstekst })}
        />
      );
    });
  };

  return (
    <>
      {renderLinkCards(visning.se, content.linkForASe, 'se')}
      {renderLinkCards(visning.sende, content.linkForASende, 'sende', (info) =>
        info.harOgsaInnsendte
          ? content.linkForASende?.tilleggstekstVedInnsendteMeldekort
          : undefined,
      )}
      {renderLinkCards(visning.fyllUt, content.linkForAFylleUt, 'fyllUt')}
    </>
  );
}
