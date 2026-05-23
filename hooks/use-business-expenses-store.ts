import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BusinessExpense {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category: string | null;
  description: string | null;
  is_system: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface BusinessExpensesState {
  expenses: BusinessExpense[];
  expensesLoading: boolean;
  expensesLastFetched: number | null;

  fetchExpenses: () => Promise<void>;
  toggleExpense: (expenseId: string) => Promise<void>;
  updateExpense: (
    expenseId: string,
    updates: { name: string; amount: number; description?: string; category?: string }
  ) => Promise<void>;
  addExpense: (expense: {
    name: string;
    amount: number;
    description?: string;
    category?: string;
  }) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  invalidateExpenses: () => void;
}

export const useBusinessExpensesStore = create<BusinessExpensesState>((set, get) => ({
  expenses: [],
  expensesLoading: false,
  expensesLastFetched: null,

  fetchExpenses: async () => {
    const state = get();
    const now = Date.now();

    if (state.expensesLastFetched && now - state.expensesLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.expensesLoading) return;

    set({ expensesLoading: true });

    try {
      const { data, error } = await supabase
        .from("business_expenses")
        .select("id, name, amount, is_active, category, description, is_system")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        expenses: (data || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          amount: e.amount,
          is_active: e.is_active,
          category: e.category,
          description: e.description,
          is_system: e.is_system,
        })),
        expensesLastFetched: Date.now(),
        expensesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      set({ expensesLoading: false });
    }
  },

  toggleExpense: async (expenseId) => {
    const state = get();
    const expense = state.expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    try {
      const { error } = await supabase
        .from("business_expenses")
        .update({ is_active: !expense.is_active })
        .eq("id", expenseId);

      if (error) throw error;

      set({ expenses: state.expenses.map((e) => e.id === expenseId ? { ...e, is_active: !e.is_active } : e) });
    } catch (error) {
      console.error("Error toggling expense:", error);
    }
  },

  updateExpense: async (expenseId, updates) => {
    try {
      const { error } = await supabase
        .from("business_expenses")
        .update({
          name: updates.name,
          amount: updates.amount,
          description: updates.description || null,
          category: updates.category || null,
        })
        .eq("id", expenseId);

      if (error) throw error;

      const state = get();
      set({
        expenses: state.expenses.map((e) =>
          e.id === expenseId
            ? { ...e, name: updates.name, amount: updates.amount, description: updates.description || null, category: updates.category || null }
            : e
        ),
      });
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  },

  addExpense: async (expense) => {
    try {
      const { data, error } = await supabase
        .from("business_expenses")
        .insert({
          name: expense.name,
          amount: expense.amount,
          description: expense.description || null,
          category: expense.category || null,
          is_active: true,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        expenses: [
          ...state.expenses,
          {
            id: data.id,
            name: data.name,
            amount: data.amount,
            is_active: data.is_active,
            category: data.category,
            description: data.description,
            is_system: data.is_system,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  },

  deleteExpense: async (expenseId) => {
    try {
      const state = get();
      const expense = state.expenses.find((e) => e.id === expenseId);
      if (expense?.is_system) {
        alert("No se pueden eliminar los gastos predefinidos del sistema.");
        return;
      }

      const { error } = await supabase
        .from("business_expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      set({ expenses: state.expenses.filter((e) => e.id !== expenseId) });
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  },

  invalidateExpenses: () => set({ expensesLastFetched: null }),
}));
