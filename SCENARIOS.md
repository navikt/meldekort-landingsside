# Mock Scenarier

Når `ENFORCE_LOGIN=false` (mock mode), kan du bruke query parameter `?scenario=<navn>` for å teste forskjellige tilstander.

## Bruk

Legg til `?scenario=<navn>` i URL:
```
http://localhost:4321/meldekort?scenario=kun-dagpenger
```

## Tilgjengelige scenarier

### Redirect scenarier (kun én ytelse aktiv)

**`?scenario=kun-dagpenger`**
Kun dagpenger har aktive meldekort → redirect til dagpenger

**`?scenario=kun-aap`**
Kun AAP har aktive meldekort → redirect til AAP

**`?scenario=kun-tp`**
Kun tiltakspenger har aktive meldekort → redirect til tiltakspenger

### Landingsside scenarier (flere ytelser aktive)

**`?scenario=aap-og-tp`**
To ytelser (AAP og tiltakspenger) har aktive meldekort → viser landingsside med begge

**`?scenario=alle-ytelser`**
Alle tre ytelser har aktive meldekort → viser landingsside med alle tre

**`?scenario=default`** eller ingen scenario parameter
Standard mock data (alle tre ytelser aktive)

### Spesialtilfeller

**`?scenario=ingen-meldekort`**
Ingen ytelser har aktive meldekort → viser tom landingsside (empty state)

**`?scenario=kun-innsendte`**
Alle ytelser har kun innsendte meldekort (ingen til utfylling) → viser "Se innsendte" lenker

**`?scenario=kun-utfylling`**
Alle ytelser har kun meldekort til utfylling (ingen innsendte) → viser "Send inn" eller "Fyll ut" lenker

## Eksempler

```bash
# Lokal utvikling
http://localhost:4321/meldekort?scenario=kun-dagpenger
http://localhost:4321/meldekort?scenario=alle-ytelser
http://localhost:4321/meldekort?scenario=ingen-meldekort

# Demo miljø (hvis deployet med ENFORCE_LOGIN=false)
https://meldekort.demo.nav.no/meldekort?scenario=aap-og-tp
```

## Utvide med nye scenarier

Legg til nye scenarier i `src/lib/api/scenarios.ts`:

```typescript
export const scenarios = {
  // ... eksisterende scenarier

  'mitt-scenario': {
    dagpenger: { /* data */ },
    aap: undefined,
    tiltakspenger: { /* data */ },
  },
};
```
