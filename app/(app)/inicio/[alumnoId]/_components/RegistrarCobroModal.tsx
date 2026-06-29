"use client";

import { useState, useEffect, useMemo } from "react";
import { usePowerSync } from "@powersync/react";
import { useStaticDataStore } from "@/stores/static-data-store";
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
  const db = usePowerSync();
  const isMobile = useIsMobile();

  // Usar el store de datos estáticos
  const {
    subscriptionPlans,
    paymentMethods,
    acceptedCards,
  } = useStaticDataStore();

  const [tarjeta, setTarjeta] = useState("");

  const [pagoForm, setPagoForm] = useState<PagoForm>({
    actividad: "",
    precio: "",
    fechaCobro: "",
    fechaInicio: "",
    medioPago: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [aliasTransferencia, setAliasTransferencia] = useState("");

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
    // Obtener fecha local sin conversión a UTC
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

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

    if (fechaInicioSugerida < today) {
      fechaInicioSugerida = today;
    }

    setPagoForm((prev) => ({
      ...prev,
      fechaCobro: today,
      fechaInicio: fechaInicioSugerida,
    }));
  }, [planVigente, pagosExistentes]);


  function setPagoField(field: keyof PagoForm, value: string) {
    setPagoForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
    if (field === "medioPago") {
      setTarjeta("");
      setAliasTransferencia("");
    }
  }

  function handleClose() {
    setAliasTransferencia("");
    onClose();
  }

  function handleActividadChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value;
    const plan = subscriptionPlans.find((p) => p.name === name);
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

    if (
      pagoForm.medioPago.toLowerCase().includes("transferencia") &&
      !aliasTransferencia.trim()
    ) {
      e.aliasTransferencia = "El alias/CBU de destino es obligatorio para transferencias";
    }

    // Validar que la fecha de inicio no esté en el medio de otro plan y que no sea menor al día actual
    if (pagoForm.fechaInicio) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      if (pagoForm.fechaInicio < today) {
        e.fechaInicio = "La fecha de inicio del plan no puede ser menor que el día actual";
      } else {
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

    try {
      let fechaProximoVencimiento = null;
      const planElegido = subscriptionPlans.find(
        (p) => p.name === pagoForm.actividad,
      );

      if (planElegido && planElegido.duration_days) {
        if (!pagoForm.fechaInicio) {
          throw new Error("La fecha de inicio es requerida");
        }
        const parts = pagoForm.fechaInicio.split("-");
        if (parts.length !== 3) {
          throw new Error("El formato de la fecha de inicio es inválido");
        }
        const [y, m, d] = parts.map(Number);
        const fecha = new Date(y, m - 1, d);
        fecha.setDate(fecha.getDate() + planElegido.duration_days);
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");
        fechaProximoVencimiento = `${yyyy}-${mm}-${dd}`;
      }

      await db.execute(
        `INSERT INTO pagos (id, alumno_id, actividad, precio, fecha_cobro, medio_pago, fecha_inicio, fecha_vencimiento, tarjeta, alias_transferencia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          alumnoId,
          pagoForm.actividad,
          Number(pagoForm.precio),
          pagoForm.fechaCobro,
          pagoForm.medioPago,
          pagoForm.fechaInicio,
          fechaProximoVencimiento,
          tarjeta || null,
          aliasTransferencia.trim() || null,
        ]
      );

      // Actualizar alumno con el nuevo plan (y reiniciar counter de gracia, y marcar como activo)
      await db.execute(
        `UPDATE alumnos SET abono_ultima_inscripcion = ?, fecha_proximo_vencimiento = ?, actividad_proximo_vencimiento = ?, fecha_ultimo_inicio = ?, clases_gracia_disponibles = ?, clases_gracia_usadas = ?, es_prueba = ?, activo = 1 WHERE id = ?`,
        [
          pagoForm.actividad,
          fechaProximoVencimiento,
          pagoForm.actividad,
          pagoForm.fechaInicio,
          0,
          0,
          0,
          alumnoId,
        ]
      );

      triggerHapticFeedback(HapticPresets.success);

      setAliasTransferencia("");
      onGuardado();
      onClose();
    } catch (err: any) {
      console.error("Error al registrar cobro:", err);
      triggerHapticFeedback(HapticPresets.error);
      alert(err.message || "Error inesperado al registrar el cobro");
    } finally {
      setGuardando(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      // Si el elemento actual es un textarea, dejamos que Enter funcione normalmente
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Evitamos el comportamiento por defecto de enviar el formulario
      e.preventDefault();

      const formElement = e.currentTarget;
      const elements = Array.from(formElement.elements) as HTMLElement[];

      // Filtramos solo los elementos interactivos visibles/editables que queremos navegar
      const focusable = elements.filter((el) => {
        const nodeName = el.nodeName.toLowerCase();

        // Si está deshabilitado o tiene tabIndex negativo, no es enfocable
        if ((el as any).disabled || el.tabIndex === -1) {
          return false;
        }

        // Si es un input, select o textarea
        if (["input", "select", "textarea"].includes(nodeName)) {
          if (el instanceof HTMLInputElement) {
            // Evitamos inputs ocultos o inputs de sólo lectura
            if (el.type === "hidden" || el.readOnly) {
              return false;
            }
          }
          return true;
        }

        // Si es un botón, solo queremos enfocar los botones principales
        if (nodeName === "button") {
          const text = el.textContent?.toLowerCase() || "";
          const isCancel =
            text.includes("cancelar") ||
            text.includes("volver atrás") ||
            el.getAttribute("aria-label") === "Cerrar";
          return !isCancel;
        }

        return false;
      });

      const currentIndex = focusable.indexOf(e.target as HTMLElement);
      if (currentIndex !== -1 && currentIndex < focusable.length - 1) {
        // Enfocamos el siguiente elemento
        const nextEl = focusable[currentIndex + 1];
        nextEl.focus();

        // Si el siguiente elemento es un select, abrimos sus opciones
        if (nextEl instanceof HTMLSelectElement) {
          try {
            (nextEl as any).showPicker?.();
          } catch (err) {
            console.warn("showPicker not supported or failed:", err);
          }
        }
      } else if (currentIndex === focusable.length - 1) {
        // Si es el último elemento enfocable (que sería el botón principal de guardar), hacemos clic
        const lastEl = focusable[currentIndex];
        if (lastEl instanceof HTMLButtonElement) {
          lastEl.click();
        }
      }
    }
  };


  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[100] transition-opacity duration-200"
        onClick={handleClose}
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
            <div className="mt-1">
              <span className="inline-block text-[10px] font-medium text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.5">
                ENTER para navegación rápida
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
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
          onKeyDown={handleKeyDown}
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
                {subscriptionPlans.map((plan) => (
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
                {paymentMethods.map((mp) => (
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

          {/* Tarjeta — solo si el medio de pago contiene 'tarjeta' */}
          {pagoForm.medioPago.toLowerCase().includes('tarjeta') && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Tarjeta
              </label>
              <div className="relative">
                <select
                  value={tarjeta}
                  onChange={(e) => setTarjeta(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white appearance-none"
                >
                  <option value="">Seleccionar tarjeta...</option>
                  {acceptedCards
                    .filter((card) => {
                      const mpLower = pagoForm.medioPago.toLowerCase();
                      const cardLower = card.name.toLowerCase();
                      if (mpLower.includes("crédito") || mpLower.includes("credito")) {
                        return cardLower.includes("crédito") || cardLower.includes("credito");
                      }
                      if (mpLower.includes("débito") || mpLower.includes("debito")) {
                        return cardLower.includes("débito") || cardLower.includes("debito");
                      }
                      return true;
                    })
                    .map((card) => (
                      <option key={card.id} value={card.name}>
                        {card.name}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          {pagoForm.medioPago.toLowerCase().includes("transferencia") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Alias / CBU de destino *
              </label>
              <input
                type="text"
                placeholder="Ej: gimnasio.alfa.mp"
                value={aliasTransferencia}
                onChange={(e) => {
                  setAliasTransferencia(e.target.value);
                  setErrors((prev) => ({ ...prev, aliasTransferencia: "" }));
                }}
                className={`border rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:ring-2 focus:ring-red-50 ${
                  errors.aliasTransferencia
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-red-400"
                }`}
              />
              {errors.aliasTransferencia && (
                <span className="text-xs text-red-500">
                  {errors.aliasTransferencia}
                </span>
              )}
            </div>
          )}

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
