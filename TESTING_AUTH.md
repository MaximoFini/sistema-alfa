# 🧪 Plan de Testing - Sistema de Autenticación

## Pre-requisitos
1. Limpiar cookies del navegador
2. Limpiar localStorage
3. Abrir DevTools (F12)
4. Ir a la pestaña Console
5. Ir a la pestaña Network

---

## Test 1: Login Exitoso ✅

### Pasos:
1. Navegar a `http://localhost:3000/`
2. Ingresar credenciales correctas
3. Click en "Iniciar Sesión"

### Esperado:
- ✅ Botón muestra spinner de carga
- ✅ En console aparece "User ID: ..."
- ✅ En console aparece "Validation result: {isValid: true, role: '...'}"
- ✅ En console aparece "[Middleware] Redirecting to /inicio - has session"
- ✅ La página redirige a `/inicio`
- ✅ Se muestra el dashboard con sidebar/mobile nav
- ✅ El loading se detiene en máx 1 segundo

### En Network Tab:
- ✅ Ver POST a `/auth/v1/token` (login)
- ✅ Ver GET a `/inicio` (redirección)
- ✅ Ver cookies con nombres que comienzan con `sb-`

### En Application → Cookies:
- ✅ Debe haber cookies de Supabase (`sb-*`)
- ✅ Debe haber datos en localStorage

---

## Test 2: Credenciales Incorrectas ❌

### Pasos:
1. Ingresar email/password incorrectos
2. Click en "Iniciar Sesión"

### Esperado:
- ✅ Muestra error: "Correo o contraseña incorrectos."
- ✅ El botón vuelve al estado normal
- ✅ NO redirige
- ✅ Se queda en la página de login

---

## Test 3: Usuario sin Rol Autorizado 🚫

### Pasos:
1. Ingresar credenciales de un usuario con rol "Alumno"
2. Click en "Iniciar Sesión"

### Esperado:
- ✅ Muestra error: "No tienes permisos para acceder a este panel."
- ✅ La sesión se cierra automáticamente
- ✅ Se queda en la página de login

---

## Test 4: Acceso Directo a Ruta Protegida sin Sesión 🔒

### Pasos:
1. Sin estar logueado, navegar directamente a `http://localhost:3000/inicio`

### Esperado:
- ✅ En console aparece "[Middleware] Redirecting to login - no session"
- ✅ Redirige automáticamente a `/`
- ✅ Muestra la página de login

---

## Test 5: Acceso a Login con Sesión Activa ↩️

### Pasos:
1. Estar logueado
2. Navegar manualmente a `http://localhost:3000/`

### Esperado:
- ✅ En console aparece "[Middleware] Redirecting to /inicio - has session"
- ✅ Redirige automáticamente a `/inicio`
- ✅ No muestra el formulario de login

---

## Test 6: Navegación Entre Páginas 🔄

### Pasos:
1. Estar logueado en `/inicio`
2. Navegar a `/administracion` (si tienes permisos)
3. Navegar a `/comunicacion`
4. Volver a `/inicio`

### Esperado:
- ✅ Todas las navegaciones son rápidas (<500ms)
- ✅ NO se hacen consultas de auth en cada navegación (ver Network tab)
- ✅ El sidebar/nav muestra correctamente tu rol
- ✅ No hay re-renders infinitos

---

## Test 7: Refresh de Página 🔄

### Pasos:
1. Estar logueado en cualquier página
2. Presionar F5 o Ctrl+R

### Esperado:
- ✅ La página recarga correctamente
- ✅ Sigues logueado
- ✅ Se muestra el contenido correcto
- ✅ No redirige a login

---

## Test 8: Logout y Re-login 🚪

### Pasos:
1. Estar logueado
2. Click en "Cerrar Sesión"
3. Volver a hacer login

### Esperado:
- ✅ Cierra sesión correctamente
- ✅ Redirige a `/`
- ✅ Las cookies se borran
- ✅ El re-login funciona normal

---

## Test 9: Timeout de Seguridad ⏱️

### Pasos:
1. Modificar temporalmente el login para que se demore 15 segundos
2. Intentar login

### Esperado:
- ✅ Después de 10 segundos muestra error: "Tiempo de espera agotado. Intenta nuevamente."
- ✅ El botón vuelve al estado normal
- ✅ No se queda en loading infinito

---

## Test 10: Múltiples Tabs 📑

### Pasos:
1. Abrir 2 tabs del sistema
2. Hacer login en tab 1
3. Verificar tab 2

### Esperado:
- ✅ Ambas tabs reconocen la sesión
- ✅ Hacer logout en una tab afecta a ambas (con delay de ~1seg)

---

## Checklist de Problemas Comunes

### Si el loading se queda infinito:
- [ ] Verificar en Console si hay errores
- [ ] Verificar en Console los logs del middleware
- [ ] Verificar en Network si las cookies se están enviando
- [ ] Verificar si `router.push("/inicio")` se ejecutó

### Si redirige pero vuelve a login:
- [ ] Verificar cookies en Application tab
- [ ] Verificar que las cookies tengan el dominio correcto
- [ ] Verificar logs del middleware en Console
- [ ] Ver si el middleware detecta la sesión

### Si no encuentra el perfil:
- [ ] Verificar en Supabase que existe el registro en `profiles`
- [ ] Verificar que el `id` en `profiles` coincide con el `user.id` de auth

---

## Comandos de Debug

### Ver cookies en DevTools:
1. F12 → Application → Cookies → http://localhost:3000
2. Buscar cookies que empiecen con `sb-`

### Ver localStorage:
1. F12 → Application → Local Storage → http://localhost:3000
2. Buscar items de Supabase

### Ver Network:
1. F12 → Network
2. Filtrar por "supabase" o "auth"
3. Ver headers y response de cada request

---

## Resultado Esperado Final

Después de todos los tests:
- ✅ Login funciona en <1 segundo
- ✅ Redirección automática funciona
- ✅ No hay loading infinito
- ✅ Navegación es rápida
- ✅ No hay consultas redundantes
- ✅ Middleware protege rutas correctamente
- ✅ Cookies se sincronizan correctamente

---

## Notas para el Desarrollador

### Si algo falla:
1. Revisar la consola del navegador
2. Revisar la consola del servidor (terminal donde corre `npm run dev`)
3. Revisar Network tab para ver requests fallidos
4. Copiar los mensajes de error exactos

### Logs Importantes:
- `[Middleware] ...` → Información del middleware
- `User ID: ...` → ID del usuario logueado
- `Validation result: ...` → Resultado de la validación de permisos

### Variables a Verificar:
- `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`
- Que Supabase esté corriendo y accesible
