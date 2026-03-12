"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  porPagina: number;
}

export default function Paginacion({
  paginaActual,
  totalPaginas,
  totalRegistros,
  porPagina,
}: PaginacionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function irAPagina(pagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pagina));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPaginas <= 1) return null;

  const desde = (paginaActual - 1) * porPagina + 1;
  const hasta = Math.min(paginaActual * porPagina, totalRegistros);

  // Construir rango de páginas visibles (ventana de 5)
  const VENTANA = 5;
  let inicio = Math.max(1, paginaActual - Math.floor(VENTANA / 2));
  const fin = Math.min(totalPaginas, inicio + VENTANA - 1);
  inicio = Math.max(1, fin - VENTANA + 1);
  const paginas = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-2 select-none">
      {/* Info */}
      <p className="text-xs text-gray-400 font-medium">
        Mostrando{" "}
        <span className="text-gray-600 font-semibold">{desde}–{hasta}</span>{" "}
        de{" "}
        <span className="text-gray-600 font-semibold">{totalRegistros}</span>{" "}
        alumnos
      </p>

      {/* Controles */}
      <div className="flex items-center gap-1">
        {/* Anterior */}
        <button
          onClick={() => irAPagina(paginaActual - 1)}
          disabled={paginaActual <= 1}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Número de páginas */}
        <div className="flex items-center gap-1 px-1">
          {inicio > 1 && (
            <>
              <button
                onClick={() => irAPagina(1)}
                className="w-8 h-8 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors touch-manipulation"
              >
                1
              </button>
              {inicio > 2 && (
                <span className="w-8 h-8 flex items-end justify-center pb-1.5 text-gray-400 text-sm">
                  …
                </span>
              )}
            </>
          )}

          {paginas.map((p) => (
            <button
              key={p}
              onClick={() => irAPagina(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                p === paginaActual
                  ? "text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              style={p === paginaActual ? { backgroundColor: "#DC2626" } : {}}
              aria-current={p === paginaActual ? "page" : undefined}
            >
              {p}
            </button>
          ))}

          {fin < totalPaginas && (
            <>
              {fin < totalPaginas - 1 && (
                <span className="w-8 h-8 flex items-end justify-center pb-1.5 text-gray-400 text-sm">
                  …
                </span>
              )}
              <button
                onClick={() => irAPagina(totalPaginas)}
                className="w-8 h-8 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors touch-manipulation"
              >
                {totalPaginas}
              </button>
            </>
          )}
        </div>

        {/* Siguiente */}
        <button
          onClick={() => irAPagina(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
