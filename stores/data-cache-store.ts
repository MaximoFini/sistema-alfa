import { useCallback } from "react";
import { useQuery, usePowerSync } from "@powersync/react";
import { ExerciseCategory } from "@/lib/types/exercises";
import { TrainingPlanSummary } from "@/lib/types/plans";

interface Producto {
  id: string;
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
  medio_pago?: string | null;
  tarjeta?: string | null;
  alias_transferencia?: string | null;
  productos?: {
    nombre: string;
  };
}

interface PaymentMethod {
  name: string;
}

export interface AlumnoRow {
  id: string;
  nombre: string | null;
  edad_actual: number | null;
  fecha_registro: string | null;
  dni: string | null;
  es_prueba?: boolean | null;
  actividad_interes?: string | null;
  activo?: boolean | null;
  cus_completado?: boolean | null;
  cus_clases_presentadas?: number | null;
  ultimaAsistencia: {
    fecha: string;
    hora: string | null;
  } | null;
}

const POR_PAGINA_ALUMNOS = 20;

const STABLE_ASYNC_FN = async (..._args: any[]) => {};
const STABLE_FN = (..._args: any[]) => {};

export function useDataCacheStore() {
  const db = usePowerSync();

  // Categories
  const { data: rawCategories, isLoading: categoriesLoading } = useQuery<ExerciseCategory>(
    "SELECT id, name, color FROM exercise_categories ORDER BY name"
  );
  const categories = (rawCategories ?? []) as ExerciseCategory[];

  // Payment Methods
  const { data: rawPaymentMethods, isLoading: paymentMethodsLoading } = useQuery<PaymentMethod>(
    "SELECT name FROM payment_methods WHERE is_active = 1 ORDER BY name"
  );
  const paymentMethods = (rawPaymentMethods ?? []) as PaymentMethod[];

  // Productos
  const { data: rawProductos, isLoading: productosLoading } = useQuery<{
    id: string;
    nombre: string;
    precio_venta: number;
    precio_costo: number;
    stock: number;
    stock_minimo: number;
    activo: number;
    categoria: string;
    talles: string | null;
    created_at: string;
    updated_at: string;
  }>("SELECT id, nombre, precio_venta, precio_costo, stock, stock_minimo, activo, categoria, talles, created_at, updated_at FROM productos ORDER BY nombre");

  const productos: Producto[] = (rawProductos ?? []).map((p) => ({
    ...p,
    activo: !!p.activo,
    talles: p.talles ? JSON.parse(p.talles) : null,
  }));

  // Ventas (with joined product name)
  const { data: rawVentas, isLoading: ventasLoading } = useQuery<{
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
    medio_pago: string | null;
    tarjeta: string | null;
    alias_transferencia: string | null;
    producto_nombre: string | null;
  }>(
    `SELECT v.id, v.producto_id, v.cantidad, v.precio_unitario, v.precio_costo_unitario, v.total, v.ganancia,
            v.notas, v.talle_vendido, v.created_at, v.medio_pago, v.tarjeta, v.alias_transferencia,
            p.nombre AS producto_nombre
     FROM ventas v
     LEFT JOIN productos p ON v.producto_id = p.id
     ORDER BY v.created_at DESC
     LIMIT 100`
  );

  const ventas: Venta[] = (rawVentas ?? []).map((v) => ({
    ...v,
    productos: v.producto_nombre ? { nombre: v.producto_nombre } : undefined,
  }));



  // Helper to get alumnos data imperatively
  const getAlumnos = useCallback(async (page: number, query: string) => {
    const safeQuery = query.replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s]/g, "");
    const offset = (page - 1) * POR_PAGINA_ALUMNOS;

    const countResult = await db.getAll<{ cnt: number }>(
      safeQuery
        ? `SELECT COUNT(*) as cnt FROM alumnos WHERE nombre LIKE '%' || ? || '%' OR dni LIKE '%' || ? || '%'`
        : "SELECT COUNT(*) as cnt FROM alumnos",
      safeQuery ? [safeQuery, safeQuery] : []
    );
    const totalRegistros = countResult[0]?.cnt ?? 0;
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / POR_PAGINA_ALUMNOS));

    const rawAlumnos = await db.getAll<{
      id: string;
      nombre: string | null;
      edad_actual: number | null;
      fecha_registro: string | null;
      dni: string | null;
      es_prueba: number | null;
      actividad_interes: string | null;
      activo: number | null;
      cus_completado: number | null;
      cus_clases_presentadas: number | null;
      fecha_ultima_asistencia: string | null;
    }>(
      safeQuery
        ? `SELECT id, nombre, edad_actual, fecha_registro, dni, es_prueba, actividad_interes, activo, cus_completado, cus_clases_presentadas, fecha_ultima_asistencia
           FROM alumnos
           WHERE nombre LIKE '%' || ? || '%' OR dni LIKE '%' || ? || '%'
           ORDER BY fecha_ultima_asistencia DESC NULLS LAST, nombre ASC
           LIMIT ? OFFSET ?`
        : `SELECT id, nombre, edad_actual, fecha_registro, dni, es_prueba, actividad_interes, activo, cus_completado, cus_clases_presentadas, fecha_ultima_asistencia
           FROM alumnos
           ORDER BY fecha_ultima_asistencia DESC NULLS LAST, nombre ASC
           LIMIT ? OFFSET ?`,
      safeQuery ? [safeQuery, safeQuery, POR_PAGINA_ALUMNOS, offset] : [POR_PAGINA_ALUMNOS, offset]
    );

    const alumnos: AlumnoRow[] = rawAlumnos.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      edad_actual: row.edad_actual,
      fecha_registro: row.fecha_registro,
      dni: row.dni,
      es_prueba: row.es_prueba != null ? !!row.es_prueba : null,
      actividad_interes: row.actividad_interes,
      activo: row.activo != null ? !!row.activo : null,
      cus_completado: row.cus_completado != null ? !!row.cus_completado : null,
      cus_clases_presentadas: row.cus_clases_presentadas,
      ultimaAsistencia: row.fecha_ultima_asistencia
        ? { fecha: row.fecha_ultima_asistencia, hora: null }
        : null,
    }));

    return { alumnos, totalRegistros, totalPaginas };
  }, [db]);

  return {
    categories,
    categoriesLoading,
    plans: [] as TrainingPlanSummary[],
    plansLoading: false,
    productos,
    productosLoading,
    ventas,
    ventasLoading,
    paymentMethods,
    paymentMethodsLoading,

    fetchCategories: STABLE_ASYNC_FN,
    fetchPlans: STABLE_ASYNC_FN,
    fetchProductos: STABLE_ASYNC_FN,
    fetchVentas: STABLE_ASYNC_FN,
    fetchPaymentMethods: STABLE_ASYNC_FN,
    fetchAlumnos: STABLE_ASYNC_FN,
    getAlumnos,

    invalidateCategories: STABLE_FN,
    invalidatePlans: STABLE_FN,
    invalidateProductos: STABLE_FN,
    invalidateVentas: STABLE_FN,
    invalidatePaymentMethods: STABLE_FN,
    invalidateAlumnos: STABLE_FN,

    optimisticDeletePlan: STABLE_FN,
    optimisticAddPlan: STABLE_FN,
    optimisticUpdatePlan: STABLE_FN,
    optimisticUpdateProducto: STABLE_FN,
    optimisticAddProducto: STABLE_FN,
    optimisticAddVenta: STABLE_FN,
  };
}

// Re-export for backward compatibility - consumers using `useDataCacheStore()` as Zustand store
// need to switch to calling `useDataCacheStore()` as a hook instead.
// During migration, consumers that use `useDataCacheStore.getState()` will need updating.
