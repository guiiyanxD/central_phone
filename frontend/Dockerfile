# ------------------------------------------
# DOCKERFILE - FRONTEND NEXT.JS
# ------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto del frontend
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para desarrollo con Fast Refresh
CMD ["npm", "run", "dev"]
