import { format, parseISO } from 'date-fns';
import { enGB, nb } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import type { SUPPORTED_LANGUAGES } from '../language';
import type {
  AlleMeldekortData,
  LenkeVisning,
  MeldekortData,
  MeldekortTilUtfylling,
  Ytelse,
} from '../types/meldekort';

type Language = (typeof SUPPORTED_LANGUAGES)[number];

// Mapping fra språkkode til locale for datoformatering
const localeMap: Record<Language, Locale> = {
  nb,
  en: enGB,
};

/**
 * Formater dato fra ISO 8601 format til lesbart format.
 * Datoen tolkes eksplisitt som UTC for å unngå tidssone-relaterte feil.
 *
 * @param dato - Dato i ISO 8601 format: YYYY-MM-DDTHH:mm:ss (uten tidssone, tolkes som UTC)
 * @param language - Språkkode (nb eller en)
 * @returns Formatert dato, f.eks. "13. mars 2026" eller "13 March 2026"
 */
function formaterDato(dato: string, language: Language): string {
  // Legg til 'Z' for å eksplisitt markere datoen som UTC
  const datoMedTidssone = dato.endsWith('Z') ? dato : `${dato}Z`;
  const date = parseISO(datoMedTidssone);

  return format(date, 'd. MMMM yyyy', { locale: localeMap[language] });
}

/**
 * Erstatter plassholdere i tekst fra Sanity med faktiske verdier.
 *
 * @param tekst - Tekst med plassholdere ({{ytelse}} og {{dato}})
 * @param ytelseNavn - Navnet på ytelsen som skal erstatte {{ytelse}}
 * @param dato - Dato i ISO 8601 format (YYYY-MM-DDTHH:mm:ss) som skal erstatte {{dato}}, eller undefined
 * @param language - Språkkode for datoformatering
 * @returns Tekst med erstattede plassholdere
 *
 * @example
 * erstattPlassholdere("Send {{ytelse}}-meldekort innen {{dato}}", "dagpenger", "2026-03-24T00:00:00", "nb")
 * // => "Send dagpenger-meldekort innen 24. mars 2026"
 */
export function erstattPlassholdere(
  tekst: string,
  ytelseNavn: string,
  dato: string | undefined,
  language: Language,
): string {
  return tekst
    .replace(/\{\{ytelse\}\}/g, ytelseNavn)
    .replace(/\{\{dato\}\}/g, dato ? formaterDato(dato, language) : '');
}

const idag = () => new Date().toISOString();

/**
 * Sjekker om et meldekort kan sendes inn nå.
 *
 * @param meldekort - Meldekort som skal sjekkes
 * @returns true hvis nåværende tidspunkt er lik eller etter kanSendesFra
 */
export function kanSendes(meldekort: MeldekortTilUtfylling): boolean {
  return meldekort.kanSendesFra <= idag();
}

/**
 * Sjekker om et meldekort kan fylles ut nå.
 *
 * @param meldekort - Meldekort som skal sjekkes
 * @returns true hvis kanFyllesUtFra er null, eller nåværende tidspunkt er lik eller etter kanFyllesUtFra
 */
export function kanFyllesUt(meldekort: MeldekortTilUtfylling): boolean {
  return meldekort.kanFyllesUtFra === null || meldekort.kanFyllesUtFra <= idag();
}

/**
 * Oppdaterer visningsobjektet basert på en ytelses meldekortdata.
 *
 * Hver ytelse legger til ETT kort basert på prioritet:
 * 1. Send inn - hvis meldekort kan sendes
 * 2. Se innsendte - hvis kun innsendte meldekort finnes
 * 3. Fyll ut - kun hvis sjekkFyllUt=true (kun AAP)
 *
 * @param data - Meldekortdata for en ytelse
 * @param ytelse - Type ytelse (dagpenger, aap, tiltakspenger)
 * @param visning - Visningsobjekt som oppdateres (muteres)
 * @param sjekkFyllUt - Om "Fyll ut"-lenke skal sjekkes (kun for AAP)
 */
function oppdaterVisning(
  data: MeldekortData,
  ytelse: Ytelse,
  visning: LenkeVisning,
  sjekkFyllUt = false,
): void {
  const meldekortSomKanSendes = data.meldekortTilUtfylling.filter(kanSendes);
  const kanSendeNoe = meldekortSomKanSendes.length > 0;
  const harInnsendte = data.harInnsendteMeldekort;

  if (kanSendeNoe) {
    // Finn nærmeste frist
    const sortert = meldekortSomKanSendes.sort((a, b) =>
      a.fristForInnsending.localeCompare(b.fristForInnsending),
    );

    visning.sende.push({
      url: data.redirectUrl,
      ytelse,
      dato: sortert[0]?.fristForInnsending,
      harOgsaInnsendte: harInnsendte,
    });
  } else if (harInnsendte) {
    visning.se.push({
      url: data.redirectUrl,
      ytelse,
      dato: undefined,
    });
  } else if (sjekkFyllUt && data.meldekortTilUtfylling.some(kanFyllesUt)) {
    const meldekortSomKanFyllesUt = data.meldekortTilUtfylling.filter(kanFyllesUt);
    // Finn tidligste dato det kan sendes fra
    const sortert = meldekortSomKanFyllesUt.sort((a, b) =>
      a.kanSendesFra.localeCompare(b.kanSendesFra),
    );
    visning.fyllUt.push({
      url: data.redirectUrl,
      ytelse,
      dato: sortert[0]?.kanSendesFra,
    });
  }
}

/**
 * Bestemmer hvilke lenkekort som skal vises basert på data fra alle ytelser.
 *
 * Hver ytelse viser ETT kort basert på prioritet:
 * 1. "Send inn" - hvis det finnes meldekort som kan sendes
 *    - Hvis det også finnes innsendte meldekort, vises tilleggstekst
 * 2. "Se innsendte" - hvis det finnes innsendte meldekort (og ingen kan sendes)
 * 3. "Fyll ut" - kun for AAP, hvis det finnes meldekort som kan fylles ut (og ingen kan sendes eller er innsendt)
 *
 * Flere ytelser kan vise kort i samme kategori, så det kan returneres flere "Send inn"-kort
 * hvis både DP og AAP har meldekort som kan sendes.
 *
 * @param data - Meldekortdata for alle ytelser (DP, AAP, TTL)
 * @returns Objektet som inneholder arrays av lenker som skal vises
 */
export function skalViseLenker(data: AlleMeldekortData): LenkeVisning {
  const visning: LenkeVisning = {
    se: [],
    sende: [],
    fyllUt: [],
  };

  if (data.dp) oppdaterVisning(data.dp, 'dagpenger', visning);
  if (data.ttl) oppdaterVisning(data.ttl, 'tiltakspenger', visning);
  if (data.aap) oppdaterVisning(data.aap, 'aap', visning, true);

  return visning;
}
