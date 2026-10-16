# 📊 Auditoría 2: Experiencia de Usuario e Interfaz (UI/UX) - CentralPhone

Documentación técnica y resultados consolidados de la **Segunda Auditoría del Sistema CentralPhone**, enfocada en la evaluación ergonómica de mostrador, accesibilidad web (WCAG 2.2), consistencia del sistema de diseño, microinteracciones y leyes cognitivas de UX.

---

## 📑 Índice de Documentos

1. **[informe-auditoria-ux-centralphone.md](./informe-auditoria-ux-centralphone.md)**: Informe completo unificado del panel de 5 auditores especialistas, incluyendo:
   - Resumen ejecutivo y 3 mayores riesgos / aciertos.
   - **Scorecard general (5.6 / 10)**.
   - **Top 10 Hallazgos Priorizados** (`P0` a `P3`) con evidencias exactas de código y propuestas de corrección.
   - Arbitraje de conflictos técnicos (densidad POS vs touch targets 44px, confirmaciones vs velocidad, UI optimista vs 3FN).
   - Roadmap de remediación en 3 etapas (Semana 1, Sprint 1 y Sprint 2).
   - Protocolo de pruebas con hardware real y lectores de pantalla.
   - Anexo con la matriz completa de hallazgos por especialista (`ID-DS-*`, `ID-A11Y-*`, `ID-POS-*`, `ID-MI-*`, `ID-UX-*`).

---

## 🎯 Hallazgos Críticos P0 a Atender
* **`ID-POS-001`**: Falta de `autoFocus` e inserción automática con tecla `Enter` en escaneo continuo de IMEIs con lector láser.
* **`ID-A11Y-001`**: Botones de cantidad (+/-) y eliminar con áreas táctiles < 24 px en tabletas de mostrador (incumple WCAG 2.5.8 / 2.5.5).
* **`ID-UX-001`**: Ausencia de calculadora de cambio/vuelto en efectivo (violación de la Ley de Tesler y causa de descuadres de arqueo).
