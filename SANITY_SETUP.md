# Sanity CMS Integrasjon

Dette prosjektet bruker Sanity CMS for å håndtere innhold til meldekort-landingssiden.

## Konfigurasjon

### Miljøvariabler

Opprett en `.env` fil basert på `.env.example`:

```bash
cp .env.example .env
```

Deretter konfigurer:

- `SANITY_DATASET`: Sanity-datasettet som skal brukes (standard: `production`)
- `SANITY_TOKEN`: Valgfritt token for private datasett (kan stå tom for offentlige datasett)

### Sanity Prosjektdetaljer

- **Project ID**: `rt6o382n`
- **Dataset**: Konfigurert via `SANITY_DATASET` miljøvariabel
- **API Version**: `2022-03-07`

## Innholdsstruktur

Landingssideinnholdet hentes fra en Sanity-dokumenttype som heter `meldekortLandingsside`.

### Skjemafelt

Skjemaet inkluderer følgende felter (alle med internasjonalisering for `nb` og `en`):

- **tittel**: Hovedoverskrift for landingssiden
- **emptyStateTekst**: Tekst som vises når ingen lenker skal vises (støtter rik tekst via PortableText)
- **body**: Bunntekst som vises under lenkekortene (støtter rik tekst via PortableText)
- **linkTittelForASe**: Tittel for lenkekort som viser innsendte meldekort
- **linkBeskrivelseForASe**: Beskrivelse for lenkekort som viser innsendte meldekort
- **linkTittelForASende**: Tittel for lenkekort som sender meldekort
- **linkBeskrivelseForASende**: Beskrivelse for lenkekort som sender meldekort
- **tilleggstekstVedInnsendteMeldekort**: Tilleggstekst som vises når bruker har både meldekort å sende og innsendte meldekort
- **linkTittelForAFylleUt**: Tittel for lenkekort som fyller ut meldekort
- **linkBeskrivelseForAFylleUt**: Beskrivelse for lenkekort som fyller ut meldekort

### Plassholdere

Innholdsredaktører kan bruke følgende plassholdere i tekstfeltene:

- `{{ytelse}}`: Vil bli erstattet med ytelsestypen (f.eks. "dagpenger")
- `{{dato}}`: Vil bli erstattet med en dato

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

// Bruk direkte - data er flat og klar til bruk
const title = content?.tittel || 'Fallback tittel';
const linkTitle = content?.linkForASe.tittel;
```

## Utvikling

### Teste Integrasjonen

1. Forsikre deg om at `.env`-filen er konfigurert korrekt
2. Start utviklingsserveren: `pnpm dev`
3. Siden vil hente innhold fra Sanity og vise det
4. Hvis Sanity-data ikke er tilgjengelig, faller den tilbake til hardkodede oversettelser

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
