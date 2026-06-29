"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePowerSync } from "@powersync/react";
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";
import {
  User,
  Phone,
  PhoneCall,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Dumbbell,
  Clock,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  Gift,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Mail,
  FileText,
} from "lucide-react";

interface Alumno {
  id: string;
  nombre: string | null;
  edad_actual: number | null;
  fecha_registro: string | null;
  dni: string | null;
  domicilio: string | null;
  telefono: string | null;
  fecha_proximo_vencimiento: string | null;
  abono_ultima_inscripcion: string | null;
  actividad_proximo_vencimiento: string | null;
  fecha_ultimo_inicio: string | null;
  fecha_ultima_asistencia: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
  clases_gracia_disponibles: number;
  clases_gracia_usadas: number;
  cus_completado: boolean;
  cus_clases_presentadas: number;
  email: string | null;
  telefono_emergencia: string | null;
  observaciones: string | null;
  activo?: boolean | number | null;
  es_prueba?: boolean | number | null;
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const clean = dateStr.split("T")[0];
  const [y, m, d] = clean.split("-");
  return `${d}/${m}/${y}`;
}

function getInitials(nombre: string | null): string {
  if (!nombre) return "?";
  const words = nombre.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

const AVATAR_COLORS = [
  "#1a1a1a",
  "#2d2d2d",
  "#404040",
  "#525252",
  "#6b7280",
  "#78716c",
  "#ea580c",
  "#374151",
];

function getAvatarColor(nombre: string | null): string {
  if (!nombre) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function DataField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-foreground break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 pt-5 pb-1">
      {children}
    </p>
  );
}

export default function PanelInfoPersonal({
  alumno,
  diasInactivo,
  onAlumnoActualizado,
}: {
  alumno: Alumno;
  diasInactivo: number;
  onAlumnoActualizado?: (datos: Partial<Alumno>) => void;
}) {
  const router = useRouter();
  const db = usePowerSync();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPressingDelete, setIsPressingDelete] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [otorgandoGracia, setOtorgandoGracia] = useState(false);
  const [clasesGraciaDisponibles, setClasesGraciaDisponibles] = useState(
    alumno.clases_gracia_disponibles,
  );
  const [clasesGraciaUsadas, setClasesGraciaUsadas] = useState(
    alumno.clases_gracia_usadas,
  );

  // CUS state
  const [cusCompletado, setCusCompletado] = useState(alumno.cus_completado);
  const [cusClasesPresentadas, setCusClasesPresentadas] = useState(
    alumno.cus_clases_presentadas,
  );
  const [marcandoCus, setMarcandoCus] = useState(false);

  // Sync state when alumno prop updates (e.g. from server fetch)
  useEffect(() => {
    setClasesGraciaDisponibles(alumno.clases_gracia_disponibles);
    setClasesGraciaUsadas(alumno.clases_gracia_usadas);
    setCusCompletado(alumno.cus_completado);
    setCusClasesPresentadas(alumno.cus_clases_presentadas);
  }, [alumno]);

  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: alumno.nombre ?? "",
    dni: alumno.dni ?? "",
    domicilio: alumno.domicilio ?? "",
    telefono: alumno.telefono ?? "",
    fecha_nacimiento: alumno.fecha_nacimiento ?? "",
    genero: alumno.genero ?? "",
    email: alumno.email ?? "",
    telefonoEmergencia: alumno.telefono_emergencia ?? "",
    observaciones: alumno.observaciones ?? "",
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparar solo fechas

  const vencimiento = alumno.fecha_proximo_vencimiento
    ? new Date(alumno.fecha_proximo_vencimiento)
    : null;

  // El alumno está activo si no ha pasado el periodo de gracia después del vencimiento o si tiene clases de gracia disponibles
  let estaActivo = false;
  let tienePlanActivoHoy = false;
  if (alumno.activo === false || alumno.activo === 0) {
    estaActivo = false;
  } else if (alumno.es_prueba === true) {
    estaActivo = true; // Trials are active until set to inactive
  } else {
    if (vencimiento) {
      vencimiento.setHours(0, 0, 0, 0); // Normalizar a medianoche
      tienePlanActivoHoy = vencimiento >= hoy;
      const vencimientoConGracia = new Date(vencimiento);
      vencimientoConGracia.setDate(vencimientoConGracia.getDate() + diasInactivo);
      estaActivo = vencimientoConGracia >= hoy;
    }
    if (!estaActivo && (clasesGraciaDisponibles ?? 0) > (clasesGraciaUsadas ?? 0)) {
      estaActivo = true;
    }
  }

  const initials = getInitials(alumno.nombre);
  const avatarColor = getAvatarColor(alumno.nombre);
  const telefonoLimpio = alumno.telefono?.replace(/\D/g, "") ?? "";

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

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!formData.nombre.trim()) e.nombre = "El nombre es requerido";
    if (!formData.dni.trim()) e.dni = "El DNI es requerido";
    if (!formData.domicilio.trim()) e.domicilio = "La dirección es requerida";
    if (!formData.telefono.trim()) e.telefono = "El teléfono es requerido";
    if (!formData.fecha_nacimiento)
      e.fecha_nacimiento = "La fecha de nacimiento es requerida";
    if (!formData.genero) e.genero = "El género es requerido";

    if (formData.telefonoEmergencia.trim()) {
      const cleanTel = formData.telefono.replace(/\D/g, "");
      const cleanEmerg = formData.telefonoEmergencia.replace(/\D/g, "");
      if (cleanTel && cleanEmerg && cleanTel === cleanEmerg) {
        e.telefonoEmergencia = "El contacto de emergencia no puede ser igual al teléfono del alumno";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleGuardarCambios() {
    if (!validateForm()) {
      triggerHapticFeedback(HapticPresets.warning);
      return;
    }

    triggerHapticFeedback(HapticPresets.medium);
    setGuardando(true);

    // Verificar si ya existe otro alumno con el mismo DNI (local query)
    const dniCheck = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM alumnos WHERE dni = ? AND id != ?",
      [formData.dni.trim(), alumno.id]
    );

    if (dniCheck.count > 0) {
      setGuardando(false);
      setErrors({ dni: "Ya existe otro alumno registrado con este DNI" });
      triggerHapticFeedback(HapticPresets.warning);
      return;
    }

    const edadCalculada = calcularEdad(formData.fecha_nacimiento);

    try {
      await db.execute(
        `UPDATE alumnos SET nombre = ?, dni = ?, domicilio = ?, telefono = ?, fecha_nacimiento = ?, genero = ?, edad_actual = ?, email = ?, telefono_emergencia = ?, observaciones = ? WHERE id = ?`,
        [
          formData.nombre.trim(),
          formData.dni.trim(),
          formData.domicilio.trim(),
          formData.telefono.trim(),
          formData.fecha_nacimiento,
          formData.genero,
          edadCalculada,
          formData.email.trim() || null,
          formData.telefonoEmergencia.trim() || null,
          formData.observaciones.trim() || null,
          alumno.id,
        ]
      );
    } catch (e: any) {
      setGuardando(false);
      triggerHapticFeedback(HapticPresets.error);
      alert("Error al actualizar el alumno: " + (e.message || e));
      return;
    }

    setGuardando(false);

    if (onAlumnoActualizado) {
      onAlumnoActualizado({
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        domicilio: formData.domicilio.trim(),
        telefono: formData.telefono.trim(),
        fecha_nacimiento: formData.fecha_nacimiento,
        genero: formData.genero,
        edad_actual: edadCalculada,
        email: formData.email.trim() || null,
        telefono_emergencia: formData.telefonoEmergencia.trim() || null,
        observaciones: formData.observaciones.trim() || null,
      });
    }

    triggerHapticFeedback(HapticPresets.success);
    setShowEditModal(false);
  }

  async function handleEliminar() {
    triggerHapticFeedback(HapticPresets.heavy);
    setEliminando(true);

    try {
      await db.execute("DELETE FROM alumnos WHERE id = ?", [alumno.id]);
    } catch (e: any) {
      setEliminando(false);
      triggerHapticFeedback(HapticPresets.error);
      alert("Error al eliminar el alumno: " + (e.message || e));
      return;
    }

    setEliminando(false);

    triggerHapticFeedback(HapticPresets.success);
    // Redirigir a la lista de alumnos
    router.push("/inicio");
  }

  async function handleOtorgarGracia() {
    triggerHapticFeedback(HapticPresets.medium);
    setOtorgandoGracia(true);
    try {
      await db.execute(
        "UPDATE alumnos SET clases_gracia_disponibles = ?, clases_gracia_usadas = ?, activo = 1 WHERE id = ?",
        [2, 0, alumno.id]
      );
    } catch (e: any) {
      setOtorgandoGracia(false);
      triggerHapticFeedback(HapticPresets.error);
      alert("Error al otorgar clases de gracia: " + (e.message || e));
      return;
    }

    triggerHapticFeedback(HapticPresets.success);
    // Optistic UI update for instant feedback
    setClasesGraciaDisponibles(2);
    setClasesGraciaUsadas(0);
    if (onAlumnoActualizado) {
      onAlumnoActualizado({
        clases_gracia_disponibles: 2,
        clases_gracia_usadas: 0,
        activo: true,
      });
    }
    setOtorgandoGracia(false);
  }


  async function handleMarcarCusCompletado() {
    triggerHapticFeedback(HapticPresets.medium);
    
    // UI Optimista: Update locally first
    setCusCompletado(true);
    if (onAlumnoActualizado) {
      onAlumnoActualizado({ cus_completado: true });
    }
    setMarcandoCus(true);

    try {
      await db.execute(
        "UPDATE alumnos SET cus_completado = ? WHERE id = ?",
        [1, alumno.id]
      );
    } catch (e: any) {
      // Revert on error
      setCusCompletado(false);
      if (onAlumnoActualizado) {
        onAlumnoActualizado({ cus_completado: false });
      }
      setMarcandoCus(false);
      triggerHapticFeedback(HapticPresets.error);
      alert("Error al actualizar CUS: " + (e.message || e));
      return;
    }

    setMarcandoCus(false);
    triggerHapticFeedback(HapticPresets.success);
  }

  const LONG_PRESS_DURATION = 3000; // 3 segundos

  function handleDeleteMouseDown() {
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
      handleEliminar();
      setShowDeleteModal(false);
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
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header del panel: avatar + nombre + estado */}
      <div
        className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4 bg-card"
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black tracking-tight shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>

        {/* Nombre */}
        <div>
          <h2 className="text-base font-extrabold text-foreground leading-tight text-balance">
            {alumno.nombre ?? "Sin nombre"}
          </h2>
          {alumno.edad_actual != null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {alumno.edad_actual} años
            </p>
          )}
        </div>

        {/* Badge de estado */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
            estaActivo
              ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30"
              : "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
          }`}
        >
          {estaActivo ? (
            <CheckCircle size={11} strokeWidth={2.5} />
          ) : (
            <XCircle size={11} strokeWidth={2.5} />
          )}
          {estaActivo ? "Activo" : "Inactivo"}
        </span>

        {/* Warning de límite alcanzado */}
        {!estaActivo && (
          <div className="w-full mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-xs font-bold text-red-600">
              {alumno.es_prueba === true 
                ? "Límite de clases de prueba alcanzado" 
                : (clasesGraciaDisponibles > 0 && clasesGraciaUsadas >= clasesGraciaDisponibles)
                  ? "Clases de gracia al límite"
                  : "Membresía vencida o inactivo"}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 w-full mt-2">
          <button
            onClick={() => {
              setFormData({
                nombre: alumno.nombre ?? "",
                dni: alumno.dni ?? "",
                domicilio: alumno.domicilio ?? "",
                telefono: alumno.telefono ?? "",
                fecha_nacimiento: alumno.fecha_nacimiento ?? "",
                genero: alumno.genero ?? "",
                email: alumno.email ?? "",
                telefonoEmergencia: alumno.telefono_emergencia ?? "",
                observaciones: alumno.observaciones ?? "",
              });
              setErrors({});
              setShowEditModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted/70 transition-colors"
          >
            <Edit2 size={14} />
            Editar
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-500/15 transition-colors"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>

        {/* Clases de gracia — visible si no tiene plan activo hoy */}
        {!tienePlanActivoHoy && (
          <div className="w-full mt-1 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col gap-2">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Clases de Gracia
            </p>
            {clasesGraciaDisponibles > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-600">
                    Usadas:{" "}
                    <span className="font-bold">
                      {clasesGraciaUsadas} / {clasesGraciaDisponibles}
                    </span>
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      clasesGraciaUsadas >= clasesGraciaDisponibles
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-500/15 text-orange-600"
                    }`}
                  >
                    {clasesGraciaDisponibles - clasesGraciaUsadas > 0
                      ? `${clasesGraciaDisponibles - clasesGraciaUsadas} disponibles`
                      : "Agotadas"}
                  </span>
                </div>
              </>
            ) : (
              <button
                onClick={handleOtorgarGracia}
                disabled={otorgandoGracia}
                className="flex items-center justify-center gap-2 w-full py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                <Gift size={13} />
                {otorgandoGracia
                  ? "Otorgando..."
                  : "Otorgar 2 clases de gracia"}
              </button>
            )}
          </div>
        )}

        {/* Panel CUS — solo visible para menores de edad */}
        {alumno.edad_actual != null && alumno.edad_actual < 18 && (
          <div
            className={`w-full mt-2 p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
              cusCompletado
                ? "bg-green-50/50 border-green-200"
                : "bg-orange-50/50 border-orange-200 shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className={cusCompletado ? "hidden" : "text-orange-500"} size={16} />
                  <ShieldCheck className={cusCompletado ? "text-green-600" : "hidden"} size={16} />
                  <h4 className={`text-sm font-bold ${cusCompletado ? 'text-green-700' : 'text-orange-700'}`}>
                    Certificado Médico
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  {cusCompletado 
                    ? "Presentado correctamente." 
                    : "Requerido para menores de edad."}
                </p>
              </div>
              
              <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
                cusCompletado 
                  ? "bg-green-100 text-green-700" 
                  : "bg-orange-100 text-orange-700"
              }`}>
                {cusCompletado ? "Entregado" : "Pendiente"}
              </span>
            </div>

            {!cusCompletado && (
              <>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-orange-800/80">Clases de margen usadas</span>
                    <span className={cusClasesPresentadas >= 3 ? "text-red-600 font-bold" : "text-orange-700 font-bold"}>
                      {cusClasesPresentadas} / 3
                    </span>
                  </div>
                  <div className="h-2 w-full bg-orange-200/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${cusClasesPresentadas >= 3 ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min((cusClasesPresentadas / 3) * 100, 100)}%` }}
                    />
                  </div>
                  <p className={`text-[10px] text-right font-semibold ${cusClasesPresentadas >= 3 ? 'text-red-500' : 'text-orange-600/80'}`}>
                    {3 - cusClasesPresentadas > 0 
                      ? `Quedan ${3 - cusClasesPresentadas} clases` 
                      : "Plazo vencido"}
                  </p>
                </div>
                
                <button
                  onClick={handleMarcarCusCompletado}
                  disabled={marcandoCus}
                  className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 hover:shadow-md transition-all disabled:opacity-60 disabled:hover:shadow-none"
                >
                  <ShieldCheck size={16} />
                  {marcandoCus ? "Registrando..." : "Marcar como entregado"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setShowEditModal(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-card rounded-2xl shadow-2xl w-[95vw] md:w-full md:max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Editar Alumno
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Modifica los datos personales
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    setErrors({ ...errors, nombre: "" });
                  }}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
                {errors.nombre && (
                  <span className="text-xs text-red-500">{errors.nombre}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  DNI *
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => {
                    setFormData({ ...formData, dni: e.target.value });
                    setErrors({ ...errors, dni: "" });
                  }}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
                {errors.dni && (
                  <span className="text-xs text-red-500">{errors.dni}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      fecha_nacimiento: e.target.value,
                    });
                    setErrors({ ...errors, fecha_nacimiento: "" });
                  }}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
                {errors.fecha_nacimiento && (
                  <span className="text-xs text-red-500">
                    {errors.fecha_nacimiento}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Género *
                </label>
                <div className="relative">
                  <select
                    value={formData.genero}
                    onChange={(e) => {
                      setFormData({ ...formData, genero: e.target.value });
                      setErrors({ ...errors, genero: "" });
                    }}
                    className="w-full border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 bg-background text-foreground appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                </div>
                {errors.genero && (
                  <span className="text-xs text-red-500">{errors.genero}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => {
                    setFormData({ ...formData, telefono: e.target.value });
                    setErrors({ ...errors, telefono: "", telefonoEmergencia: "" });
                  }}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
                {errors.telefono && (
                  <span className="text-xs text-red-500">
                    {errors.telefono}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Contacto de Emergencia (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.telefonoEmergencia}
                  onChange={(e) => {
                    setFormData({ ...formData, telefonoEmergencia: e.target.value });
                    setErrors({ ...errors, telefonoEmergencia: "" });
                  }}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
                {errors.telefonoEmergencia && (
                  <span className="text-xs text-red-500">
                    {errors.telefonoEmergencia}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={formData.domicilio}
                  onChange={(e) => {
                    setFormData({ ...formData, domicilio: e.target.value });
                    setErrors({ ...errors, domicilio: "" });
                  }}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
                {errors.domicilio && (
                  <span className="text-xs text-red-500">
                    {errors.domicilio}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Ej: juan@gmail.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Observaciones / Notas Médicas o de Lesiones (Opcional)
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => {
                    setFormData({ ...formData, observaciones: e.target.value });
                  }}
                  rows={3}
                  className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 resize-y"
                  placeholder="Ej: Alergia al polvo, lesión en rodilla derecha"
                />
              </div>

              </div> {/* Cierre del grid */}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 text-muted-foreground bg-muted border border-border text-sm font-semibold rounded-lg hover:bg-muted/70"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarCambios}
                  disabled={guardando}
                  className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 disabled:opacity-70"
                >
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setShowDeleteModal(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-card rounded-2xl shadow-2xl w-[90vw] md:w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  ¿Eliminar alumno?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Esta acción eliminará permanentemente a{" "}
                  <span className="font-semibold text-foreground">
                    {alumno.nombre}
                  </span>
                  , junto con todas sus asistencias y pagos registrados.
                </p>
                <p className="text-sm text-red-500 font-medium mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="w-full p-3 bg-muted border border-border rounded-lg">
                <p className="text-xs text-muted-foreground font-medium whitespace-break-spaces">
                  💡 Mantén presionado el botón "Eliminar" durante 3 segundos
                  para confirmar
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 text-muted-foreground bg-muted border border-border text-sm font-semibold rounded-lg hover:bg-muted/70"
                  disabled={isPressingDelete}
                >
                  Cancelar
                </button>
                <button
                  onMouseDown={handleDeleteMouseDown}
                  onMouseUp={handleDeleteMouseUp}
                  onMouseLeave={handleDeleteMouseUp}
                  onTouchStart={handleDeleteMouseDown}
                  onTouchEnd={handleDeleteMouseUp}
                  disabled={eliminando}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-70 relative overflow-hidden transition-all select-none"
                  title={
                    isPressingDelete
                      ? "Mantén presionado para eliminar..."
                      : "Mantén presionado 3 segundos para eliminar"
                  }
                >
                  {/* Barra de progreso de fondo */}
                  <div
                    className="absolute inset-0 bg-red-700 transition-all"
                    style={{
                      width: isPressingDelete ? `${deleteProgress}%` : "0%",
                      zIndex: 0,
                    }}
                  />
                  {/* Contenido del botón */}
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
                      <>Eliminar</>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Sección: Observaciones / Notas */}
      {alumno.observaciones && (
        <>
          <div className="mx-6 mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-100 flex gap-3 items-start">
            <FileText size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 min-w-0">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Observaciones / Notas Médicas
              </h4>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                {alumno.observaciones}
              </p>
            </div>
          </div>
          {/* Divider */}
          <div className="h-px bg-border mt-5" />
        </>
      )}

      {/* Sección: Datos personales */}
      <SectionTitle>Datos personales</SectionTitle>
      
      {alumno.telefono_emergencia && (
        <div className="mx-6 my-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <PhoneCall size={16} className="text-red-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-0.5">
              Contacto de Emergencia
            </p>
            <p className="text-sm font-bold text-foreground break-words">
              {alumno.telefono_emergencia}
            </p>
          </div>
        </div>
      )}

      <div className="px-6 divide-y divide-border mb-6">
        {alumno.dni && (
          <DataField
            icon={<CreditCard size={14} />}
            label="DNI"
            value={alumno.dni}
          />
        )}
        {alumno.genero && (
          <DataField
            icon={<User size={14} />}
            label="Género"
            value={alumno.genero}
          />
        )}
        {alumno.domicilio && (
          <DataField
            icon={<MapPin size={14} />}
            label="Domicilio"
            value={alumno.domicilio}
          />
        )}
        {alumno.telefono && (
          <DataField
            icon={<Phone size={14} />}
            label="Teléfono"
            value={
              <span className="flex flex-col gap-1.5">
                <span>{alumno.telefono}</span>
                <a
                  href={`https://wa.me/${telefonoLimpio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-2.5 py-1.5 rounded-lg transition-colors w-fit"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </span>
            }
          />
        )}
        {alumno.fecha_registro && (
          <DataField
            icon={<Calendar size={14} />}
            label="Alumno desde"
            value={formatFecha(alumno.fecha_registro)}
          />
        )}
        {alumno.email && (
          <DataField
            icon={<Mail size={14} />}
            label="Email"
            value={alumno.email}
          />
        )}
      </div>
    </div>
  );
}
