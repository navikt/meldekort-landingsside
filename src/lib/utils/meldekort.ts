import { isAfter, isEqual, startOfDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import type { SUPPORTED_LANGUAGES } from '../language';
import type {
  AlleMeldekortData,
  LenkeVisning,
  MeldekortData,
  MeldekortTilUtfylling,
  Ytelse,
} from '../types/meldekort';

type Language = (typeof SUPPORTED_LANGUAGES)[number];

// Mapping fra språkkode til Intl locale
const localeMap: Record<Language, string> = {
  nb: 'nb-NO',
  en: 'en-GB',
};

// Vi bruker Europe/Oslo timezone siden alle meldekort-datoer er norsk tid
const TIMEZONE = 'Europe/Oslo';

/**
 * Formater dato til lesbart format.
 * Bruker Intl.DateTimeFormat for å unngå å sende date-fns til klienten.
 *
 * @param dato - Dato i format YYYY-MM-DD eller YYYY-MM-DDTHH:mm:ss
 * @param language - Språkkode (nb eller en)
 * @returns Formatert dato, f.eks. "13. mars 2026" eller "13 March 2026"
 */
function formaterDato(dato: string, language: Language): string {
  // Sjekk om dato har eksplisitt timezone (Z eller +/-offset)
  const hasExplicitTimeZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(dato);

  // Parse i Oslo timezone hvis ingen eksplisitt timezone er spesifisert
  const date = hasExplicitTimeZone ? new Date(dato) : new TZDate(dato, TIMEZONE);
  const locale = localeMap[language];

  // Formater med Intl.DateTimeFormat i Oslo timezone
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIMEZONE,
  });

  return formatter.format(date);
}

/**
 * Erstatter plassholdere i tekst fra Sanity med faktiske verdier.
 *
 * @param tekst - Tekst med plassholdere ({{ytelse}} og {{dato}})
 * @param ytelseNavn - Navnet på ytelsen som skal erstatte {{ytelse}}
 * @param dato - Dato i format YYYY-MM-DD eller YYYY-MM-DDTHH:mm:ss som skal erstatte {{dato}}, eller undefined
 * @param language - Språkkode for datoformatering
 * @returns Tekst med erstattede plassholdere
 *
 * @example
 * erstattPlassholdere("Send {{ytelse}}-meldekort innen {{dato}}", "dagpenger", "2026-03-24", "nb")
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

/**
 * Henter dagens dato i Oslo timezone (start of day)
 */
const idag = () => startOfDay(new TZDate(new Date(), TIMEZONE));

/**
 * Sjekker om et meldekort kan sendes inn nå.
 *
 * @param meldekort - Meldekort som skal sjekkes
 * @returns true hvis dagens dato er lik eller etter kanSendesFra
 */
export function kanSendes(meldekort: MeldekortTilUtfylling): boolean {
  const today = idag();
  // Parse ISO string i Oslo timezone og få start of day
  const kanSendesFraDato = startOfDay(new TZDate(meldekort.kanSendesFra, TIMEZONE));
  return isEqual(kanSendesFraDato, today) || isAfter(today, kanSendesFraDato);
}

/**
 * Sjekker om et meldekort kan fylles ut nå.
 *
 * @param meldekort - Meldekort som skal sjekkes
 * @returns true hvis kanFyllesUtFra er null, eller dagens dato er lik eller etter kanFyllesUtFra
 */
export function kanFyllesUt(meldekort: MeldekortTilUtfylling): boolean {
  if (meldekort.kanFyllesUtFra === null) return true;

  const today = idag();
  // Parse ISO string i Oslo timezone og få start of day
  const kanFyllesUtFraDato = startOfDay(new TZDate(meldekort.kanFyllesUtFra, TIMEZONE));
  return isEqual(kanFyllesUtFraDato, today) || isAfter(today, kanFyllesUtFraDato);
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
  const harInnsendte = data.innsendteMeldekort;

  if (kanSendeNoe) {
    // Finn nærmeste frist
    const sortert = meldekortSomKanSendes.sort((a, b) =>
      a.fristForInnsending.localeCompare(b.fristForInnsending),
    );

    visning.sende.push({
      url: data.url,
      ytelse,
      dato: sortert[0]?.fristForInnsending,
      harOgsaInnsendte: harInnsendte,
    });
  } else if (harInnsendte) {
    visning.se.push({
      url: data.url,
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
      url: data.url,
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
 * hvis både dagpenger og AAP har meldekort som kan sendes.
 *
 * @param data - Meldekortdata for alle ytelser (dagpenger, AAP, tiltakspenger)
 * @returns Objektet som inneholder arrays av lenker som skal vises
 */
export function skalViseLenker(data: AlleMeldekortData): LenkeVisning {
  const visning: LenkeVisning = {
    se: [],
    sende: [],
    fyllUt: [],
  };

  if (data.dagpenger) oppdaterVisning(data.dagpenger, 'dagpenger', visning);
  if (data.tiltakspenger) oppdaterVisning(data.tiltakspenger, 'tiltakspenger', visning);
  if (data.aap) oppdaterVisning(data.aap, 'aap', visning, true);

  return visning;
}
