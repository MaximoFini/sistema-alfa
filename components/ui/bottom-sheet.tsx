"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalHistory } from "@/hooks/use-modal-history";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  showCloseButton = true,
}: BottomSheetProps) {
  // Integración del hook de history para manejar el botón "Atrás"
  useModalHistory(isOpen, onClose);

  const [isAnimating, setIsAnimating] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [currentY, setCurrentY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentY > 150) {
      handleClose();
    }
    setCurrentY(0);
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 z-[100] transition-opacity duration-200",
          isAnimating ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed left-0 right-0 bottom-0 z-[101]",
          "bg-white rounded-t-3xl shadow-2xl",
          "max-h-[90vh] flex flex-col",
          "md:left-1/2 md:-translate-x-1/2 md:max-w-md md:rounded-b-3xl md:bottom-auto md:top-1/2 md:-translate-y-1/2",
          "transition-all duration-300 ease-out",
        )}
        style={{
          transform: `translateY(${
            isAnimating ? (isDragging ? `${currentY}px` : "0") : "100%"
          }) ${window.innerWidth >= 768 ? "translateX(-50%) translateY(-50%)" : ""}`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (solo móvil) */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {(title || description || showCloseButton) && (
          <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="ml-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X size={16} className="text-gray-600" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}

export function BottomSheetContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-5", className)}>{children}</div>;
}

export function BottomSheetFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("px-5 py-4 border-t border-gray-100 shrink-0", className)}
    >
      {children}
    </div>
  );
}
