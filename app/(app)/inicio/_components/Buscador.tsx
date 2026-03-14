"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 400;

function BuscadorInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inicializar el input con el valor actual de la URL
  const [valor, setValor] = useState(searchParams.get("query") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cada vez que el usuario escribe, esperar DEBOUNCE_MS antes de actualizar la URL
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (valor.trim()) {
        params.set("query", valor.trim());
      } else {
        params.delete("query");
      }

      // Siempre volver a la página 1 cuando cambia la búsqueda
      params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  function limpiar() {
    setValor("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("query");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 min-h-[44px] focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-50 transition-all">
      <Search size={18} className="text-gray-400 shrink-0" />
      <input
        type="text"
        placeholder="Buscar por nombre o DNI..."
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="flex-1 text-base outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
        aria-label="Buscar alumno"
      />
      {valor && (
        <button
          onClick={limpiar}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors touch-manipulation"
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// Envolver en Suspense para evitar problemas de hidratación con useSearchParams
export default function Buscador() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 min-h-[44px]">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            disabled
            className="flex-1 text-base outline-none bg-transparent text-gray-400"
          />
        </div>
      }
    >
      <BuscadorInner />
    </Suspense>
  );
}
