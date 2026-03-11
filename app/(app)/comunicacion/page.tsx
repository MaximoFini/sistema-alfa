"use client"

import { useState } from "react"
import { Send, Search, Plus, Paperclip, Megaphone, Bell, ChevronDown } from "lucide-react"

interface Mensaje {
  id: number
  de: string
  para: string
  asunto: string
  cuerpo: string
  hora: string
  leido: boolean
  tipo: "inbox" | "enviado"
}

const mensajes: Mensaje[] = [
  {
    id: 1,
    de: "Secretaría",
    para: "Carlos Mendoza",
    asunto: "Recordatorio de pago",
    cuerpo: "Hola Carlos, te recordamos que tu cuota mensual de Boxeo está pendiente de pago. Por favor acércate a la secretaría o realiza el pago por transferencia. Gracias.",
    hora: "Hoy 10:30",
    leido: false,
    tipo: "inbox",
  },
  {
    id: 2,
    de: "Rodrigo Alves",
    para: "Secretaría",
    asunto: "Consulta sobre horarios",
    cuerpo: "Buenos días, quería consultar si el horario de Kickboxing del martes cambia la próxima semana.",
    hora: "Hoy 09:15",
    leido: false,
    tipo: "inbox",
  },
  {
    id: 3,
    de: "Secretaría",
    para: "Todos",
    asunto: "Nuevo torneo de MMA en Abril",
    cuerpo: "Estimados alumnos, comunicamos que el próximo mes habrá un torneo interno de MMA para alumnos intermedios y avanzados. Inscripciones abiertas hasta el 20 de marzo.",
    hora: "Ayer",
    leido: true,
    tipo: "enviado",
  },
  {
    id: 4,
    de: "Laura Ramírez",
    para: "Secretaría",
    asunto: "Inasistencia justificada",
    cuerpo: "Hola, quería avisar que no voy a poder asistir a la clase de MMA del jueves por motivos médicos. Adjunto el certificado.",
    hora: "Ayer",
    leido: true,
    tipo: "inbox",
  },
  {
    id: 5,
    de: "Secretaría",
    para: "Andrés Solis",
    asunto: "Plan de entrenamiento actualizado",
    cuerpo: "Andres, te informamos que tu plan de BJJ fue actualizado. Revisá el nuevo cronograma desde la app.",
    hora: "Lun",
    leido: true,
    tipo: "enviado",
  },
]

const anuncios = [
  {
    id: 1,
    titulo: "Torneo Interno MMA - Abril 2026",
    texto: "Inscripciones abiertas para alumnos intermedios y avanzados. Cupos limitados.",
    fecha: "05 Mar 2026",
    tipo: "evento",
  },
  {
    id: 2,
    titulo: "Nuevo horario de Muay Thai",
    texto: "A partir del 15 de marzo, la clase de Muay Thai pasará a las 20:00hs los miércoles.",
    fecha: "03 Mar 2026",
    tipo: "cambio",
  },
  {
    id: 3,
    titulo: "Recordatorio de cuotas",
    texto: "Se recuerda a todos los alumnos que las cuotas deben abonarse antes del día 10 de cada mes.",
    fecha: "01 Mar 2026",
    tipo: "aviso",
  },
]

function tipoBadge(tipo: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    evento: { label: "Evento", color: "#2563eb", bg: "#eff6ff" },
    cambio: { label: "Cambio", color: "#d97706", bg: "#fffbeb" },
    aviso: { label: "Aviso", color: "#DC2626", bg: "#fef2f2" },
  }
  const s = map[tipo] ?? map.aviso
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  )
}

export default function ComunicacionPage() {
  const [tabMain, setTabMain] = useState<"mensajes" | "anuncios">("mensajes")
  const [tabMsj, setTabMsj] = useState<"todos" | "inbox" | "enviado">("todos")
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [newMsg, setNewMsg] = useState("")
  const [search, setSearch] = useState("")

  const filtrados = mensajes.filter((m) => {
    const matchTab = tabMsj === "todos" || m.tipo === tabMsj
    const matchSearch =
      m.asunto.toLowerCase().includes(search.toLowerCase()) ||
      m.de.toLowerCase().includes(search.toLowerCase()) ||
      m.para.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const selected = mensajes.find((m) => m.id === selectedId)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comunicación</h1>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Megaphone size={15} />
            <span className="hidden sm:inline">Nuevo Anuncio</span>
          </button>
          <button
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all"
            style={{ backgroundColor: "#DC2626" }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nuevo Mensaje</span>
          </button>
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {(["mensajes", "anuncios"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTabMain(t)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
            style={
              tabMain === t
                ? { backgroundColor: "#fff", color: "#111", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "#6b7280" }
            }
          >
            {t === "mensajes" ? "Mensajes" : "Anuncios"}
          </button>
        ))}
      </div>

      {tabMain === "mensajes" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: 520 }}>
          {/* List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar mensaje..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
                />
              </div>
            </div>
            {/* Sub-tabs */}
            <div className="flex border-b border-gray-100 shrink-0">
              {(["todos", "inbox", "enviado"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTabMsj(t)}
                  className="flex-1 py-2 text-xs font-medium capitalize transition-colors border-b-2"
                  style={
                    tabMsj === t
                      ? { color: "#DC2626", borderColor: "#DC2626" }
                      : { color: "#9ca3af", borderColor: "transparent" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filtrados.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  style={selectedId === m.id ? { backgroundColor: "#fef2f2" } : {}}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      {!m.leido && (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#DC2626" }} />
                      )}
                      <span className={`text-xs font-semibold ${!m.leido ? "text-gray-900" : "text-gray-500"}`}>
                        {m.tipo === "inbox" ? m.de : `Para: ${m.para}`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{m.hora}</span>
                  </div>
                  <p className={`text-xs truncate ${!m.leido ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                    {m.asunto}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{m.cuerpo}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-base mb-2">{selected.asunto}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>De: <strong className="text-gray-600">{selected.de}</strong></span>
                    <span>Para: <strong className="text-gray-600">{selected.para}</strong></span>
                    <span>{selected.hora}</span>
                  </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.cuerpo}</p>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-red-300 transition-all">
                    <textarea
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Escribe una respuesta..."
                      rows={2}
                      className="flex-1 text-sm outline-none bg-transparent resize-none text-gray-700 placeholder:text-gray-400"
                    />
                    <div className="flex items-center gap-2 pb-0.5 shrink-0">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Paperclip size={15} />
                      </button>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all hover:brightness-110"
                        style={{ backgroundColor: "#DC2626" }}
                        onClick={() => setNewMsg("")}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bell size={22} className="text-gray-400" />
                </div>
                <p className="font-medium text-gray-500">Selecciona un mensaje para leerlo</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tabMain === "anuncios" && (
        <div className="flex flex-col gap-3">
          {anuncios.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {tipoBadge(a.tipo)}
                    <span className="text-xs text-gray-400">{a.fecha}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{a.titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{a.texto}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Crear anuncio card */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3 hover:border-red-300 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fef2f2" }}>
              <Megaphone size={18} style={{ color: "#DC2626" }} />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700 text-sm">Crear nuevo anuncio</p>
              <p className="text-xs text-gray-400">Comunica novedades a todos los alumnos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
