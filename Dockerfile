# Build stage
FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS builder
RUN npm install -g corepack@latest --force && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

RUN corepack prepare pnpm --activate
RUN pnpm config set @navikt:registry=https://npm.pkg.github.com

# Install dependencies with GitHub Packages authentication
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    pnpm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN) && \
    pnpm install --ignore-scripts --frozen-lockfile && \
    pnpm config delete //npm.pkg.github.com/:_authToken

COPY . .

RUN pnpm run build

# Export build to filesystem (GitHub)
FROM scratch AS export
COPY --from=builder /app/dist ./dist

# Production dependencies stage
FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS prod-deps
RUN npm install -g corepack@latest --force && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

RUN corepack prepare pnpm --activate
RUN pnpm config set @navikt:registry=https://npm.pkg.github.com

RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    pnpm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN) && \
    pnpm install --ignore-scripts --frozen-lockfile --prod && \
    pnpm config delete //npm.pkg.github.com/:_authToken

# Runtime stage
FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26@sha256:667fea2112c49afcd3450dd5b9dcf22e8fa4bbba195cc10c6404bc03f37cd11e AS runtime

WORKDIR /app

ENV TZ="Europe/Oslo"
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy production dependencies and built application
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["dist/server/entry.mjs"]
