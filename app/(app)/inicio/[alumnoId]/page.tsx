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

  try {
    // Intentar obtener datos con RPC optimizada
    const { data: perfilData, error: rpcError } = await supabase.rpc(
      "get_alumno_perfil_completo",
      { p_alumno_id: alumnoId },
    );

    if (!rpcError && perfilData) {
      // RPC exitosa - parsear datos
      const alumno = perfilData.alumno;
      const asistencias = perfilData.asistencias || [];
      const pagos = perfilData.pagos || [];

      if (!alumno) return notFound();

      // Obtener settings (se mantiene separado ya que es un singleton y puede cachearse)
      const { data: settings } = await supabase
        .from("settings")
        .select("days_after_expiration_inactive")
        .limit(1)
        .single();

      const diasInactivo = settings?.days_after_expiration_inactive ?? 7;

      return (
        <AlumnoPerfil
          alumno={alumno}
          asistencias={asistencias}
          pagos={pagos}
          diasInactivo={diasInactivo}
        />
      );
    }

    // Fallback: queries individuales si RPC no disponible
    console.warn(
      "[AlumnoPerfilPage] RPC no disponible, usando fallback:",
      rpcError?.message,
    );
  } catch (error) {
    console.error("[AlumnoPerfilPage] Error en RPC:", error);
  }

  // Fallback: fetch con queries separadas
  const { data: alumno, error } = await supabase
    .from("alumnos")
    .select("*")
    .eq("id", alumnoId)
    .single();

  if (error || !alumno) notFound();

  // Fetch asistencias y pagos en paralelo
  const [{ data: asistencias }, { data: pagos }, { data: settings }] =
    await Promise.all([
      supabase
        .from("asistencias")
        .select("*")
        .eq("alumno_id", alumnoId)
        .order("fecha", { ascending: false }),
      supabase
        .from("pagos")
        .select("*")
        .eq("alumno_id", alumnoId)
        .order("fecha_cobro", { ascending: false }),
      supabase
        .from("settings")
        .select("days_after_expiration_inactive")
        .limit(1)
        .single(),
    ]);

  const diasInactivo = settings?.days_after_expiration_inactive ?? 7;

  return (
    <AlumnoPerfil
      alumno={alumno}
      asistencias={asistencias ?? []}
      pagos={pagos ?? []}
      diasInactivo={diasInactivo}
    />
  );
}
