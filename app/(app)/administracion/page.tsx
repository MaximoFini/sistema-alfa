"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BarChart2,
  DollarSign,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldX,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useAdminStore } from "@/stores/admin-store";
import { useAdminSettingsStore } from "@/hooks/use-admin-settings";
import EstadisticasPage from "@/app/(app)/estadisticas/page";
import FinanzasPage from "@/app/(app)/finanzas/page";
import AjustesPage from "@/app/(app)/administracion/ajustes/page";
import EstadisticasProductosPage from "@/app/(app)/administracion/_components/EstadisticasProductos";

type Tab = "estadisticas" | "estadisticas-productos" | "finanzas" | "ajustes";

const tabs: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
  { id: "estadisticas", label: "Estadisticas Clientes", icon: BarChart2 },
  {
    id: "estadisticas-productos",
    label: "Estadisticas de Productos",
    icon: BarChart2,
  },
  { id: "finanzas", label: "Finanzas", icon: DollarSign },
  { id: "ajustes", label: "Ajustes de Negocio", icon: Settings },
];

function PasswordGate({
  userEmail,
  onSuccess,
}: {
  userEmail: string;
  onSuccess: () => void;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;

    setLoading(true);
    // Verificamos la contraseña real intentando iniciar sesión con ella
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: userEmail,
        password: value,
      },
    );
    setLoading(false);

    if (signInError) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setValue("");
    } else {
      setError(false);
      onSuccess();
    }
  }

  return (
    <div className="bg-[#111111] flex items-center justify-center px-4 py-8 min-h-full">
      <div
        className={cn(
          "bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 md:p-8 flex flex-col items-center gap-5 md:gap-6",
          shake && "animate-[shake_0.4s_ease-in-out]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20sin%20fondo%20-%20Alfa%20Club-wZgRj4RXWHpEBDZCGUmX2BQpTRkF2F.png"
          alt="Alfa Club"
          width={64}
          style={{ height: "auto" }}
          className="select-none"
        />
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: "#f97316" }} />
            <span className="font-bold text-gray-900 text-base">
              Zona de Administración
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Ingresá tu contraseña de acceso para continuar a esta sección
            protegida.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {error && (
              <p className="text-sm text-orange-600 font-medium mb-1">
                Contraseña incorrecta. Intentalo de nuevo.
              </p>
            )}
            <div className="relative">
              <input
                id="admin-password"
                type={show ? "text" : "password"}
                value={value}
                autoFocus
                autoComplete="current-password"
                disabled={loading}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(false);
                }}
                placeholder="••••••••"
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-base min-h-[44px] outline-none transition-all pr-12",
                  error
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-gray-50 focus:border-[#f97316] focus:ring-2 focus:ring-orange-100",
                  loading && "opacity-50 cursor-not-allowed",
                )}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-400 hover:text-gray-600 touch-manipulation disabled:opacity-50"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 min-h-[44px] py-3 rounded-xl text-white font-bold text-base hover:brightness-110 transition-all touch-manipulation select-none disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: "#f97316" }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

export default function AdministracionPage() {
  const { user, role, loading, refreshAuth } = useAuth();
  const [status, setStatus] = useState<
    "loading" | "authorized" | "denied" | "timeout"
  >("loading");
  const { authenticated, setAuthenticated, fetchFinanzasStats } =
    useAdminStore();
  const { fetchSettings, fetchPlanes, fetchMetodos } = useAdminSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>("estadisticas");

  useEffect(() => {
    if (loading) return;

    if (!user || role !== "Administrador") {
      setStatus("denied");
      return;
    }

    setStatus("authorized");
  }, [user, role, loading]);

  // Timeout de seguridad: si la carga no resuelve en 8s, mostrar reintentar
  useEffect(() => {
    if (status !== "loading") return;
    const id = setTimeout(() => setStatus("timeout"), 8000);
    return () => clearTimeout(id);
  }, [status]);

  // Cuando el usuario pasa el PasswordGate, iniciar carga en segundo plano
  useEffect(() => {
    if (!authenticated) return;
    fetchFinanzasStats();
    fetchSettings();
    fetchPlanes();
    fetchMetodos();
  }, [
    authenticated,
    fetchFinanzasStats,
    fetchSettings,
    fetchPlanes,
    fetchMetodos,
  ]);

  if (status === "loading") {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
            <ShieldX size={28} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              La verificación tardó demasiado
            </h2>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              No se pudo confirmar el acceso. Revisá tu conexión e intentá de
              nuevo.
            </p>
          </div>
          <button
            onClick={() => {
              refreshAuth();
              setStatus("loading");
            }}
            className="w-full min-h-[44px] rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: "#f97316" }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-full bg-[#111111] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
            <ShieldX size={28} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Acceso denegado</h2>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              No tenés permisos para acceder a la zona de administración.
              Contactá a un administrador para solicitar acceso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ahora si es authorized (Administrador), mostramos el PasswordGate si no se autenticó todavía.
  // Es seguro hacer user!.email porque status es solo "authorized" si existe user y rol es Administrador.
  if (!authenticated && user?.email) {
    return (
      <PasswordGate
        userEmail={user.email}
        onSuccess={() => setAuthenticated(true)}
      />
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex flex-col relative">
      {/* Contenedor principal con z-index para estar por encima del fondo */}
      <div className="relative z-10 flex flex-col flex-1 w-full">
        {/* Header mejorado con título y tabs */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 md:px-6 lg:px-8">
            {/* Sección de título */}
            <div className="pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Panel de Administración
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Gestión completa del sistema y negocio
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs mejorados */}
            <div className="flex items-center gap-2 pt-3 pb-0 flex-wrap -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2.5 px-5 py-3.5 min-h-[44px] text-sm font-semibold rounded-t-xl transition-all duration-200 whitespace-nowrap touch-manipulation select-none group",
                      isActive
                        ? "text-[#f97316] bg-gradient-to-b from-orange-50 to-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/80",
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-transform duration-200",
                        isActive && "scale-110",
                        !isActive && "group-hover:scale-105",
                      )}
                    />
                    <span>{tab.label}</span>
                    {/* Indicador activo */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div
            style={{ display: activeTab === "estadisticas" ? "block" : "none" }}
          >
            <EstadisticasPage />
          </div>
          <div
            style={{
              display:
                activeTab === "estadisticas-productos" ? "block" : "none",
            }}
          >
            <EstadisticasProductosPage />
          </div>
          <div style={{ display: activeTab === "finanzas" ? "block" : "none" }}>
            <FinanzasPage />
          </div>
          <div style={{ display: activeTab === "ajustes" ? "block" : "none" }}>
            <AjustesPage />
          </div>
        </div>
      </div>
    </div>
  );
}
