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
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Plan {
  id: string
  nombre: string
  precio: number
  duracion_dias: number
  activo: boolean
}

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
  // Alertas
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [diasVencimiento, setDiasVencimiento] = useState("5")
  const [diasSinAsistencia30, setDiasSinAsistencia30] = useState("15")
  const [diasSinAsistencia60, setDiasSinAsistencia60] = useState("30")
  const [diasSinAsistencia90, setDiasSinAsistencia90] = useState("60")
  const [diasInactivo, setDiasInactivo] = useState("7")
  const [diasPerdido, setDiasPerdido] = useState("90")

  // Planes
  const [planes, setPlanes] = useState<Plan[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [editPrecio, setEditPrecio] = useState("")
  const [editDuracion, setEditDuracion] = useState("")
  const [newNombre, setNewNombre] = useState("")
  const [newPrecio, setNewPrecio] = useState("")
  const [newDuracion, setNewDuracion] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: settings } = await supabase.from("system_settings").select("*").limit(1).single()
      if (settings) {
        setSettingsId(settings.id)
        setDiasVencimiento(String(settings.notify_days_before_expiration))
        setDiasSinAsistencia30(String(settings.alert_1_days_no_attendance))
        setDiasSinAsistencia60(String(settings.alert_2_days_no_attendance))
        setDiasSinAsistencia90(String(settings.alert_3_days_no_attendance))
        setDiasInactivo(String(settings.days_after_expiration_inactive))
        setDiasPerdido(String(settings.days_without_renewal_lost))
      }

      const { data: plans } = await supabase.from("subscription_plans").select("*").order("price", { ascending: true })
      if (plans) {
        setPlanes(plans.map((p: any) => ({
          id: p.id,
          nombre: p.name,
          precio: p.price,
          duracion_dias: p.duration_days,
          activo: p.is_active
        })))
      }
      setLoading(false)
    }
    loadData()
  }, [])

  async function togglePlan(plan: Plan) {
    const { error } = await supabase.from("subscription_plans").update({ is_active: !plan.activo }).eq("id", plan.id)
    if (!error) {
       setPlanes(p => p.map(x => x.id === plan.id ? { ...x, activo: !plan.activo } : x))
    }
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id)
    setEditNombre(plan.nombre)
    setEditPrecio(String(plan.precio))
    setEditDuracion(String(plan.duracion_dias))
  }

  async function saveEdit() {
    if (!editingId) return
    const update = {
      name: editNombre,
      price: Number(editPrecio),
      duration_days: Number(editDuracion)
    }
    const { error } = await supabase.from("subscription_plans").update(update).eq("id", editingId)
    if (!error) {
      setPlanes(p => p.map(x => x.id === editingId ? { ...x, nombre: editNombre, precio: update.price, duracion_dias: update.duration_days } : x))
      setEditingId(null)
    }
  }

  async function addPlan() {
    if (!newNombre.trim() || !newPrecio || !newDuracion) return
    const insert = {
      name: newNombre.trim(),
      price: Number(newPrecio),
      duration_days: Number(newDuracion),
      is_active: true
    }
    const { data, error } = await supabase.from("subscription_plans").insert(insert).select().single()
    if (data && !error) {
      setPlanes(p => [...p, { id: data.id, nombre: data.name, precio: data.price, duracion_dias: data.duration_days, activo: data.is_active }])
      setNewNombre(""); setNewPrecio(""); setNewDuracion(""); setShowNew(false)
    }
  }

  async function handleSaveAll() {
    if (settingsId) {
      const update = {
        notify_days_before_expiration: Number(diasVencimiento),
        alert_1_days_no_attendance: Number(diasSinAsistencia30),
        alert_2_days_no_attendance: Number(diasSinAsistencia60),
        alert_3_days_no_attendance: Number(diasSinAsistencia90),
        days_after_expiration_inactive: Number(diasInactivo),
        days_without_renewal_lost: Number(diasPerdido)
      }
      await supabase.from("system_settings").update(update).eq("id", settingsId)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC2626]"></div>
      </div>
    )
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
                <div className="flex items-center gap-3 w-full flex-wrap sm:flex-nowrap">
                  <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                    placeholder="Nombre" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white min-w-[120px]" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">$</span>
                    <input value={editPrecio} onChange={e => setEditPrecio(e.target.value)} type="number"
                      placeholder="Precio" className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white text-right" />
                  </div>
                  <div className="flex items-center gap-1">
                    <input value={editDuracion} onChange={e => setEditDuracion(e.target.value)} type="number"
                      placeholder="Días" className="w-16 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white text-right" />
                    <span className="text-sm text-gray-400">días</span>
                  </div>
                  <button onClick={saveEdit} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all hover:brightness-110 sm:w-auto w-full mt-2 sm:mt-0" style={{ backgroundColor: "#DC2626" }}>
                    <Save size={12} /> Guardar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">{plan.nombre}</span>
                    <span className="text-xs text-gray-400">
                      ${plan.precio.toLocaleString("es-AR")} • {plan.duracion_dias} días
                    </span>
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", plan.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400")}>
                    {plan.activo ? "Activo" : "Inactivo"}
                  </span>
                  <div className="flex items-center shrink-0">
                    <button onClick={() => startEdit(plan)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-white" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => togglePlan(plan)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-white" title={plan.activo ? "Desactivar" : "Activar"}>
                      {plan.activo ? <ToggleRight size={18} style={{ color: "#DC2626" }} /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* New plan form */}
          {showNew ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-red-200 bg-red-50/40 mt-1 flex-wrap sm:flex-nowrap">
              <input value={newNombre} onChange={e => setNewNombre(e.target.value)}
                placeholder="Nombre del plan" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white min-w-[120px]" />
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400">$</span>
                <input value={newPrecio} onChange={e => setNewPrecio(e.target.value)} type="number"
                  placeholder="Precio" className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white text-right" />
              </div>
              <div className="flex items-center gap-1">
                <input value={newDuracion} onChange={e => setNewDuracion(e.target.value)} type="number"
                  placeholder="Días" className="w-16 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-red-400 bg-white text-right" />
                <span className="text-sm text-gray-400">días</span>
              </div>
              <button onClick={addPlan} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:brightness-110 transition-all sm:w-auto w-full mt-2 sm:mt-0" style={{ backgroundColor: "#DC2626" }}>
                <Save size={12} /> Agregar
              </button>
              <button onClick={() => { setShowNew(false); setNewNombre(""); setNewPrecio(""); setNewDuracion("") }} className="text-xs text-gray-400 hover:text-gray-600 px-2 sm:w-auto w-full text-center">
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
