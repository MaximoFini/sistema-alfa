"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const disciplinaData = [
  { name: "Boxeo", alumnos: 4, color: "#DC2626" },
  { name: "MMA", alumnos: 3, color: "#111111" },
  { name: "Muay Thai", alumnos: 2, color: "#6b7280" },
  { name: "BJJ", alumnos: 1, color: "#9ca3af" },
]

const nivelData = [
  { name: "Principiante", alumnos: 5, color: "#DC2626", porcentaje: 50 },
  { name: "Intermedio", alumnos: 3, color: "#111111", porcentaje: 30 },
  { name: "Avanzado", alumnos: 2, color: "#9ca3af", porcentaje: 20 },
]

const generoData = [
  { name: "Hombres", value: 6, color: "#DC2626" },
  { name: "Mujeres", value: 4, color: "#6b7280" },
]

const mesesData = [
  { mes: "Oct", nuevos: 1 },
  { mes: "Nov", nuevos: 2 },
  { mes: "Dic", nuevos: 1 },
  { mes: "Ene", nuevos: 3 },
  { mes: "Feb", nuevos: 2 },
  { mes: "Mar", nuevos: 9 },
]

const maxNuevos = Math.max(...mesesData.map((m) => m.nuevos))

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string
  value: string
  sub?: React.ReactNode
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent ? `${accent}18` : "#f3f4f6" }}
        >
          <span style={{ color: accent ?? "#6b7280" }}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function ProgressBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = Math.round((count / total) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{count} alumnos</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function EstadisticasPage() {
  const totalAlumnos = 10

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas</h1>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Alumnos Activos"
          value="10"
          accent="#DC2626"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Nuevos Este Mes"
          value="+9"
          accent="#DC2626"
          sub={
            <div className="flex items-end gap-1">
              {mesesData.map((m) => (
                <div key={m.mes} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 rounded-sm transition-all"
                    style={{
                      height: `${Math.max(4, (m.nuevos / maxNuevos) * 28)}px`,
                      backgroundColor: m.mes === "Mar" ? "#DC2626" : "#e5e7eb",
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: m.mes === "Mar" ? "#DC2626" : "#9ca3af" }}
                  >
                    {m.mes}
                  </span>
                </div>
              ))}
            </div>
          }
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
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

      {/* Main row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Nivel/Disciplina - wide */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-6">
          {/* Disciplinas */}
          <div>
            <p className="font-semibold text-gray-900 mb-1">Disciplinas</p>
            <p className="text-xs text-gray-400 mb-4">Distribución de alumnos por deporte de combate</p>
            <div className="flex flex-col gap-3">
              {disciplinaData.map((d) => (
                <ProgressBar
                  key={d.name}
                  label={d.name}
                  count={d.alumnos}
                  total={totalAlumnos}
                  color={d.color}
                />
              ))}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-gray-100" />
          {/* Nivel */}
          <div>
            <p className="font-semibold text-gray-900 mb-1">Nivel de Alumnos</p>
            <p className="text-xs text-gray-400 mb-4">Distribución por categoría de experiencia</p>
            <div className="flex flex-col gap-3">
              {nivelData.map((n) => (
                <ProgressBar
                  key={n.name}
                  label={n.name}
                  count={n.alumnos}
                  total={totalAlumnos}
                  color={n.color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Género donut */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
            <p className="font-semibold text-gray-900">Distribución por Género</p>
            <div className="flex justify-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
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
              </ResponsiveContainer>
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

          {/* Retención */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                Retención de Clientes
              </p>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">100%</p>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full w-full" style={{ backgroundColor: "#DC2626" }} />
            </div>
            <p className="text-xs text-gray-400">
              Métrica basada en el flujo de alumnos del presente mes.
            </p>
          </div>
        </div>
      </div>

      {/* Plan status row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Sin Plan", count: 5, color: "#d97706", bg: "#fffbeb" },
          { label: "Plan Activo", count: 3, color: "#2563eb", bg: "#eff6ff" },
          { label: "Plan Vencido", count: 2, color: "#DC2626", bg: "#fef2f2" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: item.bg, color: item.color }}
            >
              {item.count}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400">
                {Math.round((item.count / totalAlumnos) * 100)}% del total
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
