"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  LogOut,
  User,
  MonitorCheck,
  ShieldCheck,
  BookOpen,
  CalendarDays,
  Dumbbell,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserProfile, UserProfile } from "@/lib/auth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  }

  const isPlanActive = pathname.startsWith("/planificacion");
  const isAdminActive = pathname.startsWith("/administracion");

  return (
    <>
      {/* Top Bar móvil con logo y hamburguesa */}
      <div
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-gray-200"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Logo */}
        <Link href="/inicio" className="flex items-center gap-2">
          <Image
            src="/Logo sin fondo - Alfa Club.png"
            alt="Alfa Club"
            width={40}
            height={40}
            priority
          />
          <span
            className="text-sm leading-tight tracking-widest uppercase font-extrabold"
            style={{ color: "#DC2626" }}
          >
            ALFA CLUB
          </span>
        </Link>

        {/* Botón hamburguesa */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors touch-manipulation"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[280px] p-0 border-r border-gray-200"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div className="flex flex-col h-full">
              {/* Header del Sheet */}
              <SheetHeader className="px-4 py-4 border-b border-gray-200">
                <SheetTitle className="flex items-center gap-2">
                  <Image
                    src="/Logo sin fondo - Alfa Club.png"
                    alt="Alfa Club"
                    width={36}
                    height={36}
                    priority
                  />
                  <span
                    className="text-base leading-tight tracking-widest uppercase font-extrabold"
                    style={{ color: "#DC2626" }}
                  >
                    MENÚ
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* Navegación */}
              <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
                {/* Alumnos */}
                <Link
                  href="/inicio"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation",
                    pathname === "/inicio"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                  style={
                    pathname === "/inicio" ? { backgroundColor: "#DC2626" } : {}
                  }
                >
                  <Users size={20} className="shrink-0" />
                  <span className="text-base font-medium">Alumnos</span>
                </Link>

                {/* Ingreso Web */}
                <Link
                  href="/ingreso-web"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation",
                    pathname === "/ingreso-web"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                  style={
                    pathname === "/ingreso-web"
                      ? { backgroundColor: "#DC2626" }
                      : {}
                  }
                >
                  <MonitorCheck size={20} className="shrink-0" />
                  <span className="text-base font-medium">Ingreso Web</span>
                </Link>

                {/* Planificación (collapsible) */}
                <div>
                  <button
                    onClick={() => setPlanOpen(!planOpen)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation",
                      isPlanActive
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                    style={isPlanActive ? { backgroundColor: "#DC2626" } : {}}
                  >
                    <BookOpen size={20} className="shrink-0" />
                    <span className="text-base font-medium flex-1 text-left">
                      Planificación
                    </span>
                  </button>
                  {planOpen && (
                    <div className="ml-6 mt-1 flex flex-col gap-1">
                      {planificacionSubmenu.map(
                        ({ href, label, icon: Icon }) => {
                          const active = pathname === href;
                          return (
                            <Link
                              key={href}
                              href={href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg transition-all text-sm font-medium touch-manipulation",
                                active
                                  ? "text-[#DC2626]"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                              )}
                              style={active ? { backgroundColor: "#FEF2F2" } : {}}
                            >
                              <Icon size={16} className="shrink-0" />
                              {label}
                            </Link>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>

                {/* Administración */}
                {profile?.role === "Administrador" && (
                  <Link
                    href="/administracion"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation",
                      isAdminActive
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                    style={isAdminActive ? { backgroundColor: "#DC2626" } : {}}
                  >
                    <ShieldCheck size={20} className="shrink-0" />
                    <span className="text-base font-medium">Administración</span>
                  </Link>
                )}

                {/* Comunicación */}
                <Link
                  href="/comunicacion"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation",
                    pathname === "/comunicacion"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                  style={
                    pathname === "/comunicacion"
                      ? { backgroundColor: "#DC2626" }
                      : {}
                  }
                >
                  <MessageSquare size={20} className="shrink-0" />
                  <span className="text-base font-medium">Comunicación</span>
                </Link>
              </nav>

              {/* Usuario y logout */}
              <div className="px-3 pb-4 flex flex-col gap-2 border-t border-gray-200 pt-3">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-gray-600" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-900 text-sm font-semibold truncate">
                      {profile?.full_name || profile?.role || "Cargando..."}
                    </span>
                    <span className="text-gray-500 text-xs truncate">
                      {profile?.email || ""}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg hover:bg-red-50 transition-all touch-manipulation"
                  style={{ color: "#DC2626" }}
                >
                  <LogOut size={18} className="shrink-0" />
                  <span className="text-base font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
