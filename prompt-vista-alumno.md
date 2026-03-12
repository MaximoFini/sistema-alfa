# Prompt: Implementar Vista de Perfil de Alumno

## Contexto del Proyecto

- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, shadcn/ui, lucide-react
- **Estructura relevante**:
  - `app/(app)/inicio/page.tsx` — Server Component que lista alumnos
  - `app/(app)/inicio/_components/AlumnosList.tsx` — Client Component con `AlumnoCard`
  - `lib/supabase.ts` y `lib/supabase-server.ts` — clientes Supabase
- **Colores del proyecto**: rojo primario `#DC2626`, fondo gris claro, cards blancas con bordes `border-gray-100`

## Estructura de datos conocida (tabla `alumnos`)

```ts
// Campos confirmados en AlumnoRow (AlumnosList.tsx)
{
  id: string,
  nombre: string | null,
  edad_actual: number | null,        // columna calculada/generada en DB
  fecha_registro: string | null,     // "YYYY-MM-DD"
  fecha_ultima_asistencia: string | null,
  dni: string | null,
}

// Campos adicionales usados en el form de creación (NuevoAlumnoModal)
// que también están en la tabla `alumnos`:
{
  fecha_nacimiento: string,          // "YYYY-MM-DD"
  domicilio: string,
  telefono: string,
  genero: string,
  abono_ultima_inscripcion: string,
  fecha_proximo_vencimiento: string,
  actividad_proximo_vencimiento: string,
  fecha_ultimo_inicio: string,
  // Campo activo: inferir si existe, si no agregar como booleano o por vencimiento
}
```

## Estructura de datos conocida (tabla `pagos`)

```ts
// Insertado en NuevoAlumnoModal → handleGuardarPaso2
{
  alumno_id: string,
  actividad: string,
  precio: number,
  fecha_cobro: string,     // "YYYY-MM-DD"
  medio_pago: string,
  fecha_inicio: string,    // "YYYY-MM-DD"
  fecha_vencimiento: string, // "YYYY-MM-DD"
}
```

## Estructura de datos (tabla `asistencias`)

La tabla `asistencias` registra cada vez que un alumno asiste. Se infiere que tiene al menos:
```ts
{
  id: string,
  alumno_id: string,
  fecha: string,           // "YYYY-MM-DD" o timestamp
  hora: string | null,     // hora de la asistencia (puede ser parte del timestamp)
  // created_at: string    // alternativa si fecha+hora están en un timestamp
}
```
> ⚠️ **Antes de implementar**: verificar la estructura real de la tabla `asistencias` en Supabase (columnas exactas). Adaptar las queries según lo que encuentres.

---

## Objetivo

Implementar una **página de perfil de alumno** accesible al hacer clic en cualquier `AlumnoCard` en `/inicio`.

**Ruta**: `app/(app)/inicio/[alumnoId]/page.tsx`

**Layout visual** (inspirado en la referencia adjunta, adaptado a este sistema):
- **Columna izquierda** (fija, ~280px): panel de información personal
- **Columna derecha** (flexible): dos tabs — Asistencias y Pagos

---

## FASE 1: Routing y navegación desde AlumnoCard

### 1.1 Modificar `AlumnoCard` para que sea clickeable y navegue al perfil

En `app/(app)/inicio/_components/AlumnosList.tsx`, la función `AlumnoCard` actualmente muestra un `<div>` con `cursor-pointer`. Convertirla para que navegue a `/inicio/[alumnoId]`.

**Cambio mínimo**: Envolver el contenido en un `<Link href={/inicio/${alumno.id}}>` de Next.js, o usar `useRouter().push()`.

```tsx
// Ejemplo de cambio en AlumnoCard:
import Link from "next/link";

function AlumnoCard({ alumno }: { alumno: AlumnoConUI }) {
  return (
    <Link href={`/inicio/${alumno.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 md:p-5 flex items-center gap-3 md:gap-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group min-h-[76px] touch-manipulation">
      {/* ... contenido existente sin cambios ... */}
    </Link>
  );
}
```

---

## FASE 2: Server Component — página del alumno

### 2.1 Crear `app/(app)/inicio/[alumnoId]/page.tsx`

Server Component que:
1. Recibe `params.alumnoId`
2. Consulta Supabase: todos los campos del alumno
3. Consulta asistencias del alumno (ordenadas por fecha desc)
4. Consulta pagos del alumno (ordenados por fecha_cobro desc)
5. Pasa data al Client Component `AlumnoPerfil`

```tsx
// app/(app)/inicio/[alumnoId]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import AlumnoPerfil from "./_components/AlumnoPerfil";

export default async function AlumnoPerfilPage({
  params,
}: {
  params: Promise<{ alumnoId: string }>;
}) {
  const { alumnoId } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch alumno completo
  const { data: alumno, error } = await supabase
    .from("alumnos")
    .select("*")
    .eq("id", alumnoId)
    .single();

  if (error || !alumno) notFound();

  // Fetch asistencias
  const { data: asistencias } = await supabase
    .from("asistencias")
    .select("*")
    .eq("alumno_id", alumnoId)
    .order("fecha", { ascending: false }); // ajustar columna según tabla real

  // Fetch pagos
  const { data: pagos } = await supabase
    .from("pagos")
    .select("*")
    .eq("alumno_id", alumnoId)
    .order("fecha_cobro", { ascending: false });

  return (
    <AlumnoPerfil
      alumno={alumno}
      asistencias={asistencias ?? []}
      pagos={pagos ?? []}
    />
  );
}
```

---

## FASE 3: Client Component — Layout del perfil

### 3.1 Crear `app/(app)/inicio/[alumnoId]/_components/AlumnoPerfil.tsx`

Layout de dos columnas:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver      Nombre del Alumno                                │
├──────────────────┬──────────────────────────────────────────────┤
│                  │  [Tab: Asistencias]  [Tab: Pagos]            │
│  INFO PERSONAL   │                                              │
│  (panel fijo)    │  Contenido del tab activo                    │
│                  │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

**Estructura JSX general**:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PanelInfoPersonal from "./PanelInfoPersonal";
import TabAsistencias from "./TabAsistencias";
import TabPagos from "./TabPagos";

type Tab = "asistencias" | "pagos";

export default function AlumnoPerfil({ alumno, asistencias, pagos }) {
  const [tabActivo, setTabActivo] = useState<Tab>("asistencias");

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header con botón volver */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/inicio" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium">
          <ArrowLeft size={16} />
          Volver
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">{alumno.nombre}</h1>
      </div>

      {/* Layout de dos columnas */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna izquierda: info personal */}
        <div className="w-full lg:w-72 shrink-0">
          <PanelInfoPersonal alumno={alumno} />
        </div>

        {/* Columna derecha: tabs */}
        <div className="flex-1 min-w-0">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setTabActivo("asistencias")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tabActivo === "asistencias"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Asistencias
            </button>
            <button
              onClick={() => setTabActivo("pagos")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tabActivo === "pagos"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pagos
            </button>
          </div>

          {/* Contenido del tab */}
          {tabActivo === "asistencias" && (
            <TabAsistencias asistencias={asistencias} />
          )}
          {tabActivo === "pagos" && (
            <TabPagos pagos={pagos} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## FASE 4: Panel de Información Personal

### 4.1 Crear `_components/PanelInfoPersonal.tsx`

Panel fijo izquierdo con datos del alumno.

```tsx
// _components/PanelInfoPersonal.tsx
"use client";

import { User, Phone, MapPin, CreditCard, Calendar, CheckCircle, XCircle } from "lucide-react";

export default function PanelInfoPersonal({ alumno }) {
  // Calcular si está activo: 
  // Opción A: campo `activo` en DB
  // Opción B: comparar fecha_proximo_vencimiento con hoy
  const hoy = new Date();
  const vencimiento = alumno.fecha_proximo_vencimiento
    ? new Date(alumno.fecha_proximo_vencimiento)
    : null;
  const estaActivo = vencimiento ? vencimiento >= hoy : false;

  // Iniciales y color (reusar lógica existente)
  const initials = getInitials(alumno.nombre);
  const color = getColor(alumno.nombre);

  // Número de WhatsApp (solo dígitos)
  const telefonoLimpio = alumno.telefono?.replace(/\D/g, "") ?? "";
  const whatsappUrl = `https://wa.me/${telefonoLimpio}`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-5 sticky top-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{alumno.nombre ?? "Sin nombre"}</h2>
          {alumno.edad_actual != null && (
            <p className="text-sm text-gray-500">{alumno.edad_actual} años</p>
          )}
        </div>
        {/* Badge activo/inactivo */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
          estaActivo
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-600"
        }`}
        >
          {estaActivo ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {estaActivo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <hr className="border-gray-100" />

      {/* Datos */}
      <div className="flex flex-col gap-4">
        {/* DNI */}
        {alumno.dni && (
          <InfoRow icon={<CreditCard size={15} className="text-gray-400" />} label="DNI" value={alumno.dni} />
        )}

        {/* Domicilio */}
        {alumno.domicilio && (
          <InfoRow icon={<MapPin size={15} className="text-gray-400" />} label="Domicilio" value={alumno.domicilio} />
        )}

        {/* Teléfono con link a WhatsApp */}
        {alumno.telefono && (
          <div className="flex items-start gap-3">
            <Phone size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Teléfono</span>
              <span className="text-sm text-gray-800 font-medium">{alumno.telefono}</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors w-fit mt-1"
              >
                {/* Ícono WhatsApp SVG simple */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Alumno desde */}
        {alumno.fecha_registro && (
          <InfoRow
            icon={<Calendar size={15} className="text-gray-400" />}
            label="Alumno desde"
            value={formatFecha(alumno.fecha_registro)}
          />
        )}

        {/* Próximo vencimiento */}
        {alumno.fecha_proximo_vencimiento && (
          <InfoRow
            icon={<Calendar size={15} className="text-gray-400" />}
            label="Vence"
            value={formatFecha(alumno.fecha_proximo_vencimiento)}
          />
        )}
      </div>
    </div>
  );
}

// Sub-componente helper
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide block">{label}</span>
        <span className="text-sm text-gray-800 font-medium">{value}</span>
      </div>
    </div>
  );
}

// Helpers (copiar/reusar desde AlumnosList.tsx):
function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getInitials(nombre: string | null): string {
  if (!nombre) return "?";
  const words = nombre.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

const COLORS = ["#374151", "#6b7280", "#dc2626", "#4338ca", "#0f766e", "#9a3412", "#1e40af", "#78716c", "#a1a1aa", "#4b5563"];

function getColor(nombre: string | null): string {
  if (!nombre) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
```

---

## FASE 5: Tab de Asistencias

### 5.1 Crear `_components/TabAsistencias.tsx`

Este tab contiene dos secciones:
1. **Calendario** (arriba): muestra el mes actual, permite navegar por meses, marca en rojo los días con asistencia
2. **Lista desplegable por mes** (abajo): cada mes es un acordeón con las asistencias de ese mes

```tsx
// _components/TabAsistencias.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface Asistencia {
  id: string;
  alumno_id: string;
  fecha: string; // "YYYY-MM-DD" — ajustar si es timestamp
  hora?: string | null;
  // Si la fecha viene como timestamp, hacer: asistencia.fecha.split("T")[0]
}

interface Props {
  asistencias: Asistencia[];
}

export default function TabAsistencias({ asistencias }: Props) {
  const hoy = new Date();
  const [mesVista, setMesVista] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() }); // month: 0-11

  // Normalizar fechas a "YYYY-MM-DD"
  // Si el campo es timestamp, hacer: asistencia.fecha.split("T")[0]
  const fechasConAsistencia = new Set(
    asistencias.map((a) => {
      const fechaStr = typeof a.fecha === "string" ? a.fecha.split("T")[0] : "";
      return fechaStr;
    })
  );

  // Días del mes en vista
  const diasEnMes = new Date(mesVista.year, mesVista.month + 1, 0).getDate();
  const primerDiaSemana = new Date(mesVista.year, mesVista.month, 1).getDay(); // 0=Dom

  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  function mesAnterior() {
    setMesVista(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function mesSiguiente() {
    setMesVista(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  // Agrupar asistencias por mes para la lista
  const asistenciasPorMes: Record<string, Asistencia[]> = {};
  for (const a of asistencias) {
    const fechaStr = typeof a.fecha === "string" ? a.fecha.split("T")[0] : "";
    const [y, m] = fechaStr.split("-");
    const key = `${y}-${m}`;
    if (!asistenciasPorMes[key]) asistenciasPorMes[key] = [];
    asistenciasPorMes[key].push(a);
  }

  const mesesOrdenados = Object.keys(asistenciasPorMes).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Calendario ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-6">
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={mesAnterior} className="p-2 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <h3 className="text-sm font-bold text-gray-800">
            {nombresMeses[mesVista.month]} {mesVista.year}
          </h3>
          <button onClick={mesSiguiente} className="p-2 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Encabezados de días */}
        <div className="grid grid-cols-7 mb-2">
          {diasSemana.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-semibold py-1">{d}</div>
          ))}
        </div>

        {/* Grilla de días */}
        <div className="grid grid-cols-7 gap-1">
          {/* Celdas vacías al inicio */}
          {Array.from({ length: primerDiaSemana }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Días del mes */}
          {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => {
            const yyyy = mesVista.year;
            const mm = String(mesVista.month + 1).padStart(2, "0");
            const dd = String(dia).padStart(2, "0");
            const fechaCelda = `${yyyy}-${mm}-${dd}`;
            const tieneAsistencia = fechasConAsistencia.has(fechaCelda);

            return (
              <div
                key={dia}
                className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${
                  tieneAsistencia
                    ? "bg-red-500 text-white font-bold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {dia}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs text-gray-500">Día con asistencia</span>
        </div>
      </div>

      {/* ── Lista por mes (acordeón) ── */}
      {asistencias.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No hay asistencias registradas.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mesesOrdenados.map((mesKey) => (
            <MesAcordeon
              key={mesKey}
              mesKey={mesKey}
              asistencias={asistenciasPorMes[mesKey]}
              nombresMeses={nombresMeses}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MesAcordeon({
  mesKey,
  asistencias,
  nombresMeses,
}: {
  mesKey: string;
  asistencias: Asistencia[];
  nombresMeses: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [año, mes] = mesKey.split("-");
  const nombreMes = nombresMeses[parseInt(mes) - 1];

  // Ordenar asistencias del más reciente al más antiguo dentro del mes
  const ordenadas = [...asistencias].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors touch-manipulation"
      >
        <span className="text-sm font-semibold text-gray-800">
          {nombreMes} {año}
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({asistencias.length} asistencia{asistencias.length !== 1 ? "s" : ""})
          </span>
        </span>
        {abierto ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {abierto && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {ordenadas.map((a) => {
            const fechaStr = a.fecha.split("T")[0];
            const [y, m, d] = fechaStr.split("-");
            const horaDisplay = a.hora
              ? a.hora
              : a.fecha.includes("T")
              ? a.fecha.split("T")[1]?.slice(0, 5) // "HH:MM" del timestamp
              : null;

            return (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700 font-medium">
                  {d}/{m}/{y}
                </span>
                {horaDisplay && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />
                    {horaDisplay}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

## FASE 6: Tab de Pagos

### 6.1 Crear `_components/TabPagos.tsx`

Lista de pagos con todos los campos de la tabla `pagos`.

```tsx
// _components/TabPagos.tsx
"use client";

import { CreditCard, Calendar, DollarSign } from "lucide-react";

interface Pago {
  id: string;
  alumno_id: string;
  actividad: string;
  precio: number;
  fecha_cobro: string;   // "YYYY-MM-DD"
  medio_pago: string;
  fecha_inicio: string;  // "YYYY-MM-DD"
  fecha_vencimiento: string; // "YYYY-MM-DD"
}

interface Props {
  pagos: Pago[];
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const [y, m, d] = (dateStr.split("T")[0]).split("-");
  return `${d}/${m}/${y}`;
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(precio);
}

export default function TabPagos({ pagos }: Props) {
  if (pagos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No hay pagos registrados para este alumno.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pagos.map((pago) => {
        const hoy = new Date();
        const vencimiento = new Date(pago.fecha_vencimiento);
        const estaVencido = vencimiento < hoy;

        return (
          <div key={pago.id} className="bg-white rounded-xl border border-gray-100 p-4 md:p-5">
            {/* Header del pago */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{pago.actividad}</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cobrado: {formatFecha(pago.fecha_cobro)} · {pago.medio_pago}
                </p>
              </div>
              <span className="text-lg font-bold text-gray-900 shrink-0">
                {formatPrecio(pago.precio)}
              </span>
            </div>

            {/* Fechas */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar size={12} className="text-gray-400" />
                Inicio: <span className="font-medium text-gray-700">{formatFecha(pago.fecha_inicio)}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${estaVencido ? "text-red-500" : "text-gray-500"}`}> 
                <Calendar size={12} className={estaVencido ? "text-red-400" : "text-gray-400"} />
                Vence: <span className="font-medium">{formatFecha(pago.fecha_vencimiento)}</span>
                {estaVencido && (
                  <span className="ml-1 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                    Vencido
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Archivos a crear/modificar (resumen)

| Acción | Archivo |
|--------|---------|
| **MODIFICAR** | `app/(app)/inicio/_components/AlumnosList.tsx` — hacer `AlumnoCard` navegable con `<Link>` |
| **CREAR** | `app/(app)/inicio/[alumnoId]/page.tsx` — Server Component con data fetching |
| **CREAR** | `app/(app)/inicio/[alumnoId]/_components/AlumnoPerfil.tsx` — layout principal |
| **CREAR** | `app/(app)/inicio/[alumnoId]/_components/PanelInfoPersonal.tsx` — panel izquierdo |
| **CREAR** | `app/(app)/inicio/[alumnoId]/_components/TabAsistencias.tsx` — tab con calendario + lista |
| **CREAR** | `app/(app)/inicio/[alumnoId]/_components/TabPagos.tsx` — tab de pagos |

---