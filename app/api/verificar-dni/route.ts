import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

type Estado = "al-dia" | "vencido" | "advertencia" | "periodo_gracia" | "prueba";

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

    // Verificar si es un usuario de prueba
    if (alumno.es_prueba === true) {
      // Registrar asistencia para clase de prueba
      const now = new Date();
      const fechaISO = now.toISOString();
      const horaLocal = now.toTimeString().split(" ")[0]; // HH:MM:SS

      // Actualizar fecha_ultima_asistencia
      await supabase
        .from("alumnos")
        .update({ fecha_ultima_asistencia: fechaISO })
        .eq("id", alumno.id);

      // Crear registro en tabla asistencias
      await supabase
        .from("asistencias")
        .insert({
          alumno_id: alumno.id,
          fecha: fechaISO,
          hora: horaLocal,
        });

      return NextResponse.json({
        found: true,
        alumno: {
          nombre: alumno.nombre,
          estado: "prueba" as Estado,
          vencimiento: "Clase de Prueba",
          actividad: alumno.actividad_interes || "Clase de Prueba",
          esPrueba: true,
        },
      });
    }

    // 1. Determinar el estado ANTES de registrar asistencia
    //    (necesitamos saber si el ingreso está permitido)
    const { estado, clasesGracia } = await determinarEstado(alumno, supabase);

    // 2. Solo registrar asistencia si el ingreso está permitido
    const ingresoPermitido =
      estado === "al-dia" ||
      estado === "advertencia" ||
      estado === "periodo_gracia";

    if (ingresoPermitido) {
      const now = new Date();
      const fechaISO = now.toISOString();
      const horaLocal = now.toTimeString().split(" ")[0]; // HH:MM:SS

      // Actualizar fecha_ultima_asistencia
      const { error: updateError } = await supabase
        .from("alumnos")
        .update({ fecha_ultima_asistencia: fechaISO })
        .eq("id", alumno.id);

      if (updateError) {
        console.error("Error updating fecha_ultima_asistencia:", updateError);
      }

      // Crear registro en tabla asistencias
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

      // Si es período de gracia, incrementar el contador de clases usadas
      if (estado === "periodo_gracia") {
        const { error: graciaError } = await supabase
          .from("alumnos")
          .update({
            clases_gracia_usadas:
              (alumno.clases_gracia_usadas ?? 0) + 1,
          })
          .eq("id", alumno.id);

        if (graciaError) {
          console.error("Error updating clases_gracia_usadas:", graciaError);
        }
      }
    }

    // 3. Obtener información del plan activo (si existe)
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
        clasesGracia: clasesGracia ?? undefined,
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
): Promise<{
  estado: Estado;
  clasesGracia?: { usadas: number; disponibles: number };
}> {
  const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Buscar si existe algún plan activo HOY
  const { data: planesActivos, error } = await supabase
    .from("pagos")
    .select("fecha_inicio, fecha_vencimiento")
    .eq("alumno_id", alumno.id)
    .lte("fecha_inicio", hoy)
    .gte("fecha_vencimiento", hoy);

  if (error) {
    console.error("Error buscando planes activos:", error);
    return { estado: "vencido" };
  }

  // Si no hay planes activos hoy, verificar período de gracia
  if (!planesActivos || planesActivos.length === 0) {
    const disponibles: number = alumno.clases_gracia_disponibles ?? 0;
    const usadas: number = alumno.clases_gracia_usadas ?? 0;

    if (disponibles > 0 && usadas < disponibles) {
      // Tiene clases de gracia disponibles
      return {
        estado: "periodo_gracia",
        clasesGracia: {
          usadas: usadas + 1, // +1 porque esta clase se acaba de usar
          disponibles,
        },
      };
    }

    // Sin plan y sin gracia disponible → bloqueado
    return { estado: "vencido" };
  }

  // Tiene al menos un plan activo, verificar si está próximo a vencer
  const planActivo = planesActivos[0];
  const vencimiento = new Date(planActivo.fecha_vencimiento);
  const hoyDate = new Date(hoy);

  const diasRestantes =
    (vencimiento.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24);

  // Si vence en los próximos 7 días (advertencia)
  if (diasRestantes <= 7) {
    return { estado: "advertencia" };
  }

  // Al día
  return { estado: "al-dia" };
}

function formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
