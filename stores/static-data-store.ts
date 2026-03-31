/**
 * Store de caché para datos estáticos del sistema
 *
 * Cachea datos que raramente cambian (planes, métodos de pago, etc.)
 * para evitar consultas repetidas a la base de datos.
 */

import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface SubscriptionPlan {
  name: string;
  duration_days: number;
  price: number;
}

interface PaymentMethod {
  name: string;
}

interface StaticDataState {
  // Datos
  subscriptionPlans: SubscriptionPlan[];
  paymentMethods: PaymentMethod[];

  // Estados de carga
  isLoadingPlans: boolean;
  isLoadingMethods: boolean;

  // Timestamps de última actualización
  plansLastFetched: number | null;
  methodsLastFetched: number | null;

  // Acciones
  fetchSubscriptionPlans: (
    forceRefresh?: boolean,
  ) => Promise<SubscriptionPlan[]>;
  fetchPaymentMethods: (forceRefresh?: boolean) => Promise<PaymentMethod[]>;
  fetchAllStaticData: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
}

// Tiempo de caché: 5 minutos (en milisegundos)
const CACHE_DURATION = 5 * 60 * 1000;

export const useStaticDataStore = create<StaticDataState>((set, get) => ({
  // Estado inicial
  subscriptionPlans: [],
  paymentMethods: [],
  isLoadingPlans: false,
  isLoadingMethods: false,
  plansLastFetched: null,
  methodsLastFetched: null,

  // Obtener planes de suscripción
  fetchSubscriptionPlans: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Verificar si hay datos en caché y son válidos
    if (
      !forceRefresh &&
      state.subscriptionPlans.length > 0 &&
      state.plansLastFetched &&
      now - state.plansLastFetched < CACHE_DURATION
    ) {
      return state.subscriptionPlans;
    }

    // Si ya se está cargando, esperar
    if (state.isLoadingPlans) {
      // Esperar un poco y volver a verificar
      await new Promise((resolve) => setTimeout(resolve, 100));
      return get().subscriptionPlans;
    }

    set({ isLoadingPlans: true });

    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("name, duration_days, price")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      const plans = data || [];
      set({
        subscriptionPlans: plans,
        plansLastFetched: Date.now(),
        isLoadingPlans: false,
      });

      return plans;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      set({ isLoadingPlans: false });
      return state.subscriptionPlans; // Retornar datos previos en caso de error
    }
  },

  // Obtener métodos de pago
  fetchPaymentMethods: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Verificar si hay datos en caché y son válidos
    if (
      !forceRefresh &&
      state.paymentMethods.length > 0 &&
      state.methodsLastFetched &&
      now - state.methodsLastFetched < CACHE_DURATION
    ) {
      return state.paymentMethods;
    }

    // Si ya se está cargando, esperar
    if (state.isLoadingMethods) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return get().paymentMethods;
    }

    set({ isLoadingMethods: true });

    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      const methods = data || [];
      set({
        paymentMethods: methods,
        methodsLastFetched: Date.now(),
        isLoadingMethods: false,
      });

      return methods;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      set({ isLoadingMethods: false });
      return state.paymentMethods;
    }
  },

  // Obtener todos los datos estáticos en paralelo
  fetchAllStaticData: async (forceRefresh = false) => {
    const state = get();
    await Promise.all([
      state.fetchSubscriptionPlans(forceRefresh),
      state.fetchPaymentMethods(forceRefresh),
    ]);
  },

  // Limpiar caché
  clearCache: () => {
    set({
      subscriptionPlans: [],
      paymentMethods: [],
      plansLastFetched: null,
      methodsLastFetched: null,
    });
  },
}));
