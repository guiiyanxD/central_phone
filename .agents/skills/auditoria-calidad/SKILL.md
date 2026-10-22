---
name: auditoria-calidad
description: "Auditoría integral de calidad de código, Clean Architecture, SOLID, transaccionalidad ACID, calidad de pruebas y DevOps. Delega en el Lead Auditor y 7 especialistas. Invocable con /auditoria-calidad."
---

# Auditoría de Calidad de Código — CentralPhone

Objetivo de la auditoría indicado por el usuario: $ARGUMENTS
(Si el alcance no se especifica, asume auditoría integral del monorepo empezando por las features críticas: caja, ventas/pos e inventario.)

## Especialistas Disponibles
- `lead-auditor-calidad`: Senior Lead que coordina, consolida, arbitra conflictos y emite veredicto.
- `orquestador-arquitectura`: Mapea el repositorio y propone el plan de enrutamiento consultivo.
- `audit-arquitectura`: Regla de dependencia, límites entre features, puertos y adaptadores.
- `audit-solid-patrones`: Principios SOLID, prueba de costo de extensión y guía de diseño.
- `audit-backend-nestjs`: Módulos, controladores delgados, DTOs y validación.
- `audit-frontend-nextjs`: Server/Client components, páginas de composición y CDD.
- `audit-datos-acid`: Prisma + PostgreSQL 16, transacciones atómicas, concurrencia e invariantes.
- `audit-docker-devops`: Dockerfiles multi-stage, compose, 12 factores y resiliencia.
- `audit-calidad-tests`: TypeScript estricto, guardarraíles automáticos y pirámide de pruebas.

## Modo de Ejecución
1. Invoca al subagente `lead-auditor-calidad` pasando el alcance solicitado ($ARGUMENTS).
2. El Lead Auditor invocará al `orquestador-arquitectura` para trazar el `AUDIT_PLAN` y despachará a los especialistas.
3. Genera un único informe consolidado con Scorecard (0-10), Veredicto, Top 10 Hallazgos priorizados (P0-P3) y Hoja de Ruta por Olas.
