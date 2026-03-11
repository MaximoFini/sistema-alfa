"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

const planificacionSubmenu = [
  { href: "/planificacion/planificador", label: "Planificador", icon: CalendarDays },
  { href: "/planificacion/base-ejercicios", label: "Base de ejercicios", icon: Dumbbell },
  { href: "/planificacion/planes", label: "Planes", icon: ClipboardList },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/administracion"))
  const [planOpen, setPlanOpen] = useState(pathname.startsWith("/planificacion"))

  function handleLogout() {
    router.push("/")
  }

  const isAdminActive = pathname.startsWith("/administracion")
  const isPlanActive = pathname.startsWith("/planificacion")

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
      style={{ backgroundColor: "#111111" }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-white/10 shrink-0",
          collapsed ? "justify-center py-3 px-2" : "px-4 py-3 gap-2"
        )}
      >
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20sin%20fondo%20-%20Alfa%20Club-wZgRj4RXWHpEBDZCGUmX2BQpTRkF2F.png"
          alt="Alfa Club"
          width={52}
          height={52}
          style={{ height: "auto" }}
          className="shrink-0 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]"
          priority
        />
        {!collapsed && (
          <span className="text-lg leading-tight tracking-widest uppercase font-extrabold" style={{ color: "#DC2626" }}>
            ALFA CLUB
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto">

        {/* Alumnos */}
        <Link
          href="/inicio"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            pathname === "/inicio" ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          )}
          style={pathname === "/inicio" ? { backgroundColor: "#DC2626" } : {}}
          title={collapsed ? "Alumnos" : undefined}
        >
          <Users size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Alumnos</span>}
        </Link>

        {/* Ingreso Web */}
        <Link
          href="/ingreso-web"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            pathname === "/ingreso-web" ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          )}
          style={pathname === "/ingreso-web" ? { backgroundColor: "#DC2626" } : {}}
          title={collapsed ? "Ingreso Web" : undefined}
        >
          <MonitorCheck size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Ingreso Web</span>}
        </Link>

        {/* Planificacion collapsible */}
        <div>
          <button
            onClick={() => {
              if (!collapsed) setPlanOpen((o) => !o)
              else router.push("/planificacion")
            }}
            className={cn(
              "w-full flex items-center rounded-lg transition-all duration-150",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
              isPlanActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
            style={isPlanActive ? { backgroundColor: "#DC2626" } : {}}
            title={collapsed ? "Planificacion" : undefined}
          >
            <BookOpen size={18} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm font-medium flex-1 text-left">Planificacion</span>
                {planOpen ? <ChevronUp size={14} className="shrink-0 opacity-70" /> : <ChevronDown size={14} className="shrink-0 opacity-70" />}
              </>
            )}
          </button>
          {!collapsed && planOpen && (
            <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
              {planificacionSubmenu.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all text-xs font-medium",
                      active ? "text-white bg-white/10" : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon size={14} className="shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Administracion collapsible */}
        <div>
          <button
            onClick={() => {
              if (!collapsed) setAdminOpen((o) => !o)
              router.push("/administracion")
            }}
            className={cn(
              "w-full flex items-center rounded-lg transition-all duration-150",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
              isAdminActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
            style={isAdminActive ? { backgroundColor: "#DC2626" } : {}}
            title={collapsed ? "Administracion" : undefined}
          >
            <ShieldCheck size={18} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm font-medium flex-1 text-left">Administracion</span>
                {adminOpen ? <ChevronUp size={14} className="shrink-0 opacity-70" /> : <ChevronDown size={14} className="shrink-0 opacity-70" />}
              </>
            )}
          </button>
        </div>

        {/* Comunicacion */}
        <Link
          href="/comunicacion"
          className={cn(
            "flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
            pathname === "/comunicacion" ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          )}
          style={pathname === "/comunicacion" ? { backgroundColor: "#DC2626" } : {}}
          title={collapsed ? "Comunicacion" : undefined}
        >
          <MessageSquare size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Comunicacion</span>}
        </Link>
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-4 flex flex-col gap-1 border-t border-white/10 pt-3 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all py-2",
            collapsed ? "justify-center px-2" : "gap-3 px-3"
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

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <User size={14} className="text-white/70" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-semibold truncate">Secretaria</span>
              <span className="text-white/40 text-xs truncate">secretaria@alfaclub.com</span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center rounded-lg transition-all py-2 hover:bg-white/5",
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          )}
          style={{ color: "#DC2626" }}
          title={collapsed ? "Cerrar Sesion" : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Cerrar Sesion</span>}
        </button>
      </div>
    </aside>
  )
}
