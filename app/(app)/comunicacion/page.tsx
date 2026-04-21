"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MessageCircle,
  Send,
  Users,
  ChevronDown,
  CheckCheck,
  Clock,
  Phone,
  Search,
  X,
  AlertTriangle,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useAdminSettingsStore } from "@/hooks/use-admin-settings";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AlumnoComm {
  id: string;
  nombre: string | null;
  telefono: string | null;
  activo: boolean | null;
  genero: string | null;
  fecha_registro: string | null;
  fecha_ultima_asistencia: string | null;
}

type FiltroKey =
  | "todos"
  | "activos"
  | "nuevos"
  | "en_riesgo"
  | "inactivos"
  | "perdidos";

type GeneroFiltro = "todos" | "m" | "f";

interface MensajeHistorial {
  id: string;
  texto: string;
  filtro: string;
  filtro_label: string;
  cantidad: number;
  estado: string;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function diasDesde(fechaStr: string | null): number | null {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + "T00:00:00");
  return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

function formatFecha(isoStr: string): string {
  return new Date(isoStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function interpolarMensaje(texto: string, alumno: AlumnoComm): string {
  const dias = diasDesde(alumno.fecha_ultima_asistencia);
  return texto
    .replace(/\{nombre\}/g, alumno.nombre ?? "Alumno")
    .replace(/\{dias_inactivo\}/g, dias !== null ? String(dias) : "—");
}

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTROS: Record<
  FiltroKey,
  {
    label: string;
    chip: string;
    activeChip: string;
    badge: string;
    activeBadge: string;
  }
> = {
  todos: {
    label: "Todos",
    chip: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    activeChip: "bg-gray-800 text-white",
    badge: "bg-gray-200 text-gray-600",
    activeBadge: "bg-white/20 text-white",
  },
  activos: {
    label: "Activos",
    chip: "bg-green-50 text-green-700 hover:bg-green-100",
    activeChip: "bg-green-600 text-white",
    badge: "bg-green-100 text-green-700",
    activeBadge: "bg-white/20 text-white",
  },
  nuevos: {
    label: "Nuevos Este Mes",
    chip: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    activeChip: "bg-blue-600 text-white",
    badge: "bg-blue-100 text-blue-700",
    activeBadge: "bg-white/20 text-white",
  },
  en_riesgo: {
    label: "En Riesgo",
    chip: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    activeChip: "bg-amber-500 text-white",
    badge: "bg-amber-100 text-amber-700",
    activeBadge: "bg-white/20 text-white",
  },
  inactivos: {
    label: "Inactivos",
    chip: "bg-orange-50 text-orange-700 hover:bg-orange-100",
    activeChip: "bg-orange-500 text-white",
    badge: "bg-orange-100 text-orange-700",
    activeBadge: "bg-white/20 text-white",
  },
  perdidos: {
    label: "Perdidos",
    chip: "bg-red-50 text-red-700 hover:bg-red-100",
    activeChip: "bg-red-600 text-white",
    badge: "bg-red-100 text-red-700",
    activeBadge: "bg-white/20 text-white",
  },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ComunicacionPage() {
  const { settings, fetchSettings } = useAdminSettingsStore();

  const [alumnos, setAlumnos] = useState<AlumnoComm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroKey>("activos");
  const [generoFiltro, setGeneroFiltro] = useState<GeneroFiltro>("todos");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [historial, setHistorial] = useState<MensajeHistorial[]>([]);
  const [historialLoading, setHistorialLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const checkboxAllRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSettings();
    supabase
      .from("alumnos")
      .select(
        "id, nombre, telefono, activo, genero, fecha_registro, fecha_ultima_asistencia"
      )
      .eq("es_prueba", false)
      .then(({ data }) => {
        setAlumnos(data ?? []);
        setLoading(false);
      });
  }, [fetchSettings]);

  const fetchHistorial = useCallback(() => {
    setHistorialLoading(true);
    supabase
      .from("comunicacion_mensajes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        setHistorial(data ?? []);
        setHistorialLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  // ── Classification ───────────────────────────────────────────────────────────

  const grupos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const DIAS_RIESGO = 15;
    const diasInact2 = settings?.alert_2_days_no_attendance ?? 30;
    const diasPerdido = 90;

    const umbralRiesgo = new Date(hoy);
    umbralRiesgo.setDate(hoy.getDate() - DIAS_RIESGO);
    const umbralInact2 = new Date(hoy);
    umbralInact2.setDate(hoy.getDate() - diasInact2);
    const umbralPerdido = new Date(hoy);
    umbralPerdido.setDate(hoy.getDate() - diasPerdido);

    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const g: Record<FiltroKey, AlumnoComm[]> = {
      todos: alumnos,
      activos: [],
      nuevos: [],
      en_riesgo: [],
      inactivos: [],
      perdidos: [],
    };

    for (const a of alumnos) {
      const ultAsist = a.fecha_ultima_asistencia
        ? new Date(a.fecha_ultima_asistencia + "T00:00:00")
        : null;

      if (a.activo) g.activos.push(a);

      if (a.activo && a.fecha_registro) {
        const reg = new Date(a.fecha_registro + "T00:00:00");
        if (reg.getMonth() === mesActual && reg.getFullYear() === anioActual) {
          g.nuevos.push(a);
        }
      }

      if (ultAsist && ultAsist >= umbralRiesgo) g.en_riesgo.push(a);

      if (ultAsist && ultAsist < umbralInact2 && ultAsist >= umbralPerdido)
        g.inactivos.push(a);

      if (!ultAsist || ultAsist < umbralPerdido) g.perdidos.push(a);
    }

    return g;
  }, [alumnos, settings]);

  // ── Filtered list ────────────────────────────────────────────────────────────

  const alumnosVisibles = useMemo(() => {
    let base = grupos[filtro];
    if (generoFiltro === "m") base = base.filter((a) => a.genero === "masculino");
    if (generoFiltro === "f") base = base.filter((a) => a.genero === "femenino");
    if (!busqueda.trim()) return base;
    const q = busqueda.toLowerCase();
    return base.filter((a) => (a.nombre ?? "").toLowerCase().includes(q));
  }, [grupos, filtro, generoFiltro, busqueda]);

  // ── Selection ────────────────────────────────────────────────────────────────

  const todosMarcados =
    alumnosVisibles.length > 0 &&
    alumnosVisibles.every((a) => seleccionados.has(a.id));
  const algunosMarcados =
    alumnosVisibles.some((a) => seleccionados.has(a.id)) && !todosMarcados;

  useEffect(() => {
    if (checkboxAllRef.current) {
      checkboxAllRef.current.indeterminate = algunosMarcados;
    }
  }, [algunosMarcados]);

  function toggleTodos() {
    if (todosMarcados) {
      setSeleccionados((prev) => {
        const next = new Set(prev);
        alumnosVisibles.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSeleccionados((prev) => {
        const next = new Set(prev);
        alumnosVisibles.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }

  function toggleAlumno(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFiltro(f: FiltroKey) {
    setFiltro(f);
    setGeneroFiltro("todos");
    setSeleccionados(new Set());
    setBusqueda("");
  }

  const cantidadSeleccionados = useMemo(
    () => alumnos.filter((a) => seleccionados.has(a.id)).length,
    [alumnos, seleccionados]
  );

  // ── Sin telefono ─────────────────────────────────────────────────────────────

  const sinTelefono = useMemo(
    () => alumnos.filter((a) => seleccionados.has(a.id) && !a.telefono).length,
    [alumnos, seleccionados]
  );

  // ── Preview ──────────────────────────────────────────────────────────────────

  const alumnoPreview = useMemo(() => {
    if (!seleccionados.size) return null;
    return alumnos.find((a) => seleccionados.has(a.id)) ?? null;
  }, [alumnos, seleccionados]);

  const mensajePreview = useMemo(() => {
    if (!mensaje.trim() || !alumnoPreview) return null;
    return interpolarMensaje(mensaje, alumnoPreview);
  }, [mensaje, alumnoPreview]);

  // ── Send ─────────────────────────────────────────────────────────────────────

  const puedeEnviar =
    mensaje.trim().length > 0 && cantidadSeleccionados > 0 && !enviando;

  async function handleEnviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setShowPreview(false);

    await supabase.from("comunicacion_mensajes").insert({
      texto: mensaje.trim(),
      filtro,
      filtro_label: FILTROS[filtro].label,
      cantidad: cantidadSeleccionados,
      estado: "guardado",
    });

    await fetchHistorial();
    setMensaje("");
    setSeleccionados(new Set());
    setEnviando(false);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  }

  // ── Reenviar desde historial ─────────────────────────────────────────────────

  function handleReenviar(m: MensajeHistorial) {
    setMensaje(m.texto);
    const filtroKey = m.filtro as FiltroKey;
    if (filtroKey in FILTROS) handleFiltro(filtroKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comunicacion</h1>
        <p className="text-sm text-gray-500 mt-1">
          Filtra alumnos por situacion y prepara mensajes de WhatsApp.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(FILTROS) as FiltroKey[]).map((key) => {
          const isActive = filtro === key;
          const count = grupos[key].length;
          const f = FILTROS[key];
          return (
            <button
              key={key}
              onClick={() => handleFiltro(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${isActive ? f.activeChip : f.chip}`}
            >
              {f.label}
              <span
                className={`text-xs font-bold min-w-[1.25rem] text-center px-1.5 py-0.5 rounded-full ${isActive ? f.activeBadge : f.badge}`}
              >
                {loading ? "." : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left: student list */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden min-w-0">
          {/* List toolbar */}
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-3">
              <input
                ref={checkboxAllRef}
                type="checkbox"
                checked={todosMarcados}
                onChange={toggleTodos}
                className="w-4 h-4 rounded accent-red-600 cursor-pointer shrink-0"
              />
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-red-300 focus:bg-white transition-colors"
                />
              </div>
              {cantidadSeleccionados > 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full shrink-0">
                  {cantidadSeleccionados} sel.
                </span>
              )}
            </div>

            {/* Gender sub-filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 mr-0.5">Genero:</span>
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "m", label: "Hombres" },
                  { key: "f", label: "Mujeres" },
                ] as { key: GeneroFiltro; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setGeneroFiltro(key);
                    setSeleccionados(new Set());
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                    generoFiltro === key
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400">
                {alumnosVisibles.length} alumno{alumnosVisibles.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* List body */}
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                Cargando alumnos...
              </div>
            ) : alumnosVisibles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Users size={28} className="text-gray-200" />
                <p className="text-sm text-gray-400">No hay alumnos en este grupo</p>
              </div>
            ) : (
              alumnosVisibles.map((a) => {
                const dias = diasDesde(a.fecha_ultima_asistencia);
                const sel = seleccionados.has(a.id);
                return (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${sel ? "bg-red-50/40" : "hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => toggleAlumno(a.id)}
                      className="w-4 h-4 rounded accent-red-600 cursor-pointer shrink-0"
                    />
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${sel ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}
                    >
                      {(a.nombre ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {a.nombre ?? "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {a.telefono ? (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone size={10} />
                            {a.telefono}
                          </span>
                        ) : (
                          <span className="text-xs text-red-300 flex items-center gap-1">
                            <Phone size={10} />
                            Sin telefono
                          </span>
                        )}
                        {dias !== null && (
                          <span
                            className={`text-xs ${dias > 90 ? "text-red-400" : dias > 30 ? "text-orange-400" : "text-gray-400"}`}
                          >
                            . {dias}d
                          </span>
                        )}
                      </div>
                    </div>
                    {!a.activo && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                        inactivo
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Phone warning */}
          {sinTelefono > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-t border-amber-100">
              <AlertTriangle size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">{sinTelefono}</span> de los seleccionados no tienen telefono cargado
              </p>
            </div>
          )}
        </div>

        {/* Right: composer */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Composer header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 shrink-0">
                <MessageCircle size={15} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Componer mensaje</p>
                <p className="text-xs text-gray-400 truncate">
                  {cantidadSeleccionados > 0
                    ? `${cantidadSeleccionados} destinatario${cantidadSeleccionados !== 1 ? "s" : ""}`
                    : "Selecciona alumnos de la lista"}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Variable chips */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5 font-medium">Insertar variable:</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setMensaje((prev) => prev + "{nombre}")}
                    className="text-xs bg-violet-50 text-violet-600 border border-violet-100 px-2 py-1 rounded-md font-mono hover:bg-violet-100 transition-colors"
                  >
                    {"{nombre}"}
                  </button>
                  <button
                    onClick={() => setMensaje((prev) => prev + "{dias_inactivo}")}
                    className="text-xs bg-violet-50 text-violet-600 border border-violet-100 px-2 py-1 rounded-md font-mono hover:bg-violet-100 transition-colors"
                  >
                    {"{dias_inactivo}"}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Ej: Hola {nombre}, te extranamos! Volvete al gimnasio"
                  rows={5}
                  className="w-full text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none leading-relaxed border border-gray-200 rounded-xl p-3 focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                />
                {mensaje.trim() && (
                  <button
                    onClick={() => { setMensaje(""); setShowPreview(false); }}
                    className="absolute top-2.5 right-2.5 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{mensaje.length} car.</span>
                {mensajePreview && (
                  <button
                    onClick={() => setShowPreview((v) => !v)}
                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${showPreview ? "text-red-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Eye size={12} />
                    Vista previa
                  </button>
                )}
              </div>

              {/* Preview bubble */}
              {showPreview && mensajePreview && alumnoPreview && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">
                    Preview - {alumnoPreview.nombre ?? "Alumno"}
                  </p>
                  <div className="bg-[#dcf8c6] rounded-xl rounded-tr-sm px-3 py-2 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap shadow-sm">
                    {mensajePreview}
                  </div>
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleEnviar}
                disabled={!puedeEnviar}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] shadow-sm bg-red-600"
              >
                {enviando ? (
                  <>
                    <Clock size={14} className="animate-spin" />
                    Guardando...
                  </>
                ) : enviado ? (
                  <>
                    <CheckCheck size={14} />
                    Guardado
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    {cantidadSeleccionados > 0 ? `Enviar a ${cantidadSeleccionados}` : "Enviar por WhatsApp"}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                WSP Business - pendiente de configuracion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Historial de envios
          </p>
          {historial.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {historial.length}
            </span>
          )}
        </div>

        {historialLoading ? (
          <div className="bg-white rounded-xl border border-gray-200/80 px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Cargando historial...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200/80 px-5 py-8 text-center">
            <MessageCircle size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No hay mensajes registrados aun</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden"
              >
                <button
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandido(expandido === m.id ? null : m.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate font-medium">{m.texto}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${FILTROS[m.filtro as FiltroKey]?.badge ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {m.filtro_label}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users size={11} />
                        <span className="text-xs">{m.cantidad}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatFecha(m.created_at)}</span>
                    </div>
                  </div>
                  <ChevronDown
                    size={15}
                    className="text-gray-400 shrink-0 mt-0.5 transition-transform"
                    style={{ transform: expandido === m.id ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {expandido === m.id && (
                  <div className="px-5 pb-4 border-t border-gray-50">
                    <div className="bg-[#dcf8c6] rounded-xl rounded-tr-sm px-3 py-2.5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mt-3 shadow-sm">
                      {m.texto}
                    </div>
                    <button
                      onClick={() => handleReenviar(m)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <RotateCcw size={12} />
                      Usar este mensaje de nuevo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
