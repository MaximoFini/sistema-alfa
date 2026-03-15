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
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [planOpen, setPlanOpen] = useState(
    pathname.startsWith("/planificacion"),
  );

  function handleLogout() {
    router.push("/");
  }

  const isAdminActive = pathname.startsWith("/administracion");
  const isPlanActive = pathname.startsWith("/planificacion");
  const isIngresoActive = pathname.startsWith("/ingreso-web");
  const isProductosActive = pathname.startsWith("/productos-ventas");

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-[width] duration-75 ease-linear shrink-0 border-r border-neutral-800",
        collapsed ? "w-16" : "w-56",
      )}
      style={{ backgroundColor: "#000000" }}
    >
      {/* Logo */}
      <Link
        href="/inicio"
        className={cn(
          "flex items-center border-b border-neutral-800 shrink-0 hover:bg-neutral-900 transition-colors cursor-pointer justify-center",
          collapsed ? "py-3 px-2" : "px-4 py-3",
        )}
      >
        <Image
          src="/Mejor logo.png"
          alt="Mejor logo"
          width={52}
          height={52}
          className="shrink-0"
          priority
        />
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
              : "text-gray-400 hover:text-white hover:bg-neutral-800",
          )}
          style={pathname === "/inicio" ? { backgroundColor: "#DC2626" } : {}}
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
                : "text-gray-400 hover:text-white hover:bg-neutral-800",
            )}
            style={isPlanActive ? { backgroundColor: "#DC2626" } : {}}
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
            <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-800 pl-3">
              {planificacionSubmenu.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all text-xs font-medium",
                      active
                        ? "text-white bg-neutral-800"
                        : "text-gray-400 hover:text-white hover:bg-neutral-800",
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

        {/* Productos y Ventas */}
        <Link
          href="/productos-ventas"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            isProductosActive
              ? "text-white"
              : "text-gray-400 hover:text-white hover:bg-neutral-800",
          )}
          style={isProductosActive ? { backgroundColor: "#DC2626" } : {}}
          title={collapsed ? "Productos y Ventas" : undefined}
        >
          <ShoppingBag size={18} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Productos y Ventas</span>
          )}
        </Link>

        {/* Comunicacion */}
        <Link
          href="/comunicacion"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            pathname === "/comunicacion"
              ? "text-white"
              : "text-gray-400 hover:text-white hover:bg-neutral-800",
          )}
          style={
            pathname === "/comunicacion" ? { backgroundColor: "#DC2626" } : {}
          }
          title={collapsed ? "Comunicacion" : undefined}
        >
          <MessageSquare size={18} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Comunicacion</span>
          )}
        </Link>

        {/* Administracion */}
        <Link
          href="/administracion"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            isAdminActive
              ? "text-white"
              : "text-gray-400 hover:text-white hover:bg-neutral-800",
          )}
          style={isAdminActive ? { backgroundColor: "#DC2626" } : {}}
          title={collapsed ? "Administracion" : undefined}
        >
          <ShieldCheck size={18} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Administracion</span>
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
              : "text-gray-400 hover:text-white hover:bg-neutral-800",
          )}
          style={isIngresoActive ? { backgroundColor: "#DC2626" } : {}}
          title={collapsed ? "Ingreso Web" : undefined}
        >
          <MonitorCheck size={18} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Ingreso Web</span>
          )}
        </Link>
      </div>

      {/* Bottom section */}
      <div className="px-2 pb-4 flex flex-col gap-1 border-t border-neutral-800 pt-3 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800 transition-all py-2",
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
          <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
            <User size={14} className="text-gray-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-semibold truncate">
                Secretaria
              </span>
              <span className="text-gray-400 text-xs truncate">
                secretaria@alfaclub.com
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center rounded-lg transition-all py-2 hover:bg-neutral-800",
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
