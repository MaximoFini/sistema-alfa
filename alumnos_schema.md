# Esquema de la Tabla `alumnos`

A continuación se detallan todos los atributos (columnas) de la tabla `alumnos`, junto con su tipo de dato y su propósito dentro del sistema:

| Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| **`id`** | `uuid` | Identificador único del alumno (Generado automáticamente). |
| **`nombre`** | `text` | Nombre completo del alumno. |
| **`dni`** | `text` | Documento Nacional de Identidad del alumno. |
| **`domicilio`** | `text` | Dirección o domicilio de residencia. |
| **`telefono`** | `text` | Número de teléfono de contacto. |
| **`fecha_registro`** | `date` | Fecha en la que el alumno fue registrado en el sistema. |
| **`fecha_ultima_asistencia`** | `date` | Fecha correspondiente al último día que el alumno registró asistencia. |
| **`fecha_ultimo_vencimiento`** | `date` | Fecha en la que se venció su último pago o membresía. |
| **`abono_ultima_inscripcion`** | `text` | Descripción o nombre del último plan/abono que pagó el alumno. |
| **`fecha_proximo_vencimiento`** | `date` | Fecha programada para el vencimiento de su membresía o cuota actual. |
| **`actividad_proximo_vencimiento`** | `text` | Actividad o disciplina correspondiente a la membresía que vencerá próximamente. |
| **`activo`** | `boolean` | Indica si el alumno está actualmente activo en el sistema. Valor por defecto: `true`. |
| **`genero`** | `text` | Género del alumno. |
| **`edad_actual`** | `integer` | Edad actual del alumno, calculada en años. |
| **`fecha_nacimiento`** | `date` | Fecha de nacimiento del alumno. |
| **`saldo`** | `numeric` | Saldo actual en la cuenta del alumno (a favor o en contra). Valor por defecto: `0`. |
| **`fecha_ultimo_inicio`** | `date` | Fecha en la que el alumno reinició o comenzó su actividad más reciente. |
| **`clases_gracia_disponibles`** | `integer` | Cantidad de clases de gracia (compensación) que tiene disponibles para usar. Valor por defecto: `0`. |
| **`clases_gracia_usadas`** | `integer` | Cantidad de clases de gracia que el alumno ya ha utilizado. Valor por defecto: `0`. |
| **`es_prueba`** | `boolean` | Indica si el prospecto se encuentra en período de clase de prueba (sin inscripción formal). Valor por defecto: `false`. |
| **`actividad_interes`** | `text` | Actividad que el prospecto (clase de prueba) está interesado en probar. Aplica solo si `es_prueba=true`. |
| **`created_at`** | `timestamp with time zone` | Fecha y hora exacta en la que se creó el registro del alumno en la base de datos. |
| **`updated_at`** | `timestamp with time zone` | Fecha y hora de la última modificación realizada sobre el registro del alumno. |
