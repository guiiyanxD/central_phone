# ------------------------------------------
# DOCKERFILE - BACKEND NESTJS
# ------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Instalar dependencias necesarias para compilar Prisma
RUN apk add --no-cache openssl libc6-compat

# Copiar manifiestos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el código fuente
COPY . .

# Exponer el puerto del backend
EXPOSE 4000

# Comando para desarrollo con recarga en vivo
CMD ["npm", "run", "start:dev"]
