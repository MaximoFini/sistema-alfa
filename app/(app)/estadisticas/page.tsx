"use client"

import { useEffect, useState } from "react"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"

// ── Mock data ─────────────────────────────────────────────────────────────────

const mesesIngresos = [
  { mes: "Ago", ingresos: 38000 },
  { mes: "Sep", ingresos: 41000 },
  { mes: "Oct", ingresos: 37000 },
  { mes: "Nov", ingresos: 44000 },
  { mes: "Dic", ingresos: 31000 },
  { mes: "Ene", ingresos: 52000 },
  { mes: "Feb", ingresos: 48000 },
  { mes: "Mar", ingresos: 67000 },
]

const mesesNuevos = [
  { mes: "Oct", nuevos: 1 },
  { mes: "Nov", nuevos: 2 },
  { mes: "Dic", nuevos: 1 },
  { mes: "Ene", nuevos: 3 },
  { mes: "Feb", nuevos: 2 },
  { mes: "Mar", nuevos: 9 },
]
const maxNuevos = Math.max(...mesesNuevos.map((m) => m.nuevos))

const generoData = [
  { name: "Hombres", value: 6, color: "#DC2626" },
  { name: "Mujeres", value: 4, color: "#6b7280" },
]

const retencionData = [
  { mes: "Oct", tasa: 88 },
  { mes: "Nov", tasa: 91 },
  { mes: "Dic", tasa: 85 },
  { mes: "Ene", tasa: 93 },
  { mes: "Feb", tasa: 90 },
  { mes: "Mar", tasa: 100 },
]

const asistenciaHorario = [
  { horario: "08:00", alumnos: 3 },
  { horario: "10:00", alumnos: 5 },
  { horario: "12:00", alumnos: 2 },
  { horario: "17:00", alumnos: 7 },
  { horario: "19:00", alumnos: 9 },
  { horario: "21:00", alumnos: 6 },
]

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  note,
}: {
  label: string
  value: string
  sub?: React.ReactNode
  icon: React.ReactNode
  accent?: string
  note?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accent ? `${accent}18` : "#f3f4f6" }}
        >
          <span style={{ color: accent ?? "#6b7280" }}>{icon}</span>
        </div>
      </div>
      <span className="text-3xl font-bold text-gray-900 leading-none">{value}</span>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
      {note && <p className="text-xs text-gray-400 leading-relaxed">{note}</p>}
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
  description,
}: {
  label: string
  value: string
  color: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{label}</span>
      <span className="text-2xl font-bold leading-none" style={{ color }}>{value}</span>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function EstadisticasPage() {
  const totalAlumnos = 10
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>

      {/* Fila 1 — KPIs superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Alumnos Activos"
          value="10"
          accent="#DC2626"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Nuevos Este Mes"
          value="+9"
          accent="#DC2626"
          sub={
            <div className="flex items-end gap-1 mt-1">
              {mesesNuevos.map((m) => (
                <div key={m.mes} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 rounded-sm"
                    style={{
                      height: `${Math.max(4, (m.nuevos / maxNuevos) * 28)}px`,
                      backgroundColor: m.mes === "Mar" ? "#DC2626" : "#e5e7eb",
                    }}
                  />
                  <span className="text-xs" style={{ color: m.mes === "Mar" ? "#DC2626" : "#9ca3af" }}>
                    {m.mes}
                  </span>
                </div>
              ))}
            </div>
          }
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          }
        />
        <StatCard
          label="Promedio de Edad"
          value="24"
          sub="años"
          accent="#6b7280"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </div>

      {/* Fila 2 — Retención / Churn / Riesgo / Vida útil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Tasa de Retención"
          value="100%"
          color="#16a34a"
          description="Alumnos que continuaron este mes respecto al mes anterior."
        />
        <MetricCard
          label="Tasa de Churn"
          value="0%"
          color="#DC2626"
          description="Porcentaje de alumnos que abandonaron en el período actual."
        />
        <MetricCard
          label="Alumnos en Riesgo"
          value="2"
          color="#d97706"
          description="Sin actividad registrada en los últimos 14 días."
        />
        <MetricCard
          label="Vida Útil del Cliente"
          value="8 m"
          color="#2563eb"
          description="Promedio de meses de permanencia activa de cada alumno."
        />
      </div>

      {/* Fila 3 — Clientes inactivos / perdidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
            3
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Clientes Inactivos Recuperables</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Alumnos con más de 30 días sin asistir pero con menos de 90 días de baja. Potencial de reactivación.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: "#fef2f2", color: "#DC2626" }}>
            1
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Clientes Perdidos</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Alumnos con más de 90 días sin actividad ni pago. Se considera baja definitiva.
            </p>
          </div>
        </div>
      </div>

      {/* Fila 4 — Estacionalidad de ingresos + Género */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Estacionalidad (ocupa 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <p className="font-semibold text-gray-900 mb-1">Estacionalidad de Ingresos Totales</p>
          <p className="text-xs text-gray-400 mb-4">Evolución mensual de ingresos registrados</p>
          {mounted ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mesesIngresos} barSize={28}>
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
                <Bar dataKey="ingresos" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200 }} className="flex items-center justify-center text-gray-300 text-sm">
              Cargando...
            </div>
          )}
        </div>

        {/* Género donut (1/3) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
          <p className="font-semibold text-gray-900">Distribución por Género</p>
          <div className="flex justify-center">
            <div style={{ width: 160, height: 160 }}>
              {mounted && (
                <PieChart width={160} height={160}>
                  <Pie
                    data={generoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {generoData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} alumnos`]} />
                </PieChart>
              )}
            </div>
          </div>
          <div className="text-center -mt-4">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900">{totalAlumnos}</p>
          </div>
          <div className="flex justify-center gap-6">
            {generoData.map((g) => (
              <div key={g.name} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-xs text-gray-500">{g.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">
                  {Math.round((g.value / totalAlumnos) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 5 — Tasa de retención (línea) + Asistencia por horario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Retención mensual */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="font-semibold text-gray-900 mb-1">Tasa de Retención Mensual</p>
          <p className="text-xs text-gray-400 mb-4">Evolución de la retención en los últimos 6 meses</p>
          {mounted ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={retencionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[70, 100]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={(v: number) => [`${v}%`, "Retención"]} />
                <Line
                  type="monotone"
                  dataKey="tasa"
                  stroke="#DC2626"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#DC2626", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180 }} className="flex items-center justify-center text-gray-300 text-sm">
              Cargando...
            </div>
          )}
        </div>

        {/* Asistencia por horario */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="font-semibold text-gray-900 mb-1">Asistencia por Horario</p>
          <p className="text-xs text-gray-400 mb-4">Promedio de alumnos presentes por franja horaria</p>
          {mounted ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={asistenciaHorario} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="horario" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v} alumnos`, "Asistencia"]} cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="alumnos" fill="#111111" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180 }} className="flex items-center justify-center text-gray-300 text-sm">
              Cargando...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
