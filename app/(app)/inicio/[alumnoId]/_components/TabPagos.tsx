"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Banknote,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  Trash2,
} from "lucide-react";
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ModalWithHistory } from "@/components/ModalWithHistory";
import RegistrarCobroModal from "./RegistrarCobroModal";
import { useQuery, usePowerSync } from "@powersync/react";

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
  alumnoNombre: string;
  pagosIniciales: Pago[];
  onAlumnoActualizado?: (datosActualizados: any) => void;
  autoOpenModal?: boolean;
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
  efectivo: "bg-muted text-foreground ring-1 ring-border",
  transferencia: "bg-muted text-foreground ring-1 ring-border",
  tarjeta: "bg-muted text-foreground ring-1 ring-border",
  débito: "bg-muted text-foreground ring-1 ring-border",
  crédito: "bg-muted text-foreground ring-1 ring-border",
};

function getMedioPagoClass(medio: string): string {
  const key = medio.toLowerCase();
  return (
    MEDIO_PAGO_COLORS[key] ??
    "bg-muted text-muted-foreground ring-1 ring-border"
  );
}

export default function TabPagos({
  alumnoId,
  alumnoNombre,
  pagosIniciales,
  onAlumnoActualizado,
  autoOpenModal,
}: Props) {
  const router = useRouter();
  const db = usePowerSync();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [showConfirmBajaModal, setShowConfirmBajaModal] = useState(false);
  const [pagoParaBaja, setPagoParaBaja] = useState<Pago | null>(null);
  const [procesandoBaja, setProcesandoBaja] = useState(false);

  // Query reactive de pagos
  const { data: rawPagos } = useQuery<any>(
    "SELECT id, alumno_id, actividad, precio, fecha_cobro, medio_pago, fecha_inicio, fecha_vencimiento FROM pagos WHERE alumno_id = ? ORDER BY fecha_cobro DESC",
    [alumnoId]
  );
  const pagos = rawPagos ?? pagosIniciales;

  // Hook to automatically open the modal if autoOpenModal is true
  useEffect(() => {
    if (autoOpenModal) {
      setModalAbierto(true);
    }
  }, [autoOpenModal]);

  function handleConfirmarBaja(pago: Pago) {
    triggerHapticFeedback(HapticPresets.medium);
    setPagoParaBaja(pago);
    setShowConfirmBajaModal(true);
  }

  async function handleDarDeBaja() {
    if (!pagoParaBaja) return;

    triggerHapticFeedback(HapticPresets.heavy);
    setProcesandoBaja(true);

    try {
      // 1. Eliminar el pago en local
      await db.execute("DELETE FROM pagos WHERE id = ?", [pagoParaBaja.id]);

      // 2. Obtener los pagos restantes ordenados por fecha de vencimiento desc
      const pagosRestantes = await db.getAll<any>(
        "SELECT * FROM pagos WHERE alumno_id = ? ORDER BY fecha_vencimiento DESC",
        [alumnoId]
      );

      // 3. Recalcular campos del alumno
      let updateParams: any[] = [];
      let sqlUpdate = "";
      if (pagosRestantes && pagosRestantes.length > 0) {
        const latestPago = pagosRestantes[0];
        sqlUpdate = "UPDATE alumnos SET abono_ultima_inscripcion = ?, fecha_proximo_vencimiento = ?, actividad_proximo_vencimiento = ?, fecha_ultimo_inicio = ? WHERE id = ?";
        updateParams = [latestPago.actividad, latestPago.fecha_vencimiento, latestPago.actividad, latestPago.fecha_inicio, alumnoId];
      } else {
        sqlUpdate = "UPDATE alumnos SET abono_ultima_inscripcion = NULL, fecha_proximo_vencimiento = NULL, actividad_proximo_vencimiento = NULL, fecha_ultimo_inicio = NULL WHERE id = ?";
        updateParams = [alumnoId];
      }

      // 4. Actualizar alumno en local
      await db.execute(sqlUpdate, updateParams);

      triggerHapticFeedback(HapticPresets.success);
      setShowConfirmBajaModal(false);
      setPagoParaBaja(null);
    } catch (err: any) {
      console.error("Error al dar de baja el pago:", err);
      triggerHapticFeedback(HapticPresets.error);
      alert(err.message || "Error inesperado al dar de baja el pago");
    } finally {
      setProcesandoBaja(false);
    }
  }

  async function handleCobroGuardado() {
    // No-op because useQuery is fully reactive!
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
        <ModalWithHistory
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
        >
          <RegistrarCobroModal
            alumnoId={alumnoId}
            pagosExistentes={pagos}
            onClose={() => setModalAbierto(false)}
            onGuardado={handleCobroGuardado}
          />
        </ModalWithHistory>
      </>
    );
  }

  const totalPagado = pagos.reduce((acc, p) => acc + p.precio, 0);

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-500 rounded-xl border border-orange-500 p-4 flex flex-col gap-1">
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
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
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
                barColor: "bg-muted-foreground",
                badgeBg: "bg-muted text-muted-foreground ring-1 ring-border",
                dateColor: "text-muted-foreground font-semibold",
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
                className="bg-card rounded-xl border border-border overflow-hidden flex"
              >
                {/* Barra lateral de estado */}
                <div className={`w-1 shrink-0 ${config.barColor}`} />

                <div className="flex-1 p-4 flex flex-col gap-3">
                  {/* Header: actividad + precio + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-foreground">
                        {pago.actividad}
                      </span>
                      <span className="text-lg font-black text-foreground leading-tight">
                        {formatPrecio(pago.precio)}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${config.badgeBg}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                  </div>

                  {/* Footer: fechas + medio de pago */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${getMedioPagoClass(pago.medio_pago)}`}
                    >
                      {pago.medio_pago}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                      <Calendar size={11} />
                      <span>Inicio: {formatFecha(pago.fecha_inicio)}</span>
                      <span className="text-border">→</span>
                      <span className={config.dateColor}>
                        Vencimiento: {formatFecha(pago.fecha_vencimiento)}
                      </span>
                    </div>
                  </div>

                  {/* Botón de dar de baja para planes vigentes o próximos */}
                  {(estado === "vigente" || estado === "proximo") && (
                    <div className="pt-2 flex justify-end border-t border-border/40 mt-1">
                      <button
                        onClick={() => handleConfirmarBaja(pago)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/15 text-xs font-bold rounded-lg transition-colors border border-red-500/10"
                      >
                        <Trash2 size={12} />
                        Dar de baja
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal con soporte para botón "Atrás" */}
      <ModalWithHistory
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      >
        <RegistrarCobroModal
          alumnoId={alumnoId}
          pagosExistentes={pagos}
          onClose={() => setModalAbierto(false)}
          onGuardado={handleCobroGuardado}
        />
      </ModalWithHistory>

      {/* Modal de Confirmación de Baja */}
      {showConfirmBajaModal && pagoParaBaja && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={() => {
              if (!procesandoBaja) {
                setShowConfirmBajaModal(false);
                setPagoParaBaja(null);
              }
            }}
          />
          {/* Modal Card */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-card p-6 rounded-2xl shadow-2xl border border-border w-[90vw] max-w-md flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl shrink-0 mt-0.5">
                <Trash2 size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground">
                  Dar de Baja Plan
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Estás seguro de dar de baja el plan <span className="font-bold text-foreground">"{pagoParaBaja.actividad}"</span> del alumno <span className="font-bold text-foreground">"{alumnoNombre}"</span>?
                  Esta acción eliminará de forma permanente el registro del cobro y liberará las fechas en el sistema.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-border/40">
              <button
                type="button"
                disabled={procesandoBaja}
                onClick={() => {
                  setShowConfirmBajaModal(false);
                  setPagoParaBaja(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDarDeBaja}
                disabled={procesandoBaja}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {procesandoBaja ? "Procesando..." : "Confirmar Baja"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
