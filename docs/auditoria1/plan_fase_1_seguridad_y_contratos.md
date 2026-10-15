# 🛡️ PLAN DE EJECUCIÓN — FASE 1: SEGURIDAD CRÍTICA Y CONTRATOS DE DATOS

**Proyecto:** CentralPhone  
**Documento de Referencia:** [`docs/auditoria1/auditoria_tecnica_integral_centralphone.md`](./auditoria_tecnica_integral_centralphone.md)  
**Nivel de Prioridad:** Inmediato (P0) — Bloqueante de Producción  
**Estimación Total:** 8 horas de desarrollo  

---

## 1. 🎯 Objetivos de la Fase

1. **Blindaje de Autenticación y RBAC:** Eliminar el backdoor de elevación de privilegios (`switchRole`) y remover todas las credenciales maestras quemadas en el bundle del cliente web (Next.js).
2. **Sincronización de Contrato de Datos Bancarios:** Corregir el desajuste de propiedades entre la entidad `ConfiguracionNegocio` del backend y las vistas frontend (`pos/page.tsx`, `page.tsx`, `configuracion/page.tsx`) para asegurar que el QR oficial y la cuenta receptora se actualicen dinámicamente en tienda.
3. **Erradicación de Secretos y Rutas Hardcodeadas en Backend:** Parametrizar las contraseñas iniciales de `admin` y `vendedor` en el seeder mediante variables de entorno, y sustituir rutas locales estáticas de Windows por resolución dinámica relativa multiplataforma.
4. **Activación del Control de Versiones:** Inicializar el repositorio Git en la raíz del proyecto para asegurar la vigencia activa de `.gitignore`.

---

## 2. 📋 Criterios de Éxito y Definition of Done (DoD)

* [ ] Ningún archivo del frontend (`frontend/src/**/*`) contiene contraseñas en texto plano ni tokens maestros.
* [ ] El menú de usuario de [`navbar.tsx`](../../frontend/src/components/layout/navbar.tsx) no ofrece opciones para cambiar de rol sin autenticación legítima.
* [ ] La pantalla de login ([`login/page.tsx`](../../frontend/src/app/login/page.tsx)) requiere ingreso manual de credenciales sin botones de auto-llenado que revelen contraseñas.
* [ ] Al actualizar el nombre del banco, titular o cuenta en `/configuracion`, los cambios se reflejan inmediatamente en la proyección del QR en `/pos` y en el Panel de Operaciones (`/`).
* [ ] El seeder de backend genera los usuarios iniciales leyendo variables de entorno (`INITIAL_ADMIN_PASSWORD`, etc.) con valores por defecto seguros.
* [ ] El comando `git status` reporta un repositorio inicializado y limpio, con `.env` ignorado.
* [ ] `npx tsc --noEmit` pasa en verde en `backend` y `frontend`.

---

## 3. 📂 Archivos Involucrados

| Archivo | Ruta | Acción |
| :--- | :--- | :--- |
| **Auth Context** | `frontend/src/context/auth-context.tsx` | Modificar (remover `switchRole` y contraseñas quemadas). |
| **Navbar UI** | `frontend/src/components/layout/navbar.tsx` | Modificar (remover conmutador visual de rol). |
| **Login Page** | `frontend/src/app/login/page.tsx` | Modificar (remover tarjetas de autocompletado de prueba). |
| **POS Page** | `frontend/src/app/pos/page.tsx` | Modificar (ajustar lectura a `bancoOficial`, `titularCuenta`, etc.). |
| **Home Hub** | `frontend/src/app/page.tsx` | Modificar (ajustar lectura de datos bancarios). |
| **Config Page** | `frontend/src/app/configuracion/page.tsx` | Modificar (ajustar formulario para mapear directo al modelo Prisma). |
| **Backend Seeder**| `backend/src/prisma/seed.service.ts` | Modificar (parametrizar contraseñas y corregir path CSV). |
| **Plantilla Env**| `.env.example` | Modificar (declarar nuevas variables del seeder). |
| **Entorno Local**| `.env` | Modificar (asignar valores seguros locales). |

---

## 4. 🛠️ Paso a Paso Detallado de Implementación

### Paso 1: Purgar Backdoor en `frontend/src/context/auth-context.tsx`
1. Remover de la interfaz `AuthContextType` el método `switchRole`.
2. Eliminar la implementación de `switchRole` que aloja las credenciales `{ email: 'admin@centralphone.com', password: 'admin123456' }`.
3. Mantener exclusivamente los métodos `login` y `logout`.

```typescript
// En frontend/src/context/auth-context.tsx:
// ELIMINAR switchRole de AuthContextType y AuthProvider
interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}
```

### Paso 2: Limpieza de la Barra de Navegación en `frontend/src/components/layout/navbar.tsx`
1. Eliminar del hook `useAuth()` la importación de `switchRole`.
2. Remover el bloque `<div className="space-y-0.5 mb-1.5">` que renderiza "Cambiar Rol de Sesión" con los botones de Administrador y Vendedor Mostrador.
3. El menú de usuario debe mostrar únicamente:
   * Nombre y correo del usuario activo.
   * Sucursal física asignada.
   * Rol asignado (solo lectura).
   * Botón de Cerrar Sesión (`logout()`).

### Paso 3: Retirar Credenciales de `frontend/src/app/login/page.tsx`
1. Eliminar la función auxiliar `fillCredentials(userEmail, userPass)`.
2. Eliminar la sección visual inferior:
   ```tsx
   {/* Accesos Rápidos para Evaluación y Testing */}
   <div className="border-t border-slate-100 pt-4 space-y-2">...</div>
   ```
3. Mantener únicamente el formulario estándar de correo y contraseña.

### Paso 4: Unificar Contrato de Datos Bancarios en Frontend
El backend entrega el objeto [`ConfiguracionNegocio`](../../backend/prisma/schema.prisma) con las propiedades:
* `bancoOficial` (string)
* `titularCuenta` (string)
* `numeroCuenta` (string)
* `tipoCuenta` (string)
* `qrOficialImagenUrl` (string)

#### Modificaciones Requeridas:
1. **En `frontend/src/app/configuracion/page.tsx` (Líneas 62-65):**
   ```typescript
   // ANTES (erróneo):
   setBanco(configData.datosBancarios?.banco || 'Banco de Crédito BCP');
   setTitular(configData.datosBancarios?.titular || 'Alex Gomez');
   setNumeroCuenta(configData.datosBancarios?.numeroCuenta || '201-50893214-3-12');

   // DESPUÉS (corregido):
   setBanco(configData.bancoOficial || '');
   setTitular(configData.titularCuenta || '');
   setNumeroCuenta(configData.numeroCuenta || '');
   ```

2. **En `frontend/src/app/pos/page.tsx` (Líneas 648-654 y 733-749):**
   Sustituir todas las referencias `configuracion?.datosBancarios?.banco` por:
   ```tsx
   <p className="font-semibold text-slate-900 truncate">
     {configuracion?.bancoOficial || 'Banco no configurado'}
   </p>
   <p className="text-slate-500 font-mono text-[10px] mt-0.5 truncate">
     Titular: {configuracion?.titularCuenta || 'CentralPhone'}
   </p>
   <p className="text-slate-500 font-mono text-[10px] truncate">
     Cta: {configuracion?.numeroCuenta || 'N/A'}
   </p>
   ```

3. **En `frontend/src/app/page.tsx` (Líneas 215, 270-272):**
   Aplicar el mismo mapeo directo sobre `configuracion?.bancoOficial`, `configuracion?.titularCuenta` y `configuracion?.numeroCuenta`.

### Paso 5: Parametrizar y Sanear `backend/src/prisma/seed.service.ts`
1. Agregar variables a `.env.example` y `.env`:
   ```env
   # Credenciales para inicialización automática de base de datos
   INITIAL_ADMIN_EMAIL=admin@centralphone.com
   INITIAL_ADMIN_PASSWORD=change_this_admin_password_in_prod_123
   INITIAL_VENDEDOR_EMAIL=vendedor@centralphone.com
   INITIAL_VENDEDOR_PASSWORD=change_this_vendedor_password_in_prod_123
   ```
2. En `seed.service.ts`:
   * Leer `process.env.INITIAL_ADMIN_PASSWORD` (con fallback de desarrollo seguro).
   * Leer `process.env.INITIAL_VENDEDOR_PASSWORD`.
   * Eliminar la ruta estática `'C:\\Users\\USUARIO\\Desktop\\...'` y utilizar:
     ```typescript
     const possiblePaths = [
       path.resolve(process.cwd(), 'docs/requerimientos/combinaciones_iphone18.csv'),
       path.resolve(process.cwd(), '../docs/requerimientos/combinaciones_iphone18.csv'),
       path.resolve(__dirname, '../../docs/requerimientos/combinaciones_iphone18.csv'),
     ];
     ```

### Paso 6: Inicialización del Repositorio Git
1. Ejecutar en la raíz del proyecto:
   ```powershell
   git init
   ```
2. Verificar con `git status` que el archivo `.env` esté ignorado.
3. Crear el commit base:
   ```powershell
   git add .
   git commit -m "chore(infra): inicializar repositorio git y blindar seguridad de variables de entorno"
   ```

---

## 5. 🧪 Plan de Verificación y Testing

1. **Prueba de Compilación Estricta:**
   * Ejecutar en backend: `npx tsc --noEmit`
   * Ejecutar en frontend: `npx tsc --noEmit`
   * Ambos deben reportar 0 errores.
2. **Prueba de Autenticación y RBAC:**
   * Iniciar sesión como vendedor (`vendedor@centralphone.com`).
   * Verificar en el navegador que el navbar **NO** permita saltar a Administrador.
   * Intentar acceder por URL a `/configuracion` y validar que el botón de guardado esté deshabilitado o no visible (modo solo lectura).
3. **Prueba de Ciclo Completo del QR:**
   * Iniciar sesión como Administrador (`admin@centralphone.com`).
   * Ir a `/configuracion`, cambiar el banco a `"Banco Unión"`, el titular a `"CentralPhone SRL"` y la cuenta a `"1000004928172"`. Presionar Guardar.
   * Ir a `/pos`, seleccionar cobro por QR y verificar que la ventana modal proyecte exactamente `"Banco Unión"`, `"CentralPhone SRL"` y la nueva cuenta.
