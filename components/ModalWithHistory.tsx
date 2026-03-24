"use client";

import { useModalHistory } from "@/hooks/use-modal-history";
import { useEffect } from "react";

interface ModalWithHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Wrapper para modales personalizados que integra el manejo del botón "Atrás".
 * Úsalo para envolver tus modales custom que no usan componentes de Shadcn UI.
 *
 * @example
 * ```tsx
 * function MiModalPersonalizado({ onClose }: { onClose: () => void }) {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <ModalWithHistory isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *       <div className="fixed inset-0 bg-black/60" onClick={onClose}>
 *         <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
 *           // Contenido del modal
 *         </div>
 *       </div>
 *     </ModalWithHistory>
 *   );
 * }
 * ```
 */
export function ModalWithHistory({
  isOpen,
  onClose,
  children,
}: ModalWithHistoryProps) {
  // Integración del hook de history
  useModalHistory(isOpen, onClose);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return <>{children}</>;
}
