/**
 * Configuración de prefetch y caché para optimizar la navegación
 * Este archivo se debe importar en el layout principal de la app
 */

import React, { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch de las rutas más comunes después del login
    const commonRoutes = ["/inicio", "/planificacion", "/comunicacion"];

    // Pequeño delay para no interferir con la carga inicial
    const timeoutId = setTimeout(() => {
      commonRoutes.forEach((route) => {
        router.prefetch(route);
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [router]);
}

/**
 * Hook para optimizar la actualización de datos en tiempo real
 * Usa debouncing para evitar renderizados excesivos
 */
export function useOptimizedRealtime<T>(
  initialData: T,
  updateInterval: number = 300,
): [T, (data: T) => void] {
  const [data, setData] = useState<T>(initialData);
  const [pending, setPending] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const updateData = useCallback(
    (newData: T) => {
      setPending(newData);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setPending(null);
        setData(newData);
      }, updateInterval);
    },
    [updateInterval],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [pending || data, updateData];
}
