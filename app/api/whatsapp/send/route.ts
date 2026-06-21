import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getWhatsAppClient, whatsappStatusStore, formatWhatsappNumber } from "@/lib/whatsapp-client";
import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

function diasDesde(fechaStr: string | null): number | null {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + "T00:00:00");
  return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

function interpolarMensaje(texto: string, alumno: any): string {
  const dias = diasDesde(alumno.fecha_ultima_asistencia);
  return texto
    .replace(/\{nombre\}/g, alumno.nombre ?? "Alumno")
    .replace(/\{dias_inactivo\}/g, dias !== null ? String(dias) : "—");
}

async function runSendingProcess(msgId: string, textTemplate: string, alumnos: any[]) {
  console.log(`[WhatsApp] Iniciando envío de lote para mensaje ${msgId} a ${alumnos.length} alumnos`);
  const client = getWhatsAppClient();
  let successCount = 0;
  let failCount = 0;

  for (const alumno of alumnos) {
    if (!alumno.telefono) {
      failCount++;
      continue;
    }

    const text = interpolarMensaje(textTemplate, alumno);
    const formattedPhone = formatWhatsappNumber(alumno.telefono);

    if (formattedPhone) {
      try {
        // Verificar si el número está registrado en WhatsApp
        const numberId = await client.getNumberId(formattedPhone);
        const target = numberId ? numberId._serialized : formattedPhone;

        await client.sendMessage(target, text);
        successCount++;
        console.log(`[WhatsApp] Mensaje enviado a ${alumno.nombre} (${target})`);
      } catch (err) {
        console.error(`[WhatsApp] Error al enviar a ${alumno.nombre} (${formattedPhone}):`, err);
        failCount++;
      }
    } else {
      failCount++;
    }

    // Delay protector entre 1.5 y 3 segundos
    const delay = 1500 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const finalEstado = successCount > 0 ? "enviado" : "error";
  console.log(`[WhatsApp] Envío finalizado. Éxitos: ${successCount}, Fallidos: ${failCount}. Estado final: ${finalEstado}`);

  await getSupabaseAdmin()
    .from("comunicacion_mensajes")
    .update({ estado: finalEstado })
    .eq("id", msgId);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (whatsappStatusStore.status !== "CONNECTED") {
      return NextResponse.json(
        { error: "WhatsApp no está conectado. Por favor vincule su celular primero." },
        { status: 400 }
      );
    }

    const { mensaje, alumnos, filtro, filtroLabel } = await request.json();

    if (!mensaje || !alumnos || !Array.isArray(alumnos) || alumnos.length === 0) {
      return NextResponse.json(
        { error: "Mensaje o lista de alumnos inválida." },
        { status: 400 }
      );
    }

    // Crear el registro inicial en la base de datos
    const { data: dbRecord, error: dbError } = await getSupabaseAdmin()
      .from("comunicacion_mensajes")
      .insert({
        texto: mensaje.trim(),
        filtro,
        filtro_label: filtroLabel,
        cantidad: alumnos.length,
        estado: "guardado",
      })
      .select()
      .single();

    if (dbError || !dbRecord) {
      console.error("Error al crear registro de mensaje:", dbError);
      return NextResponse.json(
        { error: "Error al registrar el envío en la base de datos." },
        { status: 500 }
      );
    }

    after(() => runSendingProcess(dbRecord.id, mensaje.trim(), alumnos));

    return NextResponse.json({
      success: true,
      message: "Envío iniciado en segundo plano.",
      messageId: dbRecord.id,
    });
  } catch (err: any) {
    console.error("Error en POST /api/whatsapp/send:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
