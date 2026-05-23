"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  UserPlus,
  Activity,
  Package,
  TrendingUp,
  CreditCard,
  Coins,
  AlertTriangle,
  Loader2,
  Clock,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Función para obtener la fecha local YYYY-MM-DD
function getFechaLocal(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface AlumnoAlta {
  id: string;
  nombre: string;
  dni: string;
  created_at: string;
}

interface PagoDetalle {
  id: string;
  actividad: string;
  precio: number;
  medio_pago: string;
  tarjeta: string | null;
  alias_transferencia: string | null;
  alumnos: {
    nombre: string;
    dni: string;
  } | null;
}

interface VentaDetalle {
  id: string;
  cantidad: number;
  precio_unitario: number;
  medio_pago: string;
  tarjeta: string | null;
  alias_transferencia: string | null;
  talle_vendido: string | null;
  created_at: string;
  productos: {
    nombre: string;
    stock: number;
    stock_minimo: number;
  } | null;
}

interface AsistenciaDetalle {
  id: string;
  hora: string;
  fecha: string;
  alumnos: {
    nombre: string;
    dni: string;
    es_prueba: boolean;
  } | null;
}

export default function DiarioTab() {
  const [selectedDate, setSelectedDate] = useState<string>(getFechaLocal());
  const [loading, setLoading] = useState(true);

  // Estados de datos
  const [altas, setAltas] = useState<AlumnoAlta[]>([]);
  const [pagos, setPagos] = useState<PagoDetalle[]>([]);
  const [ventas, setVentas] = useState<VentaDetalle[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaDetalle[]>([]);

  useEffect(() => {
    loadDiarioData();
  }, [selectedDate]);

  async function loadDiarioData() {
    setLoading(true);
    try {
      // 1. Altas de alumnos
      const { data: altasData, error: errorAltas } = await supabase
        .from("alumnos")
        .select("id, nombre, dni, created_at")
        .gte("created_at", `${selectedDate}T00:00:00`)
        .lte("created_at", `${selectedDate}T23:59:59`);

      if (errorAltas) throw errorAltas;
      setAltas((altasData as AlumnoAlta[]) ?? []);

      // 2. Pagos de planes
      const { data: pagosData, error: errorPagos } = await supabase
        .from("pagos")
        .select("id, actividad, precio, medio_pago, tarjeta, alias_transferencia, alumnos(nombre, dni)")
        .gte("fecha_cobro", selectedDate)
        .lte("fecha_cobro", selectedDate);

      if (errorPagos) throw errorPagos;
      setPagos((pagosData as unknown as PagoDetalle[]) ?? []);

      // 3. Ventas de productos
      const { data: ventasData, error: errorVentas } = await supabase
        .from("ventas")
        .select("id, cantidad, precio_unitario, medio_pago, tarjeta, alias_transferencia, talle_vendido, created_at, productos(nombre, stock, stock_minimo)")
        .gte("created_at", `${selectedDate}T00:00:00`)
        .lte("created_at", `${selectedDate}T23:59:59`);

      if (errorVentas) throw errorVentas;
      setVentas((ventasData as unknown as VentaDetalle[]) ?? []);

      // 4. Asistencias del día
      const { data: asistenciasData, error: errorAsistencias } = await supabase
        .from("asistencias")
        .select("id, hora, fecha, alumnos(nombre, dni, es_prueba)")
        .gte("fecha", `${selectedDate}T00:00:00`)
        .lte("fecha", `${selectedDate}T23:59:59`)
        .order("hora", { ascending: true });

      if (errorAsistencias) throw errorAsistencias;
      setAsistencias((asistenciasData as unknown as AsistenciaDetalle[]) ?? []);

    } catch (err) {
      console.error("Error al cargar datos del diario:", err);
    } finally {
      setLoading(false);
    }
  }

  // Desplazar fecha
  function shiftDate(days: number) {
    const current = new Date(selectedDate + "T12:00:00");
    current.setDate(current.getDate() + days);
    setSelectedDate(getFechaLocal(current));
  }

  function setToday() {
    setSelectedDate(getFechaLocal());
  }

  // Cálculos financieros
  const totalPagos = pagos.reduce((sum, p) => sum + (p.precio || 0), 0);
  const totalVentas = ventas.reduce((sum, v) => sum + ((v.precio_unitario || 0) * (v.cantidad || 0)), 0);
  const totalIngresos = totalPagos + totalVentas;

  // Arqueo / Cierre de caja consolidado
  const arqueoBreakdown = (() => {
    const map: Record<string, { total: number; details: Set<string> }> = {};

    // Procesar pagos
    pagos.forEach((p) => {
      const medio = p.medio_pago || "Efectivo";
      const key = medio.trim().toLowerCase();
      if (!map[key]) {
        map[key] = { total: 0, details: new Set() };
      }
      map[key].total += p.precio || 0;
      if (p.tarjeta) {
        map[key].details.add(`Tarjeta: ${p.tarjeta}`);
      }
      if (p.alias_transferencia) {
        map[key].details.add(`Destino: ${p.alias_transferencia}`);
      }
    });

    // Procesar ventas
    ventas.forEach((v) => {
      const medio = v.medio_pago || "Efectivo";
      const key = medio.trim().toLowerCase();
      if (!map[key]) {
        map[key] = { total: 0, details: new Set() };
      }
      map[key].total += (v.precio_unitario || 0) * (v.cantidad || 0);
      if (v.tarjeta) {
        map[key].details.add(`Tarjeta: ${v.tarjeta}`);
      }
      if (v.alias_transferencia) {
        map[key].details.add(`Destino: ${v.alias_transferencia}`);
      }
    });

    // Dar formato estético
    return Object.entries(map).map(([key, item]) => {
      // Capitalizar nombre
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      return {
        name,
        total: item.total,
        details: Array.from(item.details).join(" | "),
      };
    }).sort((a, b) => b.total - a.total);
  })();

  // Alertas de Stock Crítico debido a las ventas de hoy
  const stockAlerts = (() => {
    const alerts: Record<string, { name: string; current: number; min: number }> = {};
    ventas.forEach((v) => {
      if (v.productos) {
        const pName = v.productos.nombre;
        const stock = v.productos.stock;
        const min = v.productos.stock_minimo;
        if (stock <= min) {
          alerts[pName] = {
            name: pName,
            current: stock,
            min: min,
          };
        }
      }
    });
    return Object.values(alerts);
  })();

  // ── Asistencias por horario ────────────────────────────────────────
  const HORAS_FRANJA = Array.from({ length: 16 }, (_, i) => i + 7); // 07..22
  const asistenciaHorarioReal = (() => {
    const conteoHora = new Map<number, number>();
    for (const h of HORAS_FRANJA) conteoHora.set(h, 0);
    for (const a of asistencias) {
      if (!a.hora) continue;
      const h = parseInt(a.hora.split(":")[0]);
      if (h >= 7 && h <= 22)
        conteoHora.set(h, (conteoHora.get(h) ?? 0) + 1);
    }
    return HORAS_FRANJA.map((h) => ({
      horario: `${String(h).padStart(2, "0")}:00`,
      alumnos: conteoHora.get(h) ?? 0,
    }));
  })();

  return (
    <div className="p-4 lg:p-6 w-full mx-auto flex flex-col gap-6 bg-[#FAFAFA] min-h-screen">
      {/* Barra superior de control de fecha */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm shrink-0">
            <ClipboardList size={20} className="text-orange-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Diario de Operaciones</h2>
            <p className="text-xs text-gray-400">Control unificado de actividad y caja</p>
          </div>
        </div>

        {/* Controles de fecha */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => shiftDate(-1)}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
            title="Día anterior"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              disabled={loading}
              className="w-full sm:w-44 pl-10 pr-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50/50"
            />
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button
            onClick={() => shiftDate(1)}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
            title="Día siguiente"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>

          <button
            onClick={setToday}
            disabled={loading || selectedDate === getFechaLocal()}
            className="px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 border border-orange-150 rounded-xl hover:bg-orange-100 active:scale-95 transition-all disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200"
          >
            Hoy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={36} className="animate-spin text-orange-500" />
          <p className="text-sm font-semibold text-gray-400">Sincronizando el diario del día...</p>
        </div>
      ) : (
        <>
          {/* Alertas de Stock Crítico */}
          {stockAlerts.length > 0 && (
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-900">Alerta de Stock Crítico</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    {stockAlerts.length === 1 
                      ? "Un producto vendido hoy bajó o está por debajo de su stock mínimo:"
                      : `${stockAlerts.length} productos vendidos hoy están por debajo de su stock mínimo:`
                    }
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stockAlerts.map((s, i) => (
                      <span key={i} className="text-xs bg-red-100 text-red-800 font-semibold px-2.5 py-1 rounded-lg border border-red-200">
                        {s.name} (Stock: {s.current} / Mín: {s.min})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tarjetas de Resumen Financiero y KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Ingreso Total</span>
                <TrendingUp size={16} className="text-white/80" />
              </div>
              <div>
                <p className="text-2xl font-black leading-none">${totalIngresos.toLocaleString()}</p>
                <p className="text-[10px] text-white/70 mt-1.5 font-medium">Cuotas + Ventas de productos</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingreso Cuotas</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <DollarSign size={14} className="text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">${totalPagos.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{pagos.length} cobros registrados</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingreso Ventas</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Package size={14} className="text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">${totalVentas.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{ventas.length} artículos vendidos</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asistencias</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Activity size={14} className="text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">{asistencias.length}</p>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Ingresos por molinete</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alumnos Nuevos</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <UserPlus size={14} className="text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">{altas.length}</p>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Altas de alumnos hoy</p>
              </div>
            </div>
          </div>

          {/* Arqueo / Cierre de Caja */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Coins size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Arqueo y Cierre de Caja Consolidado</h3>
                <p className="text-xs text-gray-400">Conciliación automática de efectivo y cuentas digitales del día</p>
              </div>
            </div>

            {arqueoBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {arqueoBreakdown.map((item, idx) => {
                  const isEfectivo = item.name.toLowerCase().includes("efectivo");
                  const isTarjeta = item.name.toLowerCase().includes("tarjeta");
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-xl border p-4 flex flex-col justify-between gap-3 shadow-sm hover:scale-[1.01] transition-all",
                        isEfectivo ? "bg-emerald-50/30 border-emerald-100" :
                        isTarjeta ? "bg-blue-50/30 border-blue-100" :
                        "bg-purple-50/30 border-purple-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              isEfectivo ? "bg-emerald-500" :
                              isTarjeta ? "bg-blue-500" :
                              "bg-purple-500"
                            )}
                          />
                          <span className="font-bold text-sm text-gray-800">{item.name}</span>
                        </div>
                        {isTarjeta ? <CreditCard size={15} className="text-blue-500" /> : <Coins size={15} className="text-gray-500" />}
                      </div>

                      <div>
                        <p className="text-2xl font-black text-gray-900">${item.total.toLocaleString()}</p>
                        {item.details && (
                          <p className="text-[10px] text-gray-500 font-semibold mt-1 truncate" title={item.details}>
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500">No hay movimientos financieros registrados en esta fecha para armar el arqueo.</p>
              </div>
            )}
          </div>

          {/* Asistencias por Horario (Gráfico de Barras) */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Activity size={18} className="text-purple-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-extrabold text-gray-900 leading-tight">
                    Asistencia por Horario
                  </p>
                  <p className="text-xs text-gray-400">
                    Total de asistencias por franja horaria — día seleccionado
                  </p>
                </div>
              </div>
            </div>
            {asistenciaHorarioReal.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={asistenciaHorarioReal} barSize={32}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="horario"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    formatter={(v: number) => [`${v} asistencias`, "Asistencia"]}
                    cursor={{ fill: "#f9fafb" }}
                  />
                  <Bar dataKey="alumnos" fill="#111111" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{ height: 200 }}
                className="flex items-center justify-center text-gray-300 text-sm"
              >
                Cargando...
              </div>
            )}
          </div>

          {/* Grilla Principal de Actividades */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Columna Izquierda: Altas */}
            <div className="flex flex-col gap-6">
              
              {/* Altas de alumnos */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <UserPlus size={16} className="text-amber-600" />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900">Altas de Alumnos ({altas.length})</h3>
                </div>

                {altas.length > 0 ? (
                  <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto pr-1">
                    {altas.map((alta) => (
                      <div key={alta.id} className="py-3 flex items-center justify-between group hover:bg-gray-50/50 px-2 rounded-xl transition-all">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{alta.nombre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">DNI: {alta.dni}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                            {new Date(alta.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            Registrado
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <UserPlus size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-semibold">Sin nuevos alumnos registrados hoy</p>
                  </div>
                )}
              </div>

            </div>

            {/* Columna Derecha: Pagos y Ventas */}
            <div className="flex flex-col gap-6">
              
              {/* Detalle de pagos */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <DollarSign size={16} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900">Cobros de Membresías y Planes ({pagos.length})</h3>
                  </div>
                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                    ${totalPagos.toLocaleString()}
                  </span>
                </div>

                <div className="flex-1">
                  {pagos.length > 0 ? (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {pagos.map((pago) => {
                        const isEfectivo = pago.medio_pago?.toLowerCase().includes("efectivo");
                        const isTarjeta = pago.medio_pago?.toLowerCase().includes("tarjeta");
                        return (
                          <div
                            key={pago.id}
                            className="p-3.5 rounded-xl border border-gray-150 hover:border-gray-300 hover:shadow-sm hover:scale-[1.005] bg-white transition-all flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {pago.alumnos?.nombre || "Alumno Eliminado"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                                  {pago.actividad}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {pago.medio_pago}
                                  {pago.tarjeta && ` (${pago.tarjeta})`}
                                  {pago.alias_transferencia && ` (Destino: ${pago.alias_transferencia})`}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-base font-extrabold text-gray-900">${(pago.precio || 0).toLocaleString()}</p>
                              <span className={cn(
                                "text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase mt-1 inline-block",
                                isEfectivo ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                isTarjeta ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-purple-50 text-purple-700 border-purple-200"
                              )}>
                                Recibido
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <DollarSign size={32} className="text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400 font-semibold">Sin cobros de abonos registrados</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-[250px]">Los ingresos de caja aparecerán al realizar inscripciones o cobros.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle de ventas */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Package size={16} className="text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900">Ventas de Productos ({ventas.length})</h3>
                  </div>
                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                    ${totalVentas.toLocaleString()}
                  </span>
                </div>

                <div className="flex-1">
                  {ventas.length > 0 ? (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {ventas.map((venta) => {
                        const isEfectivo = venta.medio_pago?.toLowerCase().includes("efectivo");
                        const isTarjeta = venta.medio_pago?.toLowerCase().includes("tarjeta");
                        const subTotal = (venta.precio_unitario || 0) * (venta.cantidad || 0);
                        return (
                          <div
                            key={venta.id}
                            className="p-3.5 rounded-xl border border-gray-150 hover:border-gray-300 hover:shadow-sm hover:scale-[1.005] bg-white transition-all flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {venta.productos?.nombre || "Producto Eliminado"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {venta.talle_vendido && (
                                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                                    Talle: {venta.talle_vendido}
                                  </span>
                                )}
                                <span className="text-[11px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                                  Cant: {venta.cantidad}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {venta.medio_pago}
                                  {venta.tarjeta && ` (${venta.tarjeta})`}
                                  {venta.alias_transferencia && ` (Destino: ${venta.alias_transferencia})`}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-base font-extrabold text-gray-900">${subTotal.toLocaleString()}</p>
                              <span className={cn(
                                "text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase mt-1 inline-block",
                                isEfectivo ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                isTarjeta ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-purple-50 text-purple-700 border-purple-200"
                              )}>
                                Vendido
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Package size={32} className="text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400 font-semibold">Sin ventas de productos hoy</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-[250px]">Los ingresos de tienda aparecerán al vender desde la sección de Productos.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
