FROM node:20-alpine AS base

# Installer les dépendances
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm i

# Builder l'application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optimisation de l'étape Prisma
RUN mkdir -p /app/src/generated/prisma
# Copier uniquement le schema Prisma pour génération
COPY prisma/schema.prisma ./prisma/
# Générer le client Prisma avec timeout et optimisations
RUN NODE_ENV=production npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Image de production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]