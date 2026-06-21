import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { PowerSyncProvider } from "@/components/PowerSyncProvider";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PowerSyncProvider>
      <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-gray-50 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <MobileNav />

        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto pt-[calc(60px+env(safe-area-inset-top))] md:pt-0">
          {children}
        </main>

        <ConnectionStatus />
      </div>
    </PowerSyncProvider>
  );
}
