// Skeleton instantáneo para /inicio — se muestra mientras el Server Component
// carga la query RPC. Elimina el micro-lag en la navegación.

export default function InicioLoading() {
  return (
    <div className="relative min-h-screen">
      {/* Fondo logo — igual que AlumnosList */}
      <div className="fixed inset-0 flex items-center justify-center top-16 md:top-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/Mejor%20logo.png"
          alt=""
          className="w-[80vw] md:w-[450px] opacity-[0.35] object-contain ml-0 md:translate-x-[128px]"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 lg:px-8">
          <div className="pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
                  {/* Users icon placeholder */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Alumnos
                  </h1>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-1" />
                </div>
              </div>
              {/* Botón Crear Alumno skeleton */}
              <div className="h-10 w-28 rounded-xl bg-orange-200 animate-pulse shrink-0" />
            </div>
          </div>

          {/* Buscador + paginación skeleton */}
          <div className="py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-11 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-11 w-24 bg-gray-100 rounded-lg animate-pulse shrink-0" />
            </div>
            <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Grid de tarjetas skeleton */}
      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 md:p-5"
            >
              <div className="flex items-center gap-3 md:gap-4 min-h-[76px]">
                {/* Avatar */}
                <div className="w-12 h-12 md:w-11 md:h-11 rounded-full bg-gray-200 animate-pulse shrink-0" />
                {/* Texto */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                  <div className="flex gap-3">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                {/* Chevron */}
                <div className="w-9 h-9 md:w-7 md:h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
