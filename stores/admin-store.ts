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
  ingresosBrutos: number;
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
    genero?: string;
  }[];
  rankingTopMasc?: {
    pos: number;
    nombre: string;
    inicial: string;
    clases: number;
    genero?: string;
  }[];
  rankingTopFem?: {
    pos: number;
    nombre: string;
    inicial: string;
    clases: number;
    genero?: string;
  }[];
  mesesNuevosHistorial: { mes: string; nuevos: number }[];
  antiguedadMeses: number | null;
  prevMesLabel: string;
  selectedYear?: number;
  selectedMonth?: number;
  cacheMap?: Record<string, { fetchedAt: number; snap: EstadisticasSnapshot }>;
}

// Inline types for DiarioSnapshot entries
export interface DiarioAlta {
  id: string;
  nombre: string;
  dni: string;
  created_at: string;
}

export interface DiarioPago {
  id: string;
  actividad: string;
  precio: number;
  medio_pago: string;
  tarjeta: string | null;
  alias_transferencia: string | null;
  alumnos: { nombre: string; dni: string } | null;
}

export interface DiarioVenta {
  id: string;
  cantidad: number;
  precio_unitario: number;
  medio_pago: string;
  tarjeta: string | null;
  alias_transferencia: string | null;
  talle_vendido: string | null;
  created_at: string;
  productos: { nombre: string; stock: number; stock_minimo: number } | null;
}

export interface DiarioAsistencia {
  id: string;
  hora: string;
  fecha: string;
  alumnos: { nombre: string; dni: string; es_prueba: boolean } | null;
}

export interface DiarioSnapshot {
  selectedDate: string;
  altas: DiarioAlta[];
  pagos: DiarioPago[];
  ventas: DiarioVenta[];
  asistencias: DiarioAsistencia[];
}

// Inline types for ProductosSnapshot entries
export interface ProductosProducto {
  id: string;
  nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  categoria: string;
}

export interface ProductosVenta {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  precio_costo_unitario: number;
  total: number;
  ganancia: number;
  notas: string | null;
  talle_vendido: string | null;
  created_at: string;
  medio_pago?: string | null;
  tarjeta?: string | null;
  alias_transferencia?: string | null;
  productos?: { nombre: string };
}

export interface ProductosSnapshot {
  selectedYear: number;
  selectedMonth: number;
  productos: ProductosProducto[];
  ventas: ProductosVenta[];
}

export interface FinanzasPageSnapshot {
  selectedYear: number;
  selectedMonth: number;
  stats: FinancialStats;
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

  // Diario cache
  diarioSnapshot: DiarioSnapshot | null;
  diarioLastFetched: number | null;
  setDiarioSnapshot: (snap: DiarioSnapshot) => void;
  isDiarioCacheValid: () => boolean;

  // Productos cache
  productosSnapshot: ProductosSnapshot | null;
  productosLastFetched: number | null;
  setProductosSnapshot: (snap: ProductosSnapshot) => void;
  isProductosCacheValid: () => boolean;

  // Finanzas Page cache
  finanzasPageSnapshot: FinanzasPageSnapshot | null;
  finanzasPageLastFetched: number | null;
  setFinanzasPageSnapshot: (snap: FinanzasPageSnapshot) => void;
  isFinanzasPageCacheValid: () => boolean;
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

  // ── Diario ────────────────────────────────────────────────────────────────
  diarioSnapshot: null,
  diarioLastFetched: null,
  setDiarioSnapshot: (snap) => set({ diarioSnapshot: snap, diarioLastFetched: Date.now() }),
  isDiarioCacheValid: () => {
    const { diarioLastFetched } = get();
    return !!diarioLastFetched && Date.now() - diarioLastFetched < CACHE_DURATION;
  },

  // ── Productos ─────────────────────────────────────────────────────────────
  productosSnapshot: null,
  productosLastFetched: null,
  setProductosSnapshot: (snap) => set({ productosSnapshot: snap, productosLastFetched: Date.now() }),
  isProductosCacheValid: () => {
    const { productosLastFetched } = get();
    return !!productosLastFetched && Date.now() - productosLastFetched < CACHE_DURATION;
  },

  // ── Finanzas Page ─────────────────────────────────────────────────────────
  finanzasPageSnapshot: null,
  finanzasPageLastFetched: null,
  setFinanzasPageSnapshot: (snap) => set({ finanzasPageSnapshot: snap, finanzasPageLastFetched: Date.now() }),
  isFinanzasPageCacheValid: () => {
    const { finanzasPageLastFetched } = get();
    return !!finanzasPageLastFetched && Date.now() - finanzasPageLastFetched < CACHE_DURATION;
  },
}));
