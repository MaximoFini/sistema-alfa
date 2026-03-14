"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PanelInfoPersonal from "./PanelInfoPersonal";
import TabAsistencias from "./TabAsistencias";
import TabPagos from "./TabPagos";

type Tab = "asistencias" | "pagos";

interface Alumno {
  id: string;
  nombre: string | null;
  edad_actual: number | null;
  fecha_registro: string | null;
  fecha_ultima_asistencia: string | null;
  dni: string | null;
  fecha_nacimiento: string | null;
  domicilio: string | null;
  telefono: string | null;
  genero: string | null;
  abono_ultima_inscripcion: string | null;
  fecha_proximo_vencimiento: string | null;
  actividad_proximo_vencimiento: string | null;
  fecha_ultimo_inicio: string | null;
}

interface Asistencia {
  id: string;
  alumno_id: string;
  fecha: string;
  hora?: string | null;
}

interface Pago {
  id: string;
  alumno_id: string;
  actividad: string;
  precio: number;
  fecha_cobro: string;
  medio_pago: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
}

export default function AlumnoPerfil({
  alumno,
  asistencias,
  pagos,
}: {
  alumno: Alumno;
  asistencias: Asistencia[];
  pagos: Pago[];
}) {
  const [tabActivo, setTabActivo] = useState<Tab>("asistencias");

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header con botón volver */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/inicio"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">{alumno.nombre}</h1>
      </div>

      {/* Layout de dos columnas */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna izquierda: info personal */}
        <div className="w-full lg:w-72 shrink-0">
          <PanelInfoPersonal alumno={alumno} />
        </div>

        {/* Columna derecha: tabs */}
        <div className="flex-1 min-w-0">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setTabActivo("asistencias")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tabActivo === "asistencias"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Asistencias
            </button>
            <button
              onClick={() => setTabActivo("pagos")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tabActivo === "pagos"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pagos
            </button>
          </div>

          {/* Contenido del tab */}
          {tabActivo === "asistencias" && (
            <TabAsistencias asistencias={asistencias} />
          )}
          {tabActivo === "pagos" && <TabPagos pagos={pagos} />}
        </div>
      </div>
    </div>
  );
}
