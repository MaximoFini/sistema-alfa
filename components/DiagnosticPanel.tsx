"use client";

import { usePowerSync } from "@powersync/react";
import { useState, useEffect } from "react";
import { 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Database,
  CheckCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DiagnosticPanel() {
  const db = usePowerSync();
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState(db.currentStatus);

  // Subscribe to PowerSync status changes
  useEffect(() => {
    setStatus(db.currentStatus);
    const unregister = db.registerListener({
      statusChanged: (newStatus) => {
        setStatus(newStatus);
      },
    });
    return () => {
      unregister();
    };
  }, [db]);

  const handleReset = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas restablecer la base de datos local?\n\nEsta acción vaciará las tablas locales y forzará una descarga completa de datos desde el servidor. Úsalo si detectas problemas de sincronización, datos desactualizados o errores de consistencia."
    );

    if (!confirmed) return;

    try {
      setIsResetting(true);
      
      // Disconnect and clear PowerSync DB (clears WASQLite / IndexedDB tables)
      await db.disconnectAndClear();

      // Clear local storage keys except the Supabase auth token
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && !key.startsWith("sb-") && !key.includes("supabase.auth.token")) {
          localStorage.removeItem(key);
        }
      }

      alert("Base de datos local limpia con éxito. La aplicación se recargará para descargar los datos actualizados.");
      window.location.reload();
    } catch (error) {
      console.error("Error al restablecer la base de datos:", error);
      alert(
        "Error al restablecer la base de datos local: " + 
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsResetting(false);
    }
  };

  // Determine actual connection state description
  let connectionLabel = "Desconectado";
  let statusColor = "text-gray-500 bg-gray-100 border-gray-200";
  let Icon = WifiOff;

  if (status.connected) {
    if (status.dataFlowStatus?.downloading || status.dataFlowStatus?.uploading) {
      connectionLabel = "Sincronizando";
      statusColor = "text-blue-700 bg-blue-50 border-blue-200";
      Icon = RefreshCw;
    } else {
      connectionLabel = "Conectado";
      statusColor = "text-green-700 bg-green-50 border-green-200";
      Icon = Wifi;
    }
  } else if (status.connecting) {
    connectionLabel = "Conectando...";
    statusColor = "text-yellow-700 bg-yellow-50 border-yellow-200";
    Icon = RefreshCw;
  } else if (status.dataFlowStatus?.downloadError || status.dataFlowStatus?.uploadError) {
    connectionLabel = "Error de Conexión";
    statusColor = "text-red-700 bg-red-50 border-red-200";
    Icon = AlertTriangle;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Subtle trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-full bg-white text-gray-400 hover:text-gray-600 shadow-md border border-gray-200 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
          title="Panel de Diagnóstico de Base de Datos"
          aria-label="Panel de Diagnóstico"
        >
          <Settings className="w-5 h-5 animate-hover-spin" />
        </button>
      )}

      {/* Popover Diagnostic Panel */}
      {isOpen && (
        <div className="w-80 rounded-2xl bg-white border border-gray-200 shadow-xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
              <Database className="w-4.5 h-4.5 text-orange-500" />
              <span>Diagnóstico DB Local</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Display */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Estado de Red/Sync:</span>
              <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold", statusColor)}>
                <Icon className={cn("w-3.5 h-3.5", { "animate-spin": connectionLabel === "Sincronizando" || connectionLabel === "Conectando..." })} />
                <span>{connectionLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border border-gray-100 rounded-xl p-2.5 bg-gray-50/50">
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-400 text-[10px]">Descargas:</span>
                <span className="font-semibold text-gray-700">
                  {status.dataFlowStatus?.downloading ? "Activas" : "Inactivas"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-400 text-[10px]">Subidas:</span>
                <span className="font-semibold text-gray-700">
                  {status.dataFlowStatus?.uploading ? "Activas" : "Inactivas"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 col-span-2 pt-1 border-t border-gray-100">
                <span className="text-gray-400 text-[10px]">Primera Sincronización:</span>
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  {status.hasSynced ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 inline" /> Completada
                    </>
                  ) : (
                    "Pendiente"
                  )}
                </span>
              </div>
            </div>

            {/* Error notifications */}
            {(status.dataFlowStatus?.downloadError || status.dataFlowStatus?.uploadError) && (
              <div className="p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[11px] flex flex-col gap-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Detalle de error detectado</span>
                </div>
                <p className="line-clamp-2 leading-relaxed opacity-90">
                  {status.dataFlowStatus?.downloadError?.message || status.dataFlowStatus?.uploadError?.message || "Error desconocido al sincronizar"}
                </p>
              </div>
            )}
          </div>

          {/* Reset Action */}
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className={cn(
                "w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 transition-colors shadow-sm flex items-center justify-center gap-2",
                { "cursor-not-allowed": isResetting }
              )}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Restableciendo...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restablecer Base de Datos Local</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2 leading-relaxed">
              Limpia el almacenamiento SQLite local y vuelve a descargar todo desde la nube.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
