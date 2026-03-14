"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CalendarCheck2,
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

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function TabAsistencias({ asistencias }: Props) {
  const hoy = new Date();
  const [mesVista, setMesVista] = useState({
    year: hoy.getFullYear(),
    month: hoy.getMonth(),
  });

  const fechasSet = new Set(
    asistencias.map((a) =>
      typeof a.fecha === "string" ? a.fecha.split("T")[0] : ""
    )
  );

  const diasEnMes = new Date(mesVista.year, mesVista.month + 1, 0).getDate();
  const primerDiaSemana = new Date(mesVista.year, mesVista.month, 1).getDay();

  // Asistencias del mes actual en vista
  const asistenciasMesVista = asistencias.filter((a) => {
    const f = a.fecha.split("T")[0];
    const [y, m] = f.split("-");
    return parseInt(y) === mesVista.year && parseInt(m) - 1 === mesVista.month;
  });

  // Agrupar por mes para la lista acordeón
  const porMes: Record<string, Asistencia[]> = {};
  for (const a of asistencias) {
    const f = a.fecha.split("T")[0];
    const [y, m] = f.split("-");
    const key = `${y}-${m}`;
    if (!porMes[key]) porMes[key] = [];
    porMes[key].push(a);
  }
  const mesesOrdenados = Object.keys(porMes).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-6">
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          value={asistencias.length}
          label="Total de asistencias"
          accent
        />
        <StatCard
          value={asistenciasMesVista.length}
          label={`Asistencias en ${MESES[mesVista.month]}`}
        />
        <StatCard
          value={mesesOrdenados.length}
          label="Meses con asistencia"
          className="hidden sm:flex"
        />
      </div>

      {/* Calendario */}
      <div className="bg-card rounded-xl border border-border p-5">
        {/* Header navegación */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() =>
              setMesVista(({ year, month }) =>
                month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
              )
            }
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <h3 className="text-sm font-bold text-foreground">
            {MESES[mesVista.month]} {mesVista.year}
          </h3>
          <button
            onClick={() =>
              setMesVista(({ year, month }) =>
                month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
              )
            }
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Encabezados días semana */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-bold text-muted-foreground py-1 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grilla de días */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primerDiaSemana }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => {
            const mm = String(mesVista.month + 1).padStart(2, "0");
            const dd = String(dia).padStart(2, "0");
            const key = `${mesVista.year}-${mm}-${dd}`;
            const tiene = fechasSet.has(key);
            const esHoy =
              dia === hoy.getDate() &&
              mesVista.month === hoy.getMonth() &&
              mesVista.year === hoy.getFullYear();
            return (
              <div
                key={dia}
                className={`h-9 w-full flex items-center justify-center text-sm font-semibold rounded-lg transition-colors ${
                  tiene
                    ? "bg-[#dc2626] text-white"
                    : esHoy
                    ? "ring-2 ring-[#dc2626] text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {dia}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#dc2626]" />
            <span className="text-xs text-muted-foreground">Con asistencia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm ring-2 ring-[#dc2626]" />
            <span className="text-xs text-muted-foreground">Hoy</span>
          </div>
        </div>
      </div>

      {/* Lista por mes (acordeón) */}
      {asistencias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <CalendarCheck2 size={40} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No hay asistencias registradas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mesesOrdenados.map((mesKey) => (
            <MesAcordeon
              key={mesKey}
              mesKey={mesKey}
              asistencias={porMes[mesKey]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  value,
  label,
  accent,
  className = "",
}: {
  value: number;
  label: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 ${
        accent
          ? "bg-[#dc2626] border-[#dc2626] text-white"
          : "bg-card border-border text-foreground"
      } ${className}`}
    >
      <span className={`text-3xl font-black leading-none ${accent ? "text-white" : "text-foreground"}`}>
        {value}
      </span>
      <span className={`text-xs font-medium leading-tight ${accent ? "text-white/80" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

function MesAcordeon({
  mesKey,
  asistencias,
}: {
  mesKey: string;
  asistencias: Asistencia[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [año, mes] = mesKey.split("-");
  const nombreMes = MESES[parseInt(mes) - 1];

  const ordenadas = [...asistencias].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {nombreMes} {año}
          </span>
          <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {asistencias.length}
          </span>
        </div>
        {abierto ? (
          <ChevronUp size={15} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={15} className="text-muted-foreground" />
        )}
      </button>

      {abierto && (
        <div className="border-t border-border divide-y divide-border">
          {ordenadas.map((a) => {
            const fechaStr = a.fecha.split("T")[0];
            const [y, m, d] = fechaStr.split("-");
            const hora =
              a.hora ??
              (a.fecha.includes("T") ? a.fecha.split("T")[1]?.slice(0, 5) : null);
            return (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium text-foreground">
                  {d}/{m}/{y}
                </span>
                {hora && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />
                    {hora}
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
