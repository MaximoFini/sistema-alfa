import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const now = new Date();
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");

    const currentYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const currentMonth = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    // Rangos del mes seleccionado
    const firstDayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const lastDayVal = new Date(currentYear, currentMonth, 0).getDate();
    const lastDayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDayVal).padStart(2, "0")}`;

    // Rangos del semestre
    const esPrimerSemestre = currentMonth <= 6;
    const mesInicio = esPrimerSemestre ? 1 : 7;
    const mesFin = esPrimerSemestre ? 6 : 12;

    // Mes anterior (para estadisticaMesAnterior)
    const mesAnterior = currentMonth === 1 ? 12 : currentMonth - 1;
    const yearMesAnterior = currentMonth === 1 ? currentYear - 1 : currentYear;

    // ─── Consultas independientes del mes actual en paralelo ──────────────────
    const [
      { data: pagosDelMes, error: pagosError },
      { data: ventasDelMes, error: ventasError },
      { data: activePaymentMethods, error: methodsError },
      { data: expensesConfig },
      { data: salariesConfig },
      { data: alumnosData, error: alumnosError },
      { data: estadisticaMesAnterior },
    ] = await Promise.all([
      // 1. Pagos del mes seleccionado
      supabase
        .from("pagos")
        .select("precio, medio_pago, alumno_id")
        .gte("fecha_cobro", firstDayStr)
        .lte("fecha_cobro", lastDayStr),

      // 2. Ventas del mes seleccionado
      supabase
        .from("ventas")
        .select("total, medio_pago")
        .gte("created_at", `${firstDayStr}T00:00:00.000Z`)
        .lte("created_at", `${lastDayStr}T23:59:59.999Z`),

      // 3. Métodos de pago activos
      supabase
        .from("payment_methods")
        .select("name")
        .eq("is_active", true),

      // 4. Gastos del mes seleccionado
      supabase
        .from("monthly_expenses_config")
        .select("amount")
        .eq("year", currentYear)
        .eq("month", currentMonth)
        .eq("is_active", true),

      // 5. Sueldos del mes seleccionado
      supabase
        .from("monthly_salaries_config")
        .select("amount")
        .eq("year", currentYear)
        .eq("month", currentMonth)
        .eq("is_active", true),

      // 6. Alumnos activos (saldo)
      supabase
        .from("alumnos")
        .select("saldo")
        .eq("activo", true),

      // 7. Estadística mes anterior
      supabase
        .from("estadisticas_mensuales")
        .select("ingresos_mes")
        .eq("year", yearMesAnterior)
        .eq("month", mesAnterior)
        .single(),
    ]);

    // ─── Validación de errores ────────────────────────────────────────────────
    if (pagosError) throw pagosError;
    if (ventasError) throw ventasError;
    if (methodsError) throw methodsError;
    if (alumnosError) throw alumnosError;

    // ─── Cálculos derivados ───────────────────────────────────────────────────
    const totalPagos =
      pagosDelMes?.reduce((sum, pago) => sum + Number(pago.precio || 0), 0) || 0;

    const totalVentas =
      ventasDelMes?.reduce((sum, venta) => sum + Number(venta.total || 0), 0) || 0;

    const activeMethods = activePaymentMethods?.map((m) => m.name) || [];
    // Map lowercase → nombre original para lookup O(1) en vez de O(n) por pago
    const activeMethodsLookup = new Map(activeMethods.map((m) => [m.toLowerCase(), m]));

    // Calcular distribución de formas de pago dinámicas
    const formasPagoMap = new Map<string, number>();

    // Inicializar todos los métodos activos con 0
    activeMethods.forEach((method) => {
      formasPagoMap.set(method, 0);
    });

    // Agrupar pagos
    pagosDelMes?.forEach((pago) => {
      const medio = pago.medio_pago || "Sin especificar";
      const matched = activeMethodsLookup.get(medio.toLowerCase());
      if (matched) {
        formasPagoMap.set(matched, (formasPagoMap.get(matched) || 0) + Number(pago.precio || 0));
      } else {
        formasPagoMap.set(medio, (formasPagoMap.get(medio) || 0) + Number(pago.precio || 0));
      }
    });

    // Agrupar ventas
    ventasDelMes?.forEach((venta) => {
      const medio = venta.medio_pago || "Sin especificar";
      const matched = activeMethodsLookup.get(medio.toLowerCase());
      if (matched) {
        formasPagoMap.set(matched, (formasPagoMap.get(matched) || 0) + Number(venta.total || 0));
      } else {
        formasPagoMap.set(medio, (formasPagoMap.get(medio) || 0) + Number(venta.total || 0));
      }
    });

    const totalBrutoIngresos = Array.from(formasPagoMap.values()).reduce((sum, v) => sum + v, 0);

    const formasPago = Array.from(formasPagoMap.entries()).map(([medio, monto]) => ({
      medio,
      monto,
      porcentaje: totalBrutoIngresos > 0 ? Math.round((monto / totalBrutoIngresos) * 100) : 0,
    }));

    const totalGastos =
      expensesConfig?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
    const totalSueldos =
      salariesConfig?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

    // Neto = (Ventas + Pagos) - (Gastos + Sueldos)
    const ingresosBrutos = totalPagos + totalVentas;
    const ingresosMes = ingresosBrutos - (totalGastos + totalSueldos);

    const alumnosActivos = alumnosData?.length ?? 0;
    const deudaTotal =
      alumnosData?.reduce((sum, alumno) => sum + Number(alumno.saldo || 0), 0) ?? 0;
    const alumnosConDeudaCount =
      alumnosData?.filter((alumno) => Number(alumno.saldo || 0) > 0).length ?? 0;

    const cantidadPagos = pagosDelMes?.length || 0;
    const ticketPromedio = cantidadPagos > 0
      ? Math.round(totalPagos / cantidadPagos)
      : 0;

    const ingresosMesAnterior = estadisticaMesAnterior?.ingresos_mes || 0;

    // Calcular variación porcentual
    const variacion =
      ingresosMesAnterior > 0
        ? Math.round(((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100)
        : 0;

    // ─── Tarea 3B: Historial semestral vía RPC Postgres ──────────────────────
    // Intentamos el RPC primero (agregación en DB).
    // Si no existe aún en producción, caemos al fallback in-memory.
    const p_semester = esPrimerSemestre ? 1 : 2;

    let ingresosHistorial: { mes: string; monto: number }[] = [];

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_ingreso_mensual_semestre",
      { p_year: currentYear, p_semester }
    );

    if (!rpcError && rpcData) {
      // Camino feliz: el RPC devuelve el array directamente
      ingresosHistorial = (rpcData as { mes: string; monto: number }[]).map((row) => ({
        mes: row.mes,
        monto: Number(row.monto),
      }));
    } else {
      // Fallback in-memory: código original para cuando la migration no está aplicada
      if (rpcError) {
        console.warn(
          "[finanzas] RPC get_ingreso_mensual_semestre falló, usando fallback in-memory:",
          rpcError.message
        );
      }

      const startDateStr = `${currentYear}-${String(mesInicio).padStart(2, "0")}-01`;
      const lastDayValTemp = new Date(currentYear, mesFin, 0).getDate();
      const endDateStr = `${currentYear}-${String(mesFin).padStart(2, "0")}-${String(lastDayValTemp).padStart(2, "0")}`;

      const mesesParaCalcular: { year: number; month: number }[] = [];
      for (let m = mesInicio; m <= mesFin; m++) {
        mesesParaCalcular.push({ year: currentYear, month: m });
      }

      // Consultas batch en paralelo (fallback)
      const [
        { data: todosLosPagos, error: errTodosPagos },
        { data: todasLasVentas, error: errTodasVentas },
        { data: todosLosGastos },
        { data: todosLosSueldos },
      ] = await Promise.all([
        supabase
          .from("pagos")
          .select("precio, fecha_cobro")
          .gte("fecha_cobro", startDateStr)
          .lte("fecha_cobro", endDateStr),

        supabase
          .from("ventas")
          .select("total, created_at")
          .gte("created_at", `${startDateStr}T00:00:00.000Z`)
          .lte("created_at", `${endDateStr}T23:59:59.999Z`),

        supabase
          .from("monthly_expenses_config")
          .select("amount, year, month")
          .eq("is_active", true)
          .eq("year", currentYear)
          .gte("month", mesInicio)
          .lte("month", mesFin),

        supabase
          .from("monthly_salaries_config")
          .select("amount, year, month")
          .eq("is_active", true)
          .eq("year", currentYear)
          .gte("month", mesInicio)
          .lte("month", mesFin),
      ]);

      if (errTodosPagos) throw errTodosPagos;
      if (errTodasVentas) throw errTodasVentas;

      const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

      ingresosHistorial = mesesParaCalcular.map(({ year, month }) => {
        const startMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const endMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

        const pagosMes =
          todosLosPagos
            ?.filter((p) => p.fecha_cobro >= startMonthStr && p.fecha_cobro <= endMonthStr)
            ?.reduce((sum, p) => sum + Number(p.precio || 0), 0) || 0;

        const ventasMes =
          todasLasVentas
            ?.filter((v) => {
              const fechaStr = v.created_at.split("T")[0];
              return fechaStr >= startMonthStr && fechaStr <= endMonthStr;
            })
            ?.reduce((sum, v) => sum + Number(v.total || 0), 0) || 0;

        const gastosMes =
          todosLosGastos
            ?.filter((g) => g.year === year && g.month === month)
            ?.reduce((sum, g) => sum + Number(g.amount || 0), 0) || 0;

        const sueldosMes =
          todosLosSueldos
            ?.filter((s) => s.year === year && s.month === month)
            ?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

        return {
          mes: mesesNombres[month - 1],
          monto: pagosMes + ventasMes - (gastosMes + sueldosMes),
        };
      });
    }
    // ─── Fin Tarea 3B ─────────────────────────────────────────────────────────

    return NextResponse.json({
      ingresosMes,
      ingresosBrutos,
      ticketPromedio,
      deudaTotal,
      alumnosActivos,
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
