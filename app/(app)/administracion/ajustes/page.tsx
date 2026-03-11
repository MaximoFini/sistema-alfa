"use client"

import { useState } from "react"
import {
  DollarSign,
  Bell,
  Tag,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Save,
  Percent,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Plan {
  id: number
  nombre: string
  precio: number
  activo: boolean
}

// ─── Initial mock data ────────────────────────────────────────────────────────
const initialPlanes: Plan[] = [
  { id: 1, nombre: "Mensual", precio: 8000, activo: true },
  { id: 2, nombre: "Trimestral", precio: 21000, activo: true },
  { id: 3, nombre: "Anual", precio: 75000, activo: true },
  { id: 4, nombre: "Clase suelta", precio: 2000, activo: false },
]

// ─── Accordion section wrapper ────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  icon: typeof DollarSign
  title: string
  subtitle: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#FEF2F2" }}>
          <Icon size={18} style={{ color: "#DC2626" }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Number input row ────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  value,
  onChange,
  suffix,
  prefix,
}: {
  label: string
  description?: string
  value: string
  onChange: (v: string) => void
  suffix?: string
  prefix?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        {description && <span className="text-xs text-gray-400 leading-relaxed">{description}</span>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {prefix && <span className="text-sm text-gray-400 font-medium">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={0}
          onChange={e => onChange(e.target.value)}
          className="w-20 text-right border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all bg-gray-50"
        />
        {suffix && <span className="text-sm text-gray-400 font-medium w-10">{suffix}</span>}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AjustesPage() {
  // Finanzas
  const [precioBase, setPrecioBase] = useState("8000")
  const [recargo, setRecargo] = useState("10")

  // Alertas
  const [diasVencimiento, setDiasVencimiento] = useState("5")
  const [diasSinAsistencia30, setDiasSinAsistencia30] = useState("15")
  const [diasSinAsistencia60, setDiasSinAsistencia60] = useState("30")
  const [diasSinAsistencia90, setDiasSinAsistencia90] = useState("60")
  const [diasInactivo, setDiasInactivo] = useState("7")
  const [diasPerdido, setDiasPerdido] = useState("90")

  // Planes
  const [planes, setPlanes] = useState<Plan[]>(initialPlanes)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [editPrecio, setEditPrecio] = useState("")
  const [newNombre, setNewNombre] = useState("")
  const [newPrecio, setNewPrecio] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [saved, setSaved] = useState(false)

  function togglePlan(id: number) {
    setPlanes(p => p.map(x => x.id === id ? { ...x, activo: !x.activo } : x))
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id)
    setEditNombre(plan.nombre)
    setEditPrecio(String(plan.precio))
  }

  function saveEdit() {
    setPlanes(p => p.map(x => x.id === editingId ? { ...x, nombre: editNombre, precio: Number(editPrecio) } : x))
    setEditingId(null)
  }

  function addPlan() {
    if (!newNombre.trim() || !newPrecio) return
    setPlanes(p => [...p, { id: Date.now(), nombre: newNombre.trim(), precio: Number(newPrecio), activo: true }])
    setNewNombre(""); setNewPrecio(""); setShowNew(false)
  }

  function handleSaveAll() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Ajustes de Negocio</h1>
          <p className="text-sm text-gray-400 mt-1">Configura los parametros generales del gimnasio.</p>
        </div>
        <button
          onClick={handleSaveAll}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
            saved
              ? "bg-green-100 text-green-700"
              : "text-white hover:brightness-110"
          )}
          style={saved ? {} : { backgroundColor: "#DC2626" }}
        >
          <Save size={15} />
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>

      {/* ── Finanzas ── */}
      <Section icon={DollarSign} title="Finanzas" subtitle="Precios y recargos de las suscripciones">
        <div className="flex flex-col gap-0 pt-2">
          <SettingRow
            label="Precio base de suscripcion mensual"
            description="Monto de referencia por defecto para nuevas suscripciones."
            value={precioBase}
            onChange={setPrecioBase}
            prefix="$"
          />
          <SettingRow
            label="Recargo por pago en cuotas"
            description="Porcentaje adicional que se aplica cuando el alumno paga en cuotas."
            value={recargo}
            onChange={setRecargo}
            suffix="%"
          />
        </div>
      </Section>

      {/* ── Alertas ── */}
      <Section icon={Bell} title="Alertas y Notificaciones" subtitle="Parametros para avisos automaticos y seguimiento de alumnos">
        <div className="flex flex-col gap-0 pt-2">
          <SettingRow
            label="Dias antes del vencimiento para notificar"
            description="Se envia aviso al alumno cuando le faltan estos dias para vencer su cuota."
            value={diasVencimiento}
            onChange={setDiasVencimiento}
            suffix="dias"
          />
          <SettingRow
            label="Dias sin asistencia — Alerta nivel 1"
            description="A partir de estos dias sin venir, el alumno pasa a estado de seguimiento."
            value={diasSinAsistencia30}
            onChange={setDiasSinAsistencia30}
            suffix="dias"
          />
          <SettingRow
            label="Dias sin asistencia — Alerta nivel 2"
            description="Segunda alerta de riesgo de abandono."
            value={diasSinAsistencia60}
            onChange={setDiasSinAsistencia60}
            suffix="dias"
          />
          <SettingRow
            label="Dias sin asistencia — Alerta nivel 3"
            description="Alerta critica: el alumno esta en riesgo alto de perderse."
            value={diasSinAsistencia90}
            onChange={setDiasSinAsistencia90}
            suffix="dias"
          />
          <SettingRow
            label="Dias tras vencimiento para marcar como inactivo"
            description="Cuantos dias despues del vencimiento se considera al alumno inactivo."
            value={diasInactivo}
            onChange={setDiasInactivo}
            suffix="dias"
          />
          <SettingRow
            label="Dias sin renovacion para marcar como perdido"
            description="A partir de este periodo sin renovar, el alumno se clasifica como perdido."
            value={diasPerdido}
            onChange={setDiasPerdido}
            suffix="dias"
          />
        </div>
      </Section>

      {/* ── Planes ── */}
      <Section icon={Tag} title="Categorias y Planes" subtitle="Crea, edita o desactiva los tipos de suscripcion disponibles">
        <div className="flex flex-col gap-2 pt-3">
          {planes.map(plan => (
            <div
              key={plan.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                plan.activo ? "border-gray-100 bg-gray-50" : "border-gray-100 bg-white opacity-50"
              )}
            >
              {editingId === plan.id ? (
                <>
                  <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">$</span>
                    <input value={editPrecio} onChange={e => setEditPrecio(e.target.value)} type="number"
                      className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white text-right" />
                  </div>
                  <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all hover:brightness-110" style={{ backgroundColor: "#DC2626" }}>
                    <Save size={12} /> Guardar
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">{plan.nombre}</span>
                    <span className="text-xs text-gray-400">${plan.precio.toLocaleString("es-AR")}</span>
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", plan.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400")}>
                    {plan.activo ? "Activo" : "Inactivo"}
                  </span>
                  <button onClick={() => startEdit(plan)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-white" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => togglePlan(plan.id)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-white" title={plan.activo ? "Desactivar" : "Activar"}>
                    {plan.activo ? <ToggleRight size={18} style={{ color: "#DC2626" }} /> : <ToggleLeft size={18} />}
                  </button>
                </>
              )}
            </div>
          ))}

          {/* New plan form */}
          {showNew ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-red-200 bg-red-50/40 mt-1">
              <input value={newNombre} onChange={e => setNewNombre(e.target.value)}
                placeholder="Nombre del plan" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white" />
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400">$</span>
                <input value={newPrecio} onChange={e => setNewPrecio(e.target.value)} type="number"
                  placeholder="Precio" className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white text-right" />
              </div>
              <button onClick={addPlan} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:brightness-110 transition-all" style={{ backgroundColor: "#DC2626" }}>
                <Save size={12} /> Agregar
              </button>
              <button onClick={() => { setShowNew(false); setNewNombre(""); setNewPrecio("") }} className="text-xs text-gray-400 hover:text-gray-600 px-2">
                Cancelar
              </button>
            </div>
          ) : (
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 text-sm font-medium mt-1 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-all">
              <Plus size={15} /> Nuevo plan
            </button>
          )}
        </div>
      </Section>
    </div>
  )
}
