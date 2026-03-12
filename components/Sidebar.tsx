"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  MonitorCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Dumbbell,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserProfile, UserProfile } from "@/lib/auth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const planificacionSubmenu = [
  {
    href: "/planificacion/planificador",
    label: "Planificador",
    icon: CalendarDays,
  },
  {
    href: "/planificacion/base-ejercicios",
    label: "Base de ejercicios",
    icon: Dumbbell,
  },
  { href: "/planificacion/planes", label: "Planes", icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [planOpen, setPlanOpen] = useState(
    pathname.startsWith("/planificacion"),
  );

  useEffect(() => {
    async function loadProfile() {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const isAdminActive = pathname.startsWith("/administracion");
  const isPlanActive = pathname.startsWith("/planificacion");
  const isIngresoActive = pathname.startsWith("/ingreso-web");

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-[width] duration-75 ease-linear shrink-0 border-r",
        collapsed ? "w-16" : "w-56",
      )}
      style={{ backgroundColor: "#FFFFFF", borderColor: "#e5e7eb" }}
    >
      {/* Logo */}
      <Link
        href="/inicio"
        className={cn(
          "flex items-center border-b border-gray-200 shrink-0 hover:bg-gray-50 transition-colors cursor-pointer",
          collapsed ? "justify-center py-3 px-2" : "px-4 py-3 gap-2",
        )}
      >
        <Image
          src="/Logo sin fondo - Alfa Club.png"
          alt="Alfa Club"
          width={52}
          height={52}
          className="shrink-0"
          priority
        />
        {!collapsed && (
          <span
            className="text-lg leading-tight tracking-widest uppercase font-extrabold"
            style={{ color: "#DC2626" }}
          >
            ALFA CLUB
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto">
        {/* Alumnos */}
        <Link
          href="/inicio"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            pathname === "/inicio"
              ? "text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          )}
          style={pathname === "/inicio" ? { backgroundColor: "#ea580c" } : {}}
          title={collapsed ? "Alumnos" : undefined}
        >
          <Users size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Alumnos</span>}
        </Link>

        {/* Ingreso Web is moved to the bottom section to open in a new tab */}

        {/* Planificacion collapsible */}
        <div>
          <button
            onClick={() => {
              if (!collapsed) setPlanOpen((o) => !o);
              else router.push("/planificacion");
            }}
            className={cn(
              "w-full flex items-center rounded-lg transition-all duration-150",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
              isPlanActive
                ? "text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
            style={isPlanActive ? { backgroundColor: "#ea580c" } : {}}
            title={collapsed ? "Planificacion" : undefined}
          >
            <BookOpen size={18} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm font-medium flex-1 text-left">
                  Planificacion
                </span>
                {planOpen ? (
                  <ChevronUp size={14} className="shrink-0 opacity-70" />
                ) : (
                  <ChevronDown size={14} className="shrink-0 opacity-70" />
                )}
              </>
            )}
          </button>
          {!collapsed && planOpen && (
            <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-gray-200 pl-3">
              {planificacionSubmenu.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all text-xs font-medium",
                      active
                        ? "text-gray-900 bg-gray-100"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                    )}
                  >
                    <Icon size={14} className="shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Administracion */}
        {profile?.role === "Administrador" && (
          <Link
            href="/administracion"
            className={cn(
              "flex items-center rounded-lg transition-all duration-150",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
              isAdminActive
                ? "text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
            style={isAdminActive ? { backgroundColor: "#ea580c" } : {}}
            title={collapsed ? "Administracion" : undefined}
          >
            <ShieldCheck size={18} className="shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Administracion</span>
            )}
          </Link>
        )}

        {/* Comunicacion */}
        <Link
          href="/comunicacion"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            pathname === "/comunicacion"
              ? "text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          )}
          style={
            pathname === "/comunicacion" ? { backgroundColor: "#ea580c" } : {}
          }
          title={collapsed ? "Comunicacion" : undefined}
        >
          <MessageSquare size={18} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Comunicacion</span>
          )}
        </Link>
      </nav>

      {/* Ingreso Web placed just above the divider */}
      <div className="px-2 pb-1 shrink-0">
        <Link
          href="/ingreso-web"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            isIngresoActive
              ? "text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          )}
          style={isIngresoActive ? { backgroundColor: "#ea580c" } : {}}
          title={collapsed ? "Ingreso Web" : undefined}
        >
          <MonitorCheck size={18} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Ingreso Web</span>
          )}
        </Link>
      </div>

      {/* Bottom section */}
      <div className="px-2 pb-4 flex flex-col gap-1 border-t border-gray-200 pt-3 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all py-2",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs font-medium">Colapsar</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <User size={14} className="text-gray-600" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-gray-900 text-xs font-semibold truncate">
                {profile?.full_name || profile?.role || "Cargando..."}
              </span>
              <span className="text-gray-500 text-[10px] truncate">
                {profile?.email || ""}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center rounded-lg transition-all py-2 hover:bg-red-50",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
          style={{ color: "#DC2626" }}
          title={collapsed ? "Cerrar Sesion" : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Cerrar Sesion</span>
          )}
        </button>
      </div>
    </aside>
  );
}
