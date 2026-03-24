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
    .order("fecha", { ascending: false });

  // Fetch pagos
  const { data: pagos } = await supabase
    .from("pagos")
    .select("*")
    .eq("alumno_id", alumnoId)
    .order("fecha_cobro", { ascending: false });

  // Fetch configuración de días de inactividad
  const { data: settings } = await supabase
    .from("settings")
    .select("days_after_expiration_inactive")
    .limit(1)
    .single();

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
