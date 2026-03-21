"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Banknote, CheckCircle2, XCircle, Plus, Clock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RegistrarCobroModal from "./RegistrarCobroModal";

interface Pago {
  id: string;
  alumno_id: string;
  actividad: string;
  precio: number;
  fecha_cobro: string;
  medio_pago: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
}

interface Props {
  alumnoId: string;
  pagosIniciales: Pago[];
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const clean = dateStr.split("T")[0];
  const [y, m, d] = clean.split("-");
  return `${d}/${m}/${y}`;
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(precio);
}

const MEDIO_PAGO_COLORS: Record<string, string> = {
  efectivo: "bg-green-50 text-green-700 ring-1 ring-green-200",
  transferencia: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  tarjeta: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  débito: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  crédito: "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
};

function getMedioPagoClass(medio: string): string {
  const key = medio.toLowerCase();
  return (
    MEDIO_PAGO_COLORS[key] ??
    "bg-muted text-muted-foreground ring-1 ring-border"
  );
}

export default function TabPagos({ alumnoId, pagosIniciales }: Props) {
  const router = useRouter();
  const [pagos, setPagos] = useState<Pago[]>(pagosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [pagoAEliminar, setPagoAEliminar] = useState<Pago | null>(null);
  const [isPressingDelete, setIsPressingDelete] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [eliminando, setEliminando] = useState(false);

  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const LONG_PRESS_DURATION = 3000;

  function handleDeleteMouseDown(pago: Pago) {
    setIsPressingDelete(true);
    let startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setDeleteProgress(progress);

      if (progress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    deleteTimerRef.current = setTimeout(() => {
      setIsPressingDelete(false);
      setDeleteProgress(0);
      handleEliminarPago(pago);
    }, LONG_PRESS_DURATION);

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }

  function handleDeleteMouseUp() {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPressingDelete(false);
    setDeleteProgress(0);
  }

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  async function handleEliminarPago(pago: Pago) {
    setEliminando(true);

    const { error } = await supabase.from("pagos").delete().eq("id", pago.id);

    if (error) {
      alert("Error al eliminar el pago: " + error.message);
      setEliminando(false);
      return;
    }

    // Buscar el último pago restante para actualizar el estado del alumno
    const { data: pagosRestantes } = await supabase
      .from("pagos")
      .select("*")
      .eq("alumno_id", alumnoId)
      .order("fecha_vencimiento", { ascending: false })
      .limit(1);

    const updateData = pagosRestantes && pagosRestantes.length > 0
      ? {
          abono_ultima_inscripcion: pagosRestantes[0].actividad,
          fecha_proximo_vencimiento: pagosRestantes[0].fecha_vencimiento,
          actividad_proximo_vencimiento: pagosRestantes[0].actividad,
          fecha_ultimo_inicio: pagosRestantes[0].fecha_inicio,
        }
      : {
          abono_ultima_inscripcion: null,
          fecha_proximo_vencimiento: null,
          actividad_proximo_vencimiento: null,
          fecha_ultimo_inicio: null,
        };

    await supabase.from("alumnos").update(updateData).eq("id", alumnoId);

    setEliminando(false);
    setPagoAEliminar(null);
    refrescarPagos();
    router.refresh();
  }

  // Refrescar pagos desde la base de datos
  async function refrescarPagos() {
    const { data } = await supabase
      .from("pagos")
      .select("*")
      .eq("alumno_id", alumnoId)
      .order("fecha_cobro", { ascending: false });

    if (data) {
      setPagos(data);
    }
  }

  function handleCobroGuardado() {
    refrescarPagos();
  }

  if (pagos.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center max-w-2xl">
          <Banknote size={40} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No hay pagos registrados para este alumno.
          </p>
          <button
            onClick={() => setModalAbierto(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            Registrar Primer Cobro
          </button>
        </div>
        {modalAbierto && (
          <RegistrarCobroModal
            alumnoId={alumnoId}
            pagosExistentes={pagos}
            onClose={() => setModalAbierto(false)}
            onGuardado={handleCobroGuardado}
          />
        )}
      </>
    );
  }

  const totalPagado = pagos.reduce((acc, p) => acc + p.precio, 0);

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#dc2626] rounded-xl border border-[#dc2626] p-4 flex flex-col gap-1">
            <span className="text-3xl font-black text-white leading-none">
              {pagos.length}
            </span>
            <span className="text-xs font-medium text-white/80">
              Pagos registrados
            </span>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-1">
            <span className="text-2xl font-black text-foreground leading-none">
              {formatPrecio(totalPagado)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Total acumulado
            </span>
          </div>
        </div>

        {/* Botón Registrar Cobro */}
        <button
          onClick={() => setModalAbierto(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          Registrar Cobro
        </button>

        {/* Lista de pagos */}
        <div className="flex flex-col gap-3">
          {pagos.map((pago) => {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Reset time to compare only dates
            
            const inicio = new Date(pago.fecha_inicio);
            inicio.setHours(0, 0, 0, 0);
            
            const vencimiento = new Date(pago.fecha_vencimiento);
            vencimiento.setHours(0, 0, 0, 0);

            // Determinar estado del plan
            let estado: "proximo" | "vigente" | "vencido";
            if (hoy < inicio) {
              estado = "proximo";
            } else if (hoy > vencimiento) {
              estado = "vencido";
            } else {
              estado = "vigente";
            }

            // Configuración de estilos por estado
            const estadoConfig = {
              proximo: {
                barColor: "bg-blue-500",
                badgeBg: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
                dateColor: "text-blue-600 font-semibold",
                icon: <Clock size={10} strokeWidth={2.5} />,
                label: "Próximo",
              },
              vigente: {
                barColor: "bg-green-500",
                badgeBg: "bg-green-50 text-green-700 ring-1 ring-green-200",
                dateColor: "text-green-600 font-semibold",
                icon: <CheckCircle2 size={10} strokeWidth={2.5} />,
                label: "Vigente",
              },
              vencido: {
                barColor: "bg-red-500",
                badgeBg: "bg-red-50 text-red-600 ring-1 ring-red-200",
                dateColor: "text-red-500 font-semibold",
                icon: <XCircle size={10} strokeWidth={2.5} />,
                label: "Vencido",
              },
            };

            const config = estadoConfig[estado];

            return (
              <div
                key={pago.id}
                className="group relative bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm overflow-hidden"
              >
                {/* Botones de acción (Eliminar) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block">
                  <button
                    onClick={() => setPagoAEliminar(pago)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Dar de baja este plan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* En móvil, mostrar siempre el botón de eliminar, pero más sutil */}
                <div className="absolute top-3 right-3 opacity-100 z-10 md:hidden">
                  <button
                    onClick={() => setPagoAEliminar(pago)}
                    className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Línea decorativa del estado */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.barColor}`} />
                
                <div className="flex flex-col gap-3 pl-2 pr-6">
                  {/* Top section: Actividad & Precio */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <h4 className="text-base font-extrabold text-foreground tracking-tight capitalize">
                        {pago.actividad}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-sm font-bold ${config.dateColor}`}>
                          Vence: {formatFecha(pago.fecha_vencimiento)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${config.badgeBg}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-foreground leading-none">
                        {formatPrecio(pago.precio)}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Abonado
                      </span>
                    </div>
                  </div>

                  {/* Bottom section: Medio de pago y periodos */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getMedioPagoClass(
                        pago.medio_pago
                      )}`}
                    >
                      {pago.medio_pago}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Calendar size={12} className="opacity-70" />
                      <span>{formatFecha(pago.fecha_inicio)}</span>
                      <span className="text-border/50">→</span>
                      <span className={config.dateColor}>
                        {formatFecha(pago.fecha_vencimiento)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <RegistrarCobroModal
          alumnoId={alumnoId}
          pagosExistentes={pagos}
          onClose={() => setModalAbierto(false)}
          onGuardado={handleCobroGuardado}
        />
      )}

      {/* Modal Confirmar Eliminar Pago */}
      {pagoAEliminar && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => !eliminando && setPagoAEliminar(null)}
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-2xl shadow-2xl w-[90vw] md:w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ¿Dar de baja este plan?
                </h3>
                <p className="text-sm text-gray-500">
                  Estás por eliminar el pago de{" "}
                  <span className="font-semibold text-gray-900">
                    {pagoAEliminar.actividad}
                  </span>{" "}
                  por{" "}
                  <span className="font-semibold text-gray-900">
                    {formatPrecio(pagoAEliminar.precio)}
                  </span>
                  .
                </p>
                <p className="text-sm text-red-600 font-medium mt-2">
                  Esta acción revertirá las fechas y estado del alumno al plan anterior (si existe). No se puede deshacer.
                </p>
              </div>
              <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-medium whitespace-break-spaces">
                  💡 Mantén presionado el botón "Dar de baja" durante 3 segundos para confirmar
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => setPagoAEliminar(null)}
                  className="flex-1 py-2.5 text-gray-600 bg-gray-50 border border-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-100"
                  disabled={isPressingDelete || eliminando}
                >
                  Cancelar
                </button>
                <button
                  onMouseDown={() => handleDeleteMouseDown(pagoAEliminar)}
                  onMouseUp={handleDeleteMouseUp}
                  onMouseLeave={handleDeleteMouseUp}
                  onTouchStart={() => handleDeleteMouseDown(pagoAEliminar)}
                  onTouchEnd={handleDeleteMouseUp}
                  disabled={eliminando}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-70 relative overflow-hidden transition-all select-none"
                  title={
                    isPressingDelete
                      ? "Mantén presionado para eliminar..."
                      : "Mantén presionado 3 segundos para eliminar"
                  }
                >
                  <div
                    className="absolute inset-0 bg-red-700 transition-all"
                    style={{
                      width: isPressingDelete ? `${deleteProgress}%` : "0%",
                      zIndex: 0,
                    }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2 pointer-events-none">
                    {eliminando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Eliminando...
                      </>
                    ) : isPressingDelete ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {Math.round(deleteProgress)}%
                      </>
                    ) : (
                      <>Dar de baja</>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
