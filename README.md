# Meldekort Landingsside

Landingsside for meldekort bygget med Astro og NAVs designsystem Aksel.

Dette repoet skal erstatte [meldekort-mikrofrontend](https://github.com/navikt/meldekort-mikrofrontend).

## Teknologistack

- **[Astro](https://astro.build/)** - Moderne web framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-sikkerhet
- **[React](https://react.dev/)** - UI komponenter (via Astro integrasjon)
- **[Aksel](https://aksel.nav.no/)** - NAVs designsystem
- **[Biome](https://biomejs.dev/)** - Linting og formattering
- **[pnpm](https://pnpm.io/)** - Pakkebehandler
- **[NAIS](https://doc.nais.io/)** - Deployment plattform

## Komme i gang

### Forutsetninger

- Node.js 25+
- pnpm 9.15.4+
- GitHub Personal Access Token med `read:packages` scope

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

### Utvikling

Start utviklingsserver:
```bash
pnpm run dev
```

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
│   ├── nais.yaml         # Dev konfigurasjon
│   └── nais-prod.yaml    # Prod konfigurasjon
├── public/               # Statiske filer
├── src/                  # Kildekode
│   ├── components/       # React komponenter
│   ├── layouts/          # Astro layouts
│   └── pages/            # Astro sider (routing)
├── astro.config.mjs      # Astro konfigurasjon
├── biome.json            # Biome konfigurasjon
├── Dockerfile            # Docker image konfigurasjon
├── package.json          # NPM avhengigheter og scripts
└── tsconfig.json         # TypeScript konfigurasjon
```

## CI/CD

Prosjektet bruker GitHub Actions for automatisk testing, bygging og deployment:

- **Test og Lint**: Kjører på alle PRs og pushes
- **Build**: Bygger Docker image ved push til main
- **Deploy**: Deployer automatisk til demo ved push til main

### Secrets som kreves

- `READER_TOKEN`: GitHub token med `read:packages` scope

## Deployment

Applikasjonen deployes til NAIS demo-miljø:

- **Demo**: https://meldekort-landingsside-demo.intern.dev.nav.no

## Golden Path Compliance

Dette prosjektet følger NAVs [Golden Path for Frontend](https://aksel.nav.no/god-praksis/artikler/golden-path-frontend) med tilpasninger for Astro:

- ✅ TypeScript med strict mode
- ✅ pnpm som pakkebehandler
- ✅ Aksel designsystem
- ✅ Biome for linting og formattering
- ✅ Docker containerisering
- ✅ NAIS deployment
- ✅ GitHub Actions CI/CD
- ✅ Dependabot for automatiske oppdateringer
- ✅ CodeQL sikkerhetsskanning (GitHub default setup)
- ✅ Git hooks med Husky

## Lisens

MIT - se [LICENSE](LICENSE)
