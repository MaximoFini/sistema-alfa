import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BusinessSalary {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  description: string | null;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface BusinessSalariesState {
  salaries: BusinessSalary[];
  salariesLoading: boolean;
  salariesLastFetched: number | null;

  fetchSalaries: () => Promise<void>;
  toggleSalary: (salaryId: string) => Promise<void>;
  updateSalary: (salaryId: string, updates: { name: string; amount: number; description?: string }) => Promise<void>;
  addSalary: (salary: { name: string; amount: number; description?: string }) => Promise<void>;
  deleteSalary: (salaryId: string) => Promise<void>;
  invalidateSalaries: () => void;
}

export const useBusinessSalariesStore = create<BusinessSalariesState>((set, get) => ({
  salaries: [],
  salariesLoading: false,
  salariesLastFetched: null,

  fetchSalaries: async () => {
    const state = get();
    const now = Date.now();

    if (state.salariesLastFetched && now - state.salariesLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.salariesLoading) return;

    set({ salariesLoading: true });

    try {
      const { data, error } = await supabase
        .from("business_salaries")
        .select("id, name, amount, is_active, description")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        salaries: (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          amount: s.amount,
          is_active: s.is_active,
          description: s.description,
        })),
        salariesLastFetched: Date.now(),
        salariesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching salaries:", error);
      set({ salariesLoading: false });
    }
  },

  toggleSalary: async (salaryId) => {
    const state = get();
    const salary = state.salaries.find((s) => s.id === salaryId);
    if (!salary) return;

    try {
      const { error } = await supabase
        .from("business_salaries")
        .update({ is_active: !salary.is_active })
        .eq("id", salaryId);

      if (error) throw error;

      set({ salaries: state.salaries.map((s) => s.id === salaryId ? { ...s, is_active: !s.is_active } : s) });
    } catch (error) {
      console.error("Error toggling salary:", error);
    }
  },

  updateSalary: async (salaryId, updates) => {
    try {
      const { error } = await supabase
        .from("business_salaries")
        .update({ name: updates.name, amount: updates.amount, description: updates.description || null })
        .eq("id", salaryId);

      if (error) throw error;

      const state = get();
      set({
        salaries: state.salaries.map((s) =>
          s.id === salaryId
            ? { ...s, name: updates.name, amount: updates.amount, description: updates.description || null }
            : s
        ),
      });
    } catch (error) {
      console.error("Error updating salary:", error);
    }
  },

  addSalary: async (salary) => {
    try {
      const { data, error } = await supabase
        .from("business_salaries")
        .insert({ name: salary.name, amount: salary.amount, description: salary.description || null, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        salaries: [
          ...state.salaries,
          { id: data.id, name: data.name, amount: data.amount, is_active: data.is_active, description: data.description },
        ],
      });
    } catch (error) {
      console.error("Error adding salary:", error);
    }
  },

  deleteSalary: async (salaryId) => {
    try {
      const { error } = await supabase
        .from("business_salaries")
        .delete()
        .eq("id", salaryId);

      if (error) throw error;

      const state = get();
      set({ salaries: state.salaries.filter((s) => s.id !== salaryId) });
    } catch (error) {
      console.error("Error deleting salary:", error);
    }
  },

  invalidateSalaries: () => set({ salariesLastFetched: null }),
}));
