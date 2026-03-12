import { createSupabaseServerClient } from "@/lib/supabase-server";
import AlumnosList from "./_components/AlumnosList";

// ─────────────────────────────────────────────
// Constante de paginación
// ─────────────────────────────────────────────
const POR_PAGINA = 20;

// ─────────────────────────────────────────────
// Server Component – data fetching con .range() + búsqueda ilike
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

  const from = (paginaActual - 1) * POR_PAGINA;
  const to = from + POR_PAGINA - 1;

  const supabase = await createSupabaseServerClient();

  // Construir la consulta base
  let consulta = supabase
    .from("alumnos")
    .select("id, nombre, edad_actual, fecha_registro, fecha_ultima_asistencia, dni", {
      count: "exact",
    })
    .order("fecha_ultima_asistencia", { ascending: false, nullsFirst: false });

  // Aplicar filtro de búsqueda si existe un query
  if (query) {
    consulta = consulta.or(
      `nombre.ilike.%${query}%,dni.ilike.%${query}%`,
    );
  }

  // Aplicar paginación al final
  const { data, count, error } = await consulta.range(from, to);

  if (error) {
    console.error("[InicioPage] Error fetching alumnos:", error.message);
  }

  const totalRegistros = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / POR_PAGINA));

  // Asegurarse de no pasar una página mayor al total disponible
  const paginaFinal = Math.min(paginaActual, totalPaginas);

  return (
    <AlumnosList
      alumnos={data ?? []}
      totalRegistros={totalRegistros}
      paginaActual={paginaFinal}
      totalPaginas={totalPaginas}
      porPagina={POR_PAGINA}
      queryActual={query}
    />
  );
}
