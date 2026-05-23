import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  duracion_dias: number;
  activo: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface SubscriptionPlansState {
  planes: Plan[];
  planesLoading: boolean;
  planesLastFetched: number | null;

  fetchPlanes: () => Promise<void>;
  togglePlan: (planId: string) => Promise<void>;
  updatePlan: (planId: string, updates: { nombre: string; precio: number; duracion_dias: number }) => Promise<void>;
  addPlan: (plan: { nombre: string; precio: number; duracion_dias: number }) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  invalidatePlanes: () => void;
}

export const useSubscriptionPlansStore = create<SubscriptionPlansState>((set, get) => ({
  planes: [],
  planesLoading: false,
  planesLastFetched: null,

  fetchPlanes: async () => {
    const state = get();
    const now = Date.now();

    if (state.planesLastFetched && now - state.planesLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.planesLoading) return;

    set({ planesLoading: true });

    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name, price, duration_days, is_active")
        .order("price", { ascending: true });

      if (error) throw error;

      set({
        planes: (data || []).map((p: any) => ({
          id: p.id,
          nombre: p.name,
          precio: p.price,
          duracion_dias: p.duration_days,
          activo: p.is_active,
        })),
        planesLastFetched: Date.now(),
        planesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching planes:", error);
      set({ planesLoading: false });
    }
  },

  togglePlan: async (planId) => {
    const state = get();
    const plan = state.planes.find((p) => p.id === planId);
    if (!plan) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ is_active: !plan.activo })
        .eq("id", planId);

      if (error) throw error;

      set({ planes: state.planes.map((p) => p.id === planId ? { ...p, activo: !p.activo } : p) });
    } catch (error) {
      console.error("Error toggling plan:", error);
    }
  },

  updatePlan: async (planId, updates) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ name: updates.nombre, price: updates.precio, duration_days: updates.duracion_dias })
        .eq("id", planId);

      if (error) throw error;

      const state = get();
      set({
        planes: state.planes.map((p) =>
          p.id === planId
            ? { ...p, nombre: updates.nombre, precio: updates.precio, duracion_dias: updates.duracion_dias }
            : p
        ),
      });
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  },

  addPlan: async (plan) => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .insert({ name: plan.nombre, price: plan.precio, duration_days: plan.duracion_dias, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        planes: [
          ...state.planes,
          { id: data.id, nombre: data.name, precio: data.price, duracion_dias: data.duration_days, activo: data.is_active },
        ],
      });
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  },

  deletePlan: async (planId) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      const state = get();
      set({ planes: state.planes.filter((p) => p.id !== planId) });
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  },

  invalidatePlanes: () => set({ planesLastFetched: null }),
}));
