"use client";

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
  }
> = {
  "12345678": {
    nombre: "Lucas Sola",
    estado: "al-dia",
    vencimiento: "31/03/2026",
  },
  "87654321": {
    nombre: "Mariana Gauto",
    estado: "vencido",
    vencimiento: "28/02/2026",
  },
  "11223344": {
    nombre: "Julian Becerra",
    estado: "advertencia",
    vencimiento: "15/03/2026",
  },
  "44332211": {
    nombre: "Paulina Smolinsky",
    estado: "al-dia",
    vencimiento: "30/04/2026",
  },
  "55667788": {
    nombre: "Claudia Sola",
    estado: "advertencia",
    vencimiento: "12/03/2026",
  },
};

type Estado = "al-dia" | "vencido" | "advertencia";
type Result =
  | { nombre: string; estado: Estado; vencimiento: string }
  | "not-found"
  | null;

const estadoConfig: Record<
  Estado,
  {
    label: string;
    description: string;
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
    label: "Al dia",
    description: "Su cuota se encuentra abonada. Puede ingresar.",
    icon: CheckCircle2,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    labelColor: "text-green-700",
    badgeBg: "bg-green-100",
    ring: "#22c55e",
  },
  vencido: {
    label: "Cuota vencida",
    description:
      "La cuota del mes actual no ha sido abonada. Por favor, regularice su situacion en secretaria.",
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    labelColor: "text-red-700",
    badgeBg: "bg-red-100",
    ring: "#DC2626",
  },
  advertencia: {
    label: "Proximo a vencer",
    description:
      "Su cuota vence en los proximos dias. Acerquese a secretaria para renovar.",
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

export default function IngresoWebPage() {
  const searchParams = useSearchParams();
  const isClientView = searchParams.get("view") === "client";
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-abrir vista de cliente en nueva pestaña al cargar la página
  useEffect(() => {
    // Solo abrimos si estamos en el cliente y no en una pestaña ya abierta para clientes
    if (typeof window !== "undefined" && !isClientView && !window.opener) {
      const clientURL = window.location.origin + "/ingreso-web?view=client";
      window.open(clientURL, "_blank", "width=1024,height=768");
    }
  }, [isClientView]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = dni.trim();
    if (trimmed.length < 7) return;
    setLoading(true);
    setResult(null);
    const res = await verificarDNI(trimmed);
    setResult(res);
    setLoading(false);
  }

  function handleClear() {
    setDni("");
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // Vista simplificada para clientes
  if (isClientView) {
    return (
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "#F97316" }}
      >
        <main
          className="min-h-screen flex flex-col"
          style={{ backgroundColor: "#F97316" }}
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
                  style={{ color: "#F97316" }}
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

          {/* Cuerpo con logo y resultados */}
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            {result === null && !loading && (
              <div className="flex flex-col items-center gap-6 text-center select-none max-w-md">
                {/* Logo sin fondo grande en el centro */}
                <div className="w-32 h-32 relative mb-6">
                  <Image
                    src="/Logo sin fondo - Alfa Club.png"
                    alt="Alfa Club"
                    width={128}
                    height={128}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Verificá tu estado
                  </h2>
                  <p className="text-gray-500">
                    Ingresá tu DNI en el campo de arriba para verificar tu cuota
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-4">
                <span className="w-16 h-16 border-4 border-gray-200 border-t-[#DC2626] rounded-full animate-spin" />
                <p className="text-gray-500 text-lg">
                  Verificando DNI {dni}...
                </p>
              </div>
            )}

            {result !== null && !loading && (
              <div className="w-full max-w-md">
                {result === "not-found" ? (
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-4 text-center shadow-lg">
                    <XCircle size={64} className="text-gray-300" />
                    <div>
                      <p className="font-bold text-gray-800 text-xl mb-2">
                        DNI no encontrado
                      </p>
                      <p className="text-sm text-gray-500">
                        No hay un alumno registrado con ese DNI. Consultá en
                        secretaria.
                      </p>
                    </div>
                    <button
                      onClick={handleClear}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-2xl border-4 p-8 flex flex-col items-center gap-5 text-center shadow-lg",
                      estadoConfig[result.estado].bg,
                    )}
                    style={{
                      borderColor: estadoConfig[result.estado].ring,
                    }}
                  >
                    {(() => {
                      const Icon = estadoConfig[result.estado].icon;
                      return (
                        <Icon
                          size={72}
                          className={estadoConfig[result.estado].iconColor}
                        />
                      );
                    })()}
                    <div>
                      <p
                        className={cn(
                          "font-bold text-2xl mb-2",
                          estadoConfig[result.estado].labelColor,
                        )}
                      >
                        {estadoConfig[result.estado].label}
                      </p>
                      <p className="text-gray-700 mb-1 text-lg font-semibold">
                        {result.nombre}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {estadoConfig[result.estado].description}
                      </p>
                      <p className="text-xs text-gray-500 mt-3">
                        Vencimiento: {result.vencimiento}
                      </p>
                    </div>
                    <button
                      onClick={handleClear}
                      className="text-sm text-gray-500 hover:text-gray-700 underline mt-2"
                    >
                      Verificar otro DNI
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Vista de administrador (original)
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
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
