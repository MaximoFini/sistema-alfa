"use client";

import { Suspense } from "react";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data — replace with real API call
const MOCK_DATABASE: Record<
  string,
  {
    nombre: string;
    estado: "al-dia" | "vencido" | "advertencia";
    vencimiento: string;
    plan?: string;
    clasesDisponibles?: number;
  }
> = {
  "12345678": {
    nombre: "CONFORTI, LAUTARO ARIEL",
    estado: "al-dia",
    vencimiento: "08/04/2026",
    plan: "ALL INCLUSIVE D.P",
    clasesDisponibles: 57,
  },
  "87654321": {
    nombre: "FINI, MAXIMO",
    estado: "vencido",
    vencimiento: "28/02/2026",
  },
  "11223344": {
    nombre: "BECERRA, JULIAN IGNACIO",
    estado: "advertencia",
    vencimiento: "18/03/2026",
    plan: "MUSCULACION 3X SEMANA",
    clasesDisponibles: 6,
  },
};

type Estado = "al-dia" | "vencido" | "advertencia";
type Result =
  | {
      nombre: string;
      estado: Estado;
      vencimiento: string;
      plan?: string;
      clasesDisponibles?: number;
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
};

async function verificarDNI(dni: string): Promise<Result> {
  await new Promise((r) => setTimeout(r, 600));
  const found = MOCK_DATABASE[dni];
  if (!found) return "not-found";
  return found;
}

const RESET_DELAY_MS = 15000;

function IngresoWebContent() {
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
  } as const;

  // Vista simplificada para clientes
  if (isClientView) {
    const theme =
      result !== null && result !== "not-found"
        ? clientEstadoTheme[result.estado]
        : null;

    return (
      <div className="fixed inset-0 z-50" style={{ backgroundColor: result !== null && !loading ? (theme ? theme.bg : "#111111") : "#fb923c" }}>
        <main className="min-h-screen flex flex-col" style={{ backgroundColor: result !== null && !loading ? (theme ? theme.bg : "#111111") : "#fb923c" }}>
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
                <div className="w-48 h-48 relative flex items-center justify-center">
                  <Image
                    src="/Mejor logo.png"
                    alt="Alfa Club"
                    width={192}
                    height={192}
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
                      {(result.plan || result.vencimiento) && (
                        <div
                          className="mt-2 rounded-2xl px-8 py-5 flex flex-col items-center gap-1"
                          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                        >
                          {result.plan && (
                            <p
                              className="text-lg font-bold uppercase tracking-wider"
                              style={{ color: theme!.accent }}
                            >
                              {result.plan}
                            </p>
                          )}
                          <p
                            className="text-base font-medium"
                            style={{ color: theme!.textSecondary }}
                          >
                            {result.clasesDisponibles !== undefined &&
                              `${result.clasesDisponibles} clases disponibles  ·  `}
                            Vence {result.vencimiento}
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

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => (window.location.href = "/inicio")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-foreground">
            Control de Ingreso Web
          </h1>
          <p className="text-muted-foreground mt-2">
            Verifica el estado de los socios de Alfa Club
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ingresá DNI para buscar..."
            value={dni}
            maxLength={9}
            autoComplete="off"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 9);
              setDni(v);
              setResult(null);
            }}
            className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
          />
          <button
            type="submit"
            disabled={loading || dni.length < 7}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all",
              loading || dni.length < 7
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#DC2626] text-white hover:bg-[#b91c1c] active:scale-[0.98]"
            )}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {/* Results */}
        <div>
          {result === null && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ingresá un DNI para buscar</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <span className="inline-block w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
            </div>
          )}

          {result !== null && !loading && (
            <>
              {result === "not-found" ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
                  <p className="font-semibold text-destructive">
                    DNI no encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    No hay un socio registrado con ese DNI
                  </p>
                  <button
                    onClick={handleClear}
                    className="text-sm mt-4 text-destructive hover:underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {result.nombre}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      DNI: {dni}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          result.estado === "al-dia"
                            ? "#16a34a"
                            : result.estado === "vencido"
                              ? "#DC2626"
                              : "#d97706",
                      }}
                    />
                    <span className="font-medium text-foreground">
                      {result.estado === "al-dia"
                        ? "Al Día"
                        : result.estado === "vencido"
                          ? "Vencido"
                          : "Advertencia"}
                    </span>
                  </div>

                  {result.plan && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Plan
                      </p>
                      <p className="font-semibold text-foreground">
                        {result.plan}
                      </p>
                      {result.clasesDisponibles !== undefined && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.clasesDisponibles} clases disponibles
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Vencimiento
                    </p>
                    <p className="font-semibold text-foreground">
                      {result.vencimiento}
                    </p>
                  </div>

                  <button
                    onClick={handleClear}
                    className="w-full mt-6 py-2 px-4 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium"
                  >
                    Nueva búsqueda
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IngresoWebPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><span className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>}>
      <IngresoWebContent />
    </Suspense>
  );
}
