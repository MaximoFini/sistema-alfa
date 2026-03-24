import { createSupabaseServerClient } from "@/lib/supabase-server";
import AlumnosList, { AlumnoRow } from "./_components/AlumnosList";

// ─────────────────────────────────────────────
// Deshabilitar caché para tiempo real
// ─────────────────────────────────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─────────────────────────────────────────────
// Constante de paginación
// ─────────────────────────────────────────────
const POR_PAGINA = 20;

// ─────────────────────────────────────────────
// Server Component – ordena por última asistencia en la DB
// ─────────────────────────────────────────────
export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const params = await searchParams;

  // Parsear y validar el número de página
  const paginaRaw = Number(params.page ?? "1");
  const paginaActual =
    Number.isFinite(paginaRaw) && paginaRaw >= 1 ? Math.floor(paginaRaw) : 1;

  // Término de búsqueda (limpiado de espacios extremos)
  const query = params.query?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  try {
    const offset = (paginaActual - 1) * POR_PAGINA;

    // ─────────────────────────────────────────────────────────────────────────
    // Estrategia: una sola query SQL eficiente usando LEFT JOIN LATERAL.
    //
    // Para cada alumno obtenemos su asistencia más reciente mediante un
    // subquery lateral que:
    //   1. Filtra asistencias del alumno actual
    //   2. Ordena DESC por fecha y hora
    //   3. Toma solo la primera fila (LIMIT 1)
    //
    // Luego ordenamos el resultado por:
    //   COALESCE(ult_asistencia.fecha, '1900-01-01') DESC  → con asistencia primero
    //   COALESCE(ult_asistencia.hora, '00:00:00') DESC     → más reciente arriba
    //
    // Esto permite que alumnos SIN asistencia en tabla asistencias, pero CON
    // fecha_ultima_asistencia en la tabla alumnos, también aparezcan correctamente.
    // Los completamente sin asistencia van al final.
    // ─────────────────────────────────────────────────────────────────────────

    // Sanitizar query para evitar inyección en SQL (solo caracteres alfanuméricos y espacios)
    const safeQuery = query.replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s]/g, "");

    const filtroWhere = safeQuery
      ? `AND (al.nombre ILIKE '%${safeQuery}%' OR al.dni ILIKE '%${safeQuery}%')`
      : "";

    // Query principal: alumnos ordenados por última asistencia
    const { data: alumnosRaw, error } = await supabase.rpc(
      "alumnos_por_orden_llegada",
      {
        p_query: safeQuery || null,
        p_limit: POR_PAGINA,
        p_offset: offset,
      },
    );

    if (error) {
      // Si la función RPC no existe todavía, fallback a método básico
      console.warn(
        "[InicioPage] RPC no disponible, usando fallback:",
        error.message,
      );
      return await fallbackQuery(supabase, query, paginaActual);
    }

    // Count separado para paginación
    let countQuery = supabase
      .from("alumnos")
      .select("id", { count: "exact", head: true });

    if (query) {
      countQuery = countQuery.or(
        `nombre.ilike.%${query}%,dni.ilike.%${query}%`,
      );
    }
    const { count } = await countQuery;

    const totalRegistros = count ?? 0;
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / POR_PAGINA));
    const paginaFinal = Math.min(paginaActual, totalPaginas);

    // Transformar datos al tipo AlumnoRow
    const alumnos: AlumnoRow[] = (alumnosRaw ?? []).map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      edad_actual: row.edad_actual,
      fecha_registro: row.fecha_registro,
      dni: row.dni,
      es_prueba: row.es_prueba,
      actividad_interes: row.actividad_interes,
      ultimaAsistencia: row.ult_fecha
        ? { fecha: row.ult_fecha, hora: row.ult_hora ?? null }
        : null,
    }));

    return (
      <AlumnosList
        alumnos={alumnos}
        totalRegistros={totalRegistros}
        paginaActual={paginaFinal}
        totalPaginas={totalPaginas}
        porPagina={POR_PAGINA}
        queryActual={query}
      />
    );
  } catch (error) {
    console.error("[InicioPage] Error:", error);
    return (
      <div className="p-4">
        <p className="text-red-600">Error al cargar los alumnos</p>
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback: usado mientras se crea la función RPC en Supabase.
// Obtiene alumnos ordenados por fecha_ultima_asistencia (sin hora) + nombre.
// ─────────────────────────────────────────────────────────────────────────────
async function fallbackQuery(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  query: string,
  paginaActual: number,
): Promise<React.ReactElement> {
  const POR_PAG = POR_PAGINA;
  const from = (paginaActual - 1) * POR_PAG;
  const to = from + POR_PAG - 1;

  let q = supabase
    .from("alumnos")
    .select(
      "id, nombre, edad_actual, fecha_registro, dni, fecha_ultima_asistencia, es_prueba, actividad_interes",
      {
        count: "exact",
      },
    )
    .order("fecha_ultima_asistencia", { ascending: false, nullsFirst: false })
    .order("nombre", { ascending: true })
    .range(from, to);

  if (query) {
    q = q.or(`nombre.ilike.%${query}%,dni.ilike.%${query}%`);
  }

  const { data, count, error } = await q;

  if (error) throw error;

  const totalRegistros = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / POR_PAG));
  const paginaFinal = Math.min(paginaActual, totalPaginas);

  // En el fallback, asociamos la fecha_ultima_asistencia del alumno sin hora
  const alumnos: AlumnoRow[] = (data ?? []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    edad_actual: row.edad_actual,
    fecha_registro: row.fecha_registro,
    dni: row.dni,
    es_prueba: row.es_prueba,
    actividad_interes: row.actividad_interes,
    ultimaAsistencia: row.fecha_ultima_asistencia
      ? { fecha: row.fecha_ultima_asistencia.split("T")[0], hora: null }
      : null,
  }));

  const { default: AlumnosList } = await import("./_components/AlumnosList");

  return (
    <AlumnosList
      alumnos={alumnos}
      totalRegistros={totalRegistros}
      paginaActual={paginaFinal}
      totalPaginas={totalPaginas}
      porPagina={POR_PAG}
      queryActual={query}
    />
  );
}
