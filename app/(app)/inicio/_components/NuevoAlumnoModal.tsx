"use client";

import { useState, useEffect } from "react";
import { usePowerSync } from "@powersync/react";
import { useStaticDataStore } from "@/stores/static-data-store";
import {
  ChevronDown,
  X,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";

// ─────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────

interface FormData {
  nombre: string;
  fechaNacimiento: string;
  fechaRegistro: string;
  domicilio: string;
  telefono: string;
  dni: string;
  genero: string;
  email: string;
  cusCompletado: boolean;
  telefonoEmergencia: string;
  observaciones: string;
}

interface PagoForm {
  actividad: string;
  precio: string;
  fechaCobro: string;
  fechaInicio: string;
  medioPago: string;
  tarjeta: string;
  aliasTransferencia: string;
}

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

export default function NuevoAlumnoModal({
  onClose,
  onGuardado,
}: {
  onClose: () => void;
  onGuardado: () => void;
}) {
  const db = usePowerSync();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<1 | 2>(1);

  // Usar el store de datos estáticos
  const {
    subscriptionPlans,
    paymentMethods,
    acceptedCards,
  } = useStaticDataStore();

  const [form, setForm] = useState<FormData>({
    nombre: "",
    fechaNacimiento: "",
    fechaRegistro: "",
    domicilio: "",
    telefono: "",
    dni: "",
    genero: "",
    email: "",
    cusCompletado: false,
    telefonoEmergencia: "",
    observaciones: "",
  });

  // Calcular si es menor de edad dinámicamente
  const esMenorDeEdad = form.fechaNacimiento
    ? calcularEdad(form.fechaNacimiento) < 18
    : false;

  const [pagoForm, setPagoForm] = useState<PagoForm>({
    actividad: "",
    precio: "",
    fechaCobro: "",
    fechaInicio: "",
    medioPago: "",
    tarjeta: "",
    aliasTransferencia: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  // Establecer fechas solo en el cliente para evitar problemas de hidratación
  useEffect(() => {
    // Obtener fecha local sin conversión a UTC
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

    setForm((prev) => ({ ...prev, fechaRegistro: today }));
    setPagoForm((prev) => ({ ...prev, fechaCobro: today, fechaInicio: today }));
  }, []);

  function setField(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const nextErrors = { ...e, [field]: "" };
      if (field === "telefono" || field === "telefonoEmergencia") {
        nextErrors.telefonoEmergencia = "";
      }
      return nextErrors;
    });
  }

  function setPagoField(field: keyof PagoForm, value: string) {
    setPagoForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      // Si el elemento actual es un textarea, dejamos que Enter funcione normalmente (salto de línea)
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
            // Evitamos inputs ocultos o inputs de sólo lectura (como precio no editable)
            if (el.type === "hidden" || el.readOnly) {
              return false;
            }
          }
          return true;
        }

        // Si es un botón, solo queremos enfocar los botones principales (no Cancelar ni Volver Atrás)
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

  function validatePaso1(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido";
    if (!form.fechaNacimiento)
      e.fechaNacimiento = "La fecha de nacimiento es requerida";
    if (!form.fechaRegistro)
      e.fechaRegistro = "La fecha de registro es requerida";
    if (!form.dni.trim()) e.dni = "El DNI es requerido";
    if (!form.domicilio.trim()) e.domicilio = "La dirección es requerida";
    if (!form.telefono.trim()) e.telefono = "El teléfono es requerido";
    if (!form.genero) e.genero = "El género es requerido";
    if (!form.telefonoEmergencia.trim()) {
      e.telefonoEmergencia = "El contacto de emergencia es requerido";
    } else {
      const cleanTel = form.telefono.replace(/\D/g, "");
      const cleanEmerg = form.telefonoEmergencia.replace(/\D/g, "");
      if (cleanTel && cleanEmerg && cleanTel === cleanEmerg) {
        e.telefonoEmergencia = "El contacto de emergencia no puede ser igual al teléfono del alumno";
      }
    }
    return e;
  }

  function validatePaso2(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!pagoForm.actividad) e.actividad = "La actividad es requerida";
    if (!pagoForm.precio) e.precio = "El precio es requerido";
    if (!pagoForm.fechaCobro) e.fechaCobro = "La fecha de cobro es requerida";
    if (!pagoForm.fechaInicio) {
      e.fechaInicio = "La fecha de inicio es requerida";
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      if (pagoForm.fechaInicio < today) {
        e.fechaInicio = "La fecha de inicio del plan no puede ser menor que el día actual";
      }
    }
    if (!pagoForm.medioPago) e.medioPago = "El medio de pago es requerido";

    if (
      pagoForm.medioPago.toLowerCase().includes("transferencia") &&
      !pagoForm.aliasTransferencia.trim()
    ) {
      e.aliasTransferencia = "El alias/CBU de destino es obligatorio para transferencias";
    }

    return e;
  }

  function calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const [y, m, d] = fechaNacimiento.split("-").map(Number);
    if (!y || !m || !d) return 0;
    const hoy = new Date();
    let edad = hoy.getFullYear() - y;
    const mesActual = hoy.getMonth() + 1;
    const diaActual = hoy.getDate();

    if (mesActual < m || (mesActual === m && diaActual < d)) {
      edad--;
    }
    return Math.max(0, edad);
  }

  async function handleGuardarPaso1(goToStep2: boolean) {
    const errs = validatePaso1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerHapticFeedback(HapticPresets.warning);
      return;
    }

    setGuardando(true);

    try {
      // Verificar si ya existe un alumno con el mismo DNI (local query)
      const dniCheck = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM alumnos WHERE dni = ?",
        [form.dni.trim()]
      );

      if (dniCheck.count > 0) {
        setErrors({ dni: "Ya existe un alumno registrado con este DNI" });
        triggerHapticFeedback(HapticPresets.warning);
        return;
      }

      triggerHapticFeedback(HapticPresets.medium);

      if (goToStep2) {
        // Avanzar al paso 2 de inmediato en el cliente, sin tocar la base de datos aún (0 RTT)
        setStep(2);
      } else {
        // Guardado tradicional sin cobro
        const edadCalculada = calcularEdad(form.fechaNacimiento);

        await db.execute(
          `INSERT INTO alumnos (id, nombre, dni, domicilio, telefono, fecha_nacimiento, fecha_registro, genero, edad_actual, cus_completado, cus_clases_presentadas, email, telefono_emergencia, observaciones)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            form.nombre.trim(),
            form.dni.trim(),
            form.domicilio.trim(),
            form.telefono.trim(),
            form.fechaNacimiento,
            form.fechaRegistro,
            form.genero,
            edadCalculada,
            esMenorDeEdad ? (form.cusCompletado ? 1 : 0) : 0,
            0,
            form.email.trim() || null,
            form.telefonoEmergencia.trim() || null,
            form.observaciones.trim() || null,
          ]
        );

        triggerHapticFeedback(HapticPresets.success);
        onGuardado();
        onClose();
      }
    } catch (err: any) {
      console.error("Error al guardar alumno Paso 1:", err);
      triggerHapticFeedback(HapticPresets.error);
      alert(err.message || "Error inesperado al registrar los datos personales del alumno");
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarPaso2() {
    const errs = validatePaso2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerHapticFeedback(HapticPresets.warning);
      return;
    }

    triggerHapticFeedback(HapticPresets.medium);
    setGuardando(true);

    try {
      // Verificar si ya existe un alumno con el mismo DNI (local query)
      const dniCheck = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM alumnos WHERE dni = ?",
        [form.dni.trim()]
      );

      if (dniCheck.count > 0) {
        setStep(1); // Volver al paso 1 para mostrar el error
        setErrors({ dni: "Ya existe un alumno registrado con este DNI" });
        triggerHapticFeedback(HapticPresets.warning);
        return;
      }

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

      const edadCalculada = calcularEdad(form.fechaNacimiento);

      // Insert alumno + pago locally (PowerSync syncs to Supabase)
      const alumnoId = crypto.randomUUID();

      await db.execute(
        `INSERT INTO alumnos (id, nombre, dni, domicilio, telefono, fecha_nacimiento, fecha_registro, genero, edad_actual, abono_ultima_inscripcion, fecha_proximo_vencimiento, actividad_proximo_vencimiento, fecha_ultimo_inicio, cus_completado, cus_clases_presentadas, email, telefono_emergencia, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alumnoId,
          form.nombre.trim(),
          form.dni.trim(),
          form.domicilio.trim(),
          form.telefono.trim(),
          form.fechaNacimiento,
          form.fechaRegistro,
          form.genero,
          edadCalculada,
          pagoForm.actividad,
          fechaProximoVencimiento,
          pagoForm.actividad,
          pagoForm.fechaInicio,
          esMenorDeEdad ? (form.cusCompletado ? 1 : 0) : 0,
          0,
          form.email.trim() || null,
          form.telefonoEmergencia.trim() || null,
          form.observaciones.trim() || null,
        ]
      );

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
          pagoForm.tarjeta || null,
          pagoForm.aliasTransferencia.trim() || null,
        ]
      );

      triggerHapticFeedback(HapticPresets.success);
      onGuardado();
      onClose();
    } catch (err: any) {
      console.error("Error al registrar alumno con cobro:", err);
      triggerHapticFeedback(HapticPresets.error);
      alert(err.message || "Error inesperado al crear el alumno y registrar el cobro");
    } finally {
      setGuardando(false);
    }
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
              : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl w-full max-w-3xl max-h-[90vh]"
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
              {step === 1 ? "Nuevo Alumno" : "Registrar Cobro"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 1
                ? "Completá los datos personales."
                : "Asigná una actividad y registra el pago."}
            </p>
            <div className="mt-1">
              <span className="inline-block text-[10px] font-medium text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.5">
                ENTER para navegación rápida
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Panel Paso 1 */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGuardarPaso1(false);
            }}
            onKeyDown={handleKeyDown}
            className="px-4 md:px-6 py-5 flex flex-col gap-4 overflow-y-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              {/* Nombre completo */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan García"
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.nombre && (
                  <span className="text-xs text-red-500">{errors.nombre}</span>
                )}
              </div>

              {/* DNI */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  DNI *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 38765432"
                  value={form.dni}
                  onChange={(e) => setField("dni", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.dni && (
                  <span className="text-xs text-red-500">{errors.dni}</span>
                )}
              </div>

              {/* Nacimiento */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Nacimiento *
                </label>
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => {
                    setField("fechaNacimiento", e.target.value);
                    // Reset CUS si deja de ser menor
                    if (calcularEdad(e.target.value) >= 18) {
                      setForm((f) => ({ ...f, cusCompletado: false }));
                    }
                  }}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.fechaNacimiento && (
                  <span className="text-xs text-red-500">
                    {errors.fechaNacimiento}
                  </span>
                )}
              </div>

              {/* Registro */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Registro *
                </label>
                <input
                  type="date"
                  value={form.fechaRegistro}
                  onChange={(e) => setField("fechaRegistro", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.fechaRegistro && (
                  <span className="text-xs text-red-500">
                    {errors.fechaRegistro}
                  </span>
                )}
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 11-4521-0011"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.telefono && (
                  <span className="text-xs text-red-500">
                    {errors.telefono}
                  </span>
                )}
              </div>

              {/* Género */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Género *
                </label>
                <div className="relative">
                  <select
                    value={form.genero}
                    onChange={(e) => setField("genero", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {errors.genero && (
                  <span className="text-xs text-red-500">{errors.genero}</span>
                )}
              </div>

              {/* Dirección */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Dirección *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Av. Corrientes 1234"
                  value={form.domicilio}
                  onChange={(e) => setField("domicilio", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.domicilio && (
                  <span className="text-xs text-red-500">{errors.domicilio}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Ej: juan@gmail.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
              </div>

              {/* Contacto de Emergencia */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Contacto de Emergencia *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 11-4521-0012 (Mamá)"
                  value={form.telefonoEmergencia}
                  onChange={(e) => setField("telefonoEmergencia", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.telefonoEmergencia && (
                  <span className="text-xs text-red-500">
                    {errors.telefonoEmergencia}
                  </span>
                )}
              </div>

              {/* Observaciones */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Observaciones (Opcional)
                </label>
                <textarea
                  placeholder="Ej: Alergia al polvo, lesión en rodilla derecha"
                  value={form.observaciones}
                  onChange={(e) => setField("observaciones", e.target.value)}
                  rows={2}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[48px] focus:border-red-400 focus:ring-2 focus:ring-red-50 resize-y"
                />
              </div>

              {/* CUS — solo visible si es menor de edad */}
              {esMenorDeEdad && (
                <div className="md:col-span-2 flex flex-col gap-2">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2.5">
                    {/* Encabezado */}
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                        Menor de edad — CUS requerido
                      </p>
                    </div>

                    {/* Estado actual */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                        form.cusCompletado
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {form.cusCompletado ? (
                        <>
                          <ShieldCheck size={13} className="text-green-600 shrink-0" />
                          CUS entregado — no hay clases pendientes
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                          CUS pendiente — tiene 3 clases para presentarlo
                        </>
                      )}
                    </div>

                    {/* Descripción */}
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Tiene {calcularEdad(form.fechaNacimiento)} años. El CUS (Certificado Único de Salud) es obligatorio para menores.
                    </p>

                    {/* Checkbox siempre afirmativo */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative shrink-0">
                        <input
                          type="checkbox"
                          checked={form.cusCompletado}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, cusCompletado: e.target.checked }))
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            form.cusCompletado
                              ? "bg-green-500 border-green-500"
                              : "bg-white border-amber-300 group-hover:border-amber-400"
                          }`}
                        >
                          {form.cusCompletado && (
                            <ShieldCheck size={12} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700">
                        El CUS ya fue entregado al momento del registro
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-3 pt-3 mt-auto shrink-0 border-t border-gray-100">
              <button
                type="button"
                disabled={guardando}
                onClick={() => handleGuardarPaso1(true)}
                className="w-full md:w-auto md:px-6 py-3 bg-orange-600 text-white text-base md:text-sm font-bold min-h-[44px] rounded-xl shadow-md hover:brightness-110 disabled:opacity-70 transition-all border border-transparent"
              >
                {guardando ? "Guardando..." : "Guardar y Registrar Cobro"}
              </button>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 md:flex-initial md:px-6 py-2.5 text-gray-600 bg-gray-50 border border-gray-200 text-base md:text-sm font-semibold min-h-[44px] rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => handleGuardarPaso1(false)}
                  className="flex-1 md:flex-initial md:px-6 py-2.5 text-orange-600 bg-orange-50 border border-orange-100 text-base md:text-sm font-semibold min-h-[44px] rounded-lg hover:bg-orange-100 disabled:opacity-70 whitespace-nowrap"
                >
                  Guardar Datos Alumnos
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Panel Paso 2 */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGuardarPaso2();
            }}
            onKeyDown={handleKeyDown}
            className="px-4 md:px-6 py-5 flex flex-col gap-4 overflow-y-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              <div className="md:col-span-2 p-4 bg-green-50 border border-green-100 text-green-800 rounded-xl text-sm font-medium mb-2 text-center">
                Datos personales validados. Completá el cobro para registrar.
              </div>

              {/* Actividad */}
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

              {/* Precio */}
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

              {/* Medio de Pago */}
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
                      value={pagoForm.tarjeta}
                      onChange={(e) => setPagoField("tarjeta", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white appearance-none"
                    >
                      <option value="">Seleccionar tarjeta...</option>
                      {acceptedCards.map((card) => (
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

              {/* Transferencia — solo si el medio de pago contiene 'transferencia' */}
              {pagoForm.medioPago.toLowerCase().includes("transferencia") && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Alias / CBU de destino *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: gimnasio.alfa.mp"
                    value={pagoForm.aliasTransferencia}
                    onChange={(e) => setPagoField("aliasTransferencia", e.target.value)}
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

              {/* Fecha de Cobro */}
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

              {/* Fecha de Inicio del Plan */}
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

            {/* Acciones Paso 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-3 pt-4 mt-auto shrink-0 border-t border-gray-100">
              <button
                type="submit"
                disabled={guardando}
                className="w-full md:w-auto md:px-8 py-3 bg-green-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-green-700 disabled:opacity-70 transition-all border border-transparent min-h-[44px]"
              >
                {guardando ? "Registrando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full md:w-auto md:px-6 py-2.5 text-gray-600 bg-gray-50 border border-gray-200 text-sm font-semibold min-h-[44px] rounded-lg hover:bg-gray-100"
              >
                Volver atrás
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
