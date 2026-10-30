# Build stage
FROM node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85 AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

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
FROM node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85 AS prod-deps

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    pnpm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN) && \
    pnpm install --ignore-scripts --frozen-lockfile --prod && \
    pnpm config delete //npm.pkg.github.com/:_authToken

# Runtime stage
FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26@sha256:56318b4d534eed41f70a37b52cff36e78e05fe5e4693aa997532ac27fddc7bbb AS runtime

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
