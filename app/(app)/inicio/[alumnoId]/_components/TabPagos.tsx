"use client";

import { CreditCard, Calendar, DollarSign } from "lucide-react";

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
  pagos: Pago[];
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const fechaSplit = dateStr.split("T")[0];
  const [y, m, d] = fechaSplit.split("-");
  return `${d}/${m}/${y}`;
}

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(precio);
}

export default function TabPagos({ pagos }: Props) {
  if (pagos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No hay pagos registrados para este alumno.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pagos.map((pago) => {
        const hoy = new Date();
        const vencimiento = new Date(pago.fecha_vencimiento);
        const estaVencido = vencimiento < hoy;

        return (
          <div
            key={pago.id}
            className="bg-white rounded-xl border border-gray-100 p-4 md:p-5"
          >
            {/* Header del pago */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  {pago.actividad}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cobrado: {formatFecha(pago.fecha_cobro)} · {pago.medio_pago}
                </p>
              </div>
              <span className="text-lg font-bold text-gray-900 shrink-0">
                {formatPrecio(pago.precio)}
              </span>
            </div>

            {/* Fechas */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar size={12} className="text-gray-400" />
                Inicio:{" "}
                <span className="font-medium text-gray-700">
                  {formatFecha(pago.fecha_inicio)}
                </span>
              </div>
              <div
                className={`flex items-center gap-1.5 text-xs ${
                  estaVencido ? "text-red-500" : "text-gray-500"
                }`}
              >
                <Calendar
                  size={12}
                  className={estaVencido ? "text-red-400" : "text-gray-400"}
                />
                Vence:{" "}
                <span className="font-medium">
                  {formatFecha(pago.fecha_vencimiento)}
                </span>
                {estaVencido && (
                  <span className="ml-1 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                    Vencido
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
