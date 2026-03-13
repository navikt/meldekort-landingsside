# Sanity CMS Integrasjon

Dette prosjektet bruker Sanity CMS for å håndtere innhold til meldekort-landingssiden.

## Konfigurasjon

### Sanity Prosjektdetaljer

Konfigurasjonen er hardkodet i `src/lib/sanity/client.ts`:

- **Project ID**: `rt6o382n`
- **Dataset**: `production`
- **API Version**: `2022-03-07`
- **Perspective**: `published` (kun publiserte dokumenter)

## Innholdsstruktur

Landingssideinnholdet hentes fra en Sanity-dokumenttype som heter `meldekortLandingsside`.

### Skjemafelt

Skjemaet inkluderer følgende felter (alle med internasjonalisering for `nb` og `en`):

#### Generelt innhold
- **tittel**: Hovedoverskrift for landingssiden
- **emptyStateTekst**: Tekst som vises når ingen lenker skal vises (støtter rik tekst via PortableText)
- **bunntekst**: Bunntekst som vises under lenkekortene (støtter rik tekst via PortableText)

#### Ytelsesnavn
- **ytelser**: Objekt med oversettelser for ytelsesnavn
  - **dagpenger**: Navn på ytelsen "dagpenger" (f.eks. nb: "dagpenger", en: "unemployment benefits")
  - **aap**: Navn på ytelsen "AAP" (f.eks. nb: "AAP", en: "AAP")
  - **tiltakspenger**: Navn på ytelsen "tiltakspenger" (f.eks. nb: "tiltakspenger", en: "participation allowance")

#### Lenkekort - Se innsendte meldekort
- **linkForASe**: Objekt for lenkekort som viser innsendte meldekort
  - **tittel**: Tittel på lenkekortet
  - **beskrivelse**: Beskrivelse under tittelen

#### Lenkekort - Send inn meldekort
- **linkForASende**: Objekt for lenkekort som sender meldekort
  - **tittel**: Tittel på lenkekortet
  - **beskrivelse**: Beskrivelse under tittelen
  - **fristTag**: Tag som vises i footer med frist-dato (vises som info-tag)
  - **tilleggstekstVedInnsendteMeldekort**: Tilleggstekst som vises når bruker har både meldekort å sende og innsendte meldekort

#### Lenkekort - Fyll ut meldekort
- **linkForAFylleUt**: Objekt for lenkekort som fyller ut meldekort
  - **tittel**: Tittel på lenkekortet
  - **beskrivelse**: Beskrivelse under tittelen

### Plassholdere

Innholdsredaktører kan bruke følgende plassholdere i tekstfeltene:

- `{{ytelse}}`: Erstattes med ytelsesnavnet fra `ytelser`-objektet
  - Eksempel: "Send {{ytelse}}-meldekort" → "Send dagpenger-meldekort"
- `{{dato}}`: Erstattes med formatert dato (automatisk hentes fra meldekortdata)
  - Norsk: "24. mars 2026"
  - Engelsk: "24 March 2026"

Plassholderne prosesseres automatisk av frontend basert på brukerens faktiske meldekortdata og valgt språk.

### Visningslogikk

Hvilke lenkekort som vises avhenger av brukerens meldekortdata. Hver ytelse viser **kun ett kort** basert på prioritet:

1. **"Send inn"** (`linkForASende`) - hvis det finnes meldekort som kan sendes
   - Viser frist-tag med nærmeste frist
   - Hvis bruker også har innsendte meldekort, vises tilleggstekst
2. **"Se innsendte"** (`linkForASe`) - hvis kun innsendte meldekort finnes (og ingen kan sendes)
3. **"Fyll ut"** (`linkForAFylleUt`) - kun for AAP, hvis meldekort kan fylles ut (men ikke sendes ennå)

Hvis brukeren kun har én ytelse, blir de automatisk videresendt til den ytelsens meldekortløsning.

## Arkitektur

### Filstruktur

```
src/lib/sanity/
├── client.ts       # Sanity klientkonfigurasjon
├── queries.ts      # GROQ-spørringer for å hente innhold
├── types.ts        # TypeScript-typer og hjelpefunksjoner
├── utils.ts        # Verktøyfunksjoner (f.eks. sanityDataMissing)
└── index.ts        # Eksporterer all Sanity-relatert funksjonalitet
```

### Internasjonalisering

Integrasjonen håndterer Sanitys internasjonaliserte felter via GROQ-queries:

1. Innhold lagres i Sanity som arrays med språknøkler (`nb`, `en`)
2. GROQ-queries filtrerer språket direkte i Sanity (mer effektivt)
3. Data returneres allerede flat og klart til bruk
4. Ingen klient-side prosessering nødvendig

### Bruk i Sider

```typescript
// I .astro-filer
import { sanityClient, getLandingssideQuery } from '../lib/sanity';
import type { MeldekortLandingsside } from '../lib/sanity';

// Bygg query for ønsket språk
const query = getLandingssideQuery('nb');

// Hent data (allerede filtrert for språk)
const content = await sanityClient.fetch<MeldekortLandingsside>(query);

// Bruk direkte - data er klar til bruk
const title = content?.tittel || 'Fallback tittel';
const linkTitle = content?.linkForASe.tittel;
const ytelseNavn = content?.ytelser.dagpenger; // "dagpenger"
const fristTag = content?.linkForASende.fristTag;
```

## Utvikling

### Teste Integrasjonen

1. Start utviklingsserveren: `pnpm dev`
2. Siden vil hente innhold fra Sanity og vise det
3. Hvis Sanity-data ikke er tilgjengelig, faller den tilbake til hardkodede oversettelser

### Typekontroll

Kjør typekontroll for å sikre at alt er korrekt typet:

```bash
pnpm run check
```

## Fallback-oppførsel

Implementasjonen inkluderer fallback-håndtering:

- Hvis Sanity-data ikke er tilgjengelig, bruker siden hardkodede oversettelser fra `src/lib/language.ts`
- Dette sikrer at siden forblir funksjonell selv om Sanity er utilgjengelig

## Ressurser

- [Sanity JS Client Dokumentasjon](https://www.sanity.io/docs/js-client)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
- [PortableText React](https://github.com/portabletext/react-portabletext)
- [Sanity Studio](https://www.sanity.io/docs/sanity-studio)
