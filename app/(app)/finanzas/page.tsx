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
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CreditCard,
  Info,
  Wallet,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useMonthlyExpenses } from "@/hooks/use-monthly-expenses";
import ExpensesModal from "@/components/ExpensesModal";
import { useAdminStore } from "@/stores/admin-store";

// ── Types ─────────────────────────────────────────────────────────────────────

// FinancialStats se importa implícitamente via useAdminStore

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
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentBg }}
        >
          <span style={{ color: accentText }}>{icon}</span>
        </div>
      </div>
      <span className="text-3xl font-bold text-gray-900 leading-none">
        {value}
      </span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
      {trend && (
        <div className="flex items-center gap-1">
          <TrendingUp
            size={12}
            style={{ color: trend.up ? "#16a34a" : "#dc2626" }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: trend.up ? "#16a34a" : "#dc2626" }}
          >
            {trend.label}
          </span>
        </div>
      )}
      {note && (
        <p className="text-xs text-gray-400 leading-relaxed mt-1">{note}</p>
      )}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  Efectivo: "#16a34a",
  Transferencia: "#2563eb",
  Débito: "#d97706",
  Crédito: "#dc2626",
  "Mercado Pago": "#0891b2",
  "Sin especificar": "#6b7280",
};

export default function FinanzasPage() {
  const {
    finanzasStats,
    finanzasLoading,
    fetchFinanzasStats,
  } = useAdminStore();

  const [mounted, setMounted] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  // Month selector for expenses (default: current month)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isCurrentMonth =
    selectedYear === currentYear && selectedMonth === currentMonth;

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

  // Monthly expenses hook
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
    // Siempre intentar actualizar; el store ignora si el cache es válido
    fetchFinanzasStats();
  }, [fetchFinanzasStats]);

  const stats = finanzasStats;
  const loading = !finanzasStats && finanzasLoading;

  if (!mounted || loading) {
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

  // Si no hay stats, mostrar mensaje de error
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
        {/* Fila 1 — KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            label="Ingresos del Mes"
            value={`$${stats.ingresosMes.toLocaleString("es")}`}
            accentBg="#fef2f2"
            accentText="#DC2626"
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
            value={`$${stats.ticketPromedio.toLocaleString("es")}`}
            sub="ingreso por alumno activo"
            accentBg="#eff6ff"
            accentText="#2563eb"
            icon={<CreditCard size={16} />}
            note="Calculado sobre ingresos del mes / alumnos activos."
          />
        </div>

        {/* Fila 2 — Gráfico de ingresos + formas de pago */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="font-semibold text-gray-900 mb-1">
              Ingresos Mensuales
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Evolución de los últimos meses
            </p>
            {stats.ingresosHistorial.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.ingresosHistorial} barSize={26}>
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
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No hay datos históricos disponibles
              </div>
            )}
          </div>

          {/* Formas de Pago */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                Formas de Pago — Mes Actual
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Distribución de cobros por medio de pago
              </p>
              {stats.formasPago.length > 0 ? (
                stats.formasPago.map((item) => {
                  const color = PAYMENT_METHOD_COLORS[item.medio] || "#6b7280";
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
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                Egresos Configurables
              </p>
              <p className="text-xs text-gray-400">
                Gestión de gastos fijos y sueldos del negocio — por mes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <MonthSelector
                year={selectedYear}
                month={selectedMonth}
                onPrev={handlePrevMonth}
                onNext={handleNextMonth}
                isCurrentMonth={isCurrentMonth}
                seeding={seeding}
              />
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
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                  Total Gastos
                </p>
                <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center">
                  <Receipt size={14} className="text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                $
                {(
                  expenses
                    ?.filter((e) => e.is_active)
                    .reduce((sum, e) => sum + e.amount, 0) || 0
                ).toLocaleString()}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {expenses?.filter((e) => e.is_active).length || 0} gastos
                activos
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Total Sueldos
                </p>
                <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                  <Wallet size={14} className="text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                $
                {(
                  salaries
                    ?.filter((s) => s.is_active)
                    .reduce((sum, s) => sum + s.amount, 0) || 0
                ).toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {salaries?.filter((s) => s.is_active).length || 0} sueldos
                activos
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Total Egresos
                </p>
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                  <DollarSign size={14} className="text-gray-300" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                $
                {(
                  (expenses
                    ?.filter((e) => e.is_active)
                    .reduce((sum, e) => sum + e.amount, 0) || 0) +
                  (salaries
                    ?.filter((s) => s.is_active)
                    .reduce((sum, s) => sum + s.amount, 0) || 0)
                ).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                egresos mensuales totales
              </p>
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
      </div>
    </div>
  );
}
