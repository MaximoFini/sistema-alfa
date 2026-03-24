"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Estado = "al-dia" | "vencido" | "advertencia" | "periodo_gracia" | "prueba";
type Result =
  | {
      nombre: string;
      estado: Estado;
      vencimiento: string;
      actividad?: string;
      clasesGracia?: { usadas: number; disponibles: number };
    }
  | "not-found"
  | null;

const estadoConfig: Record<
  Estado,
  {
    label: string;
    description: string;
    secondaryMessage?: string;
    icon: typeof CheckCircle2;
    bg: string;
    border: string;
    iconColor: string;
    labelColor: string;
    badgeBg: string;
    ring: string;
  }
> = {
  "al-dia": {
    label: "¡Se ha registrado tu asistencia con éxito!",
    description: "",
    icon: CheckCircle2,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    labelColor: "text-green-700",
    badgeBg: "bg-green-100",
    ring: "#22c55e",
  },
  vencido: {
    label: "No tienes actividades en condiciones para ingresar",
    description:
      "No tienes actividades vigentes, estás fuera de tu horario o día permitido, o no tienes reserva a clase",
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    labelColor: "text-red-700",
    badgeBg: "bg-red-100",
    ring: "#DC2626",
  },
  advertencia: {
    label: "Tu plan está próximo a vencer",
    description:
      "Tu plan vence en los próximos días. Te recomendamos renovarlo para seguir disfrutando de nuestros servicios sin interrupciones.",
    icon: Clock,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-yellow-500",
    labelColor: "text-yellow-700",
    badgeBg: "bg-yellow-100",
    ring: "#eab308",
  },
  periodo_gracia: {
    label: "Ingreso permitido: Clase de cortesía",
    description: "Ests usando una clase de gracia. Recordá renovar tu plan para seguir entrenando sin interrupciones.",
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    labelColor: "text-blue-700",
    badgeBg: "bg-blue-100",
    ring: "#2563EB",
  },
  prueba: {
    label: "¡Bienvenido/a a tu clase de prueba!",
    description: "Disfrutá tu clase gratuita. Si te gusta, acercate a secretaría para inscribirte.",
    icon: CheckCircle2,
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconColor: "text-orange-500",
    labelColor: "text-orange-700",
    badgeBg: "bg-orange-100",
    ring: "#ea580c",
  },
};

async function verificarDNI(dni: string): Promise<Result> {
  try {
    const response = await fetch("/api/verificar-dni", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dni }),
    });

    if (!response.ok) {
      console.error("Error en la verificación:", response.statusText);
      return "not-found";
    }

    const data = await response.json();

    if (!data.found) {
      return "not-found";
    }

    return data.alumno;
  } catch (error) {
    console.error("Error al verificar DNI:", error);
    return "not-found";
  }
}

const RESET_DELAY_MS = 15000;

function IngresoWebPageContent() {
  const searchParams = useSearchParams();
  const isClientView = searchParams.get("view") === "client";
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-abrir vista de cliente en nueva pestaña al cargar la página
  useEffect(() => {
    if (typeof window !== "undefined" && !isClientView && !window.opener) {
      const clientURL = window.location.origin + "/ingreso-web?view=client";
      window.open(clientURL, "_blank", "width=1024,height=768");
    }
  }, [isClientView]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = dni.trim();
    if (trimmed.length < 7) return;
    setLoading(true);
    setResult(null);
    // Clear input immediately after submission
    setDni("");
    const res = await verificarDNI(trimmed);
    setResult(res);
    setLoading(false);
    // Start 15-second auto-reset timer
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }, RESET_DELAY_MS);
  }

  function handleClear() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setDni("");
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // Paleta de colores por estado para la vista cliente
  const clientEstadoTheme = {
    "al-dia": {
      bg: "#16a34a",
      bgDark: "#14532d",
      accent: "#4ade80",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255,255,255,0.75)",
      icon: CheckCircle2,
      label: "INGRESO AUTORIZADO",
      sublabel: "¡Bienvenido/a al club!",
    },
    vencido: {
      bg: "#DC2626",
      bgDark: "#7f1d1d",
      accent: "#fca5a5",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255,255,255,0.75)",
      icon: XCircle,
      label: "ACCESO DENEGADO",
      sublabel: "No tienes actividades vigentes. Consultá en secretaría.",
    },
    advertencia: {
      bg: "#d97706",
      bgDark: "#78350f",
      accent: "#fcd34d",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255,255,255,0.80)",
      icon: Clock,
      label: "CUOTA POR VENCER",
      sublabel: "Tu plan vence pronto. Renovalo para seguir entrenando.",
    },
    periodo_gracia: {
      bg: "#2563EB",
      bgDark: "#1e3a8a",
      accent: "#93c5fd",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255,255,255,0.80)",
      icon: Info,
      label: "PERÍODO DE GRACIA",
      sublabel: "Renovate para seguir entrenando.",
    },
    prueba: {
      bg: "#ea580c",
      bgDark: "#7c2d12",
      accent: "#fdba74",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255,255,255,0.85)",
      icon: CheckCircle2,
      label: "CLASE DE PRUEBA",
      sublabel: "¡Bienvenido/a! Disfrutá tu clase gratuita.",
    },
  } as const;

  // Vista simplificada para clientes
  if (isClientView) {
    const theme =
      result !== null && result !== "not-found"
        ? clientEstadoTheme[result.estado]
        : null;

    return (
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor:
            result !== null && !loading
              ? theme
                ? theme.bg
                : "#111111"
              : "#fb923c",
        }}
      >
        <main
          className="min-h-screen flex flex-col"
          style={{
            backgroundColor:
              result !== null && !loading
                ? theme
                  ? theme.bg
                  : "#111111"
                : "#fb923c",
          }}
        >
          {/* Header negro con logo y campo de búsqueda */}
          <header className="bg-[#111111] border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0 gap-4">
            {/* Logo izquierda */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <Image
                  src="/Mejor logo.png"
                  alt="Alfa Club"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="h-8 w-px bg-white/20 shrink-0" />
              <div className="leading-none">
                <p
                  className="font-extrabold text-base tracking-widest uppercase"
                  style={{ color: "#fb923c" }}
                >
                  ALFA CLUB
                </p>
                <p className="text-white/40 text-xs tracking-wide">
                  Control de Ingreso
                </p>
              </div>
            </div>

            {/* Campo de búsqueda derecha */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 flex-1 justify-end max-w-sm"
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ingresá tu DNI..."
                value={dni}
                maxLength={9}
                autoComplete="off"
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setDni(v);
                  setResult(null);
                }}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-900/40 transition-all tracking-wider"
              />
              <button
                type="submit"
                disabled={loading || dni.length < 7}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold text-white transition-all whitespace-nowrap",
                  loading || dni.length < 7
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "hover:brightness-110 active:scale-[0.98]",
                )}
                style={
                  loading || dni.length < 7
                    ? {}
                    : { backgroundColor: "#DC2626" }
                }
              >
                {loading ? "..." : "Verificar"}
              </button>
            </form>
          </header>

          {/* Cuerpo */}
          <div className="flex-1 flex flex-col">
            {/* Estado vacío */}
            {result === null && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center select-none px-4 py-12">
                <div className="w-[211px] h-[211px] relative flex items-center justify-center">
                  <Image
                    src="/Mejor logo.png"
                    alt="Alfa Club"
                    width={211}
                    height={211}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-extrabold text-[#111111] tracking-tight">
                    Verificá tu estado
                  </h2>
                  <p className="text-[#111111]/60 text-base max-w-xs mx-auto leading-relaxed">
                    Ingresá tu DNI en el campo de arriba para verificar tu cuota
                  </p>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <span className="w-16 h-16 border-4 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin" />
                <p className="text-[#111111]/70 text-lg font-sans font-semibold">
                  Verificando...
                </p>
              </div>
            )}

            {/* Resultado */}
            {result !== null && !loading && (
              <>
                {result === "not-found" ? (
                  /* DNI no encontrado */
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                      <XCircle size={64} className="text-white/30" />
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-3xl mb-2 tracking-tight">
                        DNI no encontrado
                      </p>
                      <p className="text-white/50 text-base max-w-xs mx-auto leading-relaxed">
                        No hay un alumno registrado con ese DNI. Consultá en
                        secretaría.
                      </p>
                    </div>
                    <button
                      onClick={handleClear}
                      className="text-white/40 hover:text-white/70 text-sm underline underline-offset-4 transition-colors"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                ) : (
                  /* Estado del alumno: pantalla full-color impactante */
                  <div
                    className="flex-1 flex flex-col"
                    style={{ backgroundColor: theme!.bg }}
                  >
                    {/* Nombre del cliente — banda superior */}
                    <div
                      className="px-10 py-8 flex items-center gap-5 border-b"
                      style={{
                        backgroundColor: theme!.bgDark,
                        borderColor: "rgba(0,0,0,0.25)",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                      >
                        <svg
                          className="w-11 h-11"
                          fill="rgba(255,255,255,0.6)"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div>
                        <p
                          className="text-xs font-bold tracking-widest uppercase mb-1"
                          style={{ color: theme!.accent }}
                        >
                          Socio identificado
                        </p>
                        <h2
                          className="text-3xl font-extrabold uppercase tracking-wide leading-tight"
                          style={{ color: theme!.textPrimary }}
                        >
                          {result.nombre}
                        </h2>
                      </div>
                    </div>

                    {/* Bloque central de estado */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-10 text-center">
                      {/* Icono grande */}
                      {(() => {
                        const Icon = theme!.icon;
                        return (
                          <Icon
                            size={96}
                            style={{ color: theme!.accent }}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        );
                      })()}

                      {/* Etiqueta principal */}
                      <div className="flex flex-col items-center gap-3">
                        <h1
                          className="text-5xl font-black tracking-tight uppercase leading-none text-balance"
                          style={{ color: theme!.textPrimary }}
                        >
                          {theme!.label}
                        </h1>
                        <p
                          className="text-xl font-medium leading-relaxed max-w-lg text-pretty"
                          style={{ color: theme!.textSecondary }}
                        >
                          {theme!.sublabel}
                        </p>
                      </div>

                      {/* Datos del plan */}
                      {result.vencimiento && (
                        <div
                          className="mt-2 rounded-2xl px-8 py-5 flex flex-col items-center gap-1"
                          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                        >
                          {result.actividad && (
                            <p
                              className="text-lg font-bold uppercase tracking-wider"
                              style={{ color: theme!.accent }}
                            >
                              {result.actividad}
                            </p>
                          )}
                          <p
                            className="text-base font-medium"
                            style={{ color: theme!.textSecondary }}
                          >
                            Vence {result.vencimiento}
                          </p>
                        </div>
                      )}

                      {/* Clase de gracia: contador */}
                      {result.estado === "periodo_gracia" && result.clasesGracia && (
                        <div
                          className="mt-2 rounded-2xl px-8 py-4 flex flex-col items-center gap-1"
                          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                        >
                          <p
                            className="text-2xl font-black"
                            style={{ color: "#ffffff" }}
                          >
                            Clase {result.clasesGracia.usadas} de {result.clasesGracia.disponibles}
                          </p>
                          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                            Clase{result.clasesGracia.disponibles - result.clasesGracia.usadas === 0
                              ? "s de gracia agotadas"
                              : ` — te queda${result.clasesGracia.disponibles - result.clasesGracia.usadas === 1 ? " 1 clase" : ` ${result.clasesGracia.disponibles - result.clasesGracia.usadas} clases`} más`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer con botón nueva consulta */}
                    <div
                      className="px-10 py-5 flex justify-center border-t"
                      style={{ borderColor: "rgba(0,0,0,0.2)" }}
                    >
                      <button
                        onClick={handleClear}
                        className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
                        style={{ color: theme!.textSecondary }}
                      >
                        Nueva consulta
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Vista de administrador (original)
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ��─ */}
      <header className="bg-[#111111] border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0 gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 p-1.5">
            <Image
              src="/Logo sin fondo - Alfa Club.png"
              alt="Alfa Club"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div className="h-8 w-px bg-white/20 shrink-0" />
          <div className="leading-none">
            <p
              className="font-extrabold text-base tracking-widest uppercase"
              style={{ color: "#DC2626" }}
            >
              ALFA CLUB
            </p>
            <p className="text-white/40 text-xs tracking-wide">
              Control de Ingreso
            </p>
          </div>
        </div>

        {/* DNI input inline en header */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 flex-1 justify-end max-w-sm"
          aria-label="Verificar DNI"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="dni-header-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ingresa tu DNI..."
              value={dni}
              maxLength={9}
              autoComplete="off"
              aria-label="Numero de DNI"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                setDni(v);
                setResult(null);
              }}
              className={cn(
                "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30",
                "outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-900/40 transition-all tracking-wider",
              )}
            />
          </div>
          <button
            type="submit"
            disabled={loading || dni.length < 7}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold text-white transition-all whitespace-nowrap",
              loading || dni.length < 7
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "hover:brightness-110 active:scale-[0.98]",
            )}
            style={
              loading || dni.length < 7 ? {} : { backgroundColor: "#DC2626" }
            }
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando
              </span>
            ) : (
              "Verificar"
            )}
          </button>
          {(dni || result) && (
            <button
              type="button"
              onClick={handleClear}
              className="text-white/40 hover:text-white/70 text-xs transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </form>
      </header>

      {/* ── Body — resultado centrado ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {result === null && !loading && (
          <div className="flex flex-col items-center gap-4 text-center select-none">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: "#f3f4f6" }}
            >
              <Image
                src="/Logo sin fondo - Alfa Club.png"
                alt="Alfa Club"
                width={80}
                height={80}
                priority
                className="object-contain p-2"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Ingresa tu DNI en el campo de arriba y presiona{" "}
              <kbd className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-mono">
                Enter
              </kbd>{" "}
              para verificar tu estado
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4">
            <span className="w-12 h-12 border-4 border-gray-200 border-t-[#DC2626] rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Verificando DNI {dni}...</p>
          </div>
        )}

        {result !== null && !loading && (
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              "rounded-2xl border-2 p-10 flex flex-col items-center gap-5 text-center w-full max-w-md shadow-sm transition-all",
              result === "not-found"
                ? "bg-white border-gray-200"
                : estadoConfig[result.estado].bg + " border-2",
            )}
            style={
              result !== "not-found"
                ? { borderColor: estadoConfig[result.estado].ring }
                : {}
            }
          >
            {result === "not-found" ? (
              <>
                <XCircle size={56} className="text-gray-300" />
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-gray-800 text-xl">
                    DNI no encontrado
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                    No hay un alumno registrado con ese DNI. Consulta en
                    secretaria.
                  </p>
                </div>
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                >
                  Intentar de nuevo
                </button>
              </>
            ) : (
              (() => {
                const cfg = estadoConfig[result.estado];
                const Icon = cfg.icon;
                return (
                  <>
                    <Icon
                      size={64}
                      className={cfg.iconColor}
                      strokeWidth={1.5}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-extrabold text-gray-900 text-2xl tracking-tight">
                        {result.nombre}
                      </p>
                      <span
                        className={cn(
                          "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                          cfg.badgeBg,
                          cfg.labelColor,
                        )}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                      {cfg.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      Vencimiento:{" "}
                      <span className="font-semibold text-gray-600">
                        {result.vencimiento}
                      </span>
                    </p>
                    <button
                      onClick={handleClear}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                    >
                      Nueva consulta
                    </button>
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function IngresoWebPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fb923c]" />}>
      <IngresoWebPageContent />
    </Suspense>
  );
}
