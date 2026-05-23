import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

type Estado =
  | "al-dia"
  | "vencido"
  | "advertencia"
  | "periodo_gracia"
  | "prueba";

// Función auxiliar para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
      .select("id, nombre, activo, es_prueba, actividad_interes, actividad_proximo_vencimiento, clases_gracia_disponibles, clases_gracia_usadas, fecha_proximo_vencimiento")
      .eq("dni", dni)
      .single();

    // Si no se encuentra el alumno
    if (alumnoError || !alumno) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    // Verificar si es un usuario de prueba
    if (alumno.es_prueba === true) {
      // Verificar si ya usó su clase de prueba (ya tiene asistencias registradas)
      const { data: asistenciasExistentes, error: asistenciasError } =
        await supabase
          .from("asistencias")
          .select("id")
          .eq("alumno_id", alumno.id)
          .limit(1);

      if (asistenciasError) {
        console.error(
          "Error verificando asistencias de prueba:",
          asistenciasError,
        );
        return NextResponse.json(
          { error: "Error al verificar el estado de la clase de prueba" },
          { status: 500 },
        );
      }

      // Si ya tiene asistencias registradas, no permitir otra
      if (asistenciasExistentes && asistenciasExistentes.length > 0) {
        return NextResponse.json({
          found: true,
          alumno: {
            nombre: alumno.nombre,
            estado: "vencido" as Estado,
            vencimiento: "Clase de Prueba Utilizada",
            actividad: alumno.actividad_interes || "Clase de Prueba",
            esPrueba: true,
            yaUsoClasePrueba: true,
          },
        });
      }

      // Registrar asistencia para clase de prueba (solo si no tiene asistencias previas)
      const now = new Date();

      // Crear fecha y hora en hora local (sin conversión a UTC)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const fechaLocal = `${year}-${month}-${day}`;
      const horaLocal = `${hours}:${minutes}:${seconds}`;
      const fechaISO = `${fechaLocal}T${horaLocal}`;

      // Actualizar fecha_ultima_asistencia
      await supabase
        .from("alumnos")
        .update({ fecha_ultima_asistencia: fechaISO })
        .eq("id", alumno.id);

      // Crear registro en tabla asistencias
      await supabase.from("asistencias").insert({
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
    const { estado, clasesGracia, razonBloqueo, fechaInicioPlan } =
      await determinarEstado(alumno, supabase);

    // 2. Solo registrar asistencia si el ingreso está permitido
    const ingresoPermitido =
      estado === "al-dia" ||
      estado === "advertencia" ||
      estado === "periodo_gracia";

    if (ingresoPermitido) {
      const now = new Date();

      // Crear fecha y hora en hora local (sin conversión a UTC)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const fechaLocal = `${year}-${month}-${day}`;
      const horaLocal = `${hours}:${minutes}:${seconds}`;
      const fechaISO = `${fechaLocal}T${horaLocal}`;

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
            clases_gracia_usadas: (alumno.clases_gracia_usadas ?? 0) + 1,
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
      .lte("fecha_inicio", getFechaLocal())
      .gte("fecha_vencimiento", getFechaLocal())
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
          : razonBloqueo === "sin_plan"
            ? "Sin plan registrado"
            : razonBloqueo === "plan_no_iniciado" && fechaInicioPlan
              ? `Inicia el ${formatearFecha(fechaInicioPlan)}`
              : "Sin fecha",
        actividad:
          planActivo?.actividad || alumno.actividad_proximo_vencimiento,
        clasesGracia: clasesGracia ?? undefined,
        razonBloqueo: razonBloqueo,
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
  razonBloqueo?: "sin_plan" | "plan_no_iniciado";
  fechaInicioPlan?: string;
}> {
  const hoy = getFechaLocal(); // YYYY-MM-DD

  // Una sola query trae todos los planes — filtramos con JS
  const { data: todosLosPlanes, error: errorPlanes } = await supabase
    .from("pagos")
    .select("fecha_inicio, fecha_vencimiento")
    .eq("alumno_id", alumno.id)
    .order("fecha_inicio", { ascending: true })
    .limit(50); // máximo razonable

  if (errorPlanes) {
    console.error("Error buscando planes del alumno:", errorPlanes);
    return { estado: "vencido" };
  }

  // Sin ningún plan registrado → bloquear
  if (!todosLosPlanes || todosLosPlanes.length === 0) {
    return { estado: "vencido", razonBloqueo: "sin_plan" };
  }

  // Plan próximo (futuro o el más reciente)
  const planProximo =
    todosLosPlanes.find((p: any) => p.fecha_inicio >= hoy) ||
    todosLosPlanes[todosLosPlanes.length - 1];

  // Plan con inicio futuro → bloqueado con razón
  if (planProximo && planProximo.fecha_inicio > hoy) {
    return {
      estado: "vencido",
      razonBloqueo: "plan_no_iniciado",
      fechaInicioPlan: planProximo.fecha_inicio,
    };
  }

  // Filtrar planes activos hoy (en JS, sin segunda query)
  const planesActivos = todosLosPlanes.filter(
    (p: any) => p.fecha_inicio <= hoy && p.fecha_vencimiento >= hoy
  );

  // Sin planes activos hoy → verificar período de gracia
  if (planesActivos.length === 0) {
    const disponibles: number = alumno.clases_gracia_disponibles ?? 0;
    const usadas: number = alumno.clases_gracia_usadas ?? 0;

    if (disponibles > 0 && usadas < disponibles) {
      return {
        estado: "periodo_gracia",
        clasesGracia: { usadas: usadas + 1, disponibles },
      };
    }
    return { estado: "vencido" };
  }

  // Tiene plan activo → verificar si está próximo a vencer
  const planActivo = planesActivos[0];
  const vencimiento = new Date(planActivo.fecha_vencimiento);
  const hoyDate = new Date(hoy);
  const diasRestantes =
    (vencimiento.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diasRestantes <= 7) {
    return { estado: "advertencia" };
  }

  return { estado: "al-dia" };
}

function formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
