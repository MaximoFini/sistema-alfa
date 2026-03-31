import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Función auxiliar para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Actividades permitidas para clase de prueba
const ACTIVIDADES_PERMITIDAS = [
  "Boxeo",
  "MMA",
  "Kick-boxing",
  "Jiu-Jitsu",
  "Lucha",
];

interface TrialRegistrationData {
  nombre: string;
  dni: string;
  telefono: string;
  fecha_nacimiento: string;
  direccion: string;
  genero: string;
  actividad: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrialRegistrationData = await request.json();

    // Validar campos requeridos
    const camposRequeridos: (keyof TrialRegistrationData)[] = [
      "nombre",
      "dni",
      "telefono",
      "fecha_nacimiento",
      "direccion",
      "genero",
      "actividad",
    ];

    for (const campo of camposRequeridos) {
      if (!body[campo] || body[campo].toString().trim() === "") {
        return NextResponse.json(
          { error: `El campo ${campo} es requerido` },
          { status: 400 },
        );
      }
    }

    // Validar formato de DNI (7-8 dígitos numéricos)
    const dniStr = body.dni.toString().trim();
    if (!/^\d{7,8}$/.test(dniStr)) {
      return NextResponse.json(
        { error: "El DNI debe tener 7 u 8 dígitos numéricos" },
        { status: 400 },
      );
    }

    // Validar que la actividad esté en la lista permitida
    if (!ACTIVIDADES_PERMITIDAS.includes(body.actividad)) {
      return NextResponse.json(
        {
          error:
            "La actividad seleccionada no está disponible para clase de prueba",
        },
        { status: 400 },
      );
    }

    // Validar formato de fecha de nacimiento (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.fecha_nacimiento)) {
      return NextResponse.json(
        { error: "La fecha de nacimiento debe estar en formato YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verificar si el DNI ya existe en la base de datos
    const { data: alumnoExistente, error: searchError } = await supabase
      .from("alumnos")
      .select("id, es_prueba, nombre")
      .eq("dni", dniStr)
      .maybeSingle();

    if (searchError) {
      console.error("Error al buscar alumno existente:", searchError);
      return NextResponse.json(
        { error: "Error al verificar el DNI" },
        { status: 500 },
      );
    }

    // Si el DNI existe y ya hizo clase de prueba, rechazar
    if (alumnoExistente && alumnoExistente.es_prueba) {
      return NextResponse.json(
        {
          error:
            "Ya existe un registro de clase de prueba con este DNI. Por favor, contacta al gimnasio.",
          code: "TRIAL_ALREADY_REGISTERED",
        },
        { status: 409 },
      );
    }

    // Si el DNI existe y es un alumno regular, rechazar
    if (alumnoExistente && !alumnoExistente.es_prueba) {
      return NextResponse.json(
        {
          error: "Este DNI ya está registrado como alumno del gimnasio.",
          code: "ALREADY_MEMBER",
        },
        { status: 409 },
      );
    }

    // Calcular edad aproximada
    const fechaNacimiento = new Date(body.fecha_nacimiento);
    const hoy = new Date();
    let edadActual = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = fechaNacimiento.getMonth();
    if (
      mesActual < mesNacimiento ||
      (mesActual === mesNacimiento && hoy.getDate() < fechaNacimiento.getDate())
    ) {
      edadActual--;
    }

    // Insertar nuevo alumno con es_prueba=true
    const { data: nuevoAlumno, error: insertError } = await supabase
      .from("alumnos")
      .insert({
        nombre: body.nombre.trim(),
        dni: dniStr,
        telefono: body.telefono.trim(),
        fecha_nacimiento: body.fecha_nacimiento,
        domicilio: body.direccion.trim(),
        genero: body.genero,
        edad_actual: edadActual,
        fecha_registro: getFechaLocal(),
        activo: true,
        es_prueba: true,
        saldo: 0,
        actividad_interes: body.actividad,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error al insertar alumno de prueba:", insertError);
      return NextResponse.json(
        {
          error:
            "Error al registrar la clase de prueba. Por favor, intenta nuevamente.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "¡Registro exitoso! Tu clase de prueba ha sido confirmada.",
        data: {
          nombre: nuevoAlumno.nombre,
          actividad: body.actividad,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en trial-registration:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// Endpoint GET para obtener las actividades disponibles (opcional, para el formulario)
export async function GET() {
  return NextResponse.json({
    actividades: ACTIVIDADES_PERMITIDAS,
  });
}
