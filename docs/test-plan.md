# Plan de Tests — Sistema Alfa

---

## Resumen Ejecutivo

**Sistema Alfa** es una aplicación web Next.js 16 (App Router) para la gestión integral de un gimnasio de artes marciales en Argentina. Usa Supabase como backend (Auth, PostgreSQL con RLS, realtime), PowerSync para sincronización offline-first y WhatsApp Web.js para comunicaciones masivas.

### Módulos identificados

| Módulo | Descripción |
|---|---|
| **Autenticación** | Login con Supabase Auth, roles Administrador / Recepcionista, middleware de redirección, caché de rol en localStorage |
| **Alumnos (inicio)** | Listado paginado, buscador, perfil de alumno, tab de pagos, tab de asistencias, modal de nuevo alumno |
| **Ingreso Web (verificar-dni)** | Scanner de DNI para control de acceso: valida plan, período de gracia, CUS de menores, registra asistencia en tiempo real |
| **Clase de Prueba (público)** | Formulario público (sin auth) para registro de alumnos de prueba con rate limiting por IP |
| **Administración** | Panel protegido por PasswordGate, sub-tabs: Diario de Actividad, Estadísticas Clientes, Estadísticas Productos, Finanzas, Ajustes de Negocio |
| **Finanzas** | Dashboard financiero mensual/semestral: ingresos brutos, neto, ticket promedio, deuda total, distribución por método de pago, historial semestral (RPC + fallback in-memory) |
| **Estadísticas** | KPIs demográficos, tasa de retención/churn, ranking top 5, asistencia por horario |
| **Comunicación (WhatsApp)** | Conexión/desconexión del cliente WhatsApp via QR, envío masivo de mensajes con filtros, historial de envíos |
| **Productos & Ventas** | Gestión de stock, categorías, ventas |
| **Planificación** | Base de ejercicios, planes de entrenamiento, planificador drag-and-drop, exportación a PDF |
| **Ajustes** | Configuración de planes de suscripción, métodos de pago, tarjetas aceptadas, usuarios del sistema, parámetros de alertas |

### Stack relevante para tests

- **Next.js 16** con App Router y Server Components
- **Supabase** (Auth, PostgreSQL, RLS con subquery optimization)
- **PowerSync** (sincronización offline-first con SQLite local)
- **Playwright** (ya instalado como devDependency `^1.61.0`, carpeta `playwright/` y `playwright-report/` presentes)
- **WhatsApp Web.js** (Puppeteer + LocalAuth, estado global en `globalThis`)
- **Zustand** para estado global (`admin-store.ts`, `static-data-store.ts`, `data-cache-store.ts`)
- **Zod** + **react-hook-form** para validaciones de formulario
- **Rate limiting** in-process basado en `Map` (`lib/rate-limit.ts`)

---

## 1. Tests Funcionales

### 1.1 Tests de Lógica de Negocio (Unit / Integration)

#### Módulo: `lib/rate-limit.ts` — `checkRateLimit`

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| UL-01 | Primera solicitud permitida | Invocación 1 de `checkRateLimit` siempre retorna `true` | Alta |
| UL-02 | Solicitudes dentro del límite | N solicitudes < max en ventana temporal retornan `true` | Alta |
| UL-03 | Solicitud que supera el límite | La solicitud N+1 retorna `false` | Alta |
| UL-04 | Reset de ventana | Pasada la ventana `windowMs`, el contador se resetea | Alta |
| UL-05 | Aislamiento de claves | Diferentes `key` no comparten contador | Media |
| UL-06 | `getClientIp` con header `x-forwarded-for` | Extrae la primera IP de una lista separada por comas | Media |
| UL-07 | `getClientIp` sin header | Retorna `"unknown"` | Media |

#### Módulo: `lib/whatsapp-client.ts` — `formatWhatsappNumber`

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| UW-01 | Número con código 549 completo | `5491123456789` → `5491123456789@c.us` | Alta |
| UW-02 | Número de 10 dígitos sin prefijo | `1112345678` → `5491112345678@c.us` | Alta |
| UW-03 | Número local con 15 | `1512345678` → `549112345678@c.us` (elimina el 15, agrega 549) | Alta |
| UW-04 | Número de 8 dígitos (BA sin área) | `12345678` → `54911112345678@c.us` (agrega 549+11) | Alta |
| UW-05 | Número vacío | Retorna string vacío | Media |
| UW-06 | Número con caracteres no numéricos | `+54 9 11 1234-5678` → `5491112345678@c.us` | Alta |
| UW-07 | Número 54 de 12 dígitos sin el 9 | Agrega el `9` en posición correcta | Alta |

#### Módulo: `app/api/verificar-dni/route.ts` — `determinarEstado`

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| UV-01 | Alumno con plan activo, más de 7 días | Retorna `estado: "al-dia"` | Crítica |
| UV-02 | Alumno con plan activo a 7 días o menos | Retorna `estado: "advertencia"` | Crítica |
| UV-03 | Alumno sin plan registrado | Retorna `estado: "vencido"`, `razonBloqueo: "sin_plan"` | Crítica |
| UV-04 | Alumno con plan futuro (no iniciado) | Retorna `estado: "vencido"`, `razonBloqueo: "plan_no_iniciado"`, con `fechaInicioPlan` | Crítica |
| UV-05 | Alumno en período de gracia (tiene disponibles) | Retorna `estado: "periodo_gracia"` con `clasesGracia` | Crítica |
| UV-06 | Alumno con período de gracia agotado | Retorna `estado: "vencido"` | Crítica |
| UV-07 | Menor de edad con CUS incompleto (<3 clases), plan activo | Retorna `estado: "advertencia"` | Crítica |
| UV-08 | Menor de edad con CUS >= 3 clases sin completar | Retorna `estado: "vencido"`, `razonBloqueo: "cus_vencido"` | Crítica |
| UV-09 | Alumno `es_prueba=true` sin asistencias previas | Registra asistencia y retorna `estado: "prueba"` | Alta |
| UV-10 | Alumno `es_prueba=true` con asistencia previa | Retorna `yaUsoClasePrueba: true` sin registrar nueva | Alta |

#### Módulo: `app/api/finanzas/route.ts` — Cálculos financieros

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| UF-01 | Cálculo de `ingresosBrutos` | `totalPagos + totalVentas` es la suma correcta | Alta |
| UF-02 | Cálculo de `ingresosMes` (neto) | `ingresosBrutos - (totalGastos + totalSueldos)` | Alta |
| UF-03 | Cálculo de `ticketPromedio` | `Math.round(totalPagos / cantidadPagos)`, 0 si no hay pagos | Alta |
| UF-04 | Distribución `formasPago` | Agrupa pagos y ventas por método, case-insensitive vía `activeMethodsLookup` | Alta |
| UF-05 | Variación porcentual mes anterior | `0` si `ingresosMesAnterior === 0`, porcentaje correcto si > 0 | Media |
| UF-06 | Parámetros `year` y `month` vía query string | Procesa correctamente mes/año arbitrarios; usa fecha actual si no se pasan | Alta |
| UF-07 | `ingresosHistorial` vía RPC `get_ingreso_mensual_semestre` | Formato `{mes, monto}[]` correcto cuando el RPC responde | Alta |
| UF-08 | Fallback in-memory si RPC falla | Calcula historial semestral desde queries en batch sin errores | Media |
| UF-09 | Rango correcto para primer vs segundo semestre | Meses 1-6 para primero, 7-12 para segundo | Alta |

#### Módulo: `lib/auth.ts` — `validateUserForLogin`

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| UA-01 | Administrador válido | Retorna `{isValid: true, role: "Administrador"}` | Crítica |
| UA-02 | Recepcionista válido | Retorna `{isValid: true, role: "Recepcionista"}` | Crítica |
| UA-03 | Usuario sin perfil en `profiles` | Retorna `{isValid: false, errorMessage: "Usuario no encontrado en el sistema."}` | Crítica |
| UA-04 | Usuario con rol diferente (ej: "Alumno") | Retorna `{isValid: false, errorMessage: "No tienes permisos para acceder a este panel."}` | Crítica |
| UA-05 | Error de Supabase durante consulta | Retorna `{isValid: false, errorMessage: "Error al verificar el usuario."}` | Alta |

#### Módulo: `app/api/users/route.ts` — `requireAdminSession` y cache de roles

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| UU-01 | Cache de rol en memoria válido | Segunda llamada no consulta `profiles` si el cache es vigente (<5 min) | Media |
| UU-02 | Cache expirado fuerza re-consulta | TTL de 5 minutos (ROLE_CACHE_TTL_MS) cumplido → consulta `profiles` | Media |
| UU-03 | No Administrador deniega acceso | Rol distinto de "Administrador" retorna `null` | Alta |

#### Módulo: `app/api/trial-registration/route.ts` — Validaciones

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| UT-01 | DNI con 7 dígitos válido | Pasa validación regex `^\d{7,8}$` | Alta |
| UT-02 | DNI con 8 dígitos válido | Pasa validación regex | Alta |
| UT-03 | DNI con 6 dígitos | Retorna 400 con mensaje de error | Alta |
| UT-04 | DNI con letras | Retorna 400 con mensaje de error | Alta |
| UT-05 | Actividad fuera de `ACTIVIDADES_PERMITIDAS` | Retorna 400 | Alta |
| UT-06 | Fecha de nacimiento en formato inválido | Retorna 400 | Alta |
| UT-07 | Campos requeridos vacíos (cada uno) | Retorna 400 con el campo específico | Alta |
| UT-08 | DNI con clase de prueba ya usada | Retorna 409 con `code: "TRIAL_ALREADY_REGISTERED"` | Alta |
| UT-09 | DNI de alumno regular | Retorna 409 con `code: "ALREADY_MEMBER"` | Alta |
| UT-10 | Registro exitoso nuevo alumno | Retorna 201 con `success: true`, alumno insertado con `es_prueba=true` | Crítica |

---

### 1.2 Tests End-to-End (Flujos de Usuario)

Herramienta: **Playwright** (ya instalado). Los tests deben correr contra entorno de staging/Supabase test project.

#### Flujo 1: Login y redirección

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| E2E-01 | Login exitoso como Administrador | Ingresar credenciales → `middleware.ts` redirige a `/inicio` | Crítica |
| E2E-02 | Login exitoso como Recepcionista | Ídem, misma redirección | Alta |
| E2E-03 | Login con credenciales incorrectas | Permanecer en `/` con mensaje de error | Alta |
| E2E-04 | Acceso directo a ruta protegida sin sesión | `GET /inicio` → redirige a `/` | Crítica |
| E2E-05 | Acceso a `/` con sesión activa | Redirige a `/inicio` | Alta |
| E2E-06 | Logout | Limpia sesión, redirige a `/`, borra `auth-role-*` de localStorage | Alta |

#### Flujo 2: Gestión de alumnos (`/inicio`)

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| E2E-07 | Lista de alumnos se carga | Componente `AlumnosList` muestra alumnos desde PowerSync | Crítica |
| E2E-08 | Buscador filtra por nombre | `Buscador.tsx`: escribir nombre → lista se filtra | Alta |
| E2E-09 | Paginación funciona | `Paginacion.tsx`: navegar entre páginas muestra distintos alumnos | Alta |
| E2E-10 | Crear nuevo alumno (Paso 1 — datos personales) | `NuevoAlumnoModal.tsx`: completar DNI, nombre, fecha nacimiento → avanzar a paso 2 | Crítica |
| E2E-11 | Crear nuevo alumno (Paso 2 — cobro) | Completar actividad, precio, medio de pago → guardar → llama `crear_alumno_con_cobro` RPC | Crítica |
| E2E-12 | Nuevo alumno duplicado por DNI | Mostrar error si DNI ya existe (constraint unique en `alumnos`) | Alta |
| E2E-13 | Abrir perfil de alumno | Click en alumno → navega a `/inicio/[alumnoId]` con `AlumnoPerfil` | Alta |
| E2E-14 | Registrar cobro desde perfil | `RegistrarCobroModal.tsx`: completar pago → actualiza `TabPagos` | Crítica |
| E2E-15 | Tab Asistencias muestra historial | `TabAsistencias.tsx`: lista de fechas/horas de asistencia del alumno | Media |

#### Flujo 3: Ingreso Web — Scanner de DNI (`/ingreso-web`)

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| E2E-16 | DNI no encontrado | Input de DNI desconocido → pantalla "No encontrado" | Alta |
| E2E-17 | Alumno al día | DNI con plan vigente → pantalla verde "¡Se ha registrado tu asistencia con éxito!" | Crítica |
| E2E-18 | Alumno con advertencia (plan vence pronto) | DNI con plan a ≤7 días → pantalla de advertencia | Alta |
| E2E-19 | Alumno vencido sin plan | Pantalla de bloqueo "Sin plan registrado" | Alta |
| E2E-20 | Alumno en período de gracia | Pantalla con contador de clases de gracia restantes | Alta |
| E2E-21 | Alumno de prueba (primer ingreso) | Pantalla de prueba, registra asistencia | Alta |
| E2E-22 | Alumno de prueba (ya usó la clase) | Pantalla de bloqueo "Clase de Prueba Utilizada" | Alta |
| E2E-23 | Menor sin CUS completado (<3 clases) | Pantalla de advertencia con información CUS | Alta |
| E2E-24 | Menor con CUS bloqueado (>=3 sin completar) | Pantalla de bloqueo "Falta CUS obligatorio" | Alta |

#### Flujo 4: Registro de Clase de Prueba (público `/clase-prueba`)

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| E2E-25 | Formulario se carga sin autenticación | Página pública accesible desde navegador anónimo | Alta |
| E2E-26 | Registro exitoso | Completar todos los campos válidos → 201 → pantalla de éxito | Crítica |
| E2E-27 | Validación cliente: DNI inválido | Error inline en campo DNI antes de submitir | Alta |
| E2E-28 | Error del servidor: DNI ya registrado | Respuesta 409 → mostrar mensaje "TRIAL_ALREADY_REGISTERED" | Alta |
| E2E-29 | Rate limiting (6+ envíos en 10 min) | 429 con mensaje de espera | Media |

#### Flujo 5: Administración — Acceso con PasswordGate

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| E2E-30 | Acceso a `/administracion` muestra PasswordGate | Solo Administrador ve el gate; Recepcionista no debería tener acceso completo | Crítica |
| E2E-31 | Contraseña correcta abre el panel | `PasswordGate` con email del usuario → desbloquea las pestañas | Alta |
| E2E-32 | Contraseña incorrecta muestra error y shake | Animación de error, campo se limpia | Media |
| E2E-33 | Pestaña Finanzas carga `FinanzasPage` | Tab "Finanzas" → llama a `/api/finanzas` → muestra KPIs | Alta |
| E2E-34 | Selector de mes en Finanzas | Botones ChevronLeft/ChevronRight cambian el mes → re-fetch con `year` y `month` | Alta |
| E2E-35 | Pestaña Ajustes — crear usuario | Formulario `AjustesPage` → llama `POST /api/users` → usuario aparece en lista | Alta |

#### Flujo 6: Comunicación WhatsApp (`/comunicacion`)

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| E2E-36 | Conectar WhatsApp | Botón "Conectar" → `POST /api/whatsapp/connect` → estado cambia a "INITIALIZING" | Alta |
| E2E-37 | QR Code aparece en estado QR_CODE | Polling de `GET /api/whatsapp/status` muestra imagen QR | Alta |
| E2E-38 | Seleccionar filtro de alumnos | Filtros "todos", "activos", "en_riesgo", etc. filtran la lista correctamente | Alta |
| E2E-39 | Envío de mensaje masivo | Completar texto con `{nombre}` → `POST /api/whatsapp/send` → historial muestra "guardado" | Alta |
| E2E-40 | Interpolación `{nombre}` y `{dias_inactivo}` | `interpolarMensaje` en el API route sustituye las variables correctamente | Alta |

---

### 1.3 Tests de API (Contratos de API)

#### `GET /api/finanzas`

| ID | Caso | Input | Respuesta esperada |
|---|---|---|---|
| API-F-01 | Sin parámetros (mes actual) | — | 200, JSON con `ingresosMes`, `formasPago`, `ingresosHistorial` (6 meses) |
| API-F-02 | Con `year=2025&month=6` | `?year=2025&month=6` | 200, datos del semestre correcto (Ene-Jun 2025) |
| API-F-03 | Sin sesión / anon key inválida | — | 401 o error propagado de Supabase |
| API-F-04 | Header `Cache-Control` presente | — | Header `private, max-age=30, stale-while-revalidate=60` |
| API-F-05 | Error de DB en `pagos` | Simular error Supabase | 500 con `{error: "Error al obtener estadísticas financieras"}` |

#### `POST /api/finanzas/guardar-mensual`

| ID | Caso | Respuesta esperada |
|---|---|---|
| API-FM-01 | Llamada autenticada | 200, `{success: true, message: "..."}` |
| API-FM-02 | GET (proxy a POST) | Igual que POST, 200 |
| API-FM-03 | Error en RPC `verificar_y_guardar_estadisticas_mensuales` | 500, `{error: "Error al guardar estadísticas mensuales", details: ...}` |

#### `POST /api/trial-registration`

| ID | Caso | Input | Respuesta esperada |
|---|---|---|---|
| API-TR-01 | Registro válido | Body completo | 201, `{success: true, data: {nombre, actividad}}` |
| API-TR-02 | Campo faltante | `{nombre:"X", dni:"12345678", ...}` sin `actividad` | 400 |
| API-TR-03 | DNI con formato inválido | `dni: "abc"` | 400 |
| API-TR-04 | Actividad inválida | `actividad: "Yoga"` | 400 |
| API-TR-05 | DNI duplicado (prueba ya usada) | DNI existente con `es_prueba=true` | 409, `code: "TRIAL_ALREADY_REGISTERED"` |
| API-TR-06 | DNI de alumno regular | DNI existente con `es_prueba=false` | 409, `code: "ALREADY_MEMBER"` |
| API-TR-07 | Rate limit superado | 6+ requests desde misma IP en 10 min | 429 |
| API-TR-08 | GET /api/trial-registration | — | 200, `{actividades: ["Boxeo","MMA","Kick-boxing","Jiu-Jitsu","Lucha"]}` |

#### `POST /api/verificar-dni`

| ID | Caso | Input | Respuesta esperada |
|---|---|---|---|
| API-VD-01 | DNI no encontrado | `{dni: "99999999"}` | 200, `{found: false}` |
| API-VD-02 | Alumno al día | DNI válido, plan vigente >7 días | 200, `{found: true, alumno: {estado: "al-dia", ...}}` |
| API-VD-03 | Alumno con advertencia | Plan a ≤7 días | 200, `{estado: "advertencia"}` |
| API-VD-04 | Alumno período de gracia | Sin plan activo, clases gracia disponibles | 200, `{estado: "periodo_gracia", clasesGracia: {usadas, disponibles}}` |
| API-VD-05 | Sin DNI en body | `{}` | 400, `{error: "DNI es requerido"}` |
| API-VD-06 | Rate limit | 31+ requests en 60s desde misma IP | 429 |
| API-VD-07 | Asistencia creada en DB | Alumno al-día → verificar que se insertó en tabla `asistencias` | 200 + side effect en DB |
| API-VD-08 | `cus_clases_presentadas` incrementado para menor | Menor sin CUS, ingresoPermitido=true → campo +1 | 200 + side effect en DB |

#### `POST /api/users`

| ID | Caso | Input | Respuesta esperada |
|---|---|---|---|
| API-U-01 | No Administrador | Sesión de Recepcionista | 401 |
| API-U-02 | Campos faltantes | Sin `password` | 400 |
| API-U-03 | Contraseña < 6 chars | `password: "abc"` | 400 |
| API-U-04 | Email inválido | `email: "notanemail"` | 400 |
| API-U-05 | Username duplicado | Username ya en `system_users` | 409 |
| API-U-06 | Email duplicado | Email ya en `system_users` | 409 |
| API-U-07 | Creación exitosa | Body válido | 201, objeto sin `password_hash` |

#### `PATCH /api/users` (cambio de contraseña)

| ID | Caso | Respuesta esperada |
|---|---|---|
| API-U-08 | Contraseña < 6 chars | 400 |
| API-U-09 | Sin `userId` | 400 |
| API-U-10 | Actualización exitosa | 200, `{success: true}` |

#### `PUT /api/users` (actualizar username/email)

| ID | Caso | Respuesta esperada |
|---|---|---|
| API-U-11 | Email en uso por otro usuario | 409 |
| API-U-12 | Actualización exitosa | 200, objeto sin `password_hash` |

#### `POST /api/whatsapp/connect`

| ID | Caso | Respuesta esperada |
|---|---|---|
| API-WC-01 | Sin sesión | 401 |
| API-WC-02 | Con sesión | 200, `{success: true, message: "Iniciando cliente de WhatsApp"}` |

#### `POST /api/whatsapp/send`

| ID | Caso | Input | Respuesta esperada |
|---|---|---|---|
| API-WS-01 | WhatsApp no conectado | Estado != "CONNECTED" | 400, `{error: "WhatsApp no está conectado..."}` |
| API-WS-02 | Array de alumnos vacío | `alumnos: []` | 400 |
| API-WS-03 | Sin mensaje | `mensaje: ""` | 400 |
| API-WS-04 | Envío exitoso | Alumnos válidos + estado CONNECTED | 200, `{success: true, messageId: "..."}` — proceso corre en background |
| API-WS-05 | Sin sesión | — | 401 |

---

## 2. Tests No Funcionales

### 2.1 Tests de Rendimiento General

Objetivos de rendimiento para producción (con ~150 alumnos activos):

| Endpoint / Ruta | Métrica objetivo | Herramienta |
|---|---|---|
| `GET /api/finanzas` | P95 < 800ms, P99 < 1.5s | k6 / Artillery |
| `POST /api/verificar-dni` | P95 < 300ms (es crítico para el flow en tiempo real) | k6 |
| `POST /api/trial-registration` | P95 < 500ms | k6 |
| `/inicio` (carga inicial con PowerSync) | TTI < 3s en conexión 4G | Lighthouse / Playwright |
| `/ingreso-web` | LCP < 1.5s (pantalla de ingreso crítica) | Lighthouse |
| `GET /api/finanzas` con RPC activo vs. fallback | Delta < 200ms entre paths | k6 comparativo |

**Nota crítica:** El endpoint `GET /api/finanzas` ejecuta hasta 8 queries paralelas a Supabase + 1 RPC. Medir tiempo total de respuesta incluyendo el tiempo de cold-start de la función serverless.

### 2.2 Tests de Carga

#### Escenario 1: Hora pico de ingreso al gimnasio

Simula múltiples personas pasando por el scanner en simultáneo.

```
Endpoint: POST /api/verificar-dni
Usuarios concurrentes: 20 VU (Virtual Users)
Duración: 10 minutos
Ramp-up: 0→20 VU en 2 minutos, 20 VU por 6 minutos, 20→0 en 2 minutos
Thresholds:
  - http_req_duration P95 < 500ms
  - http_req_failed < 1%
  - Verificar que asistencias en DB == requests exitosos (no duplicados)
```

#### Escenario 2: Carga concurrente en panel de administración

```
Endpoint: GET /api/finanzas
Usuarios concurrentes: 5 VU (uso típico del gimnasio)
Duración: 5 minutos
Thresholds:
  - P95 < 1s
  - Validar que Cache-Control es respetado (reqs subsiguientes en <30s deben ser más rápidos)
```

#### Escenario 3: Burst de registros de prueba (campaña de marketing)

```
Endpoint: POST /api/trial-registration
Patrón: Burst de 50 requests en 30 segundos desde 10 IPs distintas
Objetivo: Verificar que el rate limiter (5 req/10min por IP) bloquea abusos
  sin afectar IPs legítimas
Thresholds:
  - Requests de IPs dentro del límite: 0% error
  - Requests de IPs que exceden límite: 100% → 429 (no 500)
```

#### Escenario 4: Envío masivo de WhatsApp

```
Endpoint: POST /api/whatsapp/send
Payload: 200 alumnos en una sola solicitud
Duración estimada del proceso background: ~5-10 minutos (delay 1.5-3s/alumno)
Validaciones:
  - API responde 200 en < 500ms (proceso es async con `after()`)
  - Registro en `comunicacion_mensajes` aparece con estado "guardado" inmediatamente
  - Estado cambia a "enviado" o "error" al finalizar el background job
  - No bloquea otros endpoints durante el envío
```

### 2.3 Tests de Estrés

| ID | Nombre | Descripción | Punto de quiebre esperado |
|---|---|---|---|
| ST-01 | `checkRateLimit` bajo estrés | El `Map` en memoria de `lib/rate-limit.ts` es in-process. En serverless (Vercel), cada instancia tiene su propio Map → rate limiting no es efectivo en multi-instancia. Verificar el comportamiento. | No aplica a single-process; falla en multi-instancia |
| ST-02 | Conexión WhatsApp con hot-reload | El cliente WhatsApp se guarda en `globalThis` para sobrevivir hot-reloads en dev. Probar que múltiples requests concurrentes al inicializar no crean dos clientes. | Doble instancia de Puppeteer |
| ST-03 | Historial financiero con 6 meses de datos voluminosos | `GET /api/finanzas` fallback in-memory: si hay miles de pagos en el semestre, el filtrado en JS puede ser lento. Medir con 10.000 registros en `pagos`. | P99 > 3s |
| ST-04 | PowerSync con desconexión de red | Simular pérdida de conexión durante operaciones en `AlumnosList`. Verificar que los datos del cache local de PowerSync/SQLite se siguen mostrando. | Pantalla en blanco / error no manejado |
| ST-05 | Rate limit bajo multi-tenant (IPs compartidas) | NAT/proxies pueden hacer que muchos usuarios legítimos compartan IP. Con el límite de 30 req/min para verificar-dni, un gimnasio con NAT podría bloquearse. | >30 alumnos en 60 segundos desde misma IP |

### 2.4 Tests de Seguridad

#### Autenticación y Sesión

| ID | Nombre | Descripción | Severidad |
|---|---|---|---|
| SEC-01 | Acceso directo a APIs sin token | `GET /api/finanzas`, `POST /api/users` sin cookies de Supabase → 401 | Crítica |
| SEC-02 | Middleware protege rutas de app | Acceder a `/inicio`, `/finanzas`, `/administracion` sin sesión → 302 a `/` | Crítica |
| SEC-03 | `getSession()` en middleware | El middleware usa `getSession()` (no `getUser()`) para la sesión. El token JWT no se re-valida contra el servidor en cada request. Evaluar impacto de tokens robados. | Alta |
| SEC-04 | PasswordGate de administración | El gate adicional en `/administracion` verifica `supabase.auth.signInWithPassword` con el email del usuario actual. Verificar que no se puede bypassear via JS | Alta |
| SEC-05 | Rol en cache de localStorage | `use-auth.ts` persiste el rol en `localStorage`. Un atacante con acceso al browser podría modificar `auth-role-{userId}`. El servidor sigue verificando desde DB en cada request — confirmar que la modificación local no tiene efecto real. | Media |
| SEC-06 | Cache de roles en `api/users/route.ts` | `roleCache` in-process puede quedar con rol "Administrador" si el rol es degradado en DB. TTL 5 min podría permitir acciones administrativas durante ese tiempo. | Alta |

#### Autorización y RLS

| ID | Nombre | Descripción | Severidad |
|---|---|---|---|
| SEC-07 | RLS en `alumnos` solo permite Administrador/Recepcionista | Un usuario anon no puede leer `alumnos` directamente desde Supabase client | Crítica |
| SEC-08 | RLS en `pagos` solo para autenticados | Un usuario anon no puede leer/escribir pagos | Crítica |
| SEC-09 | RLS optimizado con subquery | Verificar que las políticas con `(SELECT auth.uid())` se aplican correctamente post-migración `optimize_rls_policies.sql` | Alta |
| SEC-10 | `SECURITY DEFINER` en `crear_alumno_con_cobro` | La función se ejecuta con permisos del propietario. Verificar que solo puede ser llamada por roles autorizados. | Alta |
| SEC-11 | `supabaseAdmin` (service role) solo en server-side | Confirmar que `SUPABASE_SERVICE_ROLE_KEY` nunca se expone al cliente (solo en `app/api/`) | Crítica |

#### Validación de Inputs y Ataques

| ID | Nombre | Descripción | Severidad |
|---|---|---|---|
| SEC-12 | SQL Injection via DNI | Input `dni: "1'; DROP TABLE alumnos;--"` en `/api/verificar-dni` → Supabase usa queries parametrizadas, debe ser inmune | Alta |
| SEC-13 | XSS via campo `nombre` en mensajes WhatsApp | `interpolarMensaje` sustituye `{nombre}` en texto plano para WhatsApp. Verificar que HTML/scripts no se ejecutan | Media |
| SEC-14 | Traversal via `alumnoId` en ruta dinámica | `GET /inicio/[alumnoId]` — verificar que RLS impide acceder a datos de otro alumno | Alta |
| SEC-15 | Masa de DNIs para enumerar alumnos | `/api/verificar-dni` tiene rate limiting. Sin embargo, responde `{found: false}` para DNIs inexistentes. Confirmar que no es explotable para enumeración. | Media |
| SEC-16 | Headers CORS en APIs privadas | `GET /api/finanzas` — verificar que no acepta origins arbitrarios | Media |
| SEC-17 | Cookies de sesión con flags seguros | Verificar `HttpOnly`, `Secure`, `SameSite=Lax` en cookies de Supabase Auth | Alta |

### 2.5 Tests de Accesibilidad

Aplicar WCAG 2.1 nivel AA en las pantallas críticas.

| ID | Página / Componente | Criterio | Herramienta |
|---|---|---|---|
| A11Y-01 | `/ingreso-web` (pantalla de ingreso) | Contrastes de color ≥ 4.5:1 en todos los estados (verde al-dia, rojo vencido, amarillo advertencia) | axe-core / Playwright |
| A11Y-02 | `/clase-prueba` (formulario público) | Labels asociados a todos los inputs, mensajes de error programáticamente asociados (aria-describedby) | axe-core |
| A11Y-03 | `/inicio` — Buscador | `input[type="search"]` con label visible o aria-label, anuncio de resultados con aria-live | axe-core |
| A11Y-04 | `NuevoAlumnoModal.tsx` | Foco atrapado en modal (focus trap), anuncio al abrir/cerrar, ESC cierra | Playwright manual |
| A11Y-05 | `RegistrarCobroModal.tsx` | Mismo criterio que A11Y-04 | Playwright manual |
| A11Y-06 | Panel `/administracion` — tabs | Patrón ARIA Tabs (role=tablist, role=tab, aria-selected, aria-controls) | axe-core |
| A11Y-07 | `/ingreso-web` — resultado de DNI | Anuncio automático con aria-live="polite" cuando aparece el resultado | Playwright manual |
| A11Y-08 | Navegación general | Toda la app navegable solo con teclado (Tab, Enter, Space, ESC) | Playwright manual |
| A11Y-09 | Iconos de lucide-react sin texto visible | Verificar `aria-label` o texto oculto visualmente (`sr-only`) en botones icon-only | axe-core |

---

## 3. Herramientas Recomendadas

| Herramienta | Versión recomendada | Uso en este proyecto | Justificación |
|---|---|---|---|
| **Jest** + **ts-jest** | `^29` | Tests unitarios: `checkRateLimit`, `formatWhatsappNumber`, `determinarEstado`, cálculos de `finanzas/route.ts` | Jest es el estándar para unit tests en ecosistema Node/TypeScript; ts-jest evita compilar antes de testear |
| **@testing-library/react** | `^16` | Tests de componentes: `TrialRegistrationForm`, `NuevoAlumnoModal`, `AlumnosList` | Permite testear comportamiento del usuario (clicks, typing) sin montar el navegador completo |
| **Playwright** | `^1.61.0` (ya instalado) | E2E: login, flujo ingreso-web, flujo nuevo alumno, comunicación WhatsApp | Ya está en `devDependencies`. Soporta Chromium/Firefox/WebKit. Tiene `playwright/.auth/user.json` para sesión pre-guardada |
| **@playwright/test** con `axe-playwright` | — | Tests de accesibilidad automatizados dentro de Playwright | Integración nativa con axe-core para reportes WCAG por página |
| **k6** | `v0.51+` | Tests de carga y estrés: `/api/verificar-dni`, `/api/finanzas`, `/api/trial-registration` | Scripting en JavaScript/TypeScript, thresholds declarativos, CLI sencilla, integración con CI |
| **Supabase local** (`supabase start`) | CLI `^1.x` | Base de datos aislada para tests de integración | Evita contaminar datos de producción/staging; reproducible con `supabase/migrations/` existentes |
| **MSW (Mock Service Worker)** | `^2.x` | Mocking de Supabase en tests de componentes | Permite testear componentes que hacen fetch a Supabase sin DB real |
| **Lighthouse CI** | `^12.x` | Performance + accesibilidad automatizados en CI | Métricas LCP, TTI, FID por ruta; se integra con GitHub Actions |

### Configuración de entorno recomendada

```
# Para tests unitarios (Jest)
.env.test → NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
             NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key>

# Para tests E2E (Playwright)
# Usar playwright/.auth/user.json ya existente para sesión pre-guardada
# Configurar playwright.config.ts con baseURL del entorno local/staging

# Para tests de carga (k6)
# Apuntar al entorno de staging, nunca a producción
```

---

## 4. Matriz de Prioridades

| Test ID | Nombre | Tipo | Prioridad | Esfuerzo estimado | Estado |
|---|---|---|---|---|---|
| UV-01..UV-10 | Lógica `determinarEstado` (verificar-dni) | Unit | Crítica | 4h | Pendiente |
| API-VD-01..08 | Contrato API `/api/verificar-dni` | API Integration | Crítica | 3h | Pendiente |
| E2E-01..06 | Login / Logout / Redirección | E2E | Crítica | 2h | Pendiente |
| E2E-16..24 | Flujo completo Ingreso Web | E2E | Crítica | 4h | Pendiente |
| UA-01..05 | Lógica `validateUserForLogin` | Unit | Crítica | 2h | Pendiente |
| SEC-07..09 | RLS Supabase (alumnos, pagos) | Seguridad | Crítica | 3h | Pendiente |
| SEC-11 | Service Role key no expuesta al cliente | Seguridad | Crítica | 1h | Pendiente |
| API-TR-01..10 | Contrato API `/api/trial-registration` | API Integration | Alta | 3h | Pendiente |
| API-F-01..05 | Contrato API `/api/finanzas` | API Integration | Alta | 3h | Pendiente |
| E2E-10..15 | Flujo nuevo alumno + cobro | E2E | Alta | 4h | Pendiente |
| E2E-25..29 | Flujo clase de prueba (público) | E2E | Alta | 2h | Pendiente |
| UL-01..07 | Tests `checkRateLimit` + `getClientIp` | Unit | Alta | 2h | Pendiente |
| UW-01..07 | Tests `formatWhatsappNumber` | Unit | Alta | 2h | Pendiente |
| UF-01..09 | Cálculos financieros | Unit | Alta | 3h | Pendiente |
| API-U-01..12 | Contrato API `/api/users` | API Integration | Alta | 3h | Pendiente |
| SEC-01..06 | Autenticación y sesión | Seguridad | Alta | 3h | Pendiente |
| SEC-12..17 | Validación inputs y ataques | Seguridad | Alta | 4h | Pendiente |
| E2E-30..35 | Panel Administración | E2E | Alta | 4h | Pendiente |
| E2E-36..40 | Comunicación WhatsApp | E2E | Alta | 3h | Pendiente |
| ST-01..05 | Tests de estrés | Stress | Media | 4h | Pendiente |
| CARGA-01..04 | Tests de carga (k6) | Carga | Media | 6h | Pendiente |
| A11Y-01..09 | Accesibilidad WCAG | Accesibilidad | Media | 4h | Pendiente |
| E2E-07..09 | Paginación y buscador | E2E | Media | 2h | Pendiente |
| UU-01..03 | Cache de roles en `api/users` | Unit | Media | 1.5h | Pendiente |
| API-WC-01..02 | Contrato API WhatsApp connect | API | Media | 1h | Pendiente |
| API-WS-01..05 | Contrato API WhatsApp send | API | Media | 2h | Pendiente |
| ST-03 | Estrés historial financiero con 10k registros | Stress | Media | 2h | Pendiente |
| SEC-03 | `getSession()` vs `getUser()` en middleware | Seguridad | Media | 2h | Pendiente |
| SEC-06 | TTL del cache de roles admin | Seguridad | Media | 1h | Pendiente |

**Esfuerzo total estimado: ~81.5 horas**

---

## 5. Orden de Ejecución Recomendado

### Fase 1 — Fundamentos (Semana 1)

**Objetivo:** Proteger la lógica crítica de negocio y el acceso al sistema.

1. **Configurar entorno de test:** `supabase start`, Jest + ts-jest, archivo `jest.config.ts`, variables de entorno `.env.test`.
2. **Unit tests — `lib/rate-limit.ts`** (UL-01..07): son puros, sin dependencias externas.
3. **Unit tests — `lib/whatsapp-client.ts` → `formatWhatsappNumber`** (UW-01..07): función pura, sin Puppeteer.
4. **Unit tests — `lib/auth.ts` → `validateUserForLogin`** (UA-01..05): mockear Supabase.
5. **Unit tests — `determinarEstado` en `verificar-dni/route.ts`** (UV-01..10): es la lógica más crítica del sistema. Aislar la función y mockear la DB.
6. **Unit tests — cálculos financieros en `finanzas/route.ts`** (UF-01..09): mockear Supabase.

### Fase 2 — Contratos de API (Semana 2)

**Objetivo:** Garantizar que los endpoints responden correctamente a todos los casos.

7. **Tests de integración API — `/api/trial-registration`** (API-TR-01..10): usar Supabase local.
8. **Tests de integración API — `/api/verificar-dni`** (API-VD-01..08): incluir verificación de side effects en DB.
9. **Tests de integración API — `/api/finanzas`** (API-F-01..05).
10. **Tests de integración API — `/api/users`** (API-U-01..12): requiere rol Administrador.

### Fase 3 — Tests E2E (Semana 3)

**Objetivo:** Validar los flujos de usuario completos con Playwright.

11. **E2E — Login / Logout** (E2E-01..06): punto de entrada a todo lo demás.
12. **E2E — Ingreso Web / Scanner DNI** (E2E-16..24): flujo de mayor impacto operacional diario.
13. **E2E — Clase de Prueba** (E2E-25..29): único flujo público, alta exposición.
14. **E2E — Nuevo Alumno** (E2E-10..15): flujo de registro crítico.
15. **E2E — Panel Administración** (E2E-30..35).
16. **E2E — Comunicación WhatsApp** (E2E-36..40): requiere mock del cliente WhatsApp real.

### Fase 4 — Seguridad y Accesibilidad (Semana 4)

**Objetivo:** Auditar y cerrar vulnerabilidades antes de producción.

17. **Seguridad — RLS y service role key** (SEC-07..11): ejecutar contra Supabase local.
18. **Seguridad — Autenticación / autorización** (SEC-01..06): incluir revisión del `getSession()` en middleware.
19. **Seguridad — Validación de inputs** (SEC-12..17).
20. **Accesibilidad** (A11Y-01..09): integrar `axe-playwright` en los E2E ya existentes.

### Fase 5 — Rendimiento y Carga (Semana 5)

**Objetivo:** Validar que el sistema aguanta la carga operacional real.

21. **Tests de carga — `verificar-dni` (hora pico)**: escenario 1 con k6.
22. **Tests de carga — `finanzas` y rate limiting**: escenarios 2 y 3.
23. **Tests de estrés** (ST-01..05): identificar puntos de quiebre.
24. **Tests de carga — WhatsApp send** (Escenario 4): verificar que el `after()` no bloquea.
25. **Lighthouse CI** en rutas `/inicio`, `/ingreso-web`, `/clase-prueba`.

---

*Generado el 2026-06-21 | Basado en análisis estático del codebase Sistema Alfa (rama: main, commit: e726127)*
