"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, X, AlertCircle, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";

interface PagoForm {
  actividad: string;
  precio: string;
  fechaCobro: string;
  fechaInicio: string;
  medioPago: string;
}

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
  pagosExistentes: Pago[];
  onClose: () => void;
  onGuardado: () => void;
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const clean = dateStr.split("T")[0];
  const [y, m, d] = clean.split("-");
  return `${d}/${m}/${y}`;
}

export default function RegistrarCobroModal({
  alumnoId,
  pagosExistentes,
  onClose,
  onGuardado,
}: Props) {
  const isMobile = useIsMobile();

  const [pagoForm, setPagoForm] = useState<PagoForm>({
    actividad: "",
    precio: "",
    fechaCobro: "",
    fechaInicio: "",
    medioPago: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [planesSuscripcion, setPlanesSuscripcion] = useState<
    Array<{ name: string; duration_days: number; price: number }>
  >([]);
  const [mediosPago, setMediosPago] = useState<Array<{ name: string }>>([]);

  // Encontrar plan vigente (memoizado para evitar recálculos)
  const planVigente = useMemo(() => {
    return pagosExistentes.find((p) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const inicio = new Date(p.fecha_inicio);
      inicio.setHours(0, 0, 0, 0);

      const vencimiento = new Date(p.fecha_vencimiento);
      vencimiento.setHours(0, 0, 0, 0);

      // Plan vigente: ya inició y aún no venció
      return hoy >= inicio && hoy <= vencimiento;
    });
  }, [pagosExistentes]);

  // Establecer fechas solo en el cliente
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    let fechaInicioSugerida = today;

    // Si hay un plan vigente, sugerir el día siguiente al vencimiento
    if (planVigente) {
      const vencimiento = new Date(planVigente.fecha_vencimiento);
      vencimiento.setDate(vencimiento.getDate() + 1);
      const yyyy = vencimiento.getFullYear();
      const mm = String(vencimiento.getMonth() + 1).padStart(2, "0");
      const dd = String(vencimiento.getDate()).padStart(2, "0");
      fechaInicioSugerida = `${yyyy}-${mm}-${dd}`;
    } else if (pagosExistentes.length > 0) {
      // Si no hay plan vigente pero hay pagos, usar el último plan (por fecha de vencimiento)
      const ultimoPlan = [...pagosExistentes].sort((a, b) => {
        return (
          new Date(b.fecha_vencimiento).getTime() -
          new Date(a.fecha_vencimiento).getTime()
        );
      })[0];

      const vencimiento = new Date(ultimoPlan.fecha_vencimiento);
      vencimiento.setDate(vencimiento.getDate() + 1);
      const yyyy = vencimiento.getFullYear();
      const mm = String(vencimiento.getMonth() + 1).padStart(2, "0");
      const dd = String(vencimiento.getDate()).padStart(2, "0");
      fechaInicioSugerida = `${yyyy}-${mm}-${dd}`;
    }

    setPagoForm((prev) => ({
      ...prev,
      fechaCobro: today,
      fechaInicio: fechaInicioSugerida,
    }));
  }, [planVigente, pagosExistentes]);

  // Cargar planes y medios de pago
  useEffect(() => {
    async function fetchData() {
      // Cargar planes
      const { data: planes } = await supabase
        .from("subscription_plans")
        .select("name, price, duration_days")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (planes) setPlanesSuscripcion(planes);

      // Cargar medios de pago
      const { data: metodos } = await supabase
        .from("payment_methods")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (metodos) setMediosPago(metodos);
    }

    fetchData();
  }, []);

  function setPagoField(field: keyof PagoForm, value: string) {
    setPagoForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function handleActividadChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value;
    const plan = planesSuscripcion.find((p) => p.name === name);
    setPagoForm((prev) => ({
      ...prev,
      actividad: name,
      precio: plan ? String(plan.price) : "",
    }));
    setErrors((prev) => ({ ...prev, actividad: "", precio: "" }));
  }

  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!pagoForm.actividad) e.actividad = "La actividad es requerida";
    if (!pagoForm.precio) e.precio = "El precio es requerido";
    if (!pagoForm.fechaCobro) e.fechaCobro = "La fecha de cobro es requerida";
    if (!pagoForm.fechaInicio)
      e.fechaInicio = "La fecha de inicio es requerida";
    if (!pagoForm.medioPago) e.medioPago = "El medio de pago es requerido";

    // Validar que la fecha de inicio no esté en el medio de otro plan
    if (pagoForm.fechaInicio) {
      const fechaInicio = new Date(pagoForm.fechaInicio);

      for (const pago of pagosExistentes) {
        const inicioExistente = new Date(pago.fecha_inicio);
        const vencimientoExistente = new Date(pago.fecha_vencimiento);

        // Verificar si la nueva fecha de inicio está dentro del rango de un plan existente
        if (
          fechaInicio > inicioExistente &&
          fechaInicio < vencimientoExistente
        ) {
          e.fechaInicio = `Esta fecha está dentro del plan "${pago.actividad}" (${formatFecha(pago.fecha_inicio)} - ${formatFecha(pago.fecha_vencimiento)})`;
          break;
        }
      }
    }

    return e;
  }

  async function handleGuardar() {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerHapticFeedback(HapticPresets.warning);
      return;
    }

    triggerHapticFeedback(HapticPresets.medium);
    setGuardando(true);

    let fechaProximoVencimiento = null;
    const planElegido = planesSuscripcion.find(
      (p) => p.name === pagoForm.actividad,
    );

    if (planElegido && planElegido.duration_days) {
      const [y, m, d] = pagoForm.fechaInicio.split("-").map(Number);
      const fecha = new Date(y, m - 1, d);
      fecha.setDate(fecha.getDate() + planElegido.duration_days);
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, "0");
      const dd = String(fecha.getDate()).padStart(2, "0");
      fechaProximoVencimiento = `${yyyy}-${mm}-${dd}`;
    }

    const { error: errorPago } = await supabase.from("pagos").insert({
      alumno_id: alumnoId,
      actividad: pagoForm.actividad,
      precio: Number(pagoForm.precio),
      fecha_cobro: pagoForm.fechaCobro,
      medio_pago: pagoForm.medioPago,
      fecha_inicio: pagoForm.fechaInicio,
      fecha_vencimiento: fechaProximoVencimiento,
    });

    if (errorPago) {
      setGuardando(false);
      triggerHapticFeedback(HapticPresets.error);
      alert("Error al registrar cobro: " + errorPago.message);
      return;
    }

    // Actualizar alumno con el nuevo plan (y reiniciar counter de gracia)
    const { error: errorUpdate } = await supabase
      .from("alumnos")
      .update({
        abono_ultima_inscripcion: pagoForm.actividad,
        fecha_proximo_vencimiento: fechaProximoVencimiento,
        actividad_proximo_vencimiento: pagoForm.actividad,
        fecha_ultimo_inicio: pagoForm.fechaInicio,
        // Resetear clases de gracia al renovar el plan
        clases_gracia_disponibles: 0,
        clases_gracia_usadas: 0,
      })
      .eq("id", alumnoId);

    setGuardando(false);

    if (errorUpdate) {
      triggerHapticFeedback(HapticPresets.error);
      alert("Error al actualizar alumno: " + errorUpdate.message);
      return;
    }

    triggerHapticFeedback(HapticPresets.success);

    onGuardado();
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[100] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Contenedor adaptativo */}
      <div
        className={`fixed z-[101] bg-white shadow-2xl flex flex-col
          ${
            isMobile
              ? "left-0 right-0 bottom-0 rounded-t-3xl max-h-[90vh]"
              : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl w-full max-w-md max-h-[90vh]"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (solo móvil) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Registrar Cobro
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Asigná una actividad y registra el pago.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGuardar();
          }}
          className="px-4 md:px-6 py-5 flex flex-col gap-4 overflow-y-auto"
        >
          {/* Alerta del plan vigente */}
          {planVigente && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
              <AlertCircle
                size={18}
                className="text-blue-600 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900">
                  Plan vigente: {planVigente.actividad}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Vence el {formatFecha(planVigente.fecha_vencimiento)}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Actividad *
            </label>
            <div className="relative">
              <select
                value={pagoForm.actividad}
                onChange={handleActividadChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white appearance-none font-bold"
              >
                <option value="">Seleccionar plan...</option>
                {planesSuscripcion.map((plan) => (
                  <option key={plan.name} value={plan.name}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            {errors.actividad && (
              <span className="text-xs text-red-500">{errors.actividad}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Precio *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                $
              </span>
              <input
                type="number"
                placeholder="0"
                value={pagoForm.precio}
                onChange={(e) => setPagoField("precio", e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 font-bold bg-gray-50"
                readOnly={!pagoForm.actividad}
              />
            </div>
            {errors.precio && (
              <span className="text-xs text-red-500">{errors.precio}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Medio de Pago *
            </label>
            <div className="relative">
              <select
                value={pagoForm.medioPago}
                onChange={(e) => setPagoField("medioPago", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white appearance-none"
              >
                <option value="">Seleccionar...</option>
                {mediosPago.map((mp) => (
                  <option key={mp.name} value={mp.name}>
                    {mp.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            {errors.medioPago && (
              <span className="text-xs text-red-500">{errors.medioPago}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Fecha de Cobro *
              </label>
              <input
                type="date"
                value={pagoForm.fechaCobro}
                onChange={(e) => setPagoField("fechaCobro", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
              />
              {errors.fechaCobro && (
                <span className="text-xs text-red-500">
                  {errors.fechaCobro}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Fecha de Inicio del Plan *
              </label>
              <input
                type="date"
                value={pagoForm.fechaInicio}
                onChange={(e) => setPagoField("fechaInicio", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
              />
              {errors.fechaInicio && (
                <span className="text-xs text-red-500">
                  {errors.fechaInicio}
                </span>
              )}
              <p className="text-xs text-gray-500">
                A partir de esta fecha se calculará el vencimiento del plan.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 mt-auto">
            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-green-700 disabled:opacity-70 transition-all border border-transparent min-h-[44px]"
            >
              {guardando ? "Registrando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
