import { createSupabaseServerClient } from "@/lib/supabase-server";
import { disconnectWhatsApp } from "@/lib/whatsapp-client";
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

    await disconnectWhatsApp();

    return NextResponse.json({ success: true, message: "Sesión de WhatsApp cerrada" });
  } catch (err: any) {
    console.error("Error en POST /api/whatsapp/disconnect:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
