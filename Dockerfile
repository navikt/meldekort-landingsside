# Build stage
FROM node:24-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

# Install dependencies with GitHub Packages authentication
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    pnpm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN) && \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production dependencies stage
FROM node:24-alpine AS prod-deps

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc ./

RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    pnpm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN) && \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# Runtime stage
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runtime

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
