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
import { TrendingUp, TrendingDown, DollarSign, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react"

const ingresos = [
  { mes: "Oct", monto: 42000 },
  { mes: "Nov", monto: 38000 },
  { mes: "Dic", monto: 35000 },
  { mes: "Ene", monto: 51000 },
  { mes: "Feb", monto: 48000 },
  { mes: "Mar", monto: 67000 },
]

const pagos = [
  { id: 1, alumno: "Carlos Mendoza", disciplina: "Boxeo", monto: 8500, fecha: "05 Mar 2026", estado: "pagado" },
  { id: 2, alumno: "Andrés Solis", disciplina: "BJJ", monto: 7200, fecha: "04 Mar 2026", estado: "pagado" },
  { id: 3, alumno: "Rodrigo Alves", disciplina: "Kickboxing", monto: 9500, fecha: "03 Mar 2026", estado: "pagado" },
  { id: 4, alumno: "Laura Ramírez", disciplina: "MMA", monto: 7200, fecha: "28 Feb 2026", estado: "pendiente" },
  { id: 5, alumno: "Valentina Cruz", disciplina: "Boxeo", monto: 8500, fecha: "25 Feb 2026", estado: "vencido" },
  { id: 6, alumno: "Fernanda Lara", disciplina: "MMA", monto: 7200, fecha: "20 Feb 2026", estado: "pendiente" },
  { id: 7, alumno: "Martín Peña", disciplina: "MMA", monto: 9500, fecha: "15 Feb 2026", estado: "pagado" },
  { id: 8, alumno: "Sofia Guerrero", disciplina: "Muay Thai", monto: 7200, fecha: "10 Feb 2026", estado: "vencido" },
]

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "pagado")
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <CheckCircle2 size={10} /> Pagado
      </span>
    )
  if (estado === "pendiente")
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ color: "#d97706", backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
        <AlertCircle size={10} /> Pendiente
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
      <AlertCircle size={10} /> Vencido
    </span>
  )
}

export default function FinanzasPage() {
  const [tab, setTab] = useState<"todos" | "pagado" | "pendiente" | "vencido">("todos")
  const totalMes = 67000
  const mesAnterior = 48000
  const variacion = Math.round(((totalMes - mesAnterior) / mesAnterior) * 100)
  const pendienteTotal = pagos.filter(p => p.estado !== "pagado").reduce((s, p) => s + p.monto, 0)

  const filtrado = tab === "todos" ? pagos : pagos.filter(p => p.estado === tab)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finanzas</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Ingresos mes */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Ingresos Marzo</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fef2f2" }}>
              <DollarSign size={16} style={{ color: "#dc2626" }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">$67.000</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={12} style={{ color: "#16a34a" }} />
            <span className="text-xs font-medium" style={{ color: "#16a34a" }}>+{variacion}% vs mes anterior</span>
          </div>
        </div>

        {/* Pendiente */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Por Cobrar</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fffbeb" }}>
              <AlertCircle size={16} style={{ color: "#d97706" }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${pendienteTotal.toLocaleString("es")}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-400">
              {pagos.filter(p => p.estado !== "pagado").length} pagos pendientes
            </span>
          </div>
        </div>

        {/* Cobros realizados */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Cobros Realizados</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
              <CreditCard size={16} style={{ color: "#16a34a" }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {pagos.filter(p => p.estado === "pagado").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">pagos este mes</p>
        </div>
      </div>

      {/* Chart + table row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="font-semibold text-gray-900 mb-1">Ingresos Mensuales</p>
          <p className="text-xs text-gray-400 mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ingresos} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString("es")}`, "Ingresos"]} cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="monto" fill="#DC2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <p className="font-semibold text-gray-900 mb-4">Resumen de Pagos</p>
            {[
              { label: "Pagados", count: pagos.filter(p => p.estado === "pagado").length, color: "#16a34a" },
              { label: "Pendientes", count: pagos.filter(p => p.estado === "pendiente").length, color: "#d97706" },
              { label: "Vencidos", count: pagos.filter(p => p.estado === "vencido").length, color: "#dc2626" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 mb-4">
                <div className="w-2 h-10 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count} alumnos</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(item.count / pagos.length) * 100}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white mt-2"
            style={{ backgroundColor: "#DC2626" }}
          >
            Registrar Nuevo Cobro
          </button>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <p className="font-semibold text-gray-900">Historial de Pagos</p>
          <div className="flex items-center gap-2">
            {(["todos", "pagado", "pendiente", "vencido"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize"
                style={
                  tab === t
                    ? { backgroundColor: "#DC2626", color: "#fff" }
                    : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Alumno</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Disciplina</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Monto</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Fecha</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrado.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{p.alumno}</td>
                  <td className="px-5 py-3.5 text-gray-500">{p.disciplina}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">${p.monto.toLocaleString("es")}</td>
                  <td className="px-5 py-3.5 text-gray-400">{p.fecha}</td>
                  <td className="px-5 py-3.5"><EstadoBadge estado={p.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
