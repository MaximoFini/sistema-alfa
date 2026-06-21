import { createSupabaseServerClient } from "@/lib/supabase-server";
import { whatsappStatusStore } from "@/lib/whatsapp-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      status: whatsappStatusStore.status,
      qr: whatsappStatusStore.qr,
      error: whatsappStatusStore.error,
    });
  } catch (err: any) {
    console.error("Error en GET /api/whatsapp/status:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
