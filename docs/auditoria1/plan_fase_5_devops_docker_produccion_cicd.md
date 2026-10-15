# 🐳 PLAN DE EJECUCIÓN — FASE 5: DEVOPS, DOCKER DE PRODUCCIÓN Y CI/CD

**Proyecto:** CentralPhone  
**Documento de Referencia:** [`docs/auditoria1/auditoria_tecnica_integral_centralphone.md`](./auditoria_tecnica_integral_centralphone.md)  
**Nivel de Prioridad:** Medio (P3) — Operatividad, Rendimiento y Despliegue  
**Estimación Total:** 10 horas de desarrollo  

---

## 1. 🎯 Objetivos de la Fase

1. **Dockerfiles Multi-Stage para Producción:** Optimizar las imágenes de contenedores de backend (NestJS) y frontend (Next.js) separando las etapas de compilación (*builder*) y ejecución (*runner*), reduciendo el tamaño de las imágenes de ~1.1GB a menos de 150MB y eliminando el código fuente y las `devDependencies` en runtime.
2. **Desacople de Ambientes (Desarrollo vs Producción):** Mantener `docker-compose.yml` optimizado para desarrollo local con recarga rápida (*Fast Refresh / Watch*), y crear `docker-compose.prod.yml` para despliegue productivo inmutable con políticas de reinicio y healthchecks estrictos.
3. **Pipeline de Integración Continua (CI):** Implementar flujos automatizados en GitHub Actions para validar en cada pull request: compilación de TypeScript, validación de reglas de linting y ejecución de pruebas unitarias.
4. **Endurecimiento de Seguridad en Contenedores:** Ejecutar los procesos de Node.js bajo usuarios sin privilegios de administrador (*non-root* `node` / `nextjs`) en cumplimiento de los estándares CIS Docker Benchmark.

---

## 2. 📋 Criterios de Éxito y Definition of Done (DoD)

* [ ] `backend/Dockerfile.prod` compila la aplicación con `nest build` y ejecuta exclusivamente el bundle en `dist/main.js` sobre una imagen Alpine mínima.
* [ ] `frontend/Dockerfile.prod` utiliza el modo `output: 'standalone'` de Next.js, copiando únicamente los archivos esenciales del servidor.
* [ ] Las imágenes resultantes no superan los 180MB en backend y 150MB en frontend.
* [ ] Ningún contenedor de producción corre bajo el usuario `root`.
* [ ] Se dispone del archivo `docker-compose.prod.yml` sin mapeos de volúmenes de código local (`./backend:/app`).
* [ ] Se crea el workflow `.github/workflows/ci.yml` que ejecuta chequeos de tipo y tests en paralelo.
* [ ] La infraestructura se levanta correctamente con un solo comando: `docker compose -f docker-compose.prod.yml up --build -d`.

---

## 3. 📂 Archivos Involucrados

| Archivo | Ruta | Acción |
| :--- | :--- | :--- |
| **Config Next.js** | `frontend/next.config.mjs` | Modificar (habilitar `output: 'standalone'`). |
| **Dockerfile Prod Backend**| `backend/Dockerfile.prod` | Crear (multi-stage NestJS). |
| **Dockerfile Prod Frontend**| `frontend/Dockerfile.prod` | Crear (multi-stage Next.js standalone). |
| **Compose Producción** | `docker-compose.prod.yml` | Crear (orquestación segura sin live-reload). |
| **Workflow CI** | `.github/workflows/ci.yml` | Crear (GitHub Actions pipeline). |
| **Script Despliegue** | `scripts/deploy.ps1` | Crear (automatización de migraciones y arranque). |

---

## 4. 🛠️ Paso a Paso Detallado de Implementación

### Paso 1: Habilitar Standalone en `frontend/next.config.mjs`
En `frontend/next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
```

### Paso 2: Creación de `backend/Dockerfile.prod`
```dockerfile
# ==========================================
# 1. ETAPA DE DEPENDENCIAS (deps)
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# ==========================================
# 2. ETAPA DE COMPILACIÓN (builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# ==========================================
# 3. ETAPA DE EJECUCIÓN (runner)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

# Usuario sin privilegios por seguridad
USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/package.json ./package.json

EXPOSE 4000
CMD ["node", "dist/main.js"]
```

### Paso 3: Creación de `frontend/Dockerfile.prod`
```dockerfile
# ==========================================
# 1. ETAPA DE DEPENDENCIAS (deps)
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# ==========================================
# 2. ETAPA DE COMPILACIÓN (builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==========================================
# 3. ETAPA DE EJECUCIÓN (runner)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Paso 4: Creación de `docker-compose.prod.yml`
```yaml
name: centralphone-prod

services:
  postgres:
    image: postgres:16-alpine
    container_name: centralphone_prod_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - centralphone_prod_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: centralphone_prod_backend
    restart: always
    env_file:
      - .env
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      BACKEND_PORT: ${BACKEND_PORT}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - "${BACKEND_PORT}:${BACKEND_PORT}"
    volumes:
      - uploads_prod_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - centralphone_prod_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: centralphone_prod_frontend
    restart: always
    env_file:
      - .env
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_APP_NAME: ${NEXT_PUBLIC_APP_NAME}
      PORT: ${FRONTEND_PORT}
    ports:
      - "${FRONTEND_PORT}:${FRONTEND_PORT}"
    depends_on:
      - backend
    networks:
      - centralphone_prod_net

volumes:
  postgres_prod_data:
    driver: local
  uploads_prod_data:
    driver: local

networks:
  centralphone_prod_net:
    driver: bridge
```

### Paso 5: Workflow de Integración Continua (`.github/workflows/ci.yml`)
```yaml
name: CentralPhone CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-checks:
    name: Backend Lint, Typecheck & Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Instalar Dependencias
        run: npm ci

      - name: Generar Prisma Client
        run: npx prisma generate

      - name: Verificación de Tipos TypeScript
        run: npx tsc --noEmit

      - name: Ejecutar Pruebas Automatizadas
        run: npm test

  frontend-checks:
    name: Frontend Typecheck & Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Instalar Dependencias
        run: npm ci

      - name: Verificación de Tipos TypeScript
        run: npx tsc --noEmit

      - name: Verificación de Compilación Next.js
        run: npm run build
```

---

## 5. 🧪 Plan de Verificación y Testing

1. **Construcción y Medición de Imágenes:**
   * Construir backend: `docker build -f backend/Dockerfile.prod -t centralphone-backend:prod ./backend`
   * Construir frontend: `docker build -f frontend/Dockerfile.prod -t centralphone-frontend:prod ./frontend`
   * Inspeccionar tamaño con `docker images`:
     * Verificar que el peso de ambas imágenes no supere 200MB cada una.
2. **Levantamiento Completo de Producción:**
   * Ejecutar: `docker compose -f docker-compose.prod.yml up -d`
   * Comprobar que los 3 contenedores inicien en estado `running` sin reinicios continuos.
   * Probar el acceso a la web en `http://localhost:3000` y al backend en `http://localhost:4000/api/v1/configuracion`.
3. **Validación de Usuario No-Root:**
   * Ejecutar: `docker exec -it centralphone_prod_backend whoami` $\to$ debe retornar `node`.
   * Ejecutar: `docker exec -it centralphone_prod_frontend whoami` $\to$ debe retornar `nextjs`.
