"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminStore } from "@/stores/admin-store";
import {
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  X,
  History,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Producto {
  id: string;
  nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  categoria: string;
}

interface Venta {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  precio_costo_unitario: number;
  total: number;
  ganancia: number;
  notas: string | null;
  talle_vendido: string | null;
  created_at: string;
  medio_pago?: string | null;
  tarjeta?: string | null;
  alias_transferencia?: string | null;
  productos?: {
    nombre: string;
  };
}

interface MonthlyGain {
  year: number;
  month: number;
  ganancia: number;
}

const COLORS = ["#16A34A", "#2563EB", "#DC2626", "#D97706", "#8B5CF6"];

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function MonthSelector({
  year,
  month,
  onPrev,
  onNext,
  isCurrentMonth,
  loading,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  isCurrentMonth: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
        title="Mes anterior"
      >
        <ChevronLeft size={16} className="text-gray-600" />
      </button>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg min-w-[160px] justify-center">
        {loading ? (
          <Loader2 size={14} className="text-orange-500 animate-spin" />
        ) : null}
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        {isCurrentMonth && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full">
            Actual
          </span>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Mes siguiente"
      >
        <ChevronRight size={16} className="text-gray-600" />
      </button>
    </div>
  );
}

export default function EstadisticasProductos() {
  const {
    productosSnapshot: snap,
    isProductosCacheValid,
    setProductosSnapshot,
  } = useAdminStore();

  const isCacheValid = isProductosCacheValid();

  // Navegación mensual
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(
    isCacheValid && snap ? snap.selectedYear : now.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    isCacheValid && snap ? snap.selectedMonth : now.getMonth() + 1
  );

  const [productos, setProductos] = useState<Producto[]>(
    isCacheValid && snap ? snap.productos : []
  );
  const [ventas, setVentas] = useState<Venta[]>(
    isCacheValid && snap ? snap.ventas : []
  );
  const [loading, setLoading] = useState(!isCacheValid);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showVentasHistorialModal, setShowVentasHistorialModal] = useState(false);
  const [showProductosVendidosHistorialModal, setShowProductosVendidosHistorialModal] = useState(false);
  const [showProductosActivosHistorialModal, setShowProductosActivosHistorialModal] = useState(false);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isCurrentMonth =
    selectedYear === currentYear && selectedMonth === currentMonth;

  useEffect(() => {
    if (isProductosCacheValid() && snap && snap.selectedYear === selectedYear && snap.selectedMonth === selectedMonth) {
      return;
    }
    loadData();
  }, [selectedYear, selectedMonth]);


  async function loadData() {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from("productos").select("*");
      if (prodData) setProductos(prodData);

      // Calcular límites del mes seleccionado
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01T00:00:00.000Z`;
      const lastDayVal = new Date(selectedYear, selectedMonth, 0).getDate();
      const lastDay = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDayVal).padStart(2, "0")}T23:59:59.999Z`;

      const { data: ventasData } = await supabase
        .from("ventas")
        .select("*, productos(nombre)")
        .gte("created_at", firstDay)
        .lte("created_at", lastDay);

      const finalVentas = (ventasData as Venta[]) ?? [];
      setVentas(finalVentas);

      // Guardar snapshot en Zustand Store para persistencia en caché
      setProductosSnapshot({
        selectedYear,
        selectedMonth,
        productos: prodData || [],
        ventas: finalVentas,
      });
    } catch (err) {
      console.error("Error cargando estadísticas de productos:", err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Estadísticas del mes seleccionado
  const totalVentas = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
  const totalGanancias = ventas.reduce((acc, v) => acc + (v.ganancia || 0), 0);
  const totalProductosVendidos = ventas.reduce((acc, v) => acc + (v.cantidad || 0), 0);

  // Stats por forma de pago
  const formasDePago = ventas.reduce((acc: any, v: Venta) => {
    const fp = v.medio_pago || "Efectivo";
    const fpCap = fp.charAt(0).toUpperCase() + fp.slice(1).toLowerCase();

    if (!acc[fpCap]) acc[fpCap] = 0;
    acc[fpCap] += v.total || 0;
    return acc;
  }, {});

  const pieData = Object.keys(formasDePago).map((fp) => ({
    name: fp,
    value: formasDePago[fp],
  }));

  // Calcular ranking de los 3 productos más vendidos
  const rankingProductos = Object.values(
    ventas.reduce((acc: Record<string, { nombre: string; cantidad: number; total: number }>, v) => {
      const prodId = v.producto_id;
      const nombre = v.productos?.nombre || "Producto sin nombre";
      if (!acc[prodId]) {
        acc[prodId] = { nombre, cantidad: 0, total: 0 };
      }
      acc[prodId].cantidad += v.cantidad || 0;
      acc[prodId].total += v.total || 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 3);

  if (loading && productos.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[400px]">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"
            style={{ borderTopColor: "#DC2626" }}
          />
          <p className="text-sm text-gray-500 font-semibold">Cargando estadísticas de productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full mx-auto flex flex-col gap-6 bg-[#FAFAFA] min-h-screen">
      <div className="space-y-6">
        {/* Encabezado Superior con Selector de Mes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
              <Package size={20} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Estadísticas de Productos</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Ventas totales, ganancias, distribución de pago y ranking de artículos del mes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector
              year={selectedYear}
              month={selectedMonth}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              isCurrentMonth={isCurrentMonth}
              loading={loading}
            />
          </div>
        </div>

          {/* Fila de Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI Ventas Totales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Ventas del Mes
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-50">
                <DollarSign size={16} className="text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-gray-900 leading-none">
                ${totalVentas.toFixed(2)}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-gray-400 font-medium">
                  {ventas.length} transacciones registradas
                </p>
                <button
                  onClick={() => setShowVentasHistorialModal(true)}
                  className="text-xs text-gray-400 hover:text-gray-700 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Ver historial
                </button>
              </div>
            </div>
          </div>

          {/* KPI Ganancias Totales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Ganancias del Mes
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50">
                <TrendingUp size={16} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-green-700 leading-none">
                ${totalGanancias.toFixed(2)}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-gray-400 font-medium">
                  Margen promedio:{" "}
                  {totalVentas > 0
                    ? ((totalGanancias / totalVentas) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <button
                  onClick={() => setShowHistorialModal(true)}
                  className="text-xs text-gray-400 hover:text-gray-700 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Ver historial
                </button>
              </div>
            </div>
          </div>

          {/* KPI Productos Vendidos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Productos Vendidos
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-50">
                <Package size={16} className="text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-gray-900 leading-none">
                {totalProductosVendidos}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-gray-400 font-medium">
                  Unidades totales vendidas este mes
                </p>
                <button
                  onClick={() => setShowProductosVendidosHistorialModal(true)}
                  className="text-xs text-gray-400 hover:text-gray-700 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Ver historial
                </button>
              </div>
            </div>
          </div>

          {/* KPI Productos Activos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Productos Activos
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-50">
                <Package size={16} className="text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-gray-900 leading-none">
                {productos.filter((p) => p.activo).length}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-gray-400 font-medium">
                  {
                    productos.filter((p) => p.activo && p.stock <= p.stock_minimo)
                      .length
                  }{" "}
                  con stock bajo actualmente
                </p>
                <button
                  onClick={() => setShowProductosActivosHistorialModal(true)}
                  className="text-xs text-gray-400 hover:text-gray-700 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Ver historial
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fila de Gráficos y Tablas Detalladas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas por Forma de Pago */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 border border-orange-100 shrink-0">
                <CreditCard size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Ventas por Forma de Pago
                </h3>
                <p className="text-xs text-gray-400">
                  Monto transaccionado según medio de pago
                </p>
              </div>
            </div>

            {pieData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 flex-1">
                <div className="w-full max-w-[240px] h-[240px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => [
                          "$" + value.toFixed(2),
                          "Total",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full flex flex-col gap-2.5">
                  {pieData
                    .sort((a, b) => b.value - a.value)
                    .map((entry, idx) => {
                      const percentage =
                        totalVentas > 0
                          ? ((entry.value / totalVentas) * 100).toFixed(1)
                          : 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100/75 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            />
                            <span className="font-semibold text-gray-700 text-sm truncate">
                              {entry.name}
                            </span>
                          </div>
                          <div className="text-right pl-3 shrink-0">
                            <p className="font-bold text-gray-900 text-sm">
                              ${entry.value.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              {percentage}% del total
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 flex-1 flex flex-col justify-center">
                <p className="text-gray-500 text-sm">
                  Aún no hay ventas para mostrar esta estadística este mes.
                </p>
              </div>
            )}
          </div>

          {/* Ranking de los 3 Productos Más Vendidos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 border border-orange-100">
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Top 3 Productos Más Vendidos
                </h3>
                <p className="text-xs text-gray-400">
                  Artículos con mayor volumen de ventas este mes
                </p>
              </div>
            </div>

            {rankingProductos.length > 0 ? (
              <div className="flex flex-col gap-4 flex-1 justify-center">
                {rankingProductos.map((prod, idx) => {
                  const medalColors = [
                    "bg-yellow-50 text-yellow-800 border-yellow-100", // Oro
                    "bg-gray-50 text-gray-800 border-gray-100",       // Plata
                    "bg-amber-50 text-amber-800 border-amber-100",     // Bronce
                  ];
                  const medalIcons = ["🥇", "🥈", "🥉"];

                  const maxCantidad = rankingProductos[0]?.cantidad || 1;
                  const pct = Math.round((prod.cantidad / maxCantidad) * 100);

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${medalColors[idx]}`}
                        >
                          {medalIcons[idx] || idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {prod.nombre}
                          </p>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 mt-2 overflow-hidden max-w-[200px]">
                            <div
                              className="h-full rounded-full bg-red-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right pl-4 shrink-0">
                        <p className="font-extrabold text-gray-900 text-base">
                          {prod.cantidad}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                          Unidades
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 flex-1 flex flex-col justify-center">
                <p className="text-gray-500 text-sm">
                  Aún no hay ventas para mostrar el ranking este mes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Ganancias Modal */}
      <ProductosGananciasHistorialModal
        open={showHistorialModal}
        onClose={() => setShowHistorialModal(false)}
      />

      {/* Historial de Ventas Modal */}
      <ProductosVentasHistorialModal
        open={showVentasHistorialModal}
        onClose={() => setShowVentasHistorialModal(false)}
      />

      {/* Historial de Productos Vendidos Modal */}
      <ProductosVendidosHistorialModal
        open={showProductosVendidosHistorialModal}
        onClose={() => setShowProductosVendidosHistorialModal(false)}
      />

      {/* Historial de Productos Activos Modal */}
      <ProductosActivosHistorialModal
        open={showProductosActivosHistorialModal}
        onClose={() => setShowProductosActivosHistorialModal(false)}
      />
    </div>
  );
}

// ── Componente Modal del Historial de Ganancias ──────────────────────────────
function ProductosGananciasHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<MonthlyGain[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    supabase
      .from("ventas")
      .select("ganancia, created_at")
      .order("created_at", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("Error cargando historial de ganancias:", error);
          setLoading(false);
          return;
        }

        // Agrupar por mes y año
        const grouped = (rows || []).reduce((acc: Record<string, MonthlyGain>, v) => {
          if (!v.created_at) return acc;
          const d = new Date(v.created_at);
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          const key = `${year}-${month}`;

          if (!acc[key]) {
            acc[key] = { year, month, ganancia: 0 };
          }
          acc[key].ganancia += v.ganancia || 0;
          return acc;
        }, {});

        // Convertir a array y ordenar de más reciente a más antiguo
        const sorted = Object.values(grouped).sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.month - a.month;
        });

        setData(sorted);
        setLoading(false);
      });
  }, [open]);

  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);

  // Preparar datos del gráfico
  const chartData = MONTH_NAMES.map((monthName, idx) => {
    const point: Record<string, any> = { mes: monthName.slice(0, 3) };
    years.forEach((y) => {
      const found = data.find((r) => r.year === y && r.month === idx + 1);
      if (found) {
        point[String(y)] = found.ganancia;
      }
    });
    return point;
  });

  const YEAR_COLORS = ["#16A34A", "#2563EB", "#DC2626", "#D97706", "#8B5CF6"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl w-full h-[80vh] max-h-[80vh] overflow-hidden flex flex-col p-0 bg-white rounded-2xl border border-gray-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-gray-900 leading-none">
                  Historial de Ganancias — Productos
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Evolución de ganancias netas mensuales por ventas de productos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col bg-gray-50/50">
          {/* Selector de Vista */}
          <div className="flex gap-2 mb-4 shrink-0">
            <button
              onClick={() => setVista("tabla")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "tabla"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setVista("grafico")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "grafico"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Gráfico
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 size={36} className="text-orange-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Cargando historial...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-gray-400 text-sm">
              No hay registros de ventas anteriores para mostrar ganancias.
            </div>
          ) : vista === "tabla" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Año</th>
                      <th className="px-6 py-4">Mes</th>
                      <th className="px-6 py-4 text-right">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/25 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-600">{row.year}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {MONTH_NAMES[row.month - 1]}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-green-600">
                          ${row.ganancia.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-center min-h-[300px]">
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <RechartsTooltip
                      formatter={(v: number) => [`$${v.toFixed(2)}`, "Ganancia"]}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Legend />
                    {years.map((y, idx) => (
                      <Bar
                        key={y}
                        dataKey={String(y)}
                        name={`Ganancia ${y}`}
                        fill={YEAR_COLORS[idx % YEAR_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Componente Modal del Historial de Ventas ─────────────────────────────────
interface MonthlyVenta {
  year: number;
  month: number;
  total: number;
}

function ProductosVentasHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<MonthlyVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    supabase
      .from("ventas")
      .select("total, created_at")
      .order("created_at", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("Error cargando historial de ventas:", error);
          setLoading(false);
          return;
        }

        // Agrupar por mes y año
        const grouped = (rows || []).reduce((acc: Record<string, MonthlyVenta>, v) => {
          if (!v.created_at) return acc;
          const d = new Date(v.created_at);
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          const key = `${year}-${month}`;

          if (!acc[key]) {
            acc[key] = { year, month, total: 0 };
          }
          acc[key].total += Number(v.total) || 0;
          return acc;
        }, {});

        // Convertir a array y ordenar de más reciente a más antiguo
        const sorted = Object.values(grouped).sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.month - a.month;
        });

        setData(sorted);
        setLoading(false);
      });
  }, [open]);

  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);

  // Preparar datos del gráfico
  const chartData = MONTH_NAMES.map((monthName, idx) => {
    const point: Record<string, any> = { mes: monthName.slice(0, 3) };
    years.forEach((y) => {
      const found = data.find((r) => r.year === y && r.month === idx + 1);
      if (found) {
        point[String(y)] = found.total;
      }
    });
    return point;
  });

  const YEAR_COLORS = ["#EA580C", "#2563EB", "#16A34A", "#D97706", "#8B5CF6"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl w-full h-[80vh] max-h-[80vh] overflow-hidden flex flex-col p-0 bg-white rounded-2xl border border-gray-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
              <DollarSign size={20} className="text-orange-600" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-gray-900 leading-none">
                  Historial de Ventas — Productos
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Evolución de ventas brutas mensuales por productos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col bg-gray-50/50">
          {/* Selector de Vista */}
          <div className="flex gap-2 mb-4 shrink-0">
            <button
              onClick={() => setVista("tabla")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "tabla"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setVista("grafico")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "grafico"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Gráfico
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 size={36} className="text-orange-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Cargando historial...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-gray-400 text-sm">
              No hay registros de ventas anteriores para mostrar.
            </div>
          ) : vista === "tabla" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Año</th>
                      <th className="px-6 py-4">Mes</th>
                      <th className="px-6 py-4 text-right">Ventas Brutas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/25 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-600">{row.year}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {MONTH_NAMES[row.month - 1]}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-orange-600">
                          ${row.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-center min-h-[300px]">
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <RechartsTooltip
                      formatter={(v: number) => [`$${v.toFixed(2)}`, "Ventas"]}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Legend />
                    {years.map((y, idx) => (
                      <Bar
                        key={y}
                        dataKey={String(y)}
                        name={`Ventas ${y}`}
                        fill={YEAR_COLORS[idx % YEAR_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Componente Modal del Historial de Productos Vendidos ─────────────────────
interface MonthlyProductosVendidos {
  year: number;
  month: number;
  cantidad: number;
}

function ProductosVendidosHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<MonthlyProductosVendidos[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    supabase
      .from("ventas")
      .select("cantidad, created_at")
      .order("created_at", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("Error cargando historial de productos vendidos:", error);
          setLoading(false);
          return;
        }

        // Agrupar por mes y año
        const grouped = (rows || []).reduce((acc: Record<string, MonthlyProductosVendidos>, v) => {
          if (!v.created_at) return acc;
          const d = new Date(v.created_at);
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          const key = `${year}-${month}`;

          if (!acc[key]) {
            acc[key] = { year, month, cantidad: 0 };
          }
          acc[key].cantidad += v.cantidad || 0;
          return acc;
        }, {});

        // Convertir a array y ordenar de más reciente a más antiguo
        const sorted = Object.values(grouped).sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.month - a.month;
        });

        setData(sorted);
        setLoading(false);
      });
  }, [open]);

  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);

  // Preparar datos del gráfico
  const chartData = MONTH_NAMES.map((monthName, idx) => {
    const point: Record<string, any> = { mes: monthName.slice(0, 3) };
    years.forEach((y) => {
      const found = data.find((r) => r.year === y && r.month === idx + 1);
      if (found) {
        point[String(y)] = found.cantidad;
      }
    });
    return point;
  });

  const YEAR_COLORS = ["#D97706", "#2563EB", "#16A34A", "#DC2626", "#8B5CF6"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl w-full h-[80vh] max-h-[80vh] overflow-hidden flex flex-col p-0 bg-white rounded-2xl border border-gray-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
              <Package size={20} className="text-orange-600" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-gray-900 leading-none">
                  Historial de Productos Vendidos
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Evolución de cantidad de unidades totales vendidas por mes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col bg-gray-50/50">
          {/* Selector de Vista */}
          <div className="flex gap-2 mb-4 shrink-0">
            <button
              onClick={() => setVista("tabla")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "tabla"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setVista("grafico")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "grafico"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Gráfico
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 size={36} className="text-orange-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Cargando historial...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-gray-400 text-sm">
              No hay registros de ventas anteriores para mostrar unidades vendidas.
            </div>
          ) : vista === "tabla" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Año</th>
                      <th className="px-6 py-4">Mes</th>
                      <th className="px-6 py-4 text-right">Unidades Vendidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/25 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-600">{row.year}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {MONTH_NAMES[row.month - 1]}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-orange-600">
                          {row.cantidad} uds
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-center min-h-[300px]">
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => String(v)}
                    />
                    <RechartsTooltip
                      formatter={(v: number) => [String(v), "Unidades"]}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Legend />
                    {years.map((y, idx) => (
                      <Bar
                        key={y}
                        dataKey={String(y)}
                        name={`Unidades ${y}`}
                        fill={YEAR_COLORS[idx % YEAR_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Componente Modal del Historial de Productos Activos ──────────────────────
interface MonthlyActiveProducts {
  year: number;
  month: number;
  activos: number;
}

function ProductosActivosHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<MonthlyActiveProducts[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    supabase
      .from("productos")
      .select("activo, created_at")
      .order("created_at", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("Error cargando historial de productos activos:", error);
          setLoading(false);
          return;
        }

        // Determinar año y mes de inicio
        let startYear = new Date().getFullYear();
        let startMonth = new Date().getMonth() + 1;

        const validDates = (rows || [])
          .map((r) => (r.created_at ? new Date(r.created_at) : null))
          .filter(Boolean) as Date[];

        if (validDates.length > 0) {
          const minDate = new Date(Math.min(...validDates.map((d) => d.getTime())));
          startYear = minDate.getFullYear();
          startMonth = minDate.getMonth() + 1;
        }

        const endYear = new Date().getFullYear();
        const endMonth = new Date().getMonth() + 1;

        const list: { year: number; month: number }[] = [];
        let y = startYear;
        let m = startMonth;
        while (y < endYear || (y === endYear && m <= endMonth)) {
          list.push({ year: y, month: m });
          m++;
          if (m > 12) {
            m = 1;
            y++;
          }
        }

        const result: MonthlyActiveProducts[] = list.map(({ year, month }) => {
          const limitDate = new Date(year, month, 0, 23, 59, 59, 999);
          const activos = (rows || []).filter(
            (p) => p.activo && p.created_at && new Date(p.created_at) <= limitDate
          ).length;
          return { year, month, activos };
        });

        const sorted = result.sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.month - a.month;
        });

        setData(sorted);
        setLoading(false);
      });
  }, [open]);

  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);

  // Preparar datos del gráfico
  const chartData = MONTH_NAMES.map((monthName, idx) => {
    const point: Record<string, any> = { mes: monthName.slice(0, 3) };
    years.forEach((y) => {
      const found = data.find((r) => r.year === y && r.month === idx + 1);
      if (found) {
        point[String(y)] = found.activos;
      }
    });
    return point;
  });

  const YEAR_COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl w-full h-[80vh] max-h-[80vh] overflow-hidden flex flex-col p-0 bg-white rounded-2xl border border-gray-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
              <Package size={20} className="text-orange-600" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-gray-900 leading-none">
                  Historial de Productos Activos
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Evolución de cantidad de productos activos registrados en el sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col bg-gray-50/50">
          {/* Selector de Vista */}
          <div className="flex gap-2 mb-4 shrink-0">
            <button
              onClick={() => setVista("tabla")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "tabla"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setVista("grafico")}
              className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                vista === "grafico"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Gráfico
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 size={36} className="text-orange-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Cargando historial...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-gray-400 text-sm">
              No hay registros de productos para mostrar.
            </div>
          ) : vista === "tabla" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Año</th>
                      <th className="px-6 py-4">Mes</th>
                      <th className="px-6 py-4 text-right">Productos Activos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/25 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-600">{row.year}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {MONTH_NAMES[row.month - 1]}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-blue-600">
                          {row.activos} activos
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-center min-h-[300px]">
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => String(v)}
                    />
                    <RechartsTooltip
                      formatter={(v: number) => [String(v), "Activos"]}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Legend />
                    {years.map((y, idx) => (
                      <Bar
                        key={y}
                        dataKey={String(y)}
                        name={`Activos ${y}`}
                        fill={YEAR_COLORS[idx % YEAR_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
