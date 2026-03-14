"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCircle2, ClipboardList, CreditCard } from "lucide-react";
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

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "asistencias", label: "Asistencias", icon: <ClipboardList size={15} /> },
  { key: "pagos", label: "Pagos", icon: <CreditCard size={15} /> },
];

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
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 md:px-8 py-3 flex items-center gap-3">
        <Link
          href="/inicio"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ArrowLeft size={15} />
          Volver
        </Link>
        <span className="text-border">/</span>
        <div className="flex items-center gap-2 text-foreground">
          <UserCircle2 size={15} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-balance">{alumno.nombre}</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-49px)]">
        {/* Panel lateral */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card">
          <div className="lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
            <PanelInfoPersonal alumno={alumno} />
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Tab bar */}
          <div className="bg-card border-b border-border px-4 md:px-8 flex items-center gap-1 shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabActivo(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                  tabActivo === tab.key
                    ? "border-[#dc2626] text-[#dc2626]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            {tabActivo === "asistencias" && (
              <TabAsistencias asistencias={asistencias} />
            )}
            {tabActivo === "pagos" && <TabPagos pagos={pagos} />}
          </div>
        </main>
      </div>
    </div>
  );
}
