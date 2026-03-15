"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BarChart2,
  DollarSign,
  Eye,
  EyeOff,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EstadisticasPage from "@/app/(app)/estadisticas/page";
import FinanzasPage from "@/app/(app)/finanzas/page";
import AjustesPage from "@/app/(app)/administracion/ajustes/page";

const PASSWORD = "admin123";

type Tab = "estadisticas" | "finanzas" | "ajustes";

const tabs: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
  { id: "estadisticas", label: "Estadisticas", icon: BarChart2 },
  { id: "finanzas", label: "Finanzas", icon: DollarSign },
  { id: "ajustes", label: "Ajustes de Negocio", icon: Settings },
];

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value === PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setValue("");
    }
  }

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4 py-8">
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
            Esta sección es de acceso restringido. Ingresá la contraseña para
            continuar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="admin-password"
              className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={show ? "text" : "password"}
                value={value}
                autoFocus
                autoComplete="current-password"
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
                )}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-400 hover:text-gray-600 touch-manipulation"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium">
                Contraseña incorrecta. Intentalo de nuevo.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full min-h-[44px] py-3 rounded-xl text-white font-bold text-base hover:brightness-110 transition-all touch-manipulation select-none"
            style={{ backgroundColor: "#DC2626" }}
          >
            Ingresar
          </button>
        </form>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

export default function AdministracionPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("estadisticas");

  if (!authenticated)
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tabs sin scroll horizontal */}
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
                  "flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm md:text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap touch-manipulation select-none",
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
        {activeTab === "estadisticas" && <EstadisticasPage />}
        {activeTab === "finanzas" && <FinanzasPage />}
        {activeTab === "ajustes" && <AjustesPage />}
      </div>
    </div>
  );
}
