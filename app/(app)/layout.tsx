import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50">
      {/* Navegación móvil (< md) */}
      <MobileNav />

      {/* Sidebar desktop (>= md) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
