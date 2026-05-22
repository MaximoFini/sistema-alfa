# Prioridad 1 — 21 de Mayo (Actividades de Desarrollo)

Este archivo contiene la planificación, especificación técnica y los prompts de desarrollo para implementar con éxito cada una de las 8 actividades prioritarias en el proyecto **Sistema Alfa**.

---

## 📋 Lista de Actividades

1. [ ] **Pedir CUIS para menores de edad** (Activación dinámica en creación de alumno y visualización de alerta si está pendiente).
2. [ ] **Aclaración sobre DNI para clases de prueba** (Aviso de obligatoriedad en formulario de registro público).
3. [ ] **Pedir correo electrónico en registro de alumnos** (Nuevo campo `email`).
4. [ ] **Registrar tarjeta de pago en cobros** (Tipificado en ajustes de negocio y guardado en cobro).
5. [ ] **Guardar Alias de transferencia en cobros** (Campo de texto condicional para transferencias).
6. [ ] **Número de contacto de emergencia en alumno** (Campo `telefono_emergencia`).
7. [ ] **Observaciones/Notas en la ficha del alumno** (Campo `observaciones`).
8. [ ] **Inicio enfocado: Mostrar únicamente alumnos ingresados hoy** (Filtro por asistencia diaria en la pantalla de inicio).

---

## ⚡ Prompts de Desarrollo Detallados

A continuación, se detalla el análisis técnico de afectación y el prompt específico que guiará a la IA para ejecutar cada tarea individualmente con éxito.

---

### 1. Pedir CUIS para menores
* **Descripción:** Si la fecha de nacimiento ingresada corresponde a un menor de edad (menor de 18 años), se debe activar dinámicamente la opción para registrar el **CUIS** (Certificado Único de Incorporación al Sistema / Ficha Médica). Si el CUIS no se marca como entregado/completado, el perfil del alumno y su tarjeta en el inicio deben mostrar una alerta visual destacada ("Debe CUIS" / "CUIS Pendiente").
* **Archivos a Modificar:**
  - Base de Datos (Migración): Agregar columna `cuis_completado` (boolean, default false) a la tabla `alumnos`.
  - [crear_alumno_con_cobro.sql](file:///c:/Users/Maximo/Documents/sistema-alfa/supabase/migrations/crear_alumno_con_cobro.sql): Actualizar la función RPC para recibir y persistir `p_cuis_completado`.
  - [AlumnosList.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/_components/AlumnosList.tsx): Calcular edad en tiempo real al ingresar `fechaNacimiento` en el Paso 1, mostrar checkbox condicional "CUIS Completado" y enviar valor en la inserción/RPC. Mostrar Badge "Debe CUIS" en `AlumnoCard` si es menor de 18 años y no está completado.
  - [PanelInfoPersonal.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/[alumnoId]/_components/PanelInfoPersonal.tsx) y [AlumnoPerfil.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/[alumnoId]/_components/AlumnoPerfil.tsx): Mostrar estado del CUIS en el perfil del alumno y permitir marcarlo como completado/entregado.

> [!NOTE]
> **Prompt para ejecución:**
> "Modificá la base de datos agregando la columna `cuis_completado` (boolean, default false) a la tabla `alumnos`. Actualizá el formulario de creación de alumnos en `AlumnosList.tsx` (Paso 1) para que, al ingresar la `fechaNacimiento`, se calcule dinámicamente la edad. Si es menor de 18 años, mostrá un checkbox moderno e interactivo para indicar si entregó el CUIS (`cuis_completado`). Adaptá la función RPC `crear_alumno_con_cobro` en `crear_alumno_con_cobro.sql` y en las llamadas de inserción en frontend para persistir este campo. Por último, agregá una alerta o Badge visualmente impactante (color naranja o rojo con un ícono de advertencia) que diga 'CUIS Pendiente' en `AlumnoCard` para los menores sin CUIS completado, y un interruptor/botón en `PanelInfoPersonal.tsx` para permitir que la recepción marque el CUIS como entregado desde la ficha del alumno."

---

### 2. Aclaración sobre DNI para clase de prueba
* **Descripción:** En el formulario público donde los prospectos se registran para clases de prueba, se debe agregar un texto aclaratorio visible y amigable que indique que es requisito obligatorio presentar el DNI físico el primer día de clase para verificar su identidad.
* **Archivos a Modificar:**
  - [TrialRegistrationForm.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(public)/clase-prueba/_components/TrialRegistrationForm.tsx): Añadir nota aclaratoria debajo del campo de entrada DNI en el paso del registro.

> [!NOTE]
> **Prompt para ejecución:**
> "Modificá el formulario público de registro de clase de prueba `TrialRegistrationForm.tsx`. Justo debajo del campo de entrada (input) del DNI, agregá un texto aclaratorio de estilo profesional, utilizando clases de Tailwind que combinen perfectamente con la interfaz (por ejemplo, texto naranja de intensidad media o gris oscuro estilizado con un pequeño ícono de aviso). El mensaje debe indicar de manera clara y amigable: '⚠️ Recordá presentarte con tu DNI físico el primer día de clase para verificar tu registro'."

---

### 3. Pedir Mail en registro de alumnos
* **Descripción:** Incorporar el campo de correo electrónico ("Email") en el registro de nuevos alumnos, almacenándolo en la base de datos de manera opcional para permitir contacto digital y facturación.
* **Archivos a Modificar:**
  - Base de Datos (Migración): Agregar la columna `email` (text, nullable) a la tabla `alumnos`.
  - [crear_alumno_con_cobro.sql](file:///c:/Users/Maximo/Documents/sistema-alfa/supabase/migrations/crear_alumno_con_cobro.sql): Actualizar la RPC para incluir y persistir el campo `p_email`.
  - [AlumnosList.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/_components/AlumnosList.tsx): Añadir el input del tipo email en el formulario del Paso 1 (Nuevo Alumno) y mapearlo en las llamadas de guardado tradicional y guardado atómico (RPC).
  - [PanelInfoPersonal.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/[alumnoId]/_components/PanelInfoPersonal.tsx): Mostrar y permitir la edición del email en la ficha del alumno.

> [!NOTE]
> **Prompt para ejecución:**
> "Agregá la columna `email` (tipo `text`, permitiendo valores nulos) a la tabla `alumnos` mediante una migración de base de datos. Modificá la RPC `crear_alumno_con_cobro` en `crear_alumno_con_cobro.sql` para aceptar `p_email text` e insertarlo en la columna correspondiente. En `AlumnosList.tsx`, agregá un campo de entrada para el correo electrónico en el formulario de registro de alumnos (Paso 1) con validación de formato básica. Enviá el valor del email tanto en la inserción directa como en el llamado RPC de cobros. Finalmente, asegurate de que el email se muestre y sea editable dentro del panel de información del alumno en `PanelInfoPersonal.tsx`."

---

### 4. Guardar con qué tarjeta realizó el pago (Ajustes de Negocio)
* **Descripción:** Permitir clasificar los cobros con tarjeta seleccionando qué tarjeta específica se utilizó (ej: Visa Débito, Mastercard Crédito, etc.). La lista de tarjetas debe ser configurable en los Ajustes de Negocio y cargarse dinámicamente en los formularios de cobro.
* **Archivos a Modificar:**
  - Base de Datos (Migración): Crear la tabla `accepted_cards` con columnas `id` (uuid, primary key), `name` (text, unique), `is_active` (boolean, default true). Agregar columna `tarjeta` (text, nullable) a la tabla `pagos`.
  - [use-admin-settings.ts](file:///c:/Users/Maximo/Documents/sistema-alfa/hooks/use-admin-settings.ts) y [AjustesPage](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/administracion/ajustes/page.tsx): Agregar soporte en la tienda global de ajustes y UI en Ajustes de Negocio para listar, activar/desactivar y crear nuevas tarjetas aceptadas.
  - [static-data-store.ts](file:///c:/Users/Maximo/Documents/sistema-alfa/stores/static-data-store.ts): Añadir acción para cargar tarjetas aceptadas desde la base de datos con caché de 5 minutos.
  - [RegistrarCobroModal.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/[alumnoId]/_components/RegistrarCobroModal.tsx) y [AlumnosList.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/_components/AlumnosList.tsx) (Paso 2): Si el Medio de Pago seleccionado es de tipo 'Tarjeta' (o contiene la palabra tarjeta), desplegar condicionalmente un Selector (`select`) con las tarjetas aceptadas configuradas y guardarlo en la columna `tarjeta` de la tabla `pagos`.

> [!NOTE]
> **Prompt para ejecución:**
> "Implementá la funcionalidad de selección de tarjeta de pago tipificada. 1) Creá la tabla `accepted_cards` y agregá la columna `tarjeta` a la tabla `pagos` en la base de datos. 2) Añadí en la interfaz de Ajustes de Negocio (`ajustes/page.tsx`) y en el store `use-admin-settings.ts` una sección para que los administradores gestionen las tarjetas (crear, activar, desactivar). 3) En `static-data-store.ts`, implementá la carga y el almacenamiento en caché de tarjetas activas. 4) En `RegistrarCobroModal.tsx` y en el Paso 2 de `AlumnosList.tsx`, mostrá dinámicamente un campo select 'Seleccionar Tarjeta' únicamente cuando el usuario elija un medio de pago con tarjeta, y asegurate de persistir este dato al guardar el cobro."

---

### 5. Guardar Alias de transferencia en cobros
* **Descripción:** En transacciones por transferencia, es vital registrar a qué cuenta/alias se envió el dinero para facilitar la conciliación contable de la administración.
* **Archivos a Modificar:**
  - Base de Datos (Migración): Agregar la columna `alias_transferencia` (text, nullable) a la tabla `pagos`.
  - [RegistrarCobroModal.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/[alumnoId]/_components/RegistrarCobroModal.tsx) y [AlumnosList.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/_components/AlumnosList.tsx) (Paso 2): Agregar lógica para que, si el medio de pago seleccionado es 'Transferencia' (o contiene dicha palabra), aparezca un campo de texto interactivo para que el usuario escriba el Alias o cuenta destino.
  - Actualizar el guardado/RPC en la tabla `pagos` para persistir este alias.

> [!NOTE]
> **Prompt para ejecución:**
> "Modificá la tabla `pagos` agregando la columna `alias_transferencia` (text, nullable). En `RegistrarCobroModal.tsx` y `AlumnosList.tsx` (formulario de Paso 2), programá un renderizado condicional: si el método de pago elegido es 'Transferencia' (o el nombre contiene 'transferencia'), mostrá un input de texto estilizado que pida el 'Alias / CBU de destino'. Guardá y persistí este valor en el campo `alias_transferencia` en la base de datos de Supabase."

---

### 6. Número de emergencia en registro de alumno
* **Descripción:** Añadir un campo de contacto de emergencia de suma importancia médica/gimnástica durante el registro de nuevos alumnos, visible y rápidamente accionable en el perfil.
* **Archivos a Modificar:**
  - Base de Datos (Migración): Agregar columna `telefono_emergencia` (text, nullable) a la tabla `alumnos`.
  - [crear_alumno_con_cobro.sql](file:///c:/Users/Maximo/Documents/sistema-alfa/supabase/migrations/crear_alumno_con_cobro.sql): Actualizar la RPC para aceptar e insertar `p_telefono_emergencia`.
  - [AlumnosList.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/_components/AlumnosList.tsx): Añadir el input del tipo teléfono/texto para 'Contacto de Emergencia' en el Paso 1.
  - [PanelInfoPersonal.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/[alumnoId]/_components/PanelInfoPersonal.tsx): Mostrar el contacto de emergencia en la ficha de información personal de manera destacada (por ejemplo, con ícono de Cruz Roja o aviso de alerta) y permitir su modificación.

> [!NOTE]
> **Prompt para ejecución:**
> "Agregá la columna `telefono_emergencia` (text) a la tabla `alumnos` mediante migración. Actualizá la función SQL `crear_alumno_con_cobro` para recibir y mapear este nuevo parámetro. En el componente de formulario de creación `AlumnosList.tsx` (Paso 1), insertá un input para ingresar el 'Contacto de Emergencia' del alumno y vinculalo a los flujos de guardado. Modificá `PanelInfoPersonal.tsx` para que el número de emergencia se visualice de forma muy destacada en el perfil del alumno, permitiendo su actualización rápida en caso de incidentes."

---

### 7. Observación en registro de alumno
* **Descripción:** Permitir capturar notas adicionales, antecedentes médicos, restricciones físicas o recordatorios importantes al registrar o editar a un alumno.
* **Archivos a Modificar:**
  - Base de Datos (Migración): Agregar la columna `observaciones` (text, nullable) a la tabla `alumnos`.
  - [crear_alumno_con_cobro.sql](file:///c:/Users/Maximo/Documents/sistema-alfa/supabase/migrations/crear_alumno_con_cobro.sql): Actualizar la RPC para aceptar e insertar `p_observaciones`.
  - [AlumnosList.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/_components/AlumnosList.tsx): Agregar una caja de texto (textarea) multilinea para 'Observaciones / Notas adicionales' en el formulario de alta del alumno (Paso 1).
  - [PanelInfoPersonal.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/[alumnoId]/_components/PanelInfoPersonal.tsx): Renderizar el bloque de observaciones en el detalle del alumno con un diseño limpio y moderno de notas rápidas, habilitando la edición directa.

> [!NOTE]
> **Prompt para ejecución:**
> "Crea una columna llamada `observaciones` (text) en la tabla `alumnos`. Modifica la función RPC `crear_alumno_con_cobro` para procesar e insertar esta nueva entrada. En el formulario de registro de alumnos en `AlumnosList.tsx` (Paso 1), añade un campo del tipo `textarea` moderno con placeholder para 'Observaciones importantes (alergias, lesiones, notas personales)'. Finalmente, en `PanelInfoPersonal.tsx`, crea un panel estilizado estilo 'Notas' para poder ver y editar las observaciones directamente de forma fluida."

---

### 8. Solamente se muestran en el inicio los alumnos que ingresaron en ese día
* **Descripción:** Optimizar la pantalla principal de Inicio para que la lista de alumnos por defecto muestre única y exclusivamente a las personas que registraron su ingreso/asistencia en el transcurso del día de hoy. Esto ayuda a la recepción a supervisar eficientemente quiénes se encuentran entrenando actualmente en las instalaciones.
* **Archivos a Modificar:**
  - [data-cache-store.ts](file:///c:/Users/Maximo/Documents/sistema-alfa/stores/data-cache-store.ts): Modificar la consulta principal de carga de alumnos `fetchAlumnos` para filtrar opcionalmente por asistencia del día de hoy.
  - [AlumnosList.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/inicio/_components/AlumnosList.tsx): Por defecto, habilitar un filtro/interruptor de vista activa que traiga únicamente a los alumnos con asistencia/ingreso registrado el día de hoy, permitiendo a la vez desactivar el filtro para buscar globalmente a toda la nómina si es necesario.

> [!NOTE]
> **Prompt para ejecución:**
> "Modificá la pantalla de Inicio de alumnos. En `data-cache-store.ts`, actualizá la consulta del método `fetchAlumnos` (y su query directa / llamada a RPC) para que, al solicitar la vista del inicio por defecto, se aplique un filtro de base de datos de Supabase que restrinja los resultados únicamente a los alumnos que tengan asistencia (`fecha_ultima_asistencia` o registro en la tabla `asistencias`) equivalente a la fecha de hoy. En `AlumnosList.tsx`, colocá un interruptor moderno, estilizado y premium de 'Ver ingresos de hoy' (activo por defecto) y un estado desactivado que devuelva el comportamiento de búsqueda y paginación global tradicional de toda la base de datos."
