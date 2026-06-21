"use client";

import { useState, useEffect, memo, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaticDataStore } from "@/stores/static-data-store";
import { useDataCacheStore, AlumnoRow } from "@/stores/data-cache-store";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Filter,
  X,
  Search,
  Calendar,
  User as UserIcon,
  Users,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet, BottomSheetContent } from "@/components/ui/bottom-sheet";
import { ModalWithHistory } from "@/components/ModalWithHistory";
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";
import Paginacion from "./Paginacion";
import Buscador from "./Buscador";
import { Switch } from "@/components/ui/switch";

// ─────────────────────────────────────────────
// Tipos — AlumnoRow viene del store (re-export para compatibilidad)
// ─────────────────────────────────────────────

export type { AlumnoRow } from "@/stores/data-cache-store";

// Tipo enriquecido para la tarjeta (con initials y color derivados)
interface AlumnoConUI extends AlumnoRow {
  initials: string;
  color: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const COLORS = [
  "#374151",
  "#6b7280",
  "#dc2626",
  "#4338ca",
  "#0f766e",
  "#9a3412",
  "#1e40af",
  "#78716c",
  "#a1a1aa",
  "#4b5563",
];

function getColor(nombre: string | null): string {
  if (!nombre) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(nombre: string | null): string {
  if (!nombre) return "?";
  const words = nombre.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

function enriquecerAlumno(a: AlumnoRow): AlumnoConUI {
  return {
    ...a,
    initials: getInitials(a.nombre),
    color: getColor(a.nombre),
  };
}

// ─────────────────────────────────────────────
// Subcomponente: Modal Nuevo Alumno
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

function NuevoAlumnoModal({
  onClose,
  onGuardado,
}: {
  onClose: () => void;
  onGuardado: () => void;
}) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<1 | 2>(1);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);

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
      // Verificar si ya existe un alumno con el mismo DNI (con timeout y sin maybeSingle para evitar hangs)
      const fetchPromise = supabase
        .from("alumnos")
        .select("id")
        .eq("dni", form.dni.trim())
        .limit(1);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Límite de tiempo superado al verificar el DNI (4s)")), 4000)
      );

      const { data: dniData, error: checkError } = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]);

      if (checkError) {
        throw new Error("Error al verificar el DNI: " + checkError.message);
      }

      const dniExistente = dniData && dniData.length > 0;

      if (dniExistente) {
        setErrors({ dni: "Ya existe un alumno registrado con este DNI" });
        triggerHapticFeedback(HapticPresets.warning);
        return;
      }

      triggerHapticFeedback(HapticPresets.medium);

      if (goToStep2) {
        // Avanzar al paso 2 de inmediato en el cliente, sin tocar la base de datos aún (0 RTT)
        setStep(2);
      } else {
        // Guardado tradicional sin cobro (1 RTT)
        const edadCalculada = calcularEdad(form.fechaNacimiento);

        const { error } = await supabase
          .from("alumnos")
          .insert({
            nombre: form.nombre.trim(),
            dni: form.dni.trim(),
            domicilio: form.domicilio.trim(),
            telefono: form.telefono.trim(),
            fecha_nacimiento: form.fechaNacimiento,
            fecha_registro: form.fechaRegistro,
            genero: form.genero,
            edad_actual: edadCalculada,
            cus_completado: esMenorDeEdad ? form.cusCompletado : false,
            cus_clases_presentadas: 0,
            email: form.email.trim() || null,
            telefono_emergencia: form.telefonoEmergencia.trim() || null,
            observaciones: form.observaciones.trim() || null,
          });

        if (error) {
          throw new Error("Error al guardar el alumno: " + error.message);
        }

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
      // Verificar si ya existe un alumno con el mismo DNI (doble seguridad con timeout y sin maybeSingle)
      const fetchPromise = supabase
        .from("alumnos")
        .select("id")
        .eq("dni", form.dni.trim())
        .limit(1);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Límite de tiempo superado al verificar el DNI (4s)")), 4000)
      );

      const { data: dniData, error: checkError } = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]);

      if (checkError) {
        throw new Error("Error al verificar el DNI: " + checkError.message);
      }

      const dniExistente = dniData && dniData.length > 0;

      if (dniExistente) {
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

      // Guardado unificado de alumno + pago atómico mediante la RPC (1 RTT)
      const { error: rpcError } = await supabase.rpc(
        "crear_alumno_con_cobro",
        {
          p_nombre: form.nombre.trim(),
          p_dni: form.dni.trim(),
          p_domicilio: form.domicilio.trim(),
          p_telefono: form.telefono.trim(),
          p_fecha_nacimiento: form.fechaNacimiento,
          p_fecha_registro: form.fechaRegistro,
          p_genero: form.genero,
          p_edad_actual: edadCalculada,
          p_actividad: pagoForm.actividad,
          p_precio: Number(pagoForm.precio),
          p_fecha_cobro: pagoForm.fechaCobro,
          p_medio_pago: pagoForm.medioPago,
          p_fecha_inicio: pagoForm.fechaInicio,
          p_fecha_vencimiento: fechaProximoVencimiento,
          p_cus_completado: esMenorDeEdad ? form.cusCompletado : false,
          p_email: form.email.trim() || null,
          p_tarjeta: pagoForm.tarjeta || null,
          p_alias_transferencia: pagoForm.aliasTransferencia.trim() || null,
          p_telefono_emergencia: form.telefonoEmergencia.trim() || null,
          p_observaciones: form.observaciones.trim() || null,
        }
      );

      if (rpcError) {
        throw new Error("Error al registrar alumno con cobro: " + rpcError.message);
      }

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
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-500 border border-gray-200">
                <kbd className="font-sans font-semibold">↵ Enter</kbd> para navegación rápida
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

// ─────────────────────────────────────────────
// Subcomponente: Tarjeta de Alumno
// ─────────────────────────────────────────────

const AlumnoCard = memo(function AlumnoCard({ alumno }: { alumno: AlumnoConUI }) {
  const tieneAsistencia = alumno.ultimaAsistencia?.fecha;
  const horaAsistencia = alumno.ultimaAsistencia?.hora?.slice(0, 5); // HH:MM

  // Obtener fecha de hoy en formato YYYY-MM-DD local
  const hoy = new Date();
  const fechaHoyStr = hoy.toLocaleDateString("en-CA"); // 'en-CA' da formato YYYY-MM-DD

  const esAsistenciaHoy = tieneAsistencia === fechaHoyStr;
  const esPrueba = alumno.es_prueba === true;
  const esInactivo = alumno.activo === false;

  return (
    <Link
      href={`/inicio/${alumno.id}`}
      className={`block rounded-xl border p-4 md:p-5 hover:shadow-md transition-all cursor-pointer touch-manipulation ${
        esInactivo
          ? "bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3 md:gap-4 group min-h-[76px]">
        <div
          className="w-12 h-12 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 select-none"
          style={{ backgroundColor: esPrueba ? "#ea580c" : alumno.color }}
        >
          {alumno.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-base md:text-sm truncate">
              {alumno.nombre ?? "Sin nombre"}
            </p>
            {esPrueba && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full shrink-0">
                PRUEBA
              </span>
            )}
            {/* Badge CUS Pendiente — solo para menores sin CUS */}
            {alumno.edad_actual != null &&
              alumno.edad_actual < 18 &&
              alumno.cus_completado === false && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                  <AlertTriangle size={10} className="text-amber-600" />
                  CUS Pendiente
                </span>
              )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <UserIcon size={12} className="text-gray-400" />
              {alumno.edad_actual != null ? `${alumno.edad_actual} años` : "-"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={12} className="text-gray-400" />
              Inscripto: {formatFecha(alumno.fecha_registro)}
            </span>
            {esAsistenciaHoy && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ Hoy {horaAsistencia}
              </span>
            )}
            {esPrueba && alumno.actividad_interes && (
              <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                🥊 {alumno.actividad_interes}
              </span>
            )}
            {alumno.dni && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <CreditCard size={12} className="text-gray-300" />
                {alumno.dni}
              </span>
            )}
          </div>
        </div>
        <div className="w-9 h-9 md:w-7 md:h-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors select-none">
          <ChevronRight
            size={16}
            className="text-gray-400 group-hover:text-red-500 transition-colors"
          />
        </div>
      </div>
    </Link>
  );
});

// ─────────────────────────────────────────────
// Componente principal exportado
// ─────────────────────────────────────────────

const POR_PAGINA = 20;

export default function AlumnosList() {
  const searchParamsHook = useSearchParams();
  const pageParam = searchParamsHook.get("page");
  const queryParam = searchParamsHook.get("query") ?? "";

  const paginaActual = Math.max(1, Number(pageParam ?? "1") || 1);
  const queryActual = queryParam;

  const [showModal, setShowModal] = useState(false);
  const [alumnos, setAlumnos] = useState<AlumnoRow[]>([]);
  const [alumnosLoading, setAlumnosLoading] = useState(false);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const { getAlumnos } = useDataCacheStore();

  const porPagina = POR_PAGINA;

  // Fetch cuando cambia la página o el query
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setAlumnosLoading(true);
      try {
        const result = await getAlumnos(paginaActual, queryActual);
        if (!cancelled) {
          setAlumnos(result.alumnos);
          setTotalRegistros(result.totalRegistros);
          setTotalPaginas(result.totalPaginas);
        }
      } catch (err) {
        console.error("Error fetching alumnos:", err);
      } finally {
        if (!cancelled) setAlumnosLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [paginaActual, queryActual, getAlumnos]);

  function handleGuardado() {
    // Reload current page after saving
    getAlumnos(paginaActual, queryActual).then((result) => {
      setAlumnos(result.alumnos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
    }).catch(console.error);
  }

  // Enriquecer datos con UI derivada
  const alumnosEnriquecidos = useMemo(() => alumnos.map(enriquecerAlumno), [alumnos]);

  // La variable alumnosMostrados debe ser directamente el listado de alumnos devuelto por la caché de Zustand
  const alumnosMostrados = alumnosEnriquecidos;

  return (
    <div className="relative min-h-screen">
      {/* Fondo Logo con opacidad baja, centrado en la pantalla */}
      <div className="fixed inset-0 flex items-center justify-center top-16 md:top-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/logo-sin-fondo-completo.webp"
          alt="Sistema Alfa Background"
          className="w-[80vw] md:w-[450px] opacity-[0.06] object-contain ml-0"
        />
      </div>

      {/* Modal con soporte para botón "Atrás" */}
      <ModalWithHistory isOpen={showModal} onClose={() => setShowModal(false)}>
        <NuevoAlumnoModal
          onClose={() => setShowModal(false)}
          onGuardado={handleGuardado}
        />
      </ModalWithHistory>

      {/* Header estilo Administración */}
      <div className="relative z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 lg:px-8">
          {/* Título + botón */}
          <div className="pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Alumnos
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {!queryActual ? (
                      <span className="inline-flex items-center gap-1.5 text-orange-600 font-semibold bg-orange-50 px-2.5 py-0.5 rounded-full text-xs border border-orange-100/50">
                        {alumnosMostrados.length} ingreso{alumnosMostrados.length !== 1 ? "s" : ""} hoy
                      </span>
                    ) : (
                      <>{totalRegistros} alumnos registrados · ordenados por orden de entrada</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-4 py-2.5 min-h-[40px] rounded-xl hover:brightness-110 transition-all touch-manipulation select-none shrink-0"
                style={{ backgroundColor: "#f97316" }}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Crear Alumno</span>
                <span className="sm:hidden">Crear</span>
              </button>
            </div>
          </div>

          {/* Búsqueda + paginación + conteo */}
          <div className="py-3 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <Buscador />
              </div>
              


              {queryActual !== "" && (
                <div className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 min-h-[44px] shrink-0">
                  <Filter size={15} className="text-gray-400" />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    Pág. {paginaActual}/{totalPaginas}
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-400 select-none">
              {queryActual ? (
                <>
                  <span className="text-gray-600 font-semibold">
                    {totalRegistros}
                  </span>{" "}
                  resultado
                  {totalRegistros !== 1 ? "s" : ""} para{" "}
                  <span className="text-gray-600 font-semibold">
                    &ldquo;{queryActual}&rdquo;
                  </span>
                </>
              ) : (
                <>
                  Mostrando {alumnosMostrados.length} ingreso{alumnosMostrados.length !== 1 ? "s" : ""} de hoy
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor principal con z-index para estar por encima del fondo */}
      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Loading skeleton inline (cuando no hay datos en caché aún) */}
        {alumnosLoading && alumnos.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-4 md:p-5"
              >
                <div className="flex items-center gap-3 md:gap-4 min-h-[76px]">
                  <div className="w-12 h-12 md:w-11 md:h-11 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                    <div className="flex gap-3">
                      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-9 h-9 md:w-7 md:h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : alumnosMostrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {alumnosMostrados.map((alumno) => (
              <AlumnoCard key={alumno.id} alumno={alumno} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {!queryActual ? (
              <>
                <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-3 select-none text-orange-500">
                  <Calendar size={24} />
                </div>
                <p className="text-gray-500 font-semibold text-lg max-w-md leading-snug">
                  No se registraron ingresos hoy
                </p>
                <p className="text-gray-400 text-sm mt-2 max-w-md px-4 leading-relaxed">
                  Comienza a buscar un alumno en la barra superior para marcar su asistencia o registrar cobros.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3 select-none">
                  <Search size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium text-base">
                  No se encontraron alumnos
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  No hay resultados para &ldquo;{queryActual}&rdquo;
                </p>
              </>
            )}
          </div>
        )}

        {/* Paginación (visible cuando queryActual tiene texto) */}
        {queryActual !== "" && (
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            porPagina={porPagina}
          />
        )}
      </div>
    </div>
  );
}
