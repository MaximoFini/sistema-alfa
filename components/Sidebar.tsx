"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Users,
  BarChart2,
  DollarSign,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/inicio", label: "Alumnos", icon: Users },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart2 },
  { href: "/finanzas", label: "Finanzas", icon: DollarSign },
  { href: "/comunicacion", label: "Comunicación", icon: MessageSquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    router.push("/")
  }

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
          width={collapsed ? 36 : 52}
          height={collapsed ? 42 : 62}
          className="shrink-0 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]"
        />
        {!collapsed && (
          <span className="text-white font-extrabold text-lg leading-tight tracking-widest uppercase">
            ALFA CLUB
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center rounded-lg transition-all duration-150 group",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                active
                  ? "text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
              style={active ? { backgroundColor: "#DC2626" } : {}}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-4 flex flex-col gap-1 border-t border-white/10 pt-3 shrink-0">
        {/* Collapse toggle */}
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

        {/* User */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <User size={14} className="text-white/70" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-semibold truncate">
                Secretaría
              </span>
              <span className="text-white/40 text-xs truncate">
                secretaria@alfaclub.com
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center rounded-lg transition-all py-2 hover:bg-white/5",
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          )}
          style={{ color: "#DC2626" }}
          title={collapsed ? "Cerrar Sesión" : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </aside>
  )
}
