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
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
} from "lucide-react";
import { useAdminSettingsStore } from "@/hooks/use-admin-settings";
import { usePowerSync } from "@powersync/react";
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
  const db = usePowerSync();

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

  // ── WhatsApp Connection State ──────────────────────────────────────────────────
  const [wspStatus, setWspStatus] = useState<"DISCONNECTED" | "INITIALIZING" | "QR_CODE" | "CONNECTED" | "ERROR">("DISCONNECTED");
  const [wspQr, setWspQr] = useState<string | null>(null);
  const [wspError, setWspError] = useState<string | null>(null);
  const [wspLoading, setWspLoading] = useState(false);

  const checkWspStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (res.ok) {
        const data = await res.json();
        setWspStatus(data.status);
        setWspQr(data.qr);
        setWspError(data.error);
      }
    } catch (err) {
      console.error("Error al obtener estado de WhatsApp:", err);
    }
  }, []);

  useEffect(() => {
    checkWspStatus();
    const interval = setInterval(() => {
      checkWspStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [checkWspStatus]);

  async function handleConnectWsp() {
    setWspLoading(true);
    try {
      await fetch("/api/whatsapp/connect", { method: "POST" });
      await checkWspStatus();
    } catch (err) {
      console.error("Error al conectar WhatsApp:", err);
    } finally {
      setWspLoading(false);
    }
  }

  async function handleDisconnectWsp() {
    if (!confirm("¿Estás seguro de que deseas cerrar la sesión de WhatsApp?")) return;
    setWspLoading(true);
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      await checkWspStatus();
    } catch (err) {
      console.error("Error al desconectar WhatsApp:", err);
    } finally {
      setWspLoading(false);
    }
  }

  const checkboxAllRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    mensaje.trim().length > 0 &&
    cantidadSeleccionados > 0 &&
    !enviando &&
    wspStatus === "CONNECTED";

  async function handleEnviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setShowPreview(false);

    try {
      const selectedAlumnos = alumnos.filter((a) => seleccionados.has(a.id));
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje: mensaje.trim(),
          alumnos: selectedAlumnos,
          filtro,
          filtroLabel: FILTROS[filtro].label,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al enviar los mensajes.");
        return;
      }

      setMensaje("");
      setSeleccionados(new Set());
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
      
      // Refrescar historial
      fetchHistorial();
    } catch (err) {
      console.error("Error al enviar mensajes por WhatsApp:", err);
      alert("Error al conectar con el servidor para iniciar el envío.");
    } finally {
      setEnviando(false);
    }
  }

  // ── Reenviar desde historial ─────────────────────────────────────────────────

  function handleReenviar(m: MensajeHistorial) {
    setMensaje(m.texto);
    const filtroKey = m.filtro as FiltroKey;
    if (filtroKey in FILTROS) handleFiltro(filtroKey);
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen">
      {/* Fondo con marca de agua */}
      <div 
        className="fixed bottom-0 right-0 flex items-center justify-center top-[160px] md:top-[100px] pointer-events-none z-0 overflow-hidden transition-[left] duration-75 ease-linear"
        style={{ left: "var(--sidebar-width, 0px)" }}
      >
        <img
          src="/logo-sin-fondo-completo.webp"
          alt="Sistema Alfa Background"
          className="w-[80vw] md:w-[450px] opacity-[0.06] object-contain"
        />
      </div>

      <div className="relative z-10 flex flex-col h-screen bg-transparent">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 md:px-6 lg:px-8">
            {/* Título */}
            <div className="pt-6 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/20">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                      Comunicación
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Filtra alumnos por situación y prepara mensajes de WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 lg:p-8"
        >
          <div className="max-w-4xl mx-auto space-y-6">

            {/* WhatsApp Connection Manager */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3 bg-transparent">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                    <MessageCircle size={20} className="text-emerald-600 fill-emerald-100" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Servicio de WhatsApp Web
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-md">
                      Vincula tu cuenta para poder enviar mensajes masivos y personalizados a tus alumnos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  {wspStatus === "CONNECTED" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado
                    </span>
                  )}
                  {wspStatus === "QR_CODE" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Esperando Escaneo QR
                    </span>
                  )}
                  {wspStatus === "INITIALIZING" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Loader2 size={12} className="animate-spin text-blue-500" />
                      Iniciando Navegador...
                    </span>
                  )}
                  {wspStatus === "DISCONNECTED" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Desconectado
                    </span>
                  )}
                  {wspStatus === "ERROR" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                      <AlertCircle size={12} className="text-red-500" />
                      Error de Conexión
                    </span>
                  )}

                  {/* Actions */}
                  {wspStatus === "DISCONNECTED" && (
                    <button
                      onClick={handleConnectWsp}
                      disabled={wspLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {wspLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Power size={12} />
                      )}
                      Conectar
                    </button>
                  )}

                  {(wspStatus === "CONNECTED" || wspStatus === "QR_CODE" || wspStatus === "ERROR") && (
                    <button
                      onClick={handleDisconnectWsp}
                      disabled={wspLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl transition-all border border-red-200 disabled:opacity-50"
                    >
                      {wspLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Power size={12} />
                      )}
                      Desconectar
                    </button>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              {wspStatus === "QR_CODE" && wspQr && (
                <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col md:flex-row items-center gap-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 shrink-0">
                    <img src={wspQr} alt="WhatsApp QR Code" className="w-48 h-48 object-contain" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900">
                      Escanea el código QR para vincular tu WhatsApp
                    </h3>
                    <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Abre WhatsApp en tu teléfono celular.</li>
                      <li>
                        Toca el botón de <strong>Menú</strong> (tres puntos en Android) o{" "}
                        <strong>Configuración</strong> (en iPhone).
                      </li>
                      <li>
                        Selecciona <strong>Dispositivos vinculados</strong> y luego{" "}
                        <strong>Vincular un dispositivo</strong>.
                      </li>
                      <li>Apunta la cámara de tu teléfono hacia el código QR de la izquierda.</li>
                    </ol>
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg font-medium">
                      Nota: Este navegador se ejecuta localmente en el servidor. La sesión se guardará de forma segura y automática para futuros accesos.
                    </p>
                  </div>
                </div>
              )}

              {wspStatus === "ERROR" && wspError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <span className="font-bold">Error en el servicio:</span> {wspError}
                    <button
                      onClick={handleConnectWsp}
                      className="block mt-2 underline font-semibold hover:text-red-900"
                    >
                      Intentar reconectar
                    </button>
                  </div>
                </div>
              )}
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

              <p className={`text-xs text-center font-medium ${
                wspStatus === "CONNECTED"
                  ? "text-emerald-600 animate-fade-in"
                  : wspStatus === "DISCONNECTED"
                  ? "text-gray-400"
                  : wspStatus === "ERROR"
                  ? "text-red-500"
                  : "text-amber-500 animate-pulse"
              }`}>
                {wspStatus === "CONNECTED" && "✓ WhatsApp conectado y listo"}
                {wspStatus === "DISCONNECTED" && "WhatsApp desconectado"}
                {wspStatus === "INITIALIZING" && "Iniciando servicio de WhatsApp..."}
                {wspStatus === "QR_CODE" && "Esperando vinculación QR..."}
                {wspStatus === "ERROR" && "Error en conexión de WhatsApp"}
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
        </div>
      </div>
    </div>
  );
}
