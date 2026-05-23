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

    // Calcular ingresos del mes seleccionado
    const firstDayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const lastDayVal = new Date(currentYear, currentMonth, 0).getDate();
    const lastDayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDayVal).padStart(2, "0")}`;

    // 1. Obtener pagos del mes seleccionado
    const { data: pagosDelMes, error: pagosError } = await supabase
      .from("pagos")
      .select("precio, medio_pago, alumno_id")
      .gte("fecha_cobro", firstDayStr)
      .lte("fecha_cobro", lastDayStr);

    if (pagosError) throw pagosError;

    const totalPagos = pagosDelMes?.reduce(
      (sum, pago) => sum + Number(pago.precio || 0),
      0
    ) || 0;

    // 2. Obtener ventas del mes seleccionado
    const { data: ventasDelMes, error: ventasError } = await supabase
      .from("ventas")
      .select("total, medio_pago")
      .gte("created_at", `${firstDayStr}T00:00:00.000Z`)
      .lte("created_at", `${lastDayStr}T23:59:59.999Z`);

    if (ventasError) throw ventasError;

    const totalVentas = ventasDelMes?.reduce(
      (sum, venta) => sum + Number(venta.total || 0),
      0
    ) || 0;

    // 3. Obtener métodos de pago activos desde ajustes del negocio
    const { data: activePaymentMethods, error: methodsError } = await supabase
      .from("payment_methods")
      .select("name")
      .eq("is_active", true);

    if (methodsError) throw methodsError;

    const activeMethods = activePaymentMethods?.map((m) => m.name) || [];

    // Calcular distribución de formas de pago dinámicas
    const formasPagoMap = new Map<string, number>();
    
    // Inicializar todos los métodos activos con 0
    activeMethods.forEach((method) => {
      formasPagoMap.set(method, 0);
    });

    // Agrupar pagos
    pagosDelMes?.forEach((pago) => {
      const medio = pago.medio_pago || "Sin especificar";
      const matched = activeMethods.find(
        (m) => m.toLowerCase() === medio.toLowerCase()
      );
      if (matched) {
        formasPagoMap.set(matched, (formasPagoMap.get(matched) || 0) + Number(pago.precio || 0));
      } else {
        formasPagoMap.set(medio, (formasPagoMap.get(medio) || 0) + Number(pago.precio || 0));
      }
    });

    // Agrupar ventas
    ventasDelMes?.forEach((venta) => {
      const medio = venta.medio_pago || "Sin especificar";
      const matched = activeMethods.find(
        (m) => m.toLowerCase() === medio.toLowerCase()
      );
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

    // 4. Obtener gastos configurados activos para el mes seleccionado
    const { data: expensesConfig } = await supabase
      .from("monthly_expenses_config")
      .select("amount")
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .eq("is_active", true);

    const totalGastos = expensesConfig?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

    // 5. Obtener sueldos configurados activos para el mes seleccionado
    const { data: salariesConfig } = await supabase
      .from("monthly_salaries_config")
      .select("amount")
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .eq("is_active", true);

    const totalSueldos = salariesConfig?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

    // Neto = (Ventas + Pagos) - (Gastos + Sueldos)
    const ingresosBrutos = totalPagos + totalVentas;
    const ingresosMes = ingresosBrutos - (totalGastos + totalSueldos);

    // Obtener cantidad de alumnos activos y deuda total
    const { data: alumnosData, error: alumnosError } = await supabase
      .from("alumnos")
      .select("saldo")
      .eq("activo", true);

    if (alumnosError) throw alumnosError;

    const alumnosActivos = alumnosData?.length ?? 0;
    const deudaTotal = alumnosData?.reduce(
      (sum, alumno) => sum + Number(alumno.saldo || 0),
      0
    ) ?? 0;
    const alumnosConDeudaCount = alumnosData?.filter(
      (alumno) => Number(alumno.saldo || 0) > 0
    ).length ?? 0;

    const ticketPromedio = alumnosActivos > 0
      ? Math.round(ingresosMes / alumnosActivos)
      : 0;

    // Obtener ingresos del mes anterior (mes actual - 1)
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

    // Determinar los meses del semestre correspondiente al mes seleccionado (Ene-Jun o Jul-Dic)
    const mesesParaCalcular: { year: number; month: number }[] = [];
    const esPrimerSemestre = currentMonth <= 6;
    const mesInicio = esPrimerSemestre ? 1 : 7;
    const mesFin = esPrimerSemestre ? 6 : 12;

    for (let m = mesInicio; m <= mesFin; m++) {
      mesesParaCalcular.push({ year: currentYear, month: m });
    }

    // Obtener los límites de rango para optimizar la consulta en batch
    const startDateStr = `${currentYear}-${String(mesInicio).padStart(2, "0")}-01`;
    const lastDayValTemp = new Date(currentYear, mesFin, 0).getDate();
    const endDateStr = `${currentYear}-${String(mesFin).padStart(2, "0")}-${String(lastDayValTemp).padStart(2, "0")}`;

    // Consulta batch de todos los pagos en el rango de 6 meses
    const { data: todosLosPagos, error: errTodosPagos } = await supabase
      .from("pagos")
      .select("precio, fecha_cobro")
      .gte("fecha_cobro", startDateStr)
      .lte("fecha_cobro", endDateStr);

    if (errTodosPagos) throw errTodosPagos;

    // Consulta batch de todas las ventas en el rango de 6 meses
    const { data: todasLasVentas, error: errTodasVentas } = await supabase
      .from("ventas")
      .select("total, created_at")
      .gte("created_at", `${startDateStr}T00:00:00.000Z`)
      .lte("created_at", `${endDateStr}T23:59:59.999Z`);

    if (errTodasVentas) throw errTodasVentas;

    // Consulta batch de todos los gastos configurados activos
    const { data: todosLosGastos } = await supabase
      .from("monthly_expenses_config")
      .select("amount, year, month")
      .eq("is_active", true)
      .eq("year", currentYear)
      .gte("month", mesInicio)
      .lte("month", mesFin);

    // Consulta batch de todos los sueldos configurados activos
    const { data: todosLosSueldos } = await supabase
      .from("monthly_salaries_config")
      .select("amount, year, month")
      .eq("is_active", true)
      .eq("year", currentYear)
      .gte("month", mesInicio)
      .lte("month", mesFin);

    // Formatear el historial en tiempo real calculando los ingresos netos de cada uno de los 8 meses
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    const ingresosHistorial = mesesParaCalcular.map(({ year, month }) => {
      const startMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const endMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

      // Sumar pagos
      const pagosMes = todosLosPagos
        ?.filter((p) => p.fecha_cobro >= startMonthStr && p.fecha_cobro <= endMonthStr)
        ?.reduce((sum, p) => sum + Number(p.precio || 0), 0) || 0;

      // Sumar ventas
      const ventasMes = todasLasVentas
        ?.filter((v) => {
          const fechaStr = v.created_at.split("T")[0];
          return fechaStr >= startMonthStr && fechaStr <= endMonthStr;
        })
        ?.reduce((sum, v) => sum + Number(v.total || 0), 0) || 0;

      // Sumar gastos
      const gastosMes = todosLosGastos
        ?.filter((g) => g.year === year && g.month === month)
        ?.reduce((sum, g) => sum + Number(g.amount || 0), 0) || 0;

      // Sumar sueldos
      const sueldosMes = todosLosSueldos
        ?.filter((s) => s.year === year && s.month === month)
        ?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

      // Ingreso neto de este mes
      const netoMes = (pagosMes + ventasMes) - (gastosMes + sueldosMes);

      return {
        mes: mesesNombres[month - 1],
        monto: netoMes,
      };
    });

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
