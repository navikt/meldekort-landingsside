# Analytics oppsett

Meldekort landingsside bruker Umami via NAV's dekoratør for analytics.

## Hvordan det fungerer

Analytics er satt opp gjennom `@navikt/nav-dekoratoren-moduler` som leverer Umami-integrasjon.

### Filstruktur

```
src/
├── lib/utils/analytics.ts      # Core analytics utilities
├── hooks/useAnalytics.ts        # React hook for komponenter
└── scripts/analytics.ts         # Client-side script for sidevisning-tracking
```

## Automatisk tracking

### Sidevisninger

Sidevisninger trackes automatisk når siden lastes via `src/scripts/analytics.ts`:

```typescript
// Importeres i index.astro
<script>
  import "../scripts/analytics";
</script>
```

Dette scriptet:
- Venter på at dekoratøren er ferdig lastet (`awaitDecoratorData()`)
- Sjekker at bruker har samtykket til analytics
- Tracker initial sidevisning

### Kort-visning

Når meldekort-kort vises på landingssiden, trackes automatisk:
- Hvilke kort-typer som vises (se, sende, fyll ut)
- Hvilke ytelser som vises (dagpenger, aap, tiltakspenger)
- Antall kort av hver type

Dette skjer automatisk via `src/scripts/analytics.ts` når siden lastes og kort er synlige (ikke ved API-feil).

## Manuell tracking

### I React komponenter

Bruk `useAnalytics` hook:

```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackYtelseNavigasjon, trackEvent } = useAnalytics();

  const handleClick = () => {
    trackYtelseNavigasjon('dagpenger', 'https://www.nav.no/dagpenger/meldekort');
  };

  return <button onClick={handleClick}>Gå til dagpenger</button>;
}
```

### I Astro-sider eller vanilla JS

Importer direkte fra analytics utilities:

```typescript
import { trackEvent, trackScenarioValg } from '../lib/utils/analytics';

// Track custom event
trackEvent('button klikket', {
  buttonId: 'submit-button',
  page: 'homepage',
});

// Track scenario valg (kun i mock mode)
trackScenarioValg('kun-dagpenger');
```

## Tilgjengelige tracking-funksjoner

### `trackPageView(url?: string)`
Tracker sidevisning. URL er valgfri, bruker `window.location` som default.

### `trackYtelseNavigasjon(ytelse, kortType, url)`
Tracker når bruker navigerer til en ytelse.
- `ytelse`: 'dagpenger' | 'aap' | 'tiltakspenger'
- `kortType`: 'se' | 'sende' | 'fyllUt'
- `url`: URL til ytelsen

### `trackKortVisning(visning)`
Tracker hvilke kort som vises på landingssiden.
- `visning`: Object med arrays av ytelser per kortType
  - `se`: string[] - ytelser med "Se innsendte" kort
  - `sende`: string[] - ytelser med "Send inn" kort
  - `fyllUt`: string[] - ytelser med "Fyll ut" kort

### `trackSprakEndret(gammeltSprak, nyttSprak)`
Tracker språkendring.

### `trackEvent(event, props)`
Generisk event tracking.

## Samtykke (Consent)

All analytics respekterer brukerens samtykke-innstillinger fra dekoratøren:

```typescript
// Sjekkes automatisk i alle tracking-funksjoner
const { consent } = getCurrentConsent();
if (!consent.analytics) return; // Tracker ikke hvis bruker ikke har samtykket
```

## Data som sendes

Alle events inkluderer automatisk:
- `skjemanavn: 'meldekort-landingsside'`
- Custom props spesifisert i hver tracking-funksjon

### Eksempel event-data

**Sidevisning:**
```json
{
  "skjemanavn": "meldekort-landingsside",
  "url": "/meldekort"
}
```

**Navigasjon til ytelse:**
```json
{
  "skjemanavn": "meldekort-landingsside",
  "ytelse": "dagpenger",
  "kortType": "sende",
  "url": "https://www.nav.no/dagpenger/meldekort"
}
```

**Kort-visning:**
```json
{
  "skjemanavn": "meldekort-landingsside",
  "antallSe": 1,
  "antallSende": 2,
  "antallFyllUt": 0,
  "ytelser": "tiltakspenger,dagpenger,aap"
}
```

## Debugging

For å debugge analytics i development:
1. Åpne browser console
2. Analytics events logges via dekoratørens logger
3. Sjekk at `getCurrentConsent().consent.analytics === true`

## Eksempler fra kodebasen

### MeldekortLinkCards.tsx
Tracker når bruker klikker på en ytelse-lenke:
```typescript
const handleClick = () => {
  trackYtelseNavigasjon(info.ytelse, kortType, info.url);
};
```

### scripts/analytics.ts
Tracker automatisk kort-visning ved sideopplastning:
```typescript
const meldekortVisning = window.__MELDEKORT_VISNING__;
if (meldekortVisning && !meldekortVisning.apiFeil && meldekortVisning.harKort) {
  const { visning } = meldekortVisning;
  trackKortVisning({
    se: visning.se.map((v) => v.ytelse),
    sende: visning.sende.map((v) => v.ytelse),
    fyllUt: visning.fyllUt.map((v) => v.ytelse),
  });
}
```
