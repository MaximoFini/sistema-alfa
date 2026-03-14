"use client";

import { Calendar, Banknote, CheckCircle2, XCircle } from "lucide-react";

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
  return MEDIO_PAGO_COLORS[key] ?? "bg-muted text-muted-foreground ring-1 ring-border";
}

export default function TabPagos({ pagos }: Props) {
  if (pagos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center max-w-2xl">
        <Banknote size={40} className="text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No hay pagos registrados para este alumno.</p>
      </div>
    );
  }

  const totalPagado = pagos.reduce((acc, p) => acc + p.precio, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#dc2626] rounded-xl border border-[#dc2626] p-4 flex flex-col gap-1">
          <span className="text-3xl font-black text-white leading-none">
            {pagos.length}
          </span>
          <span className="text-xs font-medium text-white/80">Pagos registrados</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-1">
          <span className="text-2xl font-black text-foreground leading-none">
            {formatPrecio(totalPagado)}
          </span>
          <span className="text-xs font-medium text-muted-foreground">Total acumulado</span>
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="flex flex-col gap-3">
        {pagos.map((pago) => {
          const hoy = new Date();
          const vencimiento = new Date(pago.fecha_vencimiento);
          const estaVencido = vencimiento < hoy;

          return (
            <div
              key={pago.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* Banda de estado */}
              <div
                className={`h-1 w-full ${estaVencido ? "bg-red-500" : "bg-green-500"}`}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-foreground leading-tight">
                      {pago.actividad}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cobrado el {formatFecha(pago.fecha_cobro)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-foreground">
                      {formatPrecio(pago.precio)}
                    </span>
                  </div>
                </div>

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
                    <span className={estaVencido ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
                      {formatFecha(pago.fecha_vencimiento)}
                    </span>
                  </div>

                  {/* Badge vencido/vigente */}
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      estaVencido
                        ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                        : "bg-green-50 text-green-700 ring-1 ring-green-200"
                    }`}
                  >
                    {estaVencido ? (
                      <XCircle size={10} strokeWidth={2.5} />
                    ) : (
                      <CheckCircle2 size={10} strokeWidth={2.5} />
                    )}
                    {estaVencido ? "Vencido" : "Vigente"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
