import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PaymentMethod {
  id: string;
  nombre: string;
  activo: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface PaymentMethodsState {
  metodos: PaymentMethod[];
  metodosLoading: boolean;
  metodosLastFetched: number | null;

  fetchMetodos: () => Promise<void>;
  toggleMetodo: (metodoId: string) => Promise<void>;
  updateMetodo: (metodoId: string, nombre: string) => Promise<void>;
  addMetodo: (nombre: string) => Promise<void>;
  deleteMetodo: (metodoId: string) => Promise<void>;
  invalidateMetodos: () => void;
}

export const usePaymentMethodsStore = create<PaymentMethodsState>((set, get) => ({
  metodos: [],
  metodosLoading: false,
  metodosLastFetched: null,

  fetchMetodos: async () => {
    const state = get();
    const now = Date.now();

    if (state.metodosLastFetched && now - state.metodosLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.metodosLoading) return;

    set({ metodosLoading: true });

    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        metodos: (data || []).map((m: any) => ({ id: m.id, nombre: m.name, activo: m.is_active })),
        metodosLastFetched: Date.now(),
        metodosLoading: false,
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      set({ metodosLoading: false });
    }
  },

  toggleMetodo: async (metodoId) => {
    const state = get();
    const metodo = state.metodos.find((m) => m.id === metodoId);
    if (!metodo) return;

    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: !metodo.activo })
        .eq("id", metodoId);

      if (error) throw error;

      set({ metodos: state.metodos.map((m) => m.id === metodoId ? { ...m, activo: !m.activo } : m) });
    } catch (error) {
      console.error("Error toggling payment method:", error);
    }
  },

  updateMetodo: async (metodoId, nombre) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ name: nombre })
        .eq("id", metodoId);

      if (error) throw error;

      const state = get();
      set({ metodos: state.metodos.map((m) => m.id === metodoId ? { ...m, nombre } : m) });
    } catch (error) {
      console.error("Error updating payment method:", error);
    }
  },

  addMetodo: async (nombre) => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert({ name: nombre, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({ metodos: [...state.metodos, { id: data.id, nombre: data.name, activo: data.is_active }] });
    } catch (error) {
      console.error("Error adding payment method:", error);
    }
  },

  deleteMetodo: async (metodoId) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", metodoId);

      if (error) throw error;

      const state = get();
      set({ metodos: state.metodos.filter((m) => m.id !== metodoId) });
    } catch (error) {
      console.error("Error deleting payment method:", error);
    }
  },

  invalidateMetodos: () => set({ metodosLastFetched: null }),
}));
