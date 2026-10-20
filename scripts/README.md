# 🛡️ Scripts de Seguridad y Protección de Base de Datos - CentralPhone

Este directorio contiene scripts de protección activa para prevenir la eliminación accidental de la base de datos de PostgreSQL en entornos locales y servidores de producción.

---

## 🛑 1. ¿Qué previenen estos scripts?

El flag `-v` o `--volumes` en Docker Compose elimina los volúmenes persistentes asociados a los contenedores:
```bash
# ⚠️ PELIGRO: Este comando destruye el volumen postgres_data y todos los registros de la empresa
docker compose down -v
```

Estos scripts interceptan las llamadas al comando `docker` en la consola antes de que lleguen al ejecutable de Docker. Si detectan la combinación de `down` y el flag `-v` o `--volumes`, cancelan la ejecución inmediatamente y muestran una advertencia.

---

## 💻 2. Cómo activar la protección en Windows (PowerShell)

### Opción A: Activar en la sesión actual
En la raíz del proyecto:
```powershell
. .\scripts\prevent-destructive-docker.ps1
```

### Opción B: Activar de forma permanente en tu perfil de PowerShell
1. Abre tu perfil de PowerShell ejecutando:
   ```powershell
   notepad $PROFILE
   ```
2. Agrega la siguiente línea al final del archivo guardado:
   ```powershell
   if (Test-Path "C:\Users\USUARIO\Desktop\proyectos_personales\julieth\central_iphone\scripts\prevent-destructive-docker.ps1") {
       . "C:\Users\USUARIO\Desktop\proyectos_personales\julieth\central_iphone\scripts\prevent-destructive-docker.ps1"
   }
   ```

---

## 🐧 3. Cómo activar la protección en Linux / Servidor (Bash/Zsh)

1. En el servidor, añade la siguiente línea a tu archivo `~/.bashrc` o `~/.zshrc`:
   ```bash
   source /ruta/al/proyecto/centralphone/scripts/prevent-destructive-docker.sh
   ```
2. Recarga tu terminal:
   ```bash
   source ~/.bashrc
   ```

---

## 📦 4. Bloqueo en NPM / Prisma

En el archivo [`backend/package.json`](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/backend/package.json), los siguientes comandos destructivos están interceptados y bloqueados por defecto:
* `npm run prisma:reset`
* `npm run migrate:reset`

Si son invocados por error por un agente o desarrollador, se aborta el proceso con código de salida `exit 1`.
