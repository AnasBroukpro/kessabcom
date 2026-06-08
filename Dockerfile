# ── Stage 1 : Build Frontend ──
FROM node:20-alpine AS builder
WORKDIR /app

# Build args pour les variables VITE_* (injectées par cloudbuild.yaml)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIRESTORE_DATABASE_ID
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_GOOGLE_MAPS_API_KEY

COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
# Rendre les VITE_* vars disponibles pour le build frontend
COPY .env.cloudbuild .env
RUN npm run build

# ── Stage 2 : Runner ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
# Installer uniquement les dépendances de production
RUN npm ci --omit=dev && npm cache clean --force

# Copier le build du frontend
COPY --from=builder /app/dist ./dist

# Copier les fichiers nécessaires pour le backend
COPY server.ts ./
COPY tsconfig.json ./
# Services métiers (monétisation, paiement, notifications)
COPY cashplusService.ts ./
COPY whatsappService.ts ./

# Cloud Run injecte la variable PORT (8080), exposé pour documentation
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

USER appuser

CMD ["npx", "tsx", "server.ts"]

