"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { TrendingUp, DollarSign, AlertCircle, CreditCard, Info } from "lucide-react"

// ── Mock data ─────────────────────────────────────────────────────────────────

const ingresos = [
  { mes: "Ago", monto: 38000 },
  { mes: "Sep", monto: 41000 },
  { mes: "Oct", monto: 37000 },
  { mes: "Nov", monto: 44000 },
  { mes: "Dic", monto: 31000 },
  { mes: "Ene", monto: 52000 },
  { mes: "Feb", monto: 48000 },
  { mes: "Mar", monto: 67000 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function MonthBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: "#fef2f2", color: "#DC2626", border: "1px solid #fecaca" }}
    >
      <Info size={11} />
      Datos del mes actual — Marzo 2026
    </span>
  )
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
  label: string
  value: string
  sub?: string
  trend?: { label: string; up: boolean }
  accentBg: string
  accentText: string
  icon: React.ReactNode
  note?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentBg }}>
          <span style={{ color: accentText }}>{icon}</span>
        </div>
      </div>
      <span className="text-3xl font-bold text-gray-900 leading-none">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
      {trend && (
        <div className="flex items-center gap-1">
          <TrendingUp size={12} style={{ color: trend.up ? "#16a34a" : "#dc2626" }} />
          <span className="text-xs font-medium" style={{ color: trend.up ? "#16a34a" : "#dc2626" }}>
            {trend.label}
          </span>
        </div>
      )}
      {note && <p className="text-xs text-gray-400 leading-relaxed mt-1">{note}</p>}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function FinanzasPage() {
  const [mounted, setMounted] = useState(false)
  if (typeof window !== "undefined" && !mounted) setMounted(true)

  const totalMes = 67000
  const mesAnterior = 48000
  const variacion = Math.round(((totalMes - mesAnterior) / mesAnterior) * 100)

  // Métricas calculadas
  const ticketPromedio = Math.round(totalMes / 10)            // ingresos / total alumnos
  const deudaTotal = 32400                                     // mock suma de deudas
  const ltv = Math.round(ticketPromedio * 8)                  // ticket * vida útil promedio (8 meses)
  const cobrosRealizados = 7
  const cobrosPendientes = 3

  return (
    <div className="p-6 lg:p-8 w-full space-y-6">

      {/* Header con indicador mensual */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
        <MonthBadge />
      </div>

      {/* Fila 1 — KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ingresos del Mes"
          value={`$${totalMes.toLocaleString("es")}`}
          accentBg="#fef2f2"
          accentText="#DC2626"
          icon={<DollarSign size={16} />}
          trend={{ label: `+${variacion}% vs mes anterior`, up: true }}
        />
        <KPICard
          label="Deuda Total Acumulada"
          value={`$${deudaTotal.toLocaleString("es")}`}
          sub={`${cobrosPendientes} alumnos con saldo pendiente`}
          accentBg="#fffbeb"
          accentText="#d97706"
          icon={<AlertCircle size={16} />}
        />
        <KPICard
          label="Ticket Promedio"
          value={`$${ticketPromedio.toLocaleString("es")}`}
          sub="ingreso por alumno activo"
          accentBg="#eff6ff"
          accentText="#2563eb"
          icon={<CreditCard size={16} />}
          note="Calculado sobre ingresos del mes / alumnos activos."
        />
        <KPICard
          label="LTV — Valor del Ciclo de Vida"
          value={`$${ltv.toLocaleString("es")}`}
          sub="ticket × vida útil promedio (8 m)"
          accentBg="#f0fdf4"
          accentText="#16a34a"
          icon={<TrendingUp size={16} />}
          note="Estimación del valor total que genera un alumno durante su permanencia."
        />
      </div>

      {/* Fila 2 — Gráfico de ingresos + resumen de cobros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="font-semibold text-gray-900 mb-1">Ingresos Mensuales</p>
          <p className="text-xs text-gray-400 mb-4">Evolución de los últimos 8 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ingresos} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString("es")}`, "Ingresos"]}
                cursor={{ fill: "#f9fafb" }}
              />
              <Bar dataKey="monto" fill="#DC2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen de cobros */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <p className="font-semibold text-gray-900 mb-4">Resumen de Cobros — Mes Actual</p>
            {[
              { label: "Pagados", count: cobrosRealizados, color: "#16a34a", bg: "#f0fdf4", total: 10 },
              { label: "Pendientes", count: 2, color: "#d97706", bg: "#fffbeb", total: 10 },
              { label: "Vencidos", count: 1, color: "#DC2626", bg: "#fef2f2", total: 10 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: item.bg, color: item.color }}
                >
                  {item.count}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-xs text-gray-400">{Math.round((item.count / item.total) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(item.count / item.total) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: "#DC2626" }}
          >
            Registrar Nuevo Cobro
          </button>
        </div>
      </div>

      {/* Fila 3 — Comparativa deuda vs ingresos */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="font-semibold text-gray-900 mb-1">Composición Financiera del Mes</p>
        <p className="text-xs text-gray-400 mb-5">Relación entre ingresos cobrados y deuda acumulada</p>
        <div className="flex flex-col sm:flex-row gap-6">
          {[
            { label: "Ingresos Cobrados", value: totalMes, total: totalMes + deudaTotal, color: "#DC2626" },
            { label: "Deuda Acumulada", value: deudaTotal, total: totalMes + deudaTotal, color: "#d97706" },
          ].map((item) => {
            const pct = Math.round((item.value / item.total) * 100)
            return (
              <div key={item.label} className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">${item.value.toLocaleString("es")}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-xs text-gray-400">{pct}% del total facturado</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
