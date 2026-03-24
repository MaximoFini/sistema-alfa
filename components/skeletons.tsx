"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton para la lista de alumnos.
 * Muestra placeholders animados mientras se cargan los datos.
 */
export function AlumnosListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-4 md:p-5"
        >
          <div className="flex items-center gap-3 md:gap-4">
            {/* Avatar skeleton */}
            <Skeleton className="w-12 h-12 md:w-11 md:h-11 rounded-full shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Nombre */}
              <Skeleton className="h-4 w-[60%]" />

              {/* Info adicional */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Chevron skeleton */}
            <Skeleton className="w-9 h-9 md:w-7 md:h-7 rounded-full shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para el header de página con título y botón.
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-11 w-full md:w-40 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton para tarjetas de estadísticas/resumen.
 */
export function StatsCardSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-4">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para tabla/lista de pagos.
 */
export function PagosListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para formulario de modal.
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}

      <div className="pt-4">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton de página completa con layout.
 * Muestra navegación visible y solo el contenido en skeleton.
 */
export function FullPageSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeaderSkeleton />

      {/* Buscador skeleton */}
      <div className="mb-6">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>

      {/* Lista skeleton */}
      <AlumnosListSkeleton count={8} />

      {/* Paginación skeleton */}
      <div className="mt-6 flex justify-center gap-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton para detalles de alumno (vista individual).
 */
export function AlumnoDetailSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header con info personal */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-4 mb-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-gray-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-t-lg" />
        ))}
      </div>

      {/* Contenido de tab */}
      <div className="space-y-4">
        <StatsCardSkeleton count={2} />
        <PagosListSkeleton count={3} />
      </div>
    </div>
  );
}
