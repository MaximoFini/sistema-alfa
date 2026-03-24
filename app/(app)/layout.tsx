import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-gray-50 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Navegación móvil (< md) */}
      <MobileNav />

      {/* Sidebar desktop (>= md) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pt-[calc(60px+env(safe-area-inset-top))] md:pt-0">
        {children}
      </main>
    </div>
  );
}
