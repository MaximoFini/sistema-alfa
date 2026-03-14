import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { dni } = await request.json();

    if (!dni) {
      return NextResponse.json({ error: "DNI es requerido" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Buscar alumno por DNI
    const { data: alumno, error: alumnoError } = await supabase
      .from("alumnos")
      .select("*")
      .eq("dni", dni)
      .single();

    // Si no se encuentra el alumno
    if (alumnoError || !alumno) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    // Registrar asistencia
    const now = new Date();
    const fechaISO = now.toISOString();
    const horaLocal = now.toTimeString().split(" ")[0]; // HH:MM:SS

    // 1. Actualizar fecha_ultima_asistencia en tabla alumnos
    const { error: updateError } = await supabase
      .from("alumnos")
      .update({ fecha_ultima_asistencia: fechaISO })
      .eq("id", alumno.id);

    if (updateError) {
      console.error("Error updating fecha_ultima_asistencia:", updateError);
    }

    // 2. Crear registro en tabla asistencias
    const { error: asistenciaError } = await supabase
      .from("asistencias")
      .insert({
        alumno_id: alumno.id,
        fecha: fechaISO,
        hora: horaLocal,
      });

    if (asistenciaError) {
      console.error("Error registering asistencia:", asistenciaError);
    }

    // Determinar estado del alumno (verificando si tiene un plan activo HOY)
    const estado = await determinarEstado(alumno, supabase);

    // Obtener información del plan activo (si existe)
    const { data: planActivo } = await supabase
      .from("pagos")
      .select("actividad, fecha_vencimiento")
      .eq("alumno_id", alumno.id)
      .lte("fecha_inicio", new Date().toISOString().split("T")[0])
      .gte("fecha_vencimiento", new Date().toISOString().split("T")[0])
      .order("fecha_vencimiento", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      found: true,
      alumno: {
        nombre: alumno.nombre,
        estado,
        vencimiento: planActivo?.fecha_vencimiento
          ? formatearFecha(planActivo.fecha_vencimiento)
          : "Sin fecha",
        actividad:
          planActivo?.actividad || alumno.actividad_proximo_vencimiento,
      },
    });
  } catch (error) {
    console.error("Error en verificar-dni:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

async function determinarEstado(
  alumno: any,
  supabase: any,
): Promise<"al-dia" | "vencido" | "advertencia"> {
  const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Buscar si existe algún plan activo HOY
  // Un plan está activo si: fecha_inicio <= HOY <= fecha_vencimiento
  const { data: planesActivos, error } = await supabase
    .from("pagos")
    .select("fecha_inicio, fecha_vencimiento")
    .eq("alumno_id", alumno.id)
    .lte("fecha_inicio", hoy)
    .gte("fecha_vencimiento", hoy);

  if (error) {
    console.error("Error buscando planes activos:", error);
    return "vencido";
  }

  // Si no hay planes activos hoy, está vencido
  if (!planesActivos || planesActivos.length === 0) {
    return "vencido";
  }

  // Tiene al menos un plan activo, verificar si está próximo a vencer
  const planActivo = planesActivos[0]; // Tomamos el primero (puede haber overlap)
  const vencimiento = new Date(planActivo.fecha_vencimiento);
  const hoyDate = new Date(hoy);

  // Calcular días restantes
  const diasRestantes =
    (vencimiento.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24);

  // Si vence en los próximos 7 días (advertencia)
  if (diasRestantes <= 7) {
    return "advertencia";
  }

  // Al día
  return "al-dia";
}

function formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
