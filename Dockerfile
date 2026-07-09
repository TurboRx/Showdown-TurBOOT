# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy TypeScript source and config
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → JavaScript
RUN npm run build

# Prune devDependencies so only production deps remain
RUN npm prune --omit=dev

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS production

# Add labels for GitHub Container Registry
LABEL org.opencontainers.image.source="https://github.com/TurboRx/Showdown-TurBOOT"
LABEL org.opencontainers.image.description="Pokémon Showdown Battle/ChatBot"
LABEL org.opencontainers.image.licenses="MIT"

# Run as non-root for security
RUN addgroup -S turboot && adduser -S turboot -G turboot

WORKDIR /app

# Copy only compiled JS and production node_modules from the builder
COPY --from=builder /build/dist/ ./dist/
COPY --from=builder /build/node_modules/ ./node_modules/
COPY --from=builder /build/package.json ./

# Switch to non-root user
USER turboot

# The bot reads env vars directly — pass them via docker run -e or .env file
CMD ["node", "dist/index.js"]
