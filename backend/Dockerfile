# ------------------------------------------
# DOCKERFILE - BACKEND NESTJS (MULTI-STAGE)
# ------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Instalar dependencias nativas para compilación de Prisma y Sharp
RUN apk add --no-cache openssl libc6-compat

# Copiar manifiestos de dependencias y esquema Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el código fuente completo
COPY . .

# Compilar NestJS a JavaScript de producción (dist/)
RUN npm run build

# ------------------------------------------
# STAGE: DESARROLLO LOCAL (WATCH & RELOAD)
# ------------------------------------------
FROM base AS development

EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# ------------------------------------------
# STAGE: PRODUCCIÓN (RENDER / CLOUD DEPLOY)
# ------------------------------------------
FROM base AS production

ENV NODE_ENV=production

# Render asigna dinámicamente PORT (por defecto 10000 o 4000)
EXPOSE 4000 10000

# En el arranque de producción: sincronizar esquema con PostgreSQL y arrancar servidor compilado
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
