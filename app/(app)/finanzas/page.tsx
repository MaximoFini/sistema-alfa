"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CreditCard,
  Wallet,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMonthlyExpenses } from "@/hooks/use-monthly-expenses";
import ExpensesModal from "@/components/ExpensesModal";
import { useAdminStore, FinancialStats } from "@/stores/admin-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  seeding,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  isCurrentMonth: boolean;
  seeding: boolean;
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
        {seeding ? (
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

function KPICard({
  label,
  value,
  sub,
  trend,
  accentBg,
  accentText,
  icon,
  note,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { label: string; up: boolean };
  accentBg: string;
  accentText: string;
  icon: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm min-h-[140px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentBg }}
        >
          <span style={{ color: accentText }}>{icon}</span>
        </div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-extrabold text-gray-900 leading-none block">
          {value}
        </span>
        {sub && <span className="text-[10px] text-gray-400 mt-1.5 font-medium block">{sub}</span>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              size={12}
              style={{ color: trend.up ? "#16a34a" : "#dc2626" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: trend.up ? "#16a34a" : "#dc2626" }}
            >
              {trend.label}
            </span>
          </div>
        )}
        {note && (
          <p className="text-[10px] text-gray-400 leading-relaxed mt-1.5 font-medium">{note}</p>
        )}
      </div>
    </div>
  );
}

function getPaymentMethodColor(medio: string): string {
  const PAYMENT_METHOD_COLORS: Record<string, string> = {
    Efectivo: "#16a34a",
    Transferencia: "#2563eb",
    Débito: "#d97706",
    Crédito: "#dc2626",
    "Mercado Pago": "#0891b2",
    "Sin especificar": "#6b7280",
  };

  if (PAYMENT_METHOD_COLORS[medio]) return PAYMENT_METHOD_COLORS[medio];

  const normalized = medio.trim().toLowerCase();
  if (normalized.includes("efectivo")) return "#16a34a";
  if (normalized.includes("transferencia") || normalized.includes("alias") || normalized.includes("cbu") || normalized.includes("cvu")) return "#2563eb";
  if (normalized.includes("mercado") || normalized.includes("pago") || normalized.includes("mp")) return "#0891b2";
  if (normalized.includes("débito") || normalized.includes("debito")) return "#d97706";
  if (normalized.includes("crédito") || normalized.includes("credito") || normalized.includes("tarjeta")) return "#dc2626";

  // Generador dinámico premium de HSL basado en hash
  let hash = 0;
  for (let i = 0; i < medio.length; i++) {
    hash = medio.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function FinanzasPage() {
  const [mounted, setMounted] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);

  // Selector de año y mes (por defecto: mes actual)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isCurrentMonth =
    selectedYear === currentYear && selectedMonth === currentMonth;

  // Estados locales para estadísticas de finanzas correspondientes al período seleccionado
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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

  // Hook de egresos mensuales
  const {
    expenses,
    salaries,
    loading: expensesLoading,
    seeding,
    toggleExpense,
    updateExpense,
    addExpense,
    deleteExpense,
    toggleSalary,
    updateSalary,
    addSalary,
    deleteSalary,
  } = useMonthlyExpenses(selectedYear, selectedMonth);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dinámico de estadísticas financieras por mes y año seleccionado
  useEffect(() => {
    if (!mounted) return;
    
    let active = true;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const response = await fetch(
          `/api/finanzas?year=${selectedYear}&month=${selectedMonth}`
        );
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();
        if (active) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error loading monthly financial stats:", error);
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, [selectedYear, selectedMonth, mounted]);

  // Cálculos reactivos en tiempo real a partir del hook de gastos
  const totalGastos = expenses
    ?.filter((e) => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0) || 0;

  const totalSueldos = salaries
    ?.filter((s) => s.is_active)
    .reduce((sum, s) => sum + s.amount, 0) || 0;

  const totalEgresos = totalGastos + totalSueldos;

  // El ingreso Neto es: Bruto (traído dinámicamente) - Gastos Activos - Sueldos Activos
  const displayIngresosMes = stats ? (stats.ingresosBrutos - totalGastos - totalSueldos) : 0;

  const displayTicketPromedio = stats && stats.alumnosActivos > 0
    ? Math.round(displayIngresosMes / stats.alumnosActivos)
    : 0;

  // Actualizar reactivamente la última barra del historial (mes seleccionado) para reflejar cambios en tiempo real
  const mesesNombresShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const selectedMonthLabel = mesesNombresShort[selectedMonth - 1];

  const displayIngresosHistorial = stats?.ingresosHistorial.map((item) => {
    if (item.mes === selectedMonthLabel) {
      return {
        ...item,
        monto: displayIngresosMes,
      };
    }
    return item;
  }) || [];

  if (!mounted || (statsLoading && !stats)) {
    return (
      <div className="p-6 lg:p-8 w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay estadísticas y no se está cargando, mostrar pantalla de error
  if (!stats) {
    return (
      <div className="p-6 lg:p-8 w-full space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-yellow-900 mb-2">
            ⚠️ No se pudieron cargar los datos
          </h2>
          <p className="text-sm text-yellow-700 mb-4">
            Las estadísticas financieras no están disponibles. Esto puede
            deberse a:
          </p>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>Error en la API de finanzas</li>
            <li>No hay datos disponibles en la base de datos</li>
            <li>Problema de conexión con Supabase</li>
          </ul>
          <p className="text-sm text-yellow-700 mt-4">
            Abre la consola del navegador (F12) para ver más detalles.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full mx-auto flex flex-col gap-6 bg-[#FAFAFA] min-h-screen">
      <div className="space-y-6">
        {/* Encabezado Superior con Selector de Mes Global */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estadísticas de Finanzas</h1>
            <p className="text-xs text-gray-400 mt-1">
              Visualiza ingresos netos, deudas, egresos y la distribución de formas de pago.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector
              year={selectedYear}
              month={selectedMonth}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              isCurrentMonth={isCurrentMonth}
              seeding={seeding || statsLoading}
            />
          </div>
        </div>

        {/* Fila 1 — KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            label="Ingresos del Mes (Neto)"
            value={`$${displayIngresosMes.toLocaleString("es")}`}
            accentBg="#F0FDF4"
            accentText="#16A34A"
            icon={<DollarSign size={16} />}
            trend={{
              label:
                stats.variacion >= 0
                  ? `+${stats.variacion}% vs mes anterior`
                  : `${stats.variacion}% vs mes anterior`,
              up: stats.variacion >= 0,
            }}
          />
          <KPICard
            label="Deuda Total Acumulada"
            value={`$${stats.deudaTotal.toLocaleString("es")}`}
            sub={`${stats.alumnosConDeuda} alumnos con saldo pendiente`}
            accentBg="#fffbeb"
            accentText="#d97706"
            icon={<AlertCircle size={16} />}
          />
          <KPICard
            label="Ticket Promedio"
            value={`$${displayTicketPromedio.toLocaleString("es")}`}
            sub="ingreso por alumno activo"
            accentBg="#eff6ff"
            accentText="#2563eb"
            icon={<CreditCard size={16} />}
            note="Calculado sobre ingresos netos del mes / alumnos activos."
          />
        </div>

        {/* Fila 2 — Gráfico de ingresos + formas de pago */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-base font-extrabold text-gray-900">
                  Ingresos Mensuales
                </p>
                <button
                  onClick={() => setShowHistorialModal(true)}
                  className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  title="Ver historial completo"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Evolución de los últimos meses
              </p>
            </div>
            {displayIngresosHistorial.length > 0 ? (
              <div
                onClick={() => setShowHistorialModal(true)}
                className="cursor-pointer group relative"
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={displayIngresosHistorial} barSize={26}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        `$${v.toLocaleString("es")}`,
                        "Ingresos",
                      ]}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="monto" fill="#DC2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/[0.01] rounded-lg transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-gray-100 font-semibold transition-all scale-95 group-hover:scale-100 flex items-center gap-1.5 pointer-events-none">
                    <Maximize2 size={12} className="text-red-500" />
                    Ver historial completo
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No hay datos históricos disponibles
              </div>
            )}
          </div>

          {/* Formas de Pago */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <p className="text-base font-extrabold text-gray-900 mb-1">
                Formas de Pago — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Distribución de cobros por medio de pago (cuotas y ventas)
              </p>
              {stats.formasPago && stats.formasPago.length > 0 ? (
                stats.formasPago.map((item) => {
                  const color = getPaymentMethodColor(item.medio);
                  const bgColor = `${color}20`;

                  return (
                    <div
                      key={item.medio}
                      className="flex items-center gap-3 mb-4"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: bgColor }}
                      >
                        <Wallet size={16} style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {item.medio}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            ${item.monto.toLocaleString("es")}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${item.porcentaje}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5">
                          {item.porcentaje}% del total
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                  No hay datos de formas de pago este mes
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fila 3 — Egresos Configurables */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-base font-extrabold text-gray-900 mb-1">
                Egresos Configurables
              </p>
              <p className="text-xs text-gray-400">
                Gestión de gastos fijos y sueldos del negocio — por mes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={() => setShowExpensesModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm active:scale-[0.98]"
              >
                <Receipt size={16} />
                Administrar Egresos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 flex flex-col justify-between min-h-[130px]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  Total Gastos
                </p>
                <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center">
                  <Receipt size={14} className="text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-orange-900 leading-none">
                  ${totalGastos.toLocaleString()}
                </p>
                <p className="text-[10px] text-orange-600 mt-1.5 font-semibold">
                  {expenses?.filter((e) => e.is_active).length || 0} gastos activos
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 flex flex-col justify-between min-h-[130px]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Total Sueldos
                </p>
                <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                  <Wallet size={14} className="text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-blue-900 leading-none">
                  ${totalSueldos.toLocaleString()}
                </p>
                <p className="text-[10px] text-blue-600 mt-1.5 font-semibold">
                  {salaries?.filter((s) => s.is_active).length || 0} sueldos activos
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col justify-between min-h-[130px]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Total Egresos
                </p>
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                  <DollarSign size={14} className="text-gray-300" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-white leading-none">
                  ${totalEgresos.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 mt-1.5 font-semibold">
                  egresos mensuales totales
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Modal */}
        <ExpensesModal
          isOpen={showExpensesModal}
          onClose={() => setShowExpensesModal(false)}
          year={selectedYear}
          month={selectedMonth}
          expenses={expenses || []}
          salaries={salaries || []}
          onToggleExpense={toggleExpense}
          onUpdateExpense={updateExpense}
          onAddExpense={addExpense}
          onDeleteExpense={deleteExpense}
          onToggleSalary={toggleSalary}
          onUpdateSalary={updateSalary}
          onAddSalary={addSalary}
          onDeleteSalary={deleteSalary}
        />

        {/* Historial Modal */}
        <FinanzasHistorialModal
          open={showHistorialModal}
          onClose={() => setShowHistorialModal(false)}
        />
      </div>
    </div>
  );
}

// ── Historial de ingresos mensuales con Modal Interactivo ────────────────────────

type FinancialSnapRow = { year: number; month: number; ingresos_mes: number };

const MESES_ABREV = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function FinanzasHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<FinancialSnapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("estadisticas_mensuales")
        .select("year, month, ingresos_mes")
        .order("year", { ascending: false })
        .order("month")
        .then(({ data: rows }) => {
          setData((rows ?? []) as FinancialSnapRow[]);
          setLoading(false);
        });
    });
  }, [open]);

  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);
  const hoyYear = new Date().getFullYear();
  const hoyMonth = new Date().getMonth() + 1;

  const allValues = data.map((r) => r.ingresos_mes);
  const maxVal = allValues.length ? Math.max(...allValues) : 1;
  const minVal = allValues.length ? Math.min(...allValues) : 0;

  const currentYearData = data.filter((r) => r.year === hoyYear);
  const lastYearSameMonths = data.filter(
    (r) =>
      r.year === hoyYear - 1 &&
      currentYearData.some((c) => c.month === r.month),
  );
  const currentAvg = currentYearData.length
    ? Math.round(
        currentYearData.reduce((s, r) => s + r.ingresos_mes, 0) /
          currentYearData.length,
      )
    : null;
  const lastAvg = lastYearSameMonths.length
    ? Math.round(
        lastYearSameMonths.reduce((s, r) => s + r.ingresos_mes, 0) /
          lastYearSameMonths.length,
      )
    : null;
  const growthPct =
    currentAvg !== null && lastAvg !== null && lastAvg > 0
      ? Math.round(((currentAvg - lastAvg) / lastAvg) * 100)
      : null;
  const bestSnap = data.reduce<FinancialSnapRow | null>(
    (best, r) => (!best || r.ingresos_mes > best.ingresos_mes ? r : best),
    null,
  );

  const YEAR_COLORS = ["#DC2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

  const chartData = MESES_ABREV.map((mes, i) => {
    const point: Record<string, number | string> = { mes };
    for (const y of years) {
      const found = data.find((r) => r.year === y && r.month === i + 1);
      if (found) point[String(y)] = found.ingresos_mes;
    }
    return point;
  });

  const formatMontoHeatmap = (monto: number) => {
    if (monto === 0) return "$0";
    if (Math.abs(monto) >= 1000000) {
      return `$${(monto / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(monto) >= 1000) {
      return `$${Math.round(monto / 1000)}k`;
    }
    return `$${monto}`;
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-5xl w-full h-[85vh] max-h-[85vh] overflow-hidden flex flex-col p-0 bg-white rounded-2xl border border-gray-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900 leading-none">
                  Historial — Ingresos Mensuales
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                {years.length
                  ? `Evolución mensual neta desde ${Math.min(...years)} hasta ${Math.max(...years)}`
                  : "Sin datos"}
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
          {/* KPI row */}
          {!loading && data.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Promedio Neto {hoyYear}
                </span>
                <span className="text-2xl font-extrabold text-gray-900 leading-none mt-1">
                  {currentAvg !== null ? `$${currentAvg.toLocaleString("es")}` : "—"}
                </span>
                {growthPct !== null && (
                  <span
                    className="text-xs font-semibold mt-1"
                    style={{ color: growthPct >= 0 ? "#16a34a" : "#DC2626" }}
                  >
                    {growthPct >= 0 ? "▲" : "▼"} {Math.abs(growthPct)}% vs {hoyYear - 1}
                  </span>
                )}
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Máximo histórico Neto
                </span>
                <span className="text-2xl font-extrabold text-gray-900 leading-none mt-1">
                  {bestSnap ? `$${bestSnap.ingresos_mes.toLocaleString("es")}` : "—"}
                </span>
                {bestSnap && (
                  <span className="text-xs text-gray-400 mt-1 font-medium">
                    {MESES_ABREV[bestSnap.month - 1]} {bestSnap.year}
                  </span>
                )}
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Años registrados
                </span>
                <span className="text-2xl font-extrabold text-gray-900 leading-none mt-1">
                  {years.length}
                </span>
                {years.length > 0 && (
                  <span className="text-xs text-gray-400 mt-1 font-medium">
                    {Math.min(...years)} – {Math.max(...years)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-8 py-5 flex-1 overflow-y-auto flex flex-col">
          {/* Toggle */}
          <div className="flex gap-2 mb-5 shrink-0">
            {(["tabla", "grafico"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                  vista === v
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {v === "tabla" ? "Tabla" : "Gráfico"}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center flex-1 text-gray-300 text-base">
              Cargando...
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-base">
              No hay datos de historial todavía.
            </div>
          )}

          {/* ── Heatmap tabla ── */}
          {!loading && data.length > 0 && vista === "tabla" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-end gap-2 mb-4">
                <span className="text-xs text-gray-400">Menos</span>
                {[0.08, 0.25, 0.45, 0.65, 0.85].map((t) => (
                  <div
                    key={t}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `rgba(220,38,38,${t})` }}
                  />
                ))}
                <span className="text-xs text-gray-400">Más</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-6 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">
                      Año
                    </th>
                    {MESES_ABREV.map((m) => (
                      <th
                        key={m}
                        className="text-center pb-3 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                      >
                        {m}
                      </th>
                    ))}
                    <th className="text-right pb-3 pl-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Prom.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => {
                    const rowData = data.filter((r) => r.year === y);
                    const rowAvg = rowData.length
                      ? Math.round(
                          rowData.reduce((s, r) => s + r.ingresos_mes, 0) /
                            rowData.length,
                        )
                      : null;
                    return (
                      <tr key={y}>
                        <td className="py-1.5 pr-6">
                          <span
                            className="text-base font-bold"
                            style={{
                              color: y === hoyYear ? "#DC2626" : "#9ca3af",
                            }}
                          >
                            {y}
                          </span>
                        </td>
                        {MESES_ABREV.map((_, i) => {
                          const snap = data.find(
                            (r) => r.year === y && r.month === i + 1,
                          );
                          const isCurrent = y === hoyYear && i + 1 === hoyMonth;
                          const t =
                            snap && maxVal > minVal
                              ? (snap.ingresos_mes - minVal) /
                                (maxVal - minVal)
                              : snap
                                ? 0.5
                                : null;
                          return (
                            <td key={i} className="px-1 py-1.5">
                              <div
                                className="rounded-lg flex items-center justify-center text-sm font-bold"
                                style={{
                                  height: 44,
                                  ...(t !== null
                                    ? {
                                        backgroundColor: isCurrent
                                          ? "#DC2626"
                                          : `rgba(220,38,38,${0.06 + t * 0.58})`,
                                        color: isCurrent
                                          ? "#fff"
                                          : t > 0.55
                                            ? "#fff"
                                            : "#374151",
                                        boxShadow: isCurrent
                                          ? "0 0 0 2px #DC2626"
                                          : "none",
                                      }
                                    : {
                                        backgroundColor: "#f9fafb",
                                        color: "#d1d5db",
                                      }),
                                }}
                              >
                                {snap ? formatMontoHeatmap(snap.ingresos_mes) : "—"}
                              </div>
                            </td>
                          );
                        })}
                        <td className="pl-5 py-1.5 text-right">
                          <span className="text-sm font-bold text-gray-400">
                            {rowAvg !== null ? `$${rowAvg.toLocaleString("es")}` : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Gráfico ── */}
          {!loading && data.length > 0 && vista === "grafico" && (
            <div className="flex-1 flex flex-col">
              <div className="flex flex-wrap gap-5 mb-5">
                {years.map((y, idx) => (
                  <div key={y} className="flex items-center gap-2.5">
                    <div
                      className="w-8 rounded-full"
                      style={{
                        backgroundColor: YEAR_COLORS[idx % YEAR_COLORS.length],
                        height: y === hoyYear ? 4 : 2,
                        opacity: y === hoyYear ? 1 : 0.6,
                      }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: y === hoyYear ? YEAR_COLORS[0] : "#9ca3af",
                      }}
                    >
                      {y}
                      {y === hoyYear ? " (actual)" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f5f5f5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 13, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString("es")}`, "Ingresos"]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                      fontSize: 14,
                    }}
                  />
                  {years.map((y, idx) => (
                    <Line
                      key={y}
                      type="monotone"
                      dataKey={String(y)}
                      stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
                      strokeWidth={y === hoyYear ? 3 : 1.5}
                      strokeOpacity={y === hoyYear ? 1 : 0.5}
                      dot={
                        y === hoyYear
                          ? {
                              r: 4,
                              fill: YEAR_COLORS[0],
                              strokeWidth: 0,
                            }
                          : false
                      }
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex justify-end bg-white shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
