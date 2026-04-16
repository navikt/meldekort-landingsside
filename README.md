# Meldekort Landingsside

Landingsside for meldekort bygget med Astro og NAVs designsystem Aksel.

Dette repoet erstatter felles-meldekort som inngangsport til meldekort i Nav. Det er en midlertidig løsning til vi er ute av Arena, slik at brukere som har flere enn 1 ytelse har tilgang til sine meldekort.

## Teknologistack

### Frontend

- **[Astro](https://astro.build/)** - Moderne web framework med SSR
- **[TypeScript](https://www.typescriptlang.org/)** - Type-sikkerhet
- **[React](https://react.dev/)** - UI komponenter (via Astro integrasjon)
- **[Aksel](https://aksel.nav.no/)** - NAVs designsystem
- **[Vitest](https://vitest.dev/)** - Testing framework

### Backend / API

- **Meldekort-API integrasjoner**:
  - **Dagpenger** - `dp-rapportering` (teamdagpenger namespace)
  - **Arbeidsavklaringspenger** - `meldekort-backend` (AAP namespace)
  - **Tiltakspenger** - `tiltakspenger-meldekort-api` (tpts namespace)
  - **Arena** - `meldekort-api` (meldekort namespace) - Returnerer redirectUrl til felles-meldekort
- **[Sanity](https://www.sanity.io/)** - Headless CMS for innhold
- **[Winston](https://github.com/winstonjs/winston)** - Logging
- **[Umami](https://umami.is/)** - Analytics (via NAV Dekoratør)

### DevOps

- **[Biome](https://biomejs.dev/)** - Linting og formattering
- **[pnpm](https://pnpm.io/)** - Pakkebehandler
- **[NAIS](https://doc.nais.io/)** - Deployment plattform
- **[MSW](https://mswjs.io/)** - Mock Service Worker for testing

## Komme i gang

### Forutsetninger

- Node.js 24.0.0+
- pnpm 10.33.0+
- GitHub Personal Access Token med `read:packages` scope (for å hente @navikt-pakker)

### Installasjon

1. Klon repoet:

```bash
git clone https://github.com/navikt/meldekort-landingsside.git
cd meldekort-landingsside
```

2. Installer avhengigheter:

```bash
pnpm install
```

3. Sett opp miljøvariabler:

Kopier `.env.example` til `.env`:

```bash
cp .env.example .env
```

**Viktig**: Lokalt kjører applikasjonen på base path `/meldekort`, konfigurert via `.env`-filen. I NAIS-miljøene (dev og demo) settes base path via miljøvariabler definert i NAIS-konfigurasjonen.

### Utvikling

Start utviklingsserver:

```bash
pnpm run dev
```

Applikasjonen vil være tilgjengelig på:

- **Prod**: https://www.nav.no/meldekort
- **Dev**: https://meldekort-landingsside.intern.dev.nav.no/meldekort
- **Demo**: https://meldekort-landingsside-demo.intern.dev.nav.no/meldekort
- **Lokal**: http://localhost:4321/meldekort
- **Scenario-oversikt** (i mock mode): http://localhost:4321/meldekort/dev/scenarios

Kjør type-checking:

```bash
pnpm run check
```

Kjør linting:

```bash
pnpm run lint
```

Fiks linting automatisk:

```bash
pnpm run lint:fix
```

Formatér kode:

```bash
pnpm run format
```

Kjør tester:

```bash
pnpm run test
```

Kjør tester i watch mode:

```bash
pnpm run test:watch
```

### Mock Mode

For lokal utvikling kan du kjøre appen i mock mode uten å være innlogget:

1. Sett `ENFORCE_LOGIN=false` i `.env`
2. Bruk `?scenario=<navn>` query parameter for å teste forskjellige tilstander

Tilgjengelige scenarier:

- `default` - Standard mock data
- `ingen-meldekort` - Ingen meldekort (empty state)
- `kun-felles-meldekort` - Redirect til felles meldekort fra arena
- `kun-dagpenger`, `kun-aap`, `kun-tp` - Redirect til enkeltytelse
- `aap-og-tp`, `alle-ytelser` - Landingsside med flere ytelser
- `kun-innsendte`, `kun-utfylling` - Spesialtilfeller

Se [SCENARIOS.md](./SCENARIOS.md) for full dokumentasjon.

Testing av ulike scenarier er også tilgjengelig i Demo.

### Bygging

Bygg for produksjon:

```bash
pnpm run build
```

Forhåndsvis produksjonsbygg:

```bash
pnpm run preview
```

## Struktur

```
.
├── .github/              # GitHub Actions workflows og konfigurasjon
│   ├── workflows/        # CI/CD pipelines
│   └── dependabot.yml    # Automatiske avhengighetsoppdateringer
├── .husky/               # Git hooks
├── nais/                 # NAIS deployment konfigurasjon
│   ├── nais.yaml         # NAIS manifest template
│   ├── vars-prod.yaml    # Prod miljø variabler
│   ├── vars-dev.yaml     # Dev miljø variabler
│   └── vars-demo.yaml    # Demo miljø variabler
├── public/               # Statiske filer
├── src/                  # Kildekode
│   ├── components/       # React komponenter
│   ├── hooks/            # React hooks (useAnalytics)
│   ├── lib/              # Utilities og business logic
│   │   ├── api/          # API clients og helpers
│   │   │   ├── clients/  # API clients (AAP, Tiltakspenger)
│   │   │   ├── scenarios.ts  # Mock scenarier
│   │   │   └── helpers.ts    # API response handlers
│   │   ├── sanity/       # Sanity CMS integrasjon
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions (logger, analytics, meldekort)
│   ├── pages/            # Astro sider (routing)
│   │   ├── api/          # API endpoints
│   │   └── dev/          # Dev-only pages (scenario selector)
│   └── scripts/          # Client-side scripts (analytics, language handler)
├── ANALYTICS.md          # Analytics dokumentasjon
├── SCENARIOS.md          # Mock scenarier dokumentasjon
├── astro.config.mjs      # Astro konfigurasjon
├── biome.json            # Biome konfigurasjon
├── Dockerfile            # Docker image konfigurasjon
├── package.json          # NPM avhengigheter og scripts
├── tsconfig.json         # TypeScript konfigurasjon
└── vitest.config.ts      # Vitest test konfigurasjon
```

## Arkitektur

### Redirect-logikk

Applikasjonen bestemmer hva brukeren skal se basert på antall aktive ytelser:

**Steg 1: Hent data fra ytelsene**

- Dagpenger, Arbeidsavklaringspenger og tiltakspenger hentes parallelt

**Steg 2: Sjekk om noen ytelser har aktive meldekort**

En ytelse regnes som aktiv hvis den har:

- `innsendteMeldekort: true` ELLER
- `meldekortTilUtfylling` med minst ett element

**Steg 3: Bestem brukerflyt**

- **Ingen ytelser har aktive meldekort**: Kall arena (meldekort-api)
  - Arena returnerer `redirectUrl` → Redirect til felles-meldekort
  - Arena returnerer ikke `redirectUrl` → Vis tom landingsside
- **1 ytelse har aktive meldekort**: Redirect direkte til den ytelsens meldekortside
- **2+ ytelser har aktive meldekort**: Vis landingsside med kort for hver ytelse

### API-integrasjoner

- **Dagpenger**: `hentMeldekortDataFraDP()` - Henter data fra `dp-rapportering`
- **AAP**: `hentMeldekortDataFraAAP()` - Henter data fra `meldekort-backend` (AAP)
- **Tiltakspenger**: `hentMeldekortDataFraTP()` - Henter data fra `tiltakspenger-meldekort-api`
- **Arena**: `hentMeldekortDataFraArena()` - Henter redirectUrl fra `meldekort-api` (kalles kun når ingen ytelser har aktive meldekort)

### Analytics

Applikasjonen bruker Umami via NAV Dekoratør for analytics. Se [ANALYTICS.md](./ANALYTICS.md) for detaljer om:

- Automatisk tracking av sidevisninger og kort-visning
- Manuell tracking av brukerinteraksjoner
- Consent-håndtering

## Testing

Prosjektet har omfattende test-dekning:

- **Unit tests**: 128+ tester med Vitest
- **API helpers**: Tester for redirect-logikk, validering, timeout-håndtering
- **Analytics**: Tester for consent, event tracking, page views
- **Meldekort utils**: Tester for dato-logikk, kort-visning, timezone-håndtering

Kjør tester:

```bash
pnpm test                # Kjør alle tester
pnpm test:watch          # Watch mode
pnpm run test:coverage   # Med coverage report
```

## CI/CD

Prosjektet bruker GitHub Actions for automatisk testing, bygging og deployment:

- **Test og Lint**: Kjører på alle PRs og pushes
- **Build**: Bygger Docker image ved push til main
- **Deploy**: Deployer automatisk til demo → dev → prod ved push til main

### Secrets som kreves

- `READER_TOKEN`: GitHub token med `read:packages` scope

## Deployment

Applikasjonen deployes til NAIS med base path `/meldekort`:

- **Prod**: https://www.nav.no/meldekort
- **Dev**: https://meldekort-landingsside.intern.dev.nav.no/meldekort
- **Demo**: https://meldekort-landingsside-demo.intern.dev.nav.no/meldekort

## Viktig dokumentasjon

- **[ANALYTICS.md](./ANALYTICS.md)** - Analytics setup, tracking-funksjoner og eksempler
- **[SCENARIOS.md](./SCENARIOS.md)** - Mock scenarier for testing og utvikling
- **[Sanity CMS](https://meldekort.sanity.studio/)** - Innholds-editor (krever tilgang)

## Miljøvariabler

Konfigureres i `.env` lokalt og via NAIS i prod/dev/demo:

- `BASE_URL` - Base path for applikasjonen (default: `/meldekort`)
- `ENFORCE_LOGIN` - Krever innlogging (`true`/`false`, default: `true`)
- `SANITY_PROJECT_ID` - Sanity prosjekt-ID
- `SANITY_DATASET` - Sanity dataset (production/development)
- `SANITY_API_VERSION` - Sanity API versjon
- `DP_API_URL` - URL til Dagpenger meldekort-api
- `DP_API_AUDIENCE` - TokenX audience for Dagpenger
- `AAP_API_URL` - URL til AAP meldekort-api
- `AAP_API_AUDIENCE` - TokenX audience for AAP
- `TP_API_URL` - URL til Tiltakspenger meldekort-api
- `TP_API_AUDIENCE` - TokenX audience for Tiltakspenger
- `ARENA_API_URL` - URL til Arena meldekort-api
- `ARENA_API_AUDIENCE` - TokenX audience for Arena

## Golden Path Compliance

Dette prosjektet følger NAVs [Golden Path for Frontend](https://aksel.nav.no/god-praksis/artikler/golden-path-frontend) med tilpasninger for Astro.

## Bidra

1. Opprett en feature branch fra `main`
2. Gjør endringer og commit (husky kjører pre-commit hooks)
3. Push og opprett en Pull Request
4. Vent på CI/CD-sjekker og code review
5. Merge til `main` når godkjent
