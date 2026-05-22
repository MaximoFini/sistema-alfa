---
description: Analiza cambios en staging, valida el build, redacta mensaje y hace commit.
---
# Auto Commit Workflow

## Objetivo
Analizar los cambios en staging, validar que la app no se rompa, redactar un mensaje de commit profesional y subirlo al repositorio.

## Pasos

1. **Validación de Build:**
   - Comando: `npm run build`
   - Condición: Si falla, abortar inmediatamente el flujo y reportar los errores. No hacer commit.

2. **Generar Mensaje de Commit (AI):**
   - El agente debe analizar todos los archivos que están en staging (`git diff --cached`).
   - Redactar un mensaje de commit claro, conciso y técnico.
   - Formato: Usar el estándar de *Conventional Commits* (ej: `feat(ui): ...`, `fix(auth): ...`).

3. **Ejecutar Git Commit:**
   - Comando: `git commit -m "[Mensaje generado por el agente]"`
   - Acción: Aplicar el mensaje redactado en el paso anterior.

4. **Push a Producción (Opcional/Seguro):**
   - Comando: `git push origin HEAD`
   - Descripción: Sube los cambios a la rama actual de forma segura.
