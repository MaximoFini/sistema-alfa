import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

type Estado =
  | "al-dia"
  | "vencido"
  | "advertencia"
  | "periodo_gracia"
  | "prueba";

// Función para calcular la edad a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const cumpleanos = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumpleanos.getFullYear();
  const m = hoy.getMonth() - cumpleanos.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
    edad--;
  }
  return edad;
}

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
      .select("id, nombre, activo, es_prueba, actividad_interes, actividad_proximo_vencimiento, clases_gracia_disponibles, clases_gracia_usadas, fecha_proximo_vencimiento, fecha_nacimiento, cus_completado, cus_clases_presentadas")
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
    const { estado, clasesGracia, razonBloqueo, fechaInicioPlan, planActivo } =
      await determinarEstado(alumno, supabase);

    const esMenorDeEdad = alumno.fecha_nacimiento
      ? calcularEdad(alumno.fecha_nacimiento) < 18
      : false;

    // 2. Solo registrar asistencia si el ingreso está permitido
    const ingresoPermitido =
      estado === "al-dia" ||
      estado === "advertencia" ||
      estado === "periodo_gracia" ||
      (estado === "vencido" && razonBloqueo === "cus_vencido");

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

      const updateData: any = { fecha_ultima_asistencia: fechaISO };
      let nuevoCusClasesPresentadas = alumno.cus_clases_presentadas ?? 0;
      if (esMenorDeEdad && alumno.cus_completado === false) {
        nuevoCusClasesPresentadas += 1;
        updateData.cus_clases_presentadas = nuevoCusClasesPresentadas;
      }

      // Si es período de gracia, incrementar el contador de clases usadas directamente en el mismo update
      if (estado === "periodo_gracia") {
        updateData.clases_gracia_usadas = (alumno.clases_gracia_usadas ?? 0) + 1;
      }

      // Ejecutar actualización del alumno e inserción de asistencia en paralelo
      const [updateResult, asistenciaResult] = await Promise.all([
        supabase
          .from("alumnos")
          .update(updateData)
          .eq("id", alumno.id),
        supabase
          .from("asistencias")
          .insert({
            alumno_id: alumno.id,
            fecha: fechaISO,
            hora: horaLocal,
          })
      ]);

      if (updateResult.error) {
        console.error("Error updating alumno:", updateResult.error);
      }
      if (asistenciaResult.error) {
        console.error("Error registering asistencia:", asistenciaResult.error);
      }
    }

    // 3. El plan activo ya fue obtenido y filtrado en memoria dentro de determinarEstado

    const finalCusClases = ingresoPermitido && esMenorDeEdad && alumno.cus_completado === false
      ? (alumno.cus_clases_presentadas ?? 0) + 1
      : (alumno.cus_clases_presentadas ?? 0);

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
              : razonBloqueo === "cus_vencido"
                ? "Falta CUS obligatorio"
                : "Sin fecha",
        actividad:
          planActivo?.actividad || alumno.actividad_proximo_vencimiento,
        clasesGracia: clasesGracia ?? undefined,
        razonBloqueo: razonBloqueo,
        esMenorDeEdad,
        cusCompletado: alumno.cus_completado,
        cusClasesPresentadas: finalCusClases,
        clasesCusMargen: esMenorDeEdad && alumno.cus_completado === false
          ? Math.max(0, 3 - finalCusClases)
          : undefined,
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
  razonBloqueo?: "sin_plan" | "plan_no_iniciado" | "cus_vencido";
  fechaInicioPlan?: string;
  planActivo?: any;
}> {
  const hoy = getFechaLocal(); // YYYY-MM-DD

  // Validar si el alumno es menor y si el CUS está vencido (bloqueado)
  const esMenorDeEdad = alumno.fecha_nacimiento
    ? calcularEdad(alumno.fecha_nacimiento) < 18
    : false;

  if (esMenorDeEdad && alumno.cus_completado === false && (alumno.cus_clases_presentadas ?? 0) >= 3) {
    return {
      estado: "vencido",
      razonBloqueo: "cus_vencido",
    };
  }

  // Una sola query trae todos los planes — filtramos con JS
  const { data: todosLosPlanes, error: errorPlanes } = await supabase
    .from("pagos")
    .select("fecha_inicio, fecha_vencimiento, actividad")
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

  // 1. Filtrar planes activos hoy (en JS, sin segunda query)
  const planesActivos = todosLosPlanes.filter(
    (p: any) => p.fecha_inicio <= hoy && p.fecha_vencimiento >= hoy
  );

  // Ordenar por fecha_vencimiento DESC para obtener el plan con mayor vigencia
  const planesActivosOrdenados = [...planesActivos].sort(
    (a: any, b: any) => new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime()
  );
  const planActivo = planesActivosOrdenados[0] || null;

  // 2. Si tiene plan activo → verificar si está próximo a vencer
  if (planActivo) {
    const vencimiento = new Date(planActivo.fecha_vencimiento);
    const hoyDate = new Date(hoy);
    const diasRestantes =
      (vencimiento.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24);

    if (esMenorDeEdad && alumno.cus_completado === false && (alumno.cus_clases_presentadas ?? 0) < 3) {
      return { estado: "advertencia", planActivo };
    }

    if (diasRestantes <= 7) {
      return { estado: "advertencia", planActivo };
    }

    return { estado: "al-dia", planActivo };
  }

  // 3. Si no tiene plan activo hoy, verificar si tiene un plan futuro agendado
  const planesFuturos = todosLosPlanes.filter((p: any) => p.fecha_inicio > hoy);
  if (planesFuturos.length > 0) {
    // El plan futuro más cercano (ordenado por fecha_inicio asc)
    const planProximo = planesFuturos[0];
    return {
      estado: "vencido",
      razonBloqueo: "plan_no_iniciado",
      fechaInicioPlan: planProximo.fecha_inicio,
    };
  }

  // 4. Si no tiene plan activo ni plan futuro → verificar período de gracia (planes vencidos)
  const disponibles: number = alumno.clases_gracia_disponibles ?? 0;
  const usadas: number = alumno.clases_gracia_usadas ?? 0;

  if (disponibles > 0 && usadas < disponibles) {
    if (esMenorDeEdad && alumno.cus_completado === false && (alumno.cus_clases_presentadas ?? 0) < 3) {
      return {
        estado: "advertencia",
        clasesGracia: { usadas: usadas + 1, disponibles },
      };
    }
    return {
      estado: "periodo_gracia",
      clasesGracia: { usadas: usadas + 1, disponibles },
    };
  }

  return { estado: "vencido" };
}

function formatearFecha(fecha: string): string {
  if (!fecha) return "Sin fecha";
  const clean = fecha.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  // Fallback a parser standard con UTC para evitar desfases de zona horaria
  try {
    const date = new Date(fecha);
    const dia = String(date.getUTCDate()).padStart(2, "0");
    const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
    const anio = date.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  } catch {
    return fecha;
  }
}
