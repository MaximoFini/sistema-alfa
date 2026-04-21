import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-indexed

    // Calcular ingresos del mes actual
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    const { data: pagosDelMes, error: pagosError } = await supabase
      .from("pagos")
      .select("precio, medio_pago, alumno_id")
      .gte("fecha_cobro", firstDayOfMonth.toISOString().split("T")[0])
      .lte("fecha_cobro", lastDayOfMonth.toISOString().split("T")[0]);

    if (pagosError) throw pagosError;

    // Calcular ingresos del mes
    const ingresosMes = pagosDelMes?.reduce(
      (sum, pago) => sum + Number(pago.precio),
      0
    ) || 0;

    // Calcular distribución de formas de pago
    const formasPagoMap = new Map<string, number>();
    pagosDelMes?.forEach((pago) => {
      const medio = pago.medio_pago || "Sin especificar";
      formasPagoMap.set(medio, (formasPagoMap.get(medio) || 0) + Number(pago.precio));
    });

    const formasPago = Array.from(formasPagoMap.entries()).map(([medio, monto]) => ({
      medio,
      monto,
      porcentaje: ingresosMes > 0 ? Math.round((monto / ingresosMes) * 100) : 0,
    }));

    // Obtener alumnos activos
    const { count: alumnosActivos, error: alumnosError } = await supabase
      .from("alumnos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);

    if (alumnosError) throw alumnosError;

    // Calcular ticket promedio
    const ticketPromedio = alumnosActivos && alumnosActivos > 0
      ? Math.round(ingresosMes / alumnosActivos)
      : 0;

    // Obtener deuda total acumulada (suma de saldos de alumnos activos)
    const { data: alumnosConDeuda, error: deudaError } = await supabase
      .from("alumnos")
      .select("saldo")
      .eq("activo", true);

    if (deudaError) throw deudaError;

    const deudaTotal = alumnosConDeuda?.reduce(
      (sum, alumno) => sum + Number(alumno.saldo || 0),
      0
    ) || 0;

    // Obtener ingresos del mes anterior
    const mesAnterior = currentMonth === 1 ? 12 : currentMonth - 1;
    const yearMesAnterior = currentMonth === 1 ? currentYear - 1 : currentYear;

    const { data: estadisticaMesAnterior } = await supabase
      .from("estadisticas_mensuales")
      .select("ingresos_mes")
      .eq("year", yearMesAnterior)
      .eq("month", mesAnterior)
      .single();

    const ingresosMesAnterior = estadisticaMesAnterior?.ingresos_mes || 0;

    // Calcular variación porcentual
    const variacion = ingresosMesAnterior > 0
      ? Math.round(((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100)
      : 0;

    // Obtener historial de ingresos mensuales (últimos 8 meses)
    const { data: historialIngresos, error: historialError } = await supabase
      .from("estadisticas_mensuales")
      .select("year, month, ingresos_mes")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(8);

    if (historialError) throw historialError;

    // Formatear historial con nombres de meses
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const ingresosHistorial = historialIngresos
      ?.map((stat) => ({
        mes: mesesNombres[stat.month - 1],
        monto: stat.ingresos_mes || 0,
      }))
      .reverse() || [];

    // Agregar el mes actual si hay datos
    if (ingresosMes > 0) {
      ingresosHistorial.push({
        mes: mesesNombres[currentMonth - 1],
        monto: ingresosMes,
      });
      // Mantener solo los últimos 8
      if (ingresosHistorial.length > 8) {
        ingresosHistorial.shift();
      }
    }

    // Contar alumnos con deuda
    const alumnosConDeudaCount = alumnosConDeuda?.filter(
      (alumno) => Number(alumno.saldo || 0) > 0
    ).length || 0;

    return NextResponse.json({
      ingresosMes,
      ticketPromedio,
      deudaTotal,
      alumnosActivos: alumnosActivos || 0,
      variacion,
      ingresosMesAnterior,
      alumnosConDeuda: alumnosConDeudaCount,
      formasPago,
      ingresosHistorial,
    });
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas financieras" },
      { status: 500 }
    );
  }
}
