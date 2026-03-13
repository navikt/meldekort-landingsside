import groq from "groq";

// Query som henter data for et spesifikt språk
const getFieldsForLanguage = (language: string) => groq`
  _id,
  "tittel": tittel[_key == "${language}"][0].value,
  "emptyStateTekst": emptyStateTekst[_key == "${language}"][0].value,
  "bunntekst": bunntekst[_key == "${language}"][0].value,
  "ytelser": {
    "dagpenger": ytelser.dagpenger[_key == "${language}"][0].value,
    "aap": ytelser.aap[_key == "${language}"][0].value,
    "tiltakspenger": ytelser.tiltakspenger[_key == "${language}"][0].value
  },
  "linkForASe": {
    "tittel": linkForASe.tittel[_key == "${language}"][0].value,
    "beskrivelse": linkForASe.beskrivelse[_key == "${language}"][0].value
  },
  "linkForASende": {
    "tittel": linkForASende.tittel[_key == "${language}"][0].value,
    "beskrivelse": linkForASende.beskrivelse[_key == "${language}"][0].value,
    "fristTag": linkForASende.fristTag[_key == "${language}"][0].value,
    "tilleggstekstVedInnsendteMeldekort": linkForASende.tilleggstekstVedInnsendteMeldekort[_key == "${language}"][0].value
  },
  "linkForAFylleUt": {
    "tittel": linkForAFylleUt.tittel[_key == "${language}"][0].value,
    "beskrivelse": linkForAFylleUt.beskrivelse[_key == "${language}"][0].value
  }
`;

// Henter publiserte dokumenter for et gitt språk
export const getLandingssideQuery = (language: string) =>
  groq`*[_type == "meldekortLandingsside"][0]{
    ${getFieldsForLanguage(language)}
  }`;
