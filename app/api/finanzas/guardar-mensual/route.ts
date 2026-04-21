import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * API endpoint para guardar estadísticas mensuales
 * Puede ser llamado por un cron job externo (Vercel Cron, GitHub Actions, etc.)
 * o manualmente desde el panel de administración
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Llamar a la función de PostgreSQL que verifica y guarda estadísticas
    const { data, error } = await supabase.rpc("verificar_y_guardar_estadisticas_mensuales");

    if (error) {
      console.error("Error calling function:", error);
      return NextResponse.json(
        { error: "Error al guardar estadísticas mensuales", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Proceso de verificación de estadísticas ejecutado correctamente",
    });
  } catch (error) {
    console.error("Error saving monthly stats:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para ejecutar manualmente desde el navegador
 */
export async function GET() {
  return POST();
}
