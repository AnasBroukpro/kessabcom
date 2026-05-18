# ── Stage 1 : Build Frontend ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2 : Runner ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Installer tsx globalement pour exécuter server.ts
RUN npm install -g tsx

COPY package*.json ./
# Installer uniquement les dépendances de production
RUN npm ci --omit=dev

# Copier le build du frontend
COPY --from=builder /app/dist ./dist

# Copier les fichiers nécessaires pour le backend
COPY server.ts ./
COPY tsconfig.json ./
# Copier firebase-applet-config.json s'il existe (optionnel)
COPY firebase-applet-config.json* ./

# Le port 3000 est utilisé par server.ts par défaut (via .env ou fallback)
EXPOSE 3000

CMD ["tsx", "server.ts"]
