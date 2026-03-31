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
import { getUserProfile, UserProfile } from "@/lib/auth";
import EstadisticasPage from "@/app/(app)/estadisticas/page";
import FinanzasPage from "@/app/(app)/finanzas/page";
import AjustesPage from "@/app/(app)/administracion/ajustes/page";
import EstadisticasProductosPage from "@/app/(app)/administracion/_components/EstadisticasProductos";

type Tab = "estadisticas" | "estadisticas-productos" | "finanzas" | "ajustes";

const tabs: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
  { id: "estadisticas", label: "Estadisticas Clientes", icon: BarChart2 },
  { id: "estadisticas-productos", label: "Estadisticas de Productos", icon: BarChart2 },
  { id: "finanzas", label: "Finanzas", icon: DollarSign },
  { id: "ajustes", label: "Ajustes de Negocio", icon: Settings },
];

function PasswordGate({ userEmail, onSuccess }: { userEmail: string; onSuccess: () => void }) {
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
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: value
    });
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
            <ShieldCheck size={18} style={{ color: "#DC2626" }} />
            <span className="font-bold text-gray-900 text-base">
              Zona de Administración
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Ingresá tu contraseña de acceso para continuar a esta sección protegida.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {error && (
              <p className="text-sm text-red-600 font-medium mb-1">
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
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50 focus:border-[#DC2626] focus:ring-2 focus:ring-red-100",
                  loading && "opacity-50 cursor-not-allowed"
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
            style={{ backgroundColor: "#DC2626" }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Ingresar"}
          </button>
        </form>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

export default function AdministracionPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("estadisticas");

  useEffect(() => {
    async function checkRole() {
      const userProfile = await getUserProfile();
      if (!userProfile) { 
        setStatus("denied"); 
        return; 
      }
      setProfile(userProfile);
      setStatus(userProfile.role === "Administrador" ? "authorized" : "denied");
    }
    checkRole();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-full bg-[#111111] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldX size={28} className="text-red-500" />
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
  // Es seguro hacer profile!.email porque status es solo "authorized" si existe perfil y rol es Administrador.
  if (!authenticated && profile?.email) {
    return <PasswordGate userEmail={profile.email} onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      <div className="border-b border-gray-100 bg-white">
        <div className="flex items-center gap-1 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-0 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap touch-manipulation select-none",
                  isActive
                    ? "border-[#DC2626] text-[#DC2626]"
                    : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200",
                )}
              >
                <Icon size={16} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1">
        <div style={{ display: activeTab === "estadisticas" ? "block" : "none" }}>
          <EstadisticasPage />
        </div>
        <div style={{ display: activeTab === "estadisticas-productos" ? "block" : "none" }}>
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
  );
}
