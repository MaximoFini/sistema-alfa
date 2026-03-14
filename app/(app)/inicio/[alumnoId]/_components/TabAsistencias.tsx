"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";

interface Asistencia {
  id: string;
  alumno_id: string;
  fecha: string;
  hora?: string | null;
}

interface Props {
  asistencias: Asistencia[];
}

export default function TabAsistencias({ asistencias }: Props) {
  const hoy = new Date();
  const [mesVista, setMesVista] = useState({
    year: hoy.getFullYear(),
    month: hoy.getMonth(),
  });

  // Normalizar fechas a "YYYY-MM-DD"
  const fechasConAsistencia = new Set(
    asistencias.map((a) => {
      const fechaStr = typeof a.fecha === "string" ? a.fecha.split("T")[0] : "";
      return fechaStr;
    }),
  );

  // Días del mes en vista
  const diasEnMes = new Date(mesVista.year, mesVista.month + 1, 0).getDate();
  const primerDiaSemana = new Date(mesVista.year, mesVista.month, 1).getDay();

  const nombresMeses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  function mesAnterior() {
    setMesVista(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  }

  function mesSiguiente() {
    setMesVista(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  }

  // Agrupar asistencias por mes para la lista
  const asistenciasPorMes: Record<string, Asistencia[]> = {};
  for (const a of asistencias) {
    const fechaStr = typeof a.fecha === "string" ? a.fecha.split("T")[0] : "";
    const [y, m] = fechaStr.split("-");
    const key = `${y}-${m}`;
    if (!asistenciasPorMes[key]) asistenciasPorMes[key] = [];
    asistenciasPorMes[key].push(a);
  }

  const mesesOrdenados = Object.keys(asistenciasPorMes).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── Calendario ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 md:p-4">
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={mesAnterior}
            className="p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <h3 className="text-sm font-bold text-gray-800">
            {nombresMeses[mesVista.month]} {mesVista.year}
          </h3>
          <button
            onClick={mesSiguiente}
            className="p-1 rounded hover:bg-gray-50 transition-colors touch-manipulation"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Encabezados de días */}
        <div className="grid grid-cols-7 mb-1 gap-1">
          {diasSemana.map((d) => (
            <div
              key={d}
              className="text-center text-sm text-gray-400 font-semibold py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grilla de días */}
        <div className="grid grid-cols-7 gap-1">
          {/* Celdas vacías al inicio */}
          {Array.from({ length: primerDiaSemana }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Días del mes */}
          {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => {
            const yyyy = mesVista.year;
            const mm = String(mesVista.month + 1).padStart(2, "0");
            const dd = String(dia).padStart(2, "0");
            const fechaCelda = `${yyyy}-${mm}-${dd}`;
            const tieneAsistencia = fechasConAsistencia.has(fechaCelda);

            return (
              <div
                key={dia}
                className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded transition-colors ${
                  tieneAsistencia
                    ? "bg-red-500 text-white font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {dia}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-sm text-gray-500">Día con asistencia</span>
        </div>
      </div>

      {/* ── Lista por mes (acordeón) ── */}
      {asistencias.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No hay asistencias registradas.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mesesOrdenados.map((mesKey) => (
            <MesAcordeon
              key={mesKey}
              mesKey={mesKey}
              asistencias={asistenciasPorMes[mesKey]}
              nombresMeses={nombresMeses}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MesAcordeon({
  mesKey,
  asistencias,
  nombresMeses,
}: {
  mesKey: string;
  asistencias: Asistencia[];
  nombresMeses: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [año, mes] = mesKey.split("-");
  const nombreMes = nombresMeses[parseInt(mes) - 1];

  // Ordenar asistencias del más reciente al más antiguo dentro del mes
  const ordenadas = [...asistencias].sort((a, b) =>
    b.fecha.localeCompare(a.fecha),
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors touch-manipulation"
      >
        <span className="text-sm font-semibold text-gray-800">
          {nombreMes} {año}
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({asistencias.length} asistencia
            {asistencias.length !== 1 ? "s" : ""})
          </span>
        </span>
        {abierto ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {abierto && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {ordenadas.map((a) => {
            const fechaStr = a.fecha.split("T")[0];
            const [y, m, d] = fechaStr.split("-");
            const horaDisplay = a.hora
              ? a.hora
              : a.fecha.includes("T")
                ? a.fecha.split("T")[1]?.slice(0, 5)
                : null;

            return (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-gray-700 font-medium">
                  {d}/{m}/{y}
                </span>
                {horaDisplay && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />
                    {horaDisplay}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
