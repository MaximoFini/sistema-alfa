// Store global de cache - Migrado desde StabilitySistema
// ⚠️ LA LÓGICA DE QUERIES DEBE MANTENERSE IDÉNTICA AL CÓDIGO ORIGINAL

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { ExerciseCategory } from "@/lib/types/exercises";
import { TrainingPlanSummary } from "@/lib/types/plans";

// Types para productos y ventas
interface Producto {  id: string;
  nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  categoria: string;
  talles: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

interface Venta {
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
  productos?: {
    nombre: string;
  };
}

interface PaymentMethod {
  name: string;
}

// Types para alumnos
export interface AlumnoRow {
  id: string;
  nombre: string | null;
  edad_actual: number | null;
  fecha_registro: string | null;
  dni: string | null;
  es_prueba?: boolean | null;
  actividad_interes?: string | null;
  activo?: boolean | null;
  ultimaAsistencia: {
    fecha: string;
    hora: string | null;
  } | null;
}

interface AlumnosCacheEntry {
  alumnos: AlumnoRow[];
  totalRegistros: number;
  totalPaginas: number;
  fetchedAt: number;
}

const POR_PAGINA_ALUMNOS = 20;

interface DataCacheState {
  // Categories
  categories: ExerciseCategory[];
  categoriesLoading: boolean;
  categoriesLastFetched: number | null;

  // Plans
  plans: TrainingPlanSummary[];
  plansLoading: boolean;
  plansLastFetched: number | null;

  // Productos
  productos: Producto[];
  productosLoading: boolean;
  productosLastFetched: number | null;

  // Ventas
  ventas: Venta[];
  ventasLoading: boolean;
  ventasLastFetched: number | null;

  // Payment Methods
  paymentMethods: PaymentMethod[];
  paymentMethodsLoading: boolean;
  paymentMethodsLastFetched: number | null;

  // Alumnos — cache por clave `${page}:${query}`
  alumnosCache: Record<string, AlumnosCacheEntry>;
  alumnosLoadingKeys: Record<string, boolean>;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchPlans: (professorId: string) => Promise<void>;
  fetchProductos: () => Promise<void>;
  fetchVentas: () => Promise<void>;
  fetchPaymentMethods: () => Promise<void>;
  fetchAlumnos: (page: number, query: string) => Promise<void>;
  invalidateCategories: () => void;
  invalidatePlans: () => void;
  invalidateProductos: () => void;
  invalidateVentas: () => void;
  invalidatePaymentMethods: () => void;
  invalidateAlumnos: () => void;

  // Optimistic updates
  optimisticDeletePlan: (planId: string) => void;
  optimisticAddPlan: (plan: TrainingPlanSummary) => void;
  optimisticUpdatePlan: (
    planId: string,
    updates: Partial<TrainingPlanSummary>,
  ) => void;
  optimisticUpdateProducto: (
    productoId: string,
    updates: Partial<Producto>,
  ) => void;
  optimisticAddProducto: (producto: Producto) => void;
  optimisticAddVenta: (venta: Venta) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useDataCacheStore = create<DataCacheState>((set, get) => ({
  // Initial state
  categories: [],
  categoriesLoading: false,
  categoriesLastFetched: null,

  plans: [],
  plansLoading: false,
  plansLastFetched: null,

  productos: [],
  productosLoading: false,
  productosLastFetched: null,

  ventas: [],
  ventasLoading: false,
  ventasLastFetched: null,

  paymentMethods: [],
  paymentMethodsLoading: false,
  paymentMethodsLastFetched: null,

  alumnosCache: {},
  alumnosLoadingKeys: {},

  // Fetch Categories
  // Query EXACTA del código original
  fetchCategories: async () => {
    const state = get();
    const now = Date.now();

    // Return cache if valid
    if (
      state.categoriesLastFetched &&
      now - state.categoriesLastFetched < CACHE_DURATION
    ) {
      return;
    }

    // Already loading
    if (state.categoriesLoading) return;

    set({ categoriesLoading: true });

    try {
      const { data, error } = await supabase
        .from("exercise_categories")
        .select("id, name, color")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        categories: data || [],
        categoriesLastFetched: Date.now(),
        categoriesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ categoriesLoading: false });
    }
  },

  // Fetch Plans
  // Query EXACTA del código original con count de asignaciones
  fetchPlans: async (professorId: string) => {
    const state = get();
    const now = Date.now();

    // Return cache if valid
    if (
      state.plansLastFetched &&
      now - state.plansLastFetched < CACHE_DURATION
    ) {
      return;
    }

    // Already loading
    if (state.plansLoading) return;

    set({ plansLoading: true });

    try {
      const { data: plansData, error } = await supabase
        .from("training_plans")
        .select(
          `
          *,
          training_plan_assignments(count)
        `,
        )
        .eq("coach_id", professorId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to include assignedCount
      const plans: TrainingPlanSummary[] = (plansData || []).map(
        (plan: any) => ({
          id: plan.id,
          coach_id: plan.coach_id,
          title: plan.title,
          description: plan.description,
          start_date: plan.start_date,
          end_date: plan.end_date,
          total_days: plan.total_days,
          days_per_week: plan.days_per_week,
          total_weeks: plan.total_weeks,
          plan_type: plan.plan_type,
          difficulty_level: plan.difficulty_level,
          is_template: plan.is_template,
          is_archived: plan.is_archived,
          created_at: plan.created_at,
          assignedCount: plan.training_plan_assignments?.[0]?.count || 0,
        }),
      );

      set({
        plans,
        plansLastFetched: Date.now(),
        plansLoading: false,
      });
    } catch (error) {
      console.error("Error fetching plans:", error);
      set({ plansLoading: false });
    }
  },

  // Invalidate cache
  invalidateCategories: () => {
    set({ categoriesLastFetched: null });
  },

  invalidatePlans: () => {
    set({ plansLastFetched: null });
  },

  invalidateProductos: () => {
    set({ productosLastFetched: null });
  },

  invalidateVentas: () => {
    set({ ventasLastFetched: null });
  },

  invalidatePaymentMethods: () => {
    set({ paymentMethodsLastFetched: null });
  },

  invalidateAlumnos: () => {
    set({ alumnosCache: {}, alumnosLoadingKeys: {} });
  },

  // Fetch Alumnos — con caché por página+query (5 min)
  fetchAlumnos: async (page: number, query: string) => {
    const safeQuery = query.replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s]/g, "");
    const cacheKey = `${page}:${safeQuery}`;
    const state = get();
    const now = Date.now();

    // Cache hit
    const cached = state.alumnosCache[cacheKey];
    if (cached && now - cached.fetchedAt < CACHE_DURATION) {
      return;
    }

    // Ya cargando esta clave
    if (state.alumnosLoadingKeys[cacheKey]) return;

    set((s) => ({
      alumnosLoadingKeys: { ...s.alumnosLoadingKeys, [cacheKey]: true },
    }));

    try {
      const offset = (page - 1) * POR_PAGINA_ALUMNOS;

      const { data: alumnosRaw, error } = await supabase.rpc(
        "alumnos_por_orden_llegada",
        {
          p_query: safeQuery || null,
          p_limit: POR_PAGINA_ALUMNOS,
          p_offset: offset,
        },
      );

      if (error) {
        // Fallback: query directa sin RPC
        const from = offset;
        const to = from + POR_PAGINA_ALUMNOS - 1;

        let q = supabase
          .from("alumnos")
          .select(
            "id, nombre, edad_actual, fecha_registro, dni, fecha_ultima_asistencia, es_prueba, actividad_interes, activo",
            { count: "exact" },
          )
          .order("fecha_ultima_asistencia", {
            ascending: false,
            nullsFirst: false,
          })
          .order("nombre", { ascending: true })
          .range(from, to);

        if (safeQuery) {
          q = q.or(
            `nombre.ilike.%${safeQuery}%,dni.ilike.%${safeQuery}%`,
          );
        }

        const { data: fallbackData, count, error: fbError } = await q;
        if (fbError) throw fbError;

        const totalRegistros = count ?? 0;
        const totalPaginas = Math.max(
          1,
          Math.ceil(totalRegistros / POR_PAGINA_ALUMNOS),
        );
        const alumnos: AlumnoRow[] = (fallbackData ?? []).map((row: any) => ({
          id: row.id,
          nombre: row.nombre,
          edad_actual: row.edad_actual,
          fecha_registro: row.fecha_registro,
          dni: row.dni,
          es_prueba: row.es_prueba,
          actividad_interes: row.actividad_interes,
          activo: row.activo,
          ultimaAsistencia: row.fecha_ultima_asistencia
            ? { fecha: row.fecha_ultima_asistencia, hora: null }
            : null,
        }));

        set((s) => ({
          alumnosCache: {
            ...s.alumnosCache,
            [cacheKey]: { alumnos, totalRegistros, totalPaginas, fetchedAt: Date.now() },
          },
          alumnosLoadingKeys: { ...s.alumnosLoadingKeys, [cacheKey]: false },
        }));
        return;
      }

      const totalRegistros =
        alumnosRaw && alumnosRaw.length > 0
          ? Number(alumnosRaw[0].total_count)
          : 0;
      const totalPaginas = Math.max(
        1,
        Math.ceil(totalRegistros / POR_PAGINA_ALUMNOS),
      );

      const alumnos: AlumnoRow[] = (alumnosRaw ?? []).map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        edad_actual: row.edad_actual,
        fecha_registro: row.fecha_registro,
        dni: row.dni,
        es_prueba: row.es_prueba,
        actividad_interes: row.actividad_interes,
        activo: row.activo,
        ultimaAsistencia: row.ult_fecha
          ? { fecha: row.ult_fecha, hora: row.ult_hora ?? null }
          : null,
      }));

      set((s) => ({
        alumnosCache: {
          ...s.alumnosCache,
          [cacheKey]: { alumnos, totalRegistros, totalPaginas, fetchedAt: Date.now() },
        },
        alumnosLoadingKeys: { ...s.alumnosLoadingKeys, [cacheKey]: false },
      }));
    } catch (err) {
      console.error("[fetchAlumnos] Error:", err);
      set((s) => ({
        alumnosLoadingKeys: { ...s.alumnosLoadingKeys, [cacheKey]: false },
      }));
    }
  },

  // Fetch Productos
  // Query EXACTA del código original
  fetchProductos: async () => {
    const state = get();
    const now = Date.now();

    // Return cache if valid
    if (
      state.productosLastFetched &&
      now - state.productosLastFetched < CACHE_DURATION
    ) {
      return;
    }

    // Already loading
    if (state.productosLoading) return;

    set({ productosLoading: true });

    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;

      set({
        productos: data || [],
        productosLastFetched: Date.now(),
        productosLoading: false,
      });
    } catch (error) {
      console.error("Error fetching productos:", error);
      set({ productosLoading: false });
    }
  },

  // Fetch Ventas
  // Query EXACTA del código original
  fetchVentas: async () => {
    const state = get();
    const now = Date.now();

    // Return cache if valid
    if (
      state.ventasLastFetched &&
      now - state.ventasLastFetched < CACHE_DURATION
    ) {
      return;
    }

    // Already loading
    if (state.ventasLoading) return;

    set({ ventasLoading: true });

    try {
      const { data, error } = await supabase
        .from("ventas")
        .select("*, productos(nombre)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      set({
        ventas: data || [],
        ventasLastFetched: Date.now(),
        ventasLoading: false,
      });
    } catch (error) {
      console.error("Error fetching ventas:", error);
      set({ ventasLoading: false });
    }
  },

  // Fetch Payment Methods
  // Query EXACTA del código original
  fetchPaymentMethods: async () => {
    const state = get();
    const now = Date.now();

    // Return cache if valid
    if (
      state.paymentMethodsLastFetched &&
      now - state.paymentMethodsLastFetched < CACHE_DURATION
    ) {
      return;
    }

    // Already loading
    if (state.paymentMethodsLoading) return;

    set({ paymentMethodsLoading: true });

    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        paymentMethods: data || [],
        paymentMethodsLastFetched: Date.now(),
        paymentMethodsLoading: false,
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      set({ paymentMethodsLoading: false });
    }
  },

  // Optimistic updates for instant UI feedback
  optimisticDeletePlan: (planId: string) => {
    set((state) => ({
      plans: state.plans.filter((plan) => plan.id !== planId),
    }));
  },

  optimisticAddPlan: (plan: TrainingPlanSummary) => {
    set((state) => ({
      plans: [plan, ...state.plans],
    }));
  },

  optimisticUpdatePlan: (
    planId: string,
    updates: Partial<TrainingPlanSummary>,
  ) => {
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === planId ? { ...plan, ...updates } : plan,
      ),
    }));
  },

  optimisticUpdateProducto: (
    productoId: string,
    updates: Partial<Producto>,
  ) => {
    set((state) => ({
      productos: state.productos.map((producto) =>
        producto.id === productoId ? { ...producto, ...updates } : producto,
      ),
    }));
  },

  optimisticAddProducto: (producto: Producto) => {
    set((state) => ({
      productos: [...state.productos, producto].sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      ),
    }));
  },

  optimisticAddVenta: (venta: Venta) => {
    set((state) => ({
      ventas: [venta, ...state.ventas],
    }));
  },
}));
