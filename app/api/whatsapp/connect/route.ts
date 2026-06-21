import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getWhatsAppClient } from "@/lib/whatsapp-client";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Inicializar el cliente (esto dispara la carga de Puppeteer y generación de QR)
    getWhatsAppClient();

    return NextResponse.json({ success: true, message: "Iniciando cliente de WhatsApp" });
  } catch (err: any) {
    console.error("Error en POST /api/whatsapp/connect:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
