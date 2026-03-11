"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Search, CheckCircle2, XCircle, Clock, Delete } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data — replace with real API call
const MOCK_DATABASE: Record<string, { nombre: string; estado: "al-dia" | "vencido" | "pendiente"; vencimiento: string }> = {
  "12345678": { nombre: "Lucas Sola", estado: "al-dia", vencimiento: "31/03/2025" },
  "87654321": { nombre: "Mariana Gauto", estado: "vencido", vencimiento: "28/02/2025" },
  "11223344": { nombre: "Julian Becerra", estado: "pendiente", vencimiento: "15/03/2025" },
  "44332211": { nombre: "Paulina Smolinsky", estado: "al-dia", vencimiento: "30/04/2025" },
}

type Estado = "al-dia" | "vencido" | "pendiente"
type Result = { nombre: string; estado: Estado; vencimiento: string } | "not-found" | null

const estadoConfig = {
  "al-dia": {
    label: "Al día",
    description: "Su cuota se encuentra abonada. Puede ingresar.",
    icon: CheckCircle2,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    labelColor: "text-green-700",
    badgeBg: "bg-green-100",
  },
  vencido: {
    label: "Cuota vencida",
    description: "La cuota del mes actual no ha sido abonada. Por favor, regularice su situación en secretaría.",
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    labelColor: "text-red-700",
    badgeBg: "bg-red-100",
  },
  pendiente: {
    label: "Pago pendiente",
    description: "Su pago está siendo procesado. Consulte en secretaría si el inconveniente persiste.",
    icon: Clock,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-yellow-500",
    labelColor: "text-yellow-700",
    badgeBg: "bg-yellow-100",
  },
}

async function verificarDNI(dni: string): Promise<Result> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 700))
  const found = MOCK_DATABASE[dni]
  if (!found) return "not-found"
  return found
}

export default function IngresoWebPage() {
  const [dni, setDni] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKey(digit: string) {
    if (dni.length < 9) {
      setDni((d) => d + digit)
      setResult(null)
    }
  }

  function handleBackspace() {
    setDni((d) => d.slice(0, -1))
    setResult(null)
  }

  function handleClear() {
    setDni("")
    setResult(null)
    inputRef.current?.focus()
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (dni.trim().length < 7) return
    setLoading(true)
    setResult(null)
    const res = await verificarDNI(dni.trim())
    setResult(res)
    setLoading(false)
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#111111] border-b border-white/10 px-6 py-4 flex items-center gap-3 shrink-0">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20sin%20fondo%20-%20Alfa%20Club-hOsH0uOCuWZI7ZmhijLi7O81WvZXr7.png"
          alt="Alfa Club"
          width={44}
          height={44}
          style={{ height: "auto" }}
          className="drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]"
        />
        <div>
          <h1 className="text-white font-extrabold text-lg tracking-widest uppercase leading-none" style={{ color: "#DC2626" }}>
            ALFA CLUB
          </h1>
          <p className="text-white/40 text-xs tracking-wide">Control de Ingreso</p>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm flex flex-col gap-6">

          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Verificar ingreso</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Ingresá tu DNI para verificar el estado de tu cuota
              </p>
            </div>

            {/* Input DNI */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dni-input" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Número de DNI
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="dni-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej: 12345678"
                    value={dni}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 9)
                      setDni(v)
                      setResult(null)
                    }}
                    autoComplete="off"
                    maxLength={9}
                    aria-label="Número de DNI"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-semibold tracking-widest text-gray-900 outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-100 transition-all text-center bg-gray-50"
                  />
                </div>
              </div>

              {/* Teclado numérico */}
              <div className="grid grid-cols-3 gap-2">
                {keys.slice(0, 9).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKey(k)}
                    className="h-12 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all text-lg font-semibold text-gray-800 select-none"
                    aria-label={`Tecla ${k}`}
                  >
                    {k}
                  </button>
                ))}
                {/* Row: delete | 0 | confirm */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center text-gray-500"
                  aria-label="Borrar último dígito"
                >
                  <Delete size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleKey("0")}
                  className="h-12 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all text-lg font-semibold text-gray-800 select-none"
                  aria-label="Tecla 0"
                >
                  0
                </button>
                <button
                  type="submit"
                  disabled={loading || dni.length < 7}
                  className={cn(
                    "h-12 rounded-xl text-white font-bold text-sm active:scale-95 transition-all flex items-center justify-center",
                    loading || dni.length < 7
                      ? "bg-gray-300 cursor-not-allowed"
                      : "hover:brightness-110"
                  )}
                  style={loading || dni.length < 7 ? {} : { backgroundColor: "#DC2626" }}
                  aria-label="Verificar DNI"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </div>

              {/* Botón submit principal (accesibilidad / teclado) */}
              <button
                type="submit"
                disabled={loading || dni.length < 7}
                className={cn(
                  "w-full py-3 rounded-xl text-white font-bold text-sm transition-all",
                  loading || dni.length < 7
                    ? "bg-gray-300 cursor-not-allowed"
                    : "hover:brightness-110 active:scale-[0.99]"
                )}
                style={loading || dni.length < 7 ? {} : { backgroundColor: "#DC2626" }}
              >
                {loading ? "Verificando..." : "Verificar DNI"}
              </button>
            </form>
          </div>

          {/* Resultado */}
          {result !== null && (
            <div
              role="alert"
              aria-live="polite"
              className={cn(
                "rounded-2xl border p-6 flex flex-col items-center gap-3 text-center transition-all",
                result === "not-found"
                  ? "bg-gray-50 border-gray-200"
                  : estadoConfig[result.estado].bg + " " + estadoConfig[result.estado].border
              )}
            >
              {result === "not-found" ? (
                <>
                  <XCircle size={40} className="text-gray-400" />
                  <div>
                    <p className="font-bold text-gray-700 text-base">DNI no encontrado</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      No encontramos un alumno registrado con ese DNI. Consultá en secretaría.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {(() => {
                    const cfg = estadoConfig[result.estado]
                    const Icon = cfg.icon
                    return (
                      <>
                        <Icon size={40} className={cfg.iconColor} />
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-gray-900 text-base">{result.nombre}</p>
                          <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full self-center", cfg.badgeBg, cfg.labelColor)}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{cfg.description}</p>
                        <p className="text-xs text-gray-400">
                          Vencimiento: <span className="font-medium text-gray-500">{result.vencimiento}</span>
                        </p>
                      </>
                    )
                  })()}
                </>
              )}

              <button
                onClick={handleClear}
                className="mt-1 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
              >
                Nueva consulta
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
