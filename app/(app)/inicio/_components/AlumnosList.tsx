"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaticDataStore } from "@/stores/static-data-store";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Filter,
  X,
  Search,
  Calendar,
  User as UserIcon,
  CreditCard,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet, BottomSheetContent } from "@/components/ui/bottom-sheet";
import { ModalWithHistory } from "@/components/ModalWithHistory";
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";
import Paginacion from "./Paginacion";
import Buscador from "./Buscador";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface AlumnoRow {
  id: string;
  nombre: string | null;
  edad_actual: number | null;
  fecha_registro: string | null; // "YYYY-MM-DD"
  dni: string | null;
  es_prueba?: boolean | null;
  actividad_interes?: string | null;
  ultimaAsistencia: {
    fecha: string;
    hora: string | null;
  } | null;
}

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
}

interface PagoForm {
  actividad: string;
  precio: string;
  fechaCobro: string;
  fechaInicio: string;
  medioPago: string;
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
    fetchSubscriptionPlans,
    fetchPaymentMethods,
  } = useStaticDataStore();

  const [form, setForm] = useState<FormData>({
    nombre: "",
    fechaNacimiento: "",
    fechaRegistro: "",
    domicilio: "",
    telefono: "",
    dni: "",
    genero: "",
  });

  const [pagoForm, setPagoForm] = useState<PagoForm>({
    actividad: "",
    precio: "",
    fechaCobro: "",
    fechaInicio: "",
    medioPago: "",
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

  // Cargar datos estáticos desde el store (con caché automático)
  useEffect(() => {
    fetchSubscriptionPlans();
    fetchPaymentMethods();
  }, [fetchSubscriptionPlans, fetchPaymentMethods]);

  function setField(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
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
    return e;
  }

  function validatePaso2(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!pagoForm.actividad) e.actividad = "La actividad es requerida";
    if (!pagoForm.precio) e.precio = "El precio es requerido";
    if (!pagoForm.fechaCobro) e.fechaCobro = "La fecha de cobro es requerida";
    if (!pagoForm.fechaInicio)
      e.fechaInicio = "La fecha de inicio es requerida";
    if (!pagoForm.medioPago) e.medioPago = "El medio de pago es requerido";
    return e;
  }

  function calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const [y, m, d] = fechaNacimiento.split("-").map(Number);
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

    triggerHapticFeedback(HapticPresets.medium);
    setGuardando(true);
    const edadCalculada = calcularEdad(form.fechaNacimiento);

    const { data, error } = await supabase
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
      })
      .select()
      .single();

    setGuardando(false);

    if (error || !data) {
      triggerHapticFeedback(HapticPresets.error);
      alert(
        "Error al guardar el alumno: " +
          (error?.message || "Error desconocido"),
      );
      return;
    }

    triggerHapticFeedback(HapticPresets.success);
    if (goToStep2) {
      setCreatedStudentId(data.id);
      setStep(2);
    } else {
      onGuardado();
      onClose();
    }
  }

  async function handleGuardarPaso2() {
    if (!createdStudentId) return;
    const errs = validatePaso2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerHapticFeedback(HapticPresets.warning);
      return;
    }

    triggerHapticFeedback(HapticPresets.medium);
    setGuardando(true);

    let fechaProximoVencimiento = null;
    const planElegido = subscriptionPlans.find(
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
      alumno_id: createdStudentId,
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

    const { error: errorUpdate } = await supabase
      .from("alumnos")
      .update({
        abono_ultima_inscripcion: pagoForm.actividad,
        fecha_proximo_vencimiento: fechaProximoVencimiento,
        actividad_proximo_vencimiento: pagoForm.actividad,
        fecha_ultimo_inicio: pagoForm.fechaInicio,
      })
      .eq("id", createdStudentId);

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

  // Wrapper responsivo: BottomSheet en móvil, Modal en desktop
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
              {step === 1 ? "Nuevo Alumno" : "Registrar Cobro"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 1
                ? "Completá los datos personales."
                : "Asigná una actividad y registra el pago."}
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

        {/* Panel Paso 1 */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGuardarPaso1(false);
            }}
            className="px-4 md:px-6 py-5 flex flex-col gap-4 overflow-y-auto"
          >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Nacimiento *
                </label>
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => setField("fechaNacimiento", e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-base md:text-sm outline-none min-h-[44px] focus:border-red-400 focus:ring-2 focus:ring-red-50"
                />
                {errors.fechaNacimiento && (
                  <span className="text-xs text-red-500">
                    {errors.fechaNacimiento}
                  </span>
                )}
              </div>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

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

            <div className="flex flex-col gap-3 pt-3 mt-auto">
              <button
                type="button"
                disabled={guardando}
                onClick={() => handleGuardarPaso1(true)}
                className="w-full py-3 bg-[#DC2626] text-white text-base md:text-sm font-bold min-h-[44px] rounded-xl shadow-md hover:brightness-110 disabled:opacity-70 transition-all border border-transparent"
              >
                {guardando ? "Guardando..." : "Guardar y Registrar Cobro"}
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-gray-600 bg-gray-50 border border-gray-200 text-base md:text-sm font-semibold min-h-[44px] rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => handleGuardarPaso1(false)}
                  className="flex-1 py-2.5 text-red-600 bg-red-50 border border-red-100 text-base md:text-sm font-semibold min-h-[44px] rounded-lg hover:bg-red-100 disabled:opacity-70"
                >
                  Guardar
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
            className="px-4 md:px-6 py-5 flex flex-col gap-4"
          >
            <div className="p-4 bg-green-50 border border-green-100 text-green-800 rounded-xl text-sm font-medium mb-2 text-center">
              Alumno creado exitosamente.
            </div>

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
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Subcomponente: Tarjeta de Alumno
// ─────────────────────────────────────────────

function AlumnoCard({ alumno }: { alumno: AlumnoConUI }) {
  const tieneAsistencia = alumno.ultimaAsistencia?.fecha;
  const horaAsistencia = alumno.ultimaAsistencia?.hora?.slice(0, 5); // HH:MM

  // Obtener fecha de hoy en formato YYYY-MM-DD local
  const hoy = new Date();
  const fechaHoyStr = hoy.toLocaleDateString("en-CA"); // 'en-CA' da formato YYYY-MM-DD

  const esAsistenciaHoy = tieneAsistencia === fechaHoyStr;
  const esPrueba = alumno.es_prueba === true;

  return (
    <Link
      href={`/inicio/${alumno.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-4 md:p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer touch-manipulation"
    >
      <div className="flex items-center gap-3 md:gap-4 group min-h-[76px]">
        <div
          className="w-12 h-12 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 select-none"
          style={{ backgroundColor: esPrueba ? "#ea580c" : alumno.color }}
        >
          {alumno.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-base md:text-sm truncate">
              {alumno.nombre ?? "Sin nombre"}
            </p>
            {esPrueba && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full shrink-0">
                PRUEBA
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
}

// ─────────────────────────────────────────────
// Componente principal exportado
// ─────────────────────────────────────────────

interface AlumnosListProps {
  alumnos: AlumnoRow[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
  porPagina: number;
  queryActual: string;
}

export default function AlumnosList({
  alumnos,
  totalRegistros,
  paginaActual,
  totalPaginas,
  porPagina,
  queryActual,
}: AlumnosListProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Realtime: escucha cambios en múltiples tablas ─────────────────────────
  // Cuando se crea/actualiza un alumno, se registra una asistencia, o se crea un pago,
  // actualizamos la lista automáticamente sin recargar la página completa.
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;

    const handleRefresh = () => {
      if (isRefreshing) return;

      // Debounce: evita múltiples refreshes simultáneos
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        setIsRefreshing(true);
        console.log("[Realtime] Ejecutando refresh...");
        router.refresh();

        // Reset después de 500ms
        setTimeout(() => setIsRefreshing(false), 500);
      }, 100);
    };

    const channel = supabase
      .channel("inicio-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alumnos",
        },
        (payload) => {
          console.log(
            "[Realtime] Cambio detectado en alumnos:",
            payload.eventType,
          );
          handleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "asistencias",
        },
        (payload) => {
          console.log("[Realtime] Nueva asistencia registrada");
          handleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pagos",
        },
        (payload) => {
          console.log("[Realtime] Nuevo pago registrado");
          handleRefresh();
        },
      )
      .subscribe((status) => {
        console.log("[Realtime] Estado de suscripción:", status);
        if (status === "SUBSCRIBED") {
          console.log(
            "[Realtime] ✅ Listo para recibir actualizaciones en tiempo real",
          );
        }
        if (status === "CHANNEL_ERROR") {
          console.error(
            "[Realtime] ❌ Error en el canal. Verifica que Realtime esté habilitado en Supabase",
          );
        }
      });

    return () => {
      console.log("[Realtime] Limpiando suscripción");
      clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [router, isRefreshing]);

  // El filtrado es 100% server-side (ilike en Supabase).
  // Aquí solo enriquecemos los datos con UI derivada.
  const alumnosEnriquecidos = alumnos.map(enriquecerAlumno);

  function handleGuardado() {
    router.refresh(); // Refresca Server Component
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Modal con soporte para botón "Atrás" */}
      <ModalWithHistory isOpen={showModal} onClose={() => setShowModal(false)}>
        <NuevoAlumnoModal
          onClose={() => setShowModal(false)}
          onGuardado={handleGuardado}
        />
      </ModalWithHistory>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Alumnos
          </h1>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <p className="text-sm text-gray-400">
              {totalRegistros} alumnos registrados
            </p>
            <p className="text-xs text-gray-400 font-medium">
              Ordenados por orden de entrada
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 text-base md:text-sm font-semibold text-white px-5 py-3 md:px-4 md:py-2.5 min-h-[44px] rounded-lg hover:brightness-110 transition-all touch-manipulation select-none"
          style={{ backgroundColor: "#DC2626" }}
        >
          <Plus size={18} className="md:w-4 md:h-4" />
          Crear Alumno
        </button>
      </div>

      {/* Barra de búsqueda global (server-side, debounce 400ms) */}
      <div className="flex items-center gap-3 mb-4">
        <Buscador />
        <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2.5 min-h-[44px] shrink-0">
          <Filter size={15} className="text-gray-400" />
          <span className="text-sm text-gray-500 hidden md:inline">
            Pág. {paginaActual}/{totalPaginas}
          </span>
        </div>
      </div>

      {/* Conteo */}
      <p className="text-xs text-gray-400 mb-3 font-medium select-none">
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
            {alumnos.length} de {totalRegistros} alumnos (página {paginaActual})
          </>
        )}
      </p>

      {/* Grid de tarjetas */}
      {alumnosEnriquecidos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {alumnosEnriquecidos.map((alumno) => (
            <AlumnoCard key={alumno.id} alumno={alumno} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3 select-none">
            <Search size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-base">
            No se encontraron alumnos
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {queryActual
              ? `No hay resultados para "${queryActual}"`
              : "No hay alumnos en esta página"}
          </p>
        </div>
      )}

      {/* Paginación siempre visible (el filtro es server-side) */}
      <Paginacion
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        porPagina={porPagina}
      />
    </div>
  );
}
