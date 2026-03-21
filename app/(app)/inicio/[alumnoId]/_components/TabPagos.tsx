"use client";

import { useState } from "react";
import { Calendar, Banknote, CheckCircle2, XCircle, Plus, Clock } from "lucide-react";
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
  const [pagos, setPagos] = useState<Pago[]>(pagosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);

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
              <div>
                <span className={config.dateColor}>
                  {formatFecha(pago.fecha_vencimiento)}
                </span>

                {/* Badge estado */}
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${config.badgeBg}`}
                >
                  {config.icon}
                  {config.label}
                </span>

                {/* Footer con fechas y medio de pago */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
                  {/* Medio de pago */}
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${getMedioPagoClass(pago.medio_pago)}`}
                  >
                    {pago.medio_pago}
                  </span>

                  {/* Fechas */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                    <Calendar size={11} />
                    <span>{formatFecha(pago.fecha_inicio)}</span>
                    <span className="text-border">→</span>
                    <span
                      className={
                        estado === "vencido"
                          ? "text-red-500 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {formatFecha(pago.fecha_vencimiento)}
                    </span>
                  </div>

                  {/* Badge vencido/vigente */}
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      estado === "vencido"
                        ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                        : "bg-green-50 text-green-700 ring-1 ring-green-200"
                    }`}
                  >
                    {estado === "vencido" ? (
                      <XCircle size={10} strokeWidth={2.5} />
                    ) : (
                      <CheckCircle2 size={10} strokeWidth={2.5} />
                    )}
                    {estado === "vencido" ? "Vencido" : "Vigente"}
                  </span>
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
    </>
  );
}
