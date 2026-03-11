"use client"

import { useState, useMemo } from "react"
import { ChevronRight, Search, Plus, Filter, X, Calendar, User as UserIcon } from "lucide-react"

interface Alumno {
  id: number
  nombre: string
  fechaNacimiento: string   // "YYYY-MM-DD"
  fechaInscripcion: string  // "YYYY-MM-DD"
  direccion: string
  telefono: string
  dni: string
  initials: string
  color: string
}

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function formatFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

const alumnosIniciales: Alumno[] = [
  { id: 1, nombre: "Carlos Mendoza",    fechaNacimiento: "1995-03-15", fechaInscripcion: "2023-01-10", direccion: "Av. Siempre Viva 742", telefono: "11-4521-0011", dni: "32145678", initials: "CM", color: "#6b7280" },
  { id: 2, nombre: "Laura Ramírez",     fechaNacimiento: "2000-07-22", fechaInscripcion: "2023-03-05", direccion: "Calle Falsa 123",      telefono: "11-9988-7766", dni: "39012345", initials: "LR", color: "#9ca3af" },
  { id: 3, nombre: "Diego Torres",      fechaNacimiento: "1998-11-30", fechaInscripcion: "2023-06-20", direccion: "Rivadavia 1500",        telefono: "11-3344-5566", dni: "35678901", initials: "DT", color: "#78716c" },
  { id: 4, nombre: "Valentina Cruz",    fechaNacimiento: "2003-05-10", fechaInscripcion: "2024-01-15", direccion: "San Martín 200",        telefono: "11-2233-4455", dni: "41234567", initials: "VC", color: "#a1a1aa" },
  { id: 5, nombre: "Andrés Solis",      fechaNacimiento: "1992-09-18", fechaInscripcion: "2022-09-01", direccion: "Belgrano 450",          telefono: "11-5566-7788", dni: "29876543", initials: "AS", color: "#374151" },
  { id: 6, nombre: "Fernanda Lara",     fechaNacimiento: "1996-02-28", fechaInscripcion: "2022-11-12", direccion: "Corrientes 890",        telefono: "11-8877-6655", dni: "33210987", initials: "FL", color: "#4b5563" },
  { id: 7, nombre: "Rodrigo Alves",     fechaNacimiento: "1989-12-05", fechaInscripcion: "2021-07-08", direccion: "Independencia 333",     telefono: "11-1122-3344", dni: "25432109", initials: "RA", color: "#111827" },
  { id: 8, nombre: "Camila Ortega",     fechaNacimiento: "2001-08-14", fechaInscripcion: "2024-02-20", direccion: "Mitre 600",             telefono: "11-6677-8899", dni: "40567890", initials: "CO", color: "#1f2937" },
  { id: 9, nombre: "Martín Peña",       fechaNacimiento: "1987-04-25", fechaInscripcion: "2021-03-14", direccion: "Sarmiento 1200",        telefono: "11-9900-1122", dni: "22345678", initials: "MP", color: "#dc2626" },
  { id: 10, nombre: "Sofia Guerrero",   fechaNacimiento: "2004-10-03", fechaInscripcion: "2024-05-01", direccion: "Lavalle 77",            telefono: "11-4433-2211", dni: "43456789", initials: "SG", color: "#4338ca" },
]

// ---- Modal de Nuevo Alumno ----
function NuevoAlumnoModal({ onClose, onGuardar }: { onClose: () => void; onGuardar: (a: Alumno) => void }) {
  const [form, setForm] = useState({
    nombre: "",
    fechaNacimiento: "",
    fechaInscripcion: new Date().toISOString().split("T")[0],
    direccion: "",
    telefono: "",
    dni: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: "" }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido"
    if (!form.fechaNacimiento) e.fechaNacimiento = "La fecha de nacimiento es requerida"
    if (!form.fechaInscripcion) e.fechaInscripcion = "La fecha de inscripción es requerida"
    if (!form.dni.trim()) e.dni = "El DNI es requerido"
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const words = form.nombre.trim().split(" ")
    const initials = (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")
    const colors = ["#374151","#6b7280","#dc2626","#4338ca","#0f766e","#9a3412","#1e40af"]
    const color = colors[Math.floor(Math.random() * colors.length)]
    onGuardar({ id: Date.now(), ...form, initials: initials.toUpperCase(), color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nuevo Alumno</h2>
            <p className="text-xs text-gray-400 mt-0.5">Completá los datos del alumno</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Nombre completo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre completo *</label>
            <input
              type="text"
              placeholder="Ej: Juan García"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            />
            {errors.nombre && <span className="text-xs text-red-500">{errors.nombre}</span>}
          </div>

          {/* DNI */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">DNI *</label>
            <input
              type="text"
              placeholder="Ej: 38765432"
              value={form.dni}
              onChange={(e) => set("dni", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            />
            {errors.dni && <span className="text-xs text-red-500">{errors.dni}</span>}
          </div>

          {/* Fecha nacimiento + inscripción en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha de nacimiento *</label>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) => set("fechaNacimiento", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
              />
              {errors.fechaNacimiento && <span className="text-xs text-red-500">{errors.fechaNacimiento}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha de inscripción *</label>
              <input
                type="date"
                value={form.fechaInscripcion}
                onChange={(e) => set("fechaInscripcion", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
              />
              {errors.fechaInscripcion && <span className="text-xs text-red-500">{errors.fechaInscripcion}</span>}
            </div>
          </div>

          {/* Dirección */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dirección</label>
            <input
              type="text"
              placeholder="Ej: Av. Corrientes 1234"
              value={form.direccion}
              onChange={(e) => set("direccion", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            />
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Número de teléfono</label>
            <input
              type="tel"
              placeholder="Ej: 11-4521-0011"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg py-2.5 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 text-white text-sm font-semibold rounded-lg py-2.5 hover:brightness-110 transition-all"
              style={{ backgroundColor: "#DC2626" }}>
              Guardar Alumno
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Tarjeta de alumno ----
function AlumnoCard({ alumno }: { alumno: Alumno }) {
  const edad = calcularEdad(alumno.fechaNacimiento)
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ backgroundColor: alumno.color }}
      >
        {alumno.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{alumno.nombre}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <UserIcon size={11} className="text-gray-400" />
            {edad} años
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={11} className="text-gray-400" />
            Inscripto: {formatFecha(alumno.fechaInscripcion)}
          </span>
        </div>
      </div>
      <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors">
        <ChevronRight size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
      </div>
    </div>
  )
}

// ---- Panel de filtros ----
function FilterPanel({
  filtros,
  setFiltros,
  onClose,
}: {
  filtros: { edadMin: string; edadMax: string; desdeInscripcion: string; hastaInscripcion: string }
  setFiltros: (f: typeof filtros) => void
  onClose: () => void
}) {
  const [local, setLocal] = useState(filtros)
  function set(k: string, v: string) { setLocal((f) => ({ ...f, [k]: v })) }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        {/* Rango de edad */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edad</span>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" min={0} max={100} value={local.edadMin}
              onChange={(e) => set("edadMin", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 transition-all" />
            <span className="text-gray-400 text-xs shrink-0">–</span>
            <input type="number" placeholder="Max" min={0} max={100} value={local.edadMax}
              onChange={(e) => set("edadMax", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 transition-all" />
          </div>
        </div>

        {/* Rango de inscripción */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha de inscripción</span>
          <div className="flex items-center gap-2">
            <input type="date" value={local.desdeInscripcion}
              onChange={(e) => set("desdeInscripcion", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 transition-all" />
            <span className="text-gray-400 text-xs shrink-0">–</span>
            <input type="date" value={local.hastaInscripcion}
              onChange={(e) => set("hastaInscripcion", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 transition-all" />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              const vacío = { edadMin: "", edadMax: "", desdeInscripcion: "", hastaInscripcion: "" }
              setLocal(vacío); setFiltros(vacío)
            }}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors whitespace-nowrap">
            Limpiar
          </button>
          <button
            onClick={() => { setFiltros(local); onClose() }}
            className="text-sm text-white font-semibold rounded-lg px-4 py-2 hover:brightness-110 transition-all whitespace-nowrap"
            style={{ backgroundColor: "#DC2626" }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Página principal ----
export default function InicioPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>(alumnosIniciales)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filtros, setFiltros] = useState({
    edadMin: "", edadMax: "",
    desdeInscripcion: "", hastaInscripcion: "",
  })

  const filtered = useMemo(() => {
    return alumnos.filter((a) => {
      const q = search.toLowerCase()
      const matchSearch = !q || a.nombre.toLowerCase().includes(q) || a.dni.includes(q)
      const edad = calcularEdad(a.fechaNacimiento)
      const matchEdadMin = !filtros.edadMin || edad >= parseInt(filtros.edadMin)
      const matchEdadMax = !filtros.edadMax || edad <= parseInt(filtros.edadMax)
      const fi = a.fechaInscripcion
      const matchDesde = !filtros.desdeInscripcion || fi >= filtros.desdeInscripcion
      const matchHasta = !filtros.hastaInscripcion || fi <= filtros.hastaInscripcion
      return matchSearch && matchEdadMin && matchEdadMax && matchDesde && matchHasta
    })
  }, [alumnos, search, filtros])

  const hayFiltrosActivos = Object.values(filtros).some((v) => v !== "")

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Modal */}
      {showModal && (
        <NuevoAlumnoModal
          onClose={() => setShowModal(false)}
          onGuardar={(a) => setAlumnos((prev) => [a, ...prev])}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{alumnos.length} alumnos registrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all"
          style={{ backgroundColor: "#DC2626" }}
        >
          <Plus size={15} />
          Crear Alumno
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            hayFiltrosActivos
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Filter size={15} />
          <span className="hidden sm:inline">Filtrar</span>
          {hayFiltrosActivos && (
            <span className="w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style={{ backgroundColor: "#DC2626", fontSize: 9 }}>
              {Object.values(filtros).filter((v) => v !== "").length}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4">
          <FilterPanel
            filtros={filtros}
            setFiltros={setFiltros}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Chips de filtros activos */}
      {hayFiltrosActivos && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filtros.edadMin && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded-full px-2.5 py-1 font-medium">
              Edad min: {filtros.edadMin}
              <button onClick={() => setFiltros((f) => ({ ...f, edadMin: "" }))}><X size={10} /></button>
            </span>
          )}
          {filtros.edadMax && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded-full px-2.5 py-1 font-medium">
              Edad max: {filtros.edadMax}
              <button onClick={() => setFiltros((f) => ({ ...f, edadMax: "" }))}><X size={10} /></button>
            </span>
          )}
          {filtros.desdeInscripcion && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded-full px-2.5 py-1 font-medium">
              Desde: {formatFecha(filtros.desdeInscripcion)}
              <button onClick={() => setFiltros((f) => ({ ...f, desdeInscripcion: "" }))}><X size={10} /></button>
            </span>
          )}
          {filtros.hastaInscripcion && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded-full px-2.5 py-1 font-medium">
              Hasta: {formatFecha(filtros.hastaInscripcion)}
              <button onClick={() => setFiltros((f) => ({ ...f, hastaInscripcion: "" }))}><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-gray-400 mb-3 font-medium">
        {filtered.length} de {alumnos.length} alumnos
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((alumno) => (
          <AlumnoCard key={alumno.id} alumno={alumno} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Search size={20} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-sm">No se encontraron alumnos</p>
          <p className="text-gray-400 text-xs mt-1">Ajustá los filtros o el término de búsqueda</p>
        </div>
      )}
    </div>
  )
}
