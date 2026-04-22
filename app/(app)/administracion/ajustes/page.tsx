"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Bell,
  Tag,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Save,
  Percent,
  Trash2,
  CreditCard,
  Users,
  Key,
  Mail,
  User,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSettings } from "@/hooks/use-admin-settings";

// ─── Accordion section wrapper ────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  icon: typeof DollarSign;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors overflow-hidden",
          open ? "rounded-t-2xl" : "rounded-2xl",
        )}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <Icon size={18} style={{ color: "#F97316" }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-50">{children}</div>
      )}
    </div>
  );
}

// ─── Number input row ────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  value,
  onChange,
  suffix,
  prefix,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        {description && (
          <span className="text-xs text-gray-400 leading-relaxed">
            {description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {prefix && (
          <span className="text-sm text-gray-400 font-medium">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          min={0}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-right border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all bg-gray-50"
        />
        {suffix && (
          <span className="text-sm text-gray-400 font-medium w-10">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Custom fast Tooltip ─────────────────────────────────────────────────────
function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group/tip inline-flex items-center justify-center">
      {children}
      <div
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
          "px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap shadow-lg",
          "opacity-0 group-hover/tip:opacity-100",
          "transition-opacity duration-100 [transition-delay:0ms] group-hover/tip:[transition-delay:150ms]",
        )}
      >
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AjustesPage() {
  // Use cached hook with realtime updates
  const {
    settings,
    settingsLoading,
    planes,
    planesLoading,
    metodos,
    metodosLoading,
    usuarios,
    usuariosLoading,
    updateSettings,
    togglePlan: togglePlanStore,
    updatePlan: updatePlanStore,
    addPlan: addPlanStore,
    deletePlan: deletePlanStore,
    toggleMetodo: toggleMetodoStore,
    updateMetodo: updateMetodoStore,
    addMetodo: addMetodoStore,
    deleteMetodo: deleteMetodoStore,
    toggleUserActive: toggleUserActiveStore,
    toggleUserAdmin: toggleUserAdminStore,
    updateUser: updateUserStore,
    addUser: addUserStore,
    deleteUser: deleteUserStore,
  } = useAdminSettings();

  // Local state for alertas
  const [diasVencimiento, setDiasVencimiento] = useState("5");
  const [diasSinAsistencia30, setDiasSinAsistencia30] = useState("15");
  const [diasSinAsistencia60, setDiasSinAsistencia60] = useState("30");
  const [diasSinAsistencia90, setDiasSinAsistencia90] = useState("60");
  const [diasInactivo, setDiasInactivo] = useState("7");
  const [diasPerdido, setDiasPerdido] = useState("90");

  // Update local state when settings load from store
  useEffect(() => {
    if (settings) {
      setDiasVencimiento(String(settings.notify_days_before_expiration));
      setDiasSinAsistencia30(String(settings.alert_1_days_no_attendance));
      setDiasSinAsistencia60(String(settings.alert_2_days_no_attendance));
      setDiasSinAsistencia90(String(settings.alert_3_days_no_attendance));
      setDiasInactivo(String(settings.days_after_expiration_inactive));
      setDiasPerdido(String(settings.days_without_renewal_lost));
    }
  }, [settings]);

  // Planes UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editDuracion, setEditDuracion] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newPrecio, setNewPrecio] = useState("");
  const [newDuracion, setNewDuracion] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  // Medios de pago UI state
  const [editingMetodoId, setEditingMetodoId] = useState<string | null>(null);
  const [editMetodoNombre, setEditMetodoNombre] = useState("");
  const [newMetodoNombre, setNewMetodoNombre] = useState("");
  const [showNewMetodo, setShowNewMetodo] = useState(false);

  // Usuarios UI state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showNewUser, setShowNewUser] = useState(false);
  const [generatingPassword, setGeneratingPassword] = useState<string | null>(
    null,
  );

  const loading =
    settingsLoading || planesLoading || metodosLoading || usuariosLoading;

  async function togglePlan(plan: any) {
    await togglePlanStore(plan.id);
  }

  function startEdit(plan: any) {
    setEditingId(plan.id);
    setEditNombre(plan.nombre);
    setEditPrecio(String(plan.precio));
    setEditDuracion(String(plan.duracion_dias));
  }

  async function saveEdit() {
    if (!editingId) return;
    await updatePlanStore(editingId, {
      nombre: editNombre,
      precio: Number(editPrecio),
      duracion_dias: Number(editDuracion),
    });
    setEditingId(null);
  }

  async function addPlan() {
    if (!newNombre.trim() || !newPrecio || !newDuracion) return;
    await addPlanStore({
      nombre: newNombre.trim(),
      precio: Number(newPrecio),
      duracion_dias: Number(newDuracion),
    });
    setNewNombre("");
    setNewPrecio("");
    setNewDuracion("");
    setShowNew(false);
  }

  async function deletePlan(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este plan?")) return;
    await deletePlanStore(id);
  }

  // ─── Payment Methods Logic ──────────────────────────────────────────────────
  async function toggleMetodo(metodo: any) {
    await toggleMetodoStore(metodo.id);
  }

  function startEditMetodo(metodo: any) {
    setEditingMetodoId(metodo.id);
    setEditMetodoNombre(metodo.nombre);
  }

  async function saveEditMetodo() {
    if (!editingMetodoId || !editMetodoNombre.trim()) return;
    await updateMetodoStore(editingMetodoId, editMetodoNombre.trim());
    setEditingMetodoId(null);
  }

  async function addMetodo() {
    if (!newMetodoNombre.trim()) return;
    await addMetodoStore(newMetodoNombre.trim());
    setNewMetodoNombre("");
    setShowNewMetodo(false);
  }

  async function deleteMetodo(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este medio de pago?"))
      return;
    await deleteMetodoStore(id);
  }

  // ─── Users Logic ─────────────────────────────────────────────────────────────
  async function toggleUserActive(user: any) {
    await toggleUserActiveStore(user.id);
  }

  async function toggleUserAdmin(user: any) {
    await toggleUserAdminStore(user.id);
  }

  function startEditUser(user: any) {
    setEditingUserId(user.id);
    setEditUserName(user.username);
    setEditUserEmail(user.email);
  }

  async function saveEditUser() {
    if (!editingUserId || !editUserName.trim() || !editUserEmail.trim()) return;

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUserId,
          username: editUserName.trim(),
          email: editUserEmail.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al actualizar el usuario");
        return;
      }

      await updateUserStore(editingUserId, {
        username: editUserName.trim(),
        email: editUserEmail.trim(),
      });
      setEditingUserId(null);
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el usuario");
    }
  }

  async function addUser() {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim())
      return;

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword.trim(),
          isAdmin: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al crear el usuario");
        return;
      }

      const data = await response.json();

      if (data.canLogin === false) {
        alert(
          "⚠️ Usuario creado en la tabla de gestión, pero NO podrá hacer login.\n\n" +
            "Para habilitar el login, configura SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
        );
      }

      await addUserStore({
        username: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
      });
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setShowNewUser(false);
    } catch (error) {
      console.error(error);
      alert("Error al crear el usuario");
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    await deleteUserStore(id);
  }

  function generatePassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async function resetUserPassword(user: any) {
    const newPassword = generatePassword();
    setGeneratingPassword(user.id);

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al generar la contraseña");
        setGeneratingPassword(null);
        return;
      }

      alert(
        `Nueva contraseña para ${user.username}:\n\n${newPassword}\n\nGuarda esta contraseña, no se mostrará nuevamente.`,
      );
    } catch (error) {
      console.error(error);
      alert("Error al generar la contraseña");
    }

    setGeneratingPassword(null);
  }

  async function handleSaveAll() {
    if (settings) {
      await updateSettings({
        notify_days_before_expiration: Number(diasVencimiento),
        alert_1_days_no_attendance: Number(diasSinAsistencia30),
        alert_2_days_no_attendance: Number(diasSinAsistencia60),
        alert_3_days_no_attendance: Number(diasSinAsistencia90),
        days_after_expiration_inactive: Number(diasInactivo),
        days_without_renewal_lost: Number(diasPerdido),
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">
            Cargando configuración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full mx-auto flex flex-col gap-6 bg-[#FAFAFA] min-h-screen">
      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Alertas (The foundation) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <Section
            icon={Bell}
            title="Alertas y Notificaciones"
            subtitle="Automatización de seguimiento y avisos"
          >
            <div className="space-y-1 mt-2">
              <SettingRow
                label="Dias aviso vencimiento"
                description="Dias antes para notificar cuota"
                value={diasVencimiento}
                onChange={setDiasVencimiento}
                suffix="días"
              />
              <SettingRow
                label="Alerta nivel 1(riesgo de abandono)"
                description="Dias sin renovar"
                value={diasSinAsistencia30}
                onChange={setDiasSinAsistencia30}
                suffix="días"
              />
              <SettingRow
                label="Alerta nivel 2(Abandono)"
                description="Dias sin renovare"
                value={diasSinAsistencia60}
                onChange={setDiasSinAsistencia60}
                suffix="días"
              />
              <SettingRow
                label="Alerta nivel 3(Critica)"
                description="Dias sin renovar"
                value={diasSinAsistencia90}
                onChange={setDiasSinAsistencia90}
                suffix="días"
              />
              <SettingRow
                label="Alumno Activo a Desactivo"
                description="Dias para pasar a estado Inactivo"
                value={diasInactivo}
                onChange={setDiasInactivo}
                suffix="días"
              />
              <SettingRow
                label="Alumno Perdido"
                description="Dias sin renovar para marcar como perdido"
                value={diasPerdido}
                onChange={setDiasPerdido}
                suffix="días"
              />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveAll}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95",
                  saved
                    ? "bg-green-600 text-white"
                    : "bg-[#111111] text-white hover:bg-gray-800",
                )}
              >
                <Save size={16} />
                {saved ? "¡Cambios Guardados!" : "Guardar cambios"}
              </button>
            </div>
          </Section>

          {/* New Payment Methods Section integrated here for density */}
          <Section
            icon={CreditCard}
            title="Medios de Pago"
            subtitle="Configuración de pasarelas y cobros"
          >
            <div className="flex flex-col gap-2 mt-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {metodos.map((metodo) => (
                <div
                  key={metodo.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border group transition-all",
                    metodo.activo
                      ? "bg-white border-gray-100 shadow-sm"
                      : "bg-gray-50/50 border-gray-100 opacity-60",
                  )}
                >
                  {editingMetodoId === metodo.id ? (
                    <div className="flex items-center gap-3 w-full">
                      <input
                        value={editMetodoNombre}
                        onChange={(e) => setEditMetodoNombre(e.target.value)}
                        autoFocus
                        className="flex-1 bg-white border border-orange-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-400"
                      />
                      <Tooltip label="Guardar cambios">
                        <button
                          onClick={saveEditMetodo}
                          className="p-2 bg-[#111111] text-white rounded-lg hover:bg-gray-800 transition-all"
                        >
                          <Save size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-gray-800">
                          {metodo.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip label="Editar nombre">
                          <button
                            onClick={() => startEditMetodo(metodo)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Eliminar medio de pago">
                          <button
                            onClick={() => deleteMetodo(metodo.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </div>
                      <Tooltip label={metodo.activo ? "Desactivar" : "Activar"}>
                        <button
                          onClick={() => toggleMetodo(metodo)}
                          className="shrink-0"
                        >
                          {metodo.activo ? (
                            <ToggleRight size={24} className="text-orange-500" />
                          ) : (
                            <ToggleLeft size={24} className="text-gray-300" />
                          )}
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              ))}
              {showNewMetodo ? (
                <div className="p-3 bg-orange-50/30 border border-dashed border-orange-200 rounded-xl space-y-3">
                  <input
                    value={newMetodoNombre}
                    onChange={(e) => setNewMetodoNombre(e.target.value)}
                    placeholder="Nombre del medio..."
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowNewMetodo(false)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={addMetodo}
                      className="bg-[#111111] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewMetodo(true)}
                  className="py-3 items-center justify-center flex gap-2 border border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs font-bold mt-1"
                >
                  <Plus size={14} /> Nuevo medio de pago
                </button>
              )}
            </div>
          </Section>
        </div>

        {/* Right Column: Planes (The intensive part) */}
        <div className="xl:col-span-7 flex flex-col gap-6 h-full">
          {/* Users Section - at the top next to Medios de Pago */}
          <Section
            icon={Users}
            title="Control de Usuarios"
            subtitle="Gestión de accesos y permisos del sistema"
          >
            <div className="flex flex-col gap-2 mt-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className={cn(
                    "flex flex-col gap-3 px-4 py-3 rounded-xl border group transition-all",
                    usuario.is_active
                      ? "bg-white border-gray-100 shadow-sm"
                      : "bg-gray-50/50 border-gray-100 opacity-60",
                  )}
                >
                  {editingUserId === usuario.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <input
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          placeholder="Nombre de usuario"
                          autoFocus
                          className="flex-1 bg-white border border-orange-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <input
                          value={editUserEmail}
                          onChange={(e) => setEditUserEmail(e.target.value)}
                          placeholder="Email"
                          type="email"
                          className="flex-1 bg-white border border-orange-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-400"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="text-xs font-bold text-gray-400 px-3"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveEditUser}
                          className="p-2 bg-[#111111] text-white rounded-lg hover:bg-gray-800 transition-all text-xs font-bold px-4"
                        >
                          <Save size={12} className="inline mr-1" /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900 truncate">
                              {usuario.username}
                            </span>
                            {usuario.is_admin && (
                              <span className="text-[9px] uppercase tracking-widest font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail size={11} />
                            <span className="truncate">{usuario.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Tooltip
                            label={
                              usuario.is_active
                                ? "Desactivar usuario"
                                : "Activar usuario"
                            }
                          >
                            <button
                              onClick={() => toggleUserActive(usuario)}
                              className="transition-transform active:scale-90"
                            >
                              {usuario.is_active ? (
                                <ToggleRight
                                  size={20}
                                  className="text-green-500"
                                />
                              ) : (
                                <ToggleLeft
                                  size={20}
                                  className="text-gray-300"
                                />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                        <Tooltip
                          label={
                            usuario.is_admin
                              ? "Quitar permisos de administrador"
                              : "Dar permisos de administrador"
                          }
                        >
                        <button
                          onClick={() => toggleUserAdmin(usuario)}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-orange-600"
                        >
                          {usuario.is_admin ? (
                            <CheckSquare
                              size={14}
                              className="text-orange-600"
                            />
                          ) : (
                            <Square size={14} className="text-gray-400" />
                          )}
                          <span
                            className={
                              usuario.is_admin
                                ? "text-orange-600"
                                : "text-gray-400"
                            }
                          >
                            Administrador
                          </span>
                        </button>
                        </Tooltip>

                        <div className="flex items-center gap-1">
                          <Tooltip label="Editar datos del usuario">
                            <button
                              onClick={() => startEditUser(usuario)}
                              className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Generar nueva contraseña">
                            <button
                              onClick={() => resetUserPassword(usuario)}
                              disabled={generatingPassword === usuario.id}
                              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                            >
                              <Key size={13} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Eliminar usuario">
                            <button
                              onClick={() => deleteUser(usuario.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {showNewUser ? (
                <div className="p-4 bg-orange-50/30 border border-dashed border-orange-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <input
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Nombre de usuario"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <input
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Key size={14} className="text-gray-400" />
                    <input
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Contraseña"
                      type="password"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                    <Tooltip label="Generar contraseña aleatoria">
                      <button
                        onClick={() => setNewUserPassword(generatePassword())}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all text-xs font-bold"
                      >
                        <Key size={14} />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowNewUser(false);
                        setNewUserName("");
                        setNewUserEmail("");
                        setNewUserPassword("");
                      }}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={addUser}
                      className="bg-[#111111] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
                    >
                      Crear Usuario
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewUser(true)}
                  className="py-3 items-center justify-center flex gap-2 border border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs font-bold mt-1"
                >
                  <Plus size={14} /> Nuevo usuario
                </button>
              )}
            </div>
          </Section>
          <Section
            icon={Tag}
            title="Categorías y Planes"
            subtitle="Catálogo de servicios y suscripciones"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {planes.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col gap-3 p-4 rounded-2xl border transition-all relative group",
                    plan.activo
                      ? "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100"
                      : "bg-gray-50/50 border-gray-100 opacity-60",
                  )}
                >
                  {editingId === plan.id ? (
                    <div className="flex flex-col gap-3">
                      <input
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            value={editPrecio}
                            onChange={(e) => setEditPrecio(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm"
                          />
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={editDuracion}
                            onChange={(e) => setEditDuracion(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">
                            días
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs font-bold text-gray-400 px-3"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveEdit}
                          className="bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-lg"
                        >
                          <Save size={12} className="inline mr-1" /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-900 truncate">
                            {plan.nombre}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-gray-900 tracking-tight">
                              ${plan.precio.toLocaleString("es-AR")}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {plan.duracion_dias} días
                            </span>
                          </div>
                        </div>
                        <Tooltip label={plan.activo ? "Desactivar plan" : "Activar plan"}>
                          <button
                            onClick={() => togglePlan(plan)}
                            className="transition-transform active:scale-90"
                          >
                            {plan.activo ? (
                              <ToggleRight
                                size={24}
                                className="text-orange-500"
                              />
                            ) : (
                              <ToggleLeft size={24} className="text-gray-300" />
                            )}
                          </button>
                        </Tooltip>
                      </div>

                      <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip label="Editar plan">
                          <button
                            onClick={() => startEdit(plan)}
                            className="p-2 text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-100 rounded-lg"
                          >
                            <Pencil size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Eliminar plan">
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {showNew ? (
                <div className="p-5 border-2 border-dashed border-orange-200 bg-orange-50/20 rounded-2xl flex flex-col gap-4">
                  <div className="space-y-3">
                    <input
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      placeholder="Nombre del plan (Ej: Trimestral)"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm outline-none focus:border-orange-400"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          value={newPrecio}
                          onChange={(e) => setNewPrecio(e.target.value)}
                          placeholder="Precio"
                          className="w-full bg-white border border-gray-200 rounded-xl pl-7 pr-4 py-2 text-sm outline-none"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={newDuracion}
                          onChange={(e) => setNewDuracion(e.target.value)}
                          placeholder="Semanas/Días"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">
                          DÍAS
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-4">
                    <button
                      onClick={() => setShowNew(false)}
                      className="text-xs font-black text-gray-400 hover:text-gray-600"
                    >
                      CANCELAR
                    </button>
                    <button
                      onClick={addPlan}
                      className="bg-[#111111] text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> CREAR PLAN
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNew(true)}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all gap-2 group min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-100 transition-all">
                    <Plus size={20} className="group-hover:text-orange-500" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">
                    Añadir Nuevo Plan
                  </span>
                </button>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
