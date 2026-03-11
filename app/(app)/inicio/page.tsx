"use client"

import { useState } from "react"
import { ChevronRight, Search, Plus, Filter } from "lucide-react"

type Disciplina = "Boxeo" | "MMA" | "Muay Thai" | "BJJ" | "Kickboxing"
type Nivel = "Principiante" | "Intermedio" | "Avanzado"
type PlanStatus = "sin_plan" | "activo" | "vencido"

interface Alumno {
  id: number
  nombre: string
  nivel: Nivel
  disciplina: Disciplina
  planStatus: PlanStatus
  planNombre?: string
  progreso?: number
  avatar?: string
  initials: string
  color: string
}

const alumnos: Alumno[] = [
  {
    id: 1,
    nombre: "Carlos Mendoza",
    nivel: "Intermedio",
    disciplina: "Boxeo",
    planStatus: "sin_plan",
    initials: "CM",
    color: "#6b7280",
  },
  {
    id: 2,
    nombre: "Laura Ramírez",
    nivel: "Principiante",
    disciplina: "MMA",
    planStatus: "sin_plan",
    initials: "LR",
    color: "#9ca3af",
  },
  {
    id: 3,
    nombre: "Diego Torres",
    nivel: "Principiante",
    disciplina: "Muay Thai",
    planStatus: "sin_plan",
    initials: "DT",
    color: "#78716c",
  },
  {
    id: 4,
    nombre: "Valentina Cruz",
    nivel: "Principiante",
    disciplina: "Boxeo",
    planStatus: "sin_plan",
    initials: "VC",
    color: "#a1a1aa",
  },
  {
    id: 5,
    nombre: "Andrés Solis",
    nivel: "Intermedio",
    disciplina: "BJJ",
    planStatus: "activo",
    planNombre: "Plan Combate M26",
    initials: "AS",
    color: "#374151",
  },
  {
    id: 6,
    nombre: "Fernanda Lara",
    nivel: "Intermedio",
    disciplina: "MMA",
    planStatus: "vencido",
    planNombre: "Plan Base",
    progreso: 0,
    initials: "FL",
    color: "#4b5563",
  },
  {
    id: 7,
    nombre: "Rodrigo Alves",
    nivel: "Avanzado",
    disciplina: "Kickboxing",
    planStatus: "activo",
    planNombre: "Plan Elite K1",
    initials: "RA",
    color: "#111827",
  },
  {
    id: 8,
    nombre: "Camila Ortega",
    nivel: "Principiante",
    disciplina: "Boxeo",
    planStatus: "vencido",
    planNombre: "Plan Inicio",
    progreso: 50,
    initials: "CO",
    color: "#1f2937",
  },
  {
    id: 9,
    nombre: "Martín Peña",
    nivel: "Avanzado",
    disciplina: "MMA",
    planStatus: "activo",
    planNombre: "Plan Profesional",
    initials: "MP",
    color: "#dc2626",
  },
  {
    id: 10,
    nombre: "Sofia Guerrero",
    nivel: "Principiante",
    disciplina: "Muay Thai",
    planStatus: "sin_plan",
    initials: "SG",
    color: "#6d28d9",
  },
]

function PlanBadge({ alumno }: { alumno: Alumno }) {
  if (alumno.planStatus === "sin_plan") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium"
        style={{ color: "#d97706", borderColor: "#fde68a", backgroundColor: "#fffbeb" }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        Sin plan
      </span>
    )
  }
  if (alumno.planStatus === "activo") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium"
        style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        {alumno.planNombre}
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium"
        style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        {alumno.planNombre}
      </span>
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium"
        style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {alumno.progreso}%
      </span>
    </div>
  )
}

function AlumnoCard({ alumno }: { alumno: Alumno }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ backgroundColor: alumno.color }}
      >
        {alumno.initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{alumno.nombre}</p>
        <p className="text-xs text-gray-500 mb-1.5">
          {alumno.nivel} &bull; {alumno.disciplina}
        </p>
        <PlanBadge alumno={alumno} />
      </div>

      {/* Arrow */}
      <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors">
        <ChevronRight size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
      </div>
    </div>
  )
}

export default function InicioPage() {
  const [search, setSearch] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)

  const filtered = alumnos.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase()) ||
    a.disciplina.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome toast */}
      {showWelcome && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-white border border-green-200 shadow-lg rounded-lg px-4 py-3 text-sm font-medium text-green-700"
          style={{ maxWidth: 260 }}
        >
          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          ¡Bienvenido de nuevo!
          <button onClick={() => setShowWelcome(false)} className="ml-auto text-green-400 hover:text-green-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Alumnos</h1>
        <button
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all"
          style={{ backgroundColor: "#DC2626" }}
        >
          <Plus size={15} />
          Nuevo Alumno
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar alumno o disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter size={15} />
          <span className="hidden sm:inline">Filtrar</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((alumno) => (
          <AlumnoCard key={alumno.id} alumno={alumno} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Users size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No se encontraron alumnos</p>
          <p className="text-gray-400 text-sm">Intenta con otro término de búsqueda</p>
        </div>
      )}
    </div>
  )
}

function Users(props: { size: number; className?: string }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
