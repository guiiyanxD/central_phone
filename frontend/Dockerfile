# ------------------------------------------
# DOCKERFILE - FRONTEND NEXT.JS (MULTI-STAGE)
# ------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat

# ------------------------------------------
# STAGE 1: DEPENDENCIAS
# ------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# ------------------------------------------
# STAGE 2: DESARROLLO LOCAL (HOT RELOAD)
# ------------------------------------------
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["npm", "run", "dev"]

# ------------------------------------------
# STAGE 3: BUILDER (COMPILACIÓN STANDALONE)
# ------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build -- --no-lint

# ------------------------------------------
# STAGE 4: PRODUCCIÓN (RUNNER ULTRA-LIGERO)
# ------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario y grupo de sistema sin privilegios de root (seguridad OWASP)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos estáticos
COPY --from=builder /app/public ./public

# Crear directorio .next con permisos correctos
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar bundle standalone generado por Next.js y assets estáticos optimizados
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
