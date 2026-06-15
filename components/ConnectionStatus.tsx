"use client";

import { useStatus } from "@powersync/react";

export function ConnectionStatus() {
  const status = useStatus();

  if (status.connected) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-4">
      Sin conexion — los cambios se sincronizaran al reconectar
    </div>
  );
}
