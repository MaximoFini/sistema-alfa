"use client";

import { useEffect, useRef } from "react";

/**
 * Hook personalizado para manejar el botón "Atrás" del navegador/dispositivo en modales y drawers.
 *
 * Cuando el modal se abre, agrega una entrada al historial del navegador.
 * Si el usuario presiona el botón "Atrás" (gesto nativo en móviles),
 * el modal se cierra en lugar de navegar a la página anterior.
 *
 * @param isOpen - Estado actual del modal (true = abierto, false = cerrado)
 * @param onClose - Función que cierra el modal (cambia isOpen a false)
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * useModalHistory(isOpen, () => setIsOpen(false));
 * ```
 */
export function useModalHistory(isOpen: boolean, onClose: () => void) {
  const isOpenRef = useRef(isOpen);
  const onCloseRef = useRef(onClose);
  const historyPushedRef = useRef(false);
  const isManualCloseRef = useRef(false);

  // Mantener refs actualizadas
  useEffect(() => {
    isOpenRef.current = isOpen;
    onCloseRef.current = onClose;
  }, [isOpen, onClose]);

  useEffect(() => {
    // Cuando el modal se abre
    if (isOpen && !historyPushedRef.current) {
      // Agregar entrada al historial
      window.history.pushState({ modalOpen: true }, "", window.location.href);
      historyPushedRef.current = true;
      isManualCloseRef.current = false;

      // Handler para el evento popstate (botón "Atrás")
      const handlePopState = (event: PopStateEvent) => {
        if (historyPushedRef.current && isOpenRef.current) {
          // El usuario presionó "Atrás", cerramos el modal
          event.preventDefault();
          historyPushedRef.current = false;
          onCloseRef.current();
        }
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);

        // Si el modal se cerró manualmente (botón X o click fuera)
        // limpiamos el historial para evitar estados huérfanos
        if (historyPushedRef.current && !isManualCloseRef.current) {
          isManualCloseRef.current = true;
          historyPushedRef.current = false;

          // Verificar si aún estamos en la entrada del modal
          if (window.history.state?.modalOpen) {
            window.history.back();
          }
        }
      };
    }

    // Cuando el modal se cierra manualmente
    if (!isOpen && historyPushedRef.current) {
      isManualCloseRef.current = true;
      historyPushedRef.current = false;

      // Retroceder en el historial si la entrada del modal sigue ahí
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    }
  }, [isOpen]);
}
