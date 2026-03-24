"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCircle2, Sparkles, CheckCircle } from "lucide-react";
import PanelInfoPersonal from "./PanelInfoPersonal";
import TabAsistencias from "./TabAsistencias";
import TabPagos from "./TabPagos";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  clases_gracia_disponibles: number;
  clases_gracia_usadas: number;
  es_prueba?: boolean | null;
  actividad_interes?: string | null;
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
  diasInactivo,
}: {
  alumno: Alumno;
  asistencias: Asistencia[];
  pagos: Pago[];
  diasInactivo: number;
}) {
  const router = useRouter();
  const [convirtiendo, setConvirtiendo] = useState(false);
  const esPrueba = alumno.es_prueba === true;

  async function handleConvertir() {
    if (!confirm("¿Estás seguro de convertir este prospecto en alumno regular? Deberás registrar su primer pago a continuación.")) {
      return;
    }

    setConvirtiendo(true);
    
    // Actualizar es_prueba a false
    const { error } = await supabase
      .from("alumnos")
      .update({ es_prueba: false })
      .eq("id", alumno.id);

    if (error) {
      alert("Error al convertir el alumno: " + error.message);
      setConvirtiendo(false);
      return;
    }

    // Refresh para cargar el estado actualizado
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner de Clase de Prueba */}
      {esPrueba && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-white shrink-0" />
            <div>
              <p className="text-white font-bold text-sm md:text-base">
                Clase de Prueba{alumno.actividad_interes ? ` • ${alumno.actividad_interes}` : ""}
              </p>
              <p className="text-white/90 text-xs md:text-sm">
                Este prospecto todavía no se ha inscrito formalmente
              </p>
            </div>
          </div>
          <button
            onClick={handleConvertir}
            disabled={convirtiendo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <CheckCircle size={16} />
            {convirtiendo ? "Convirtiendo..." : "Convertir a Alumno"}
          </button>
        </div>
      )}
      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 md:px-8 py-3 flex items-center gap-3 sticky top-0 z-10">
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
          <span className="text-sm font-semibold text-balance">
            {alumno.nombre}
          </span>
        </div>
      </div>

      {/* Main layout: 3 columnas en desktop, stack en móvil */}
      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-49px)]">
        {/* Columna 1: datos personales */}
        <aside className="w-full xl:w-72 2xl:w-80 shrink-0 border-b xl:border-b-0 xl:border-r border-border bg-card">
          <div className="xl:sticky xl:top-[49px] xl:max-h-[calc(100vh-49px)] xl:overflow-y-auto">
            <PanelInfoPersonal alumno={alumno} diasInactivo={diasInactivo} />
          </div>
        </aside>

        {/* Columnas 2 y 3: asistencias y pagos lado a lado */}
        <div className="flex-1 min-w-0 flex flex-col lg:flex-row">
          {/* Columna 2: Asistencias */}
          <section className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-border">
            <div className="px-5 md:px-7 py-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-5">
                Asistencias
              </h2>
              <TabAsistencias asistencias={asistencias} />
            </div>
          </section>

          {/* Columna 3: Pagos */}
          <section className="flex-1 min-w-0">
            <div className="px-5 md:px-7 py-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-5">
                Pagos
              </h2>
              <TabPagos alumnoId={alumno.id} pagosIniciales={pagos} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
