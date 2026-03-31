// Store global de cache - Migrado desde StabilitySistema
// ⚠️ LA LÓGICA DE QUERIES DEBE MANTENERSE IDÉNTICA AL CÓDIGO ORIGINAL

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { ExerciseCategory } from "@/lib/types/exercises";
import { TrainingPlanSummary } from "@/lib/types/plans";

interface DataCacheState {
  // Categories
  categories: ExerciseCategory[];
  categoriesLoading: boolean;
  categoriesLastFetched: number | null;

  // Plans
  plans: TrainingPlanSummary[];
  plansLoading: boolean;
  plansLastFetched: number | null;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchPlans: (professorId: string) => Promise<void>;
  invalidateCategories: () => void;
  invalidatePlans: () => void;
  
  // Optimistic updates
  optimisticDeletePlan: (planId: string) => void;
  optimisticAddPlan: (plan: TrainingPlanSummary) => void;
  optimisticUpdatePlan: (planId: string, updates: Partial<TrainingPlanSummary>) => void;
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

  optimisticUpdatePlan: (planId: string, updates: Partial<TrainingPlanSummary>) => {
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === planId ? { ...plan, ...updates } : plan
      ),
    }));
  },
}));
