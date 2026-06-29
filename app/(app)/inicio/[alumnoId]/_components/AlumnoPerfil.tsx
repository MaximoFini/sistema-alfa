"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import { ArrowLeft, UserCircle2, Sparkles, CheckCircle } from "lucide-react";
import PanelInfoPersonal from "./PanelInfoPersonal";
import TabAsistencias from "./TabAsistencias";
import TabPagos from "./TabPagos";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useQuery, usePowerSync } from "@powersync/react";

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
  es_prueba?: boolean | number | null;
  activo?: boolean | number | null;
  actividad_interes?: string | null;
  cus_completado: boolean;
  cus_clases_presentadas: number;
  email: string | null;
  telefono_emergencia: string | null;
  observaciones: string | null;
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
  alumno: alumnoInicial,
  asistencias: asistenciasIniciales,
  pagos: pagosIniciales,
  diasInactivo,
}: {
  alumno: Alumno;
  asistencias: Asistencia[];
  pagos: Pago[];
  diasInactivo: number;
}) {
  const router = useRouter();
  const db = usePowerSync();
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [autoOpenPaymentModal, setAutoOpenPaymentModal] = useState(false);

  // Query reactive del alumno actual
  const { data: rawAlumnos } = useQuery<any>(
    "SELECT * FROM alumnos WHERE id = ?",
    [alumnoInicial.id]
  );
  const dbAlumno = rawAlumnos?.[0];

  const alumno = useMemo(() => {
    if (!dbAlumno) return alumnoInicial;
    return {
      ...dbAlumno,
      activo: dbAlumno.activo !== 0,
      es_prueba: dbAlumno.es_prueba !== 0,
      cus_completado: dbAlumno.cus_completado !== 0,
      clases_gracia_disponibles: dbAlumno.clases_gracia_disponibles ?? 0,
      clases_gracia_usadas: dbAlumno.clases_gracia_usadas ?? 0,
      cus_clases_presentadas: dbAlumno.cus_clases_presentadas ?? 0,
    };
  }, [dbAlumno, alumnoInicial]);

  // Query reactive de asistencias
  const { data: rawAsistencias } = useQuery<any>(
    "SELECT id, alumno_id, fecha, hora FROM asistencias WHERE alumno_id = ? ORDER BY fecha DESC",
    [alumnoInicial.id]
  );
  const asistencias = rawAsistencias ?? asistenciasIniciales;

  // Query reactive de pagos
  const { data: rawPagos } = useQuery<any>(
    "SELECT id, alumno_id, actividad, precio, fecha_cobro, medio_pago, fecha_inicio, fecha_vencimiento FROM pagos WHERE alumno_id = ? ORDER BY fecha_cobro DESC",
    [alumnoInicial.id]
  );
  const pagos = rawPagos ?? pagosIniciales;

  const esPrueba = alumno.es_prueba === true;

  // Función para actualizar el alumno (no-op now since we use useQuery)
  function handleAlumnoActualizado(datosActualizados: Partial<Alumno>) {
    // No-op
  }

  async function handleConvertir() {
    setConvirtiendo(true);
    setAutoOpenPaymentModal(true);
    setShowConvertModal(false);

    try {
      await db.execute(
        "UPDATE alumnos SET es_prueba = 0, activo = 1 WHERE id = ?",
        [alumno.id]
      );
    } catch (error: any) {
      alert("Error al convertir el alumno: " + (error.message || error));
      setAutoOpenPaymentModal(false);
    } finally {
      setConvirtiendo(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner de Clase de Prueba */}
      {esPrueba && (
        <div className={`px-4 md:px-8 py-4 flex items-center justify-between gap-4 transition-colors ${alumno.activo === false ? "bg-red-500" : "bg-[#fb923c]"}`}>
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-white shrink-0" />
            <div>
              <p className="text-white font-bold text-sm md:text-base">
                {alumno.activo === false ? "Clase de Prueba - Límite Alcanzado" : "Clase de Prueba"}
                {alumno.actividad_interes
                  ? ` • ${alumno.actividad_interes}`
                  : ""}
              </p>
              <p className="text-white/90 text-xs md:text-sm">
                {alumno.activo === false 
                  ? "Ya asistió a su clase de prueba. Debe convertirse a alumno regular." 
                  : "Este prospecto todavía no se ha inscrito formalmente"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConvertModal(true)}
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
            <PanelInfoPersonal
              alumno={alumno}
              diasInactivo={diasInactivo}
              onAlumnoActualizado={handleAlumnoActualizado}
            />
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
              <TabPagos
                alumnoId={alumno.id}
                alumnoNombre={alumno.nombre ?? ""}
                pagosIniciales={pagos}
                onAlumnoActualizado={handleAlumnoActualizado}
                autoOpenModal={autoOpenPaymentModal}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Modal de Confirmación de Conversión */}
      {showConvertModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={() => setShowConvertModal(false)}
          />
          {/* Modal Card */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-card p-6 rounded-2xl shadow-2xl border border-border w-[90vw] max-w-md flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-950 text-[#fb923c] rounded-xl shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  Convertir a Alumno Regular
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Estás seguro de convertir este prospecto en alumno regular? Deberás registrar su primer pago a continuación.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConvertir}
                disabled={convirtiendo}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#fb923c] hover:bg-[#fb923c]/90 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {convirtiendo ? "Convirtiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
