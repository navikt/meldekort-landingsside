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
 * Parser en dato string i Oslo timezone.
 * Hvis datoen ikke har eksplisitt timezone, antas den å være i Oslo timezone.
 */
function parseDatoIOsloTimezone(dato: string): Date {
  const hasExplicitTimeZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(dato);
  if (hasExplicitTimeZone) {
    return new Date(dato);
  }

  // For datoer uten timezone, ekstraher dato-delen (YYYY-MM-DD) og parse i Oslo timezone
  // Dette sikrer konsistent parsing uavhengig av runtime sin lokale timezone
  const [dateOnly] = dato.split('T');
  return new TZDate(dateOnly || dato, TIMEZONE);
}

/**
 * Formater dato til lesbart format.
 * Bruker Intl.DateTimeFormat for å unngå å sende date-fns til klienten.
 *
 * @param dato - Dato i format YYYY-MM-DD eller YYYY-MM-DDTHH:mm:ss
 * @param language - Språkkode (nb eller en)
 * @returns Formatert dato, f.eks. "13. mars 2026" eller "13 March 2026"
 */
function formaterDato(dato: string, language: Language): string {
  const date = parseDatoIOsloTimezone(dato);
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
  const kanSendesFraDato = startOfDay(parseDatoIOsloTimezone(meldekort.kanSendesFra));
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
  const kanFyllesUtFraDato = startOfDay(parseDatoIOsloTimezone(meldekort.kanFyllesUtFra));
  return isEqual(kanFyllesUtFraDato, today) || isAfter(today, kanFyllesUtFraDato);
}

/**
 * Henter nærmeste (tidligste) dato fra liste av meldekort.
 * @param meldekort - Liste av meldekort
 * @param datoFelt - Feltnavn for dato som skal sorteres
 * @returns Nærmeste dato etter sortering, eller undefined hvis listen er tom
 */
function hentNærmesteDato(
  meldekort: MeldekortTilUtfylling[],
  datoFelt: keyof MeldekortTilUtfylling,
): string | undefined {
  const sortert = [...meldekort].sort((a, b) => {
    const datoA = a[datoFelt];
    const datoB = b[datoFelt];
    if (typeof datoA === 'string' && typeof datoB === 'string') {
      return datoA.localeCompare(datoB);
    }
    return 0;
  });
  const nærmesteDato = sortert[0]?.[datoFelt];
  return typeof nærmesteDato === 'string' ? nærmesteDato : undefined;
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
  const harInnsendte = data.innsendteMeldekort;

  if (meldekortSomKanSendes.length > 0) {
    visning.sende.push({
      url: data.url,
      ytelse,
      dato: hentNærmesteDato(meldekortSomKanSendes, 'fristForInnsending'),
      harOgsaInnsendte: harInnsendte,
    });
  } else if (harInnsendte) {
    visning.se.push({
      url: data.url,
      ytelse,
      dato: undefined,
    });
  } else if (sjekkFyllUt) {
    const meldekortSomKanFyllesUt = data.meldekortTilUtfylling.filter(kanFyllesUt);
    if (meldekortSomKanFyllesUt.length > 0) {
      visning.fyllUt.push({
        url: data.url,
        ytelse,
        dato: hentNærmesteDato(meldekortSomKanFyllesUt, 'kanSendesFra'),
      });
    }
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

  const ytelser: Array<{ data: MeldekortData | undefined; ytelse: Ytelse; sjekkFyllUt: boolean }> =
    [
      { data: data.dagpenger, ytelse: 'dagpenger', sjekkFyllUt: false },
      { data: data.tiltakspenger, ytelse: 'tiltakspenger', sjekkFyllUt: false },
      { data: data.aap, ytelse: 'aap', sjekkFyllUt: true },
    ];

  for (const { data: ytelseData, ytelse, sjekkFyllUt } of ytelser) {
    if (ytelseData) {
      oppdaterVisning(ytelseData, ytelse, visning, sjekkFyllUt);
    }
  }

  return visning;
}
