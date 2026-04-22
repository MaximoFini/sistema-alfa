/**
 * Store global para la zona de administración.
 * Persiste a través de navegaciones (client-side) gracias a Zustand en memoria.
 *
 * - authenticated: evita que el PasswordGate aparezca al volver a /administracion
 * - finanzasStats: cache con TTL para los datos del endpoint /api/finanzas
 * - estadisticasSnapshot: cache con TTL para los KPIs de EstadisticasPage
 */

import { create } from "zustand";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinancialStats {
  ingresosMes: number;
  ticketPromedio: number;
  deudaTotal: number;
  alumnosActivos: number;
  variacion: number;
  ingresosMesAnterior: number;
  alumnosConDeuda: number;
  formasPago: Array<{
    medio: string;
    monto: number;
    porcentaje: number;
  }>;
  ingresosHistorial: Array<{
    mes: string;
    monto: number;
  }>;
}

export interface EstadisticasSnapshot {
  alumnosActivos: number | null;
  nuevosEsteMes: number | null;
  promedioEdad: number | null;
  tasaRetencion: number | null;
  tasaChurn: number | null;
  alumnosEnRiesgo: number | null;
  vidaUtilMeses: number | null;
  clientesInactivos: number | null;
  clientesPerdidos: number | null;
  generoDataReal: { name: string; value: number; color: string }[];
  retencionHistorico: { mes: string; tasa: number }[];
  asistenciaHorarioReal: { horario: string; alumnos: number }[];
  rankingTop5: {
    pos: number;
    nombre: string;
    inicial: string;
    clases: number;
  }[];
  mesesNuevosHistorial: { mes: string; nuevos: number }[];
  antiguedadMeses: number | null;
  prevMesLabel: string;
}

// ── Store interface ───────────────────────────────────────────────────────────

interface AdminStoreState {
  // Admin password gate — no TTL, dura toda la sesión del tab
  authenticated: boolean;
  setAuthenticated: (value: boolean) => void;

  // Finanzas cache
  finanzasStats: FinancialStats | null;
  finanzasLastFetched: number | null;
  finanzasLoading: boolean;
  fetchFinanzasStats: () => Promise<void>;
  isFinanzasCacheValid: () => boolean;

  // Estadísticas cache
  estadisticasSnapshot: EstadisticasSnapshot | null;
  estadisticasLastFetched: number | null;
  setEstadisticasSnapshot: (snap: EstadisticasSnapshot) => void;
  isEstadisticasCacheValid: () => boolean;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminStoreState>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  authenticated: false,
  setAuthenticated: (value) => set({ authenticated: value }),

  // ── Finanzas ──────────────────────────────────────────────────────────────
  finanzasStats: null,
  finanzasLastFetched: null,
  finanzasLoading: false,

  isFinanzasCacheValid: () => {
    const { finanzasLastFetched } = get();
    return !!finanzasLastFetched && Date.now() - finanzasLastFetched < CACHE_DURATION;
  },

  fetchFinanzasStats: async () => {
    const state = get();

    // Retornar si el cache es válido
    if (state.isFinanzasCacheValid()) return;

    // Evitar requests duplicados
    if (state.finanzasLoading) return;

    set({ finanzasLoading: true });

    try {
      const response = await fetch("/api/finanzas");
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data: FinancialStats = await response.json();
      set({
        finanzasStats: data,
        finanzasLastFetched: Date.now(),
        finanzasLoading: false,
      });
    } catch (error) {
      console.error("Error fetching finanzas stats:", error);
      set({ finanzasLoading: false });
    }
  },

  // ── Estadísticas ──────────────────────────────────────────────────────────
  estadisticasSnapshot: null,
  estadisticasLastFetched: null,

  isEstadisticasCacheValid: () => {
    const { estadisticasLastFetched } = get();
    return (
      !!estadisticasLastFetched &&
      Date.now() - estadisticasLastFetched < CACHE_DURATION
    );
  },

  setEstadisticasSnapshot: (snap) =>
    set({
      estadisticasSnapshot: snap,
      estadisticasLastFetched: Date.now(),
    }),
}));
