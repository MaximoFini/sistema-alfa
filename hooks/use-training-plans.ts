// Hook de planes de entrenamiento - Migrado desde StabilitySistema
// ⚠️ Queries y payloads EXACTOS del código original (useTrainingPlans.ts)

import { useState, useEffect } from "react";
import { usePowerSync } from "@powersync/react";
import { supabase } from "@/lib/supabase";
import { TrainingPlanSummary, TrainingPlan } from "@/lib/types/plans";
import { toast } from "sonner";
import { useDataCacheStore } from "@/stores/data-cache-store";

// Helper function from original code
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface SavePlanData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isTemplate: boolean;
  days: Array<{ id: string; number: number; name: string }>;
  exercises: Array<{
    day_id: string;
    stage_id: string | null;
    stage_name: string | null;
    exercise_name: string;
    video_url?: string | null;
    series: number;
    reps: string;
    carga: string;
    pause: string;
    notes: string | null;
    write_weight?: boolean;
  }>;
}

export function useTrainingPlans() {
  const db = usePowerSync();
  const [professorId, setProfessorId] = useState<string | null>(null);
  const {
    plans, 
    plansLoading, 
    fetchPlans, 
    invalidatePlans,
    optimisticDeletePlan,
    optimisticAddPlan,
    optimisticUpdatePlan
  } = useDataCacheStore();

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setProfessorId(user.id);
        fetchPlans(user.id);
      }
    };
    getUser();
  }, [fetchPlans]);

  // SAVE PLAN - Local inserts via PowerSync (syncs automatically)
  const savePlan = async (
    planData: SavePlanData,
    existingPlanId?: string,
  ): Promise<string | null> => {
    if (!professorId) {
      toast.error("Usuario no autenticado");
      return null;
    }

    try {
      // Calculate plan metrics
      const totalDays = planData.days.length;
      const daysPerWeek = totalDays;
      const daysDiff = Math.ceil(
        (planData.endDate.getTime() - planData.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const totalWeeks = Math.ceil(daysDiff / 7);

      const planId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 1. Insert the plan
      await db.execute(
        `INSERT INTO training_plans (id, coach_id, title, description, start_date, end_date, total_days, days_per_week, total_weeks, plan_type, difficulty_level, is_template, is_archived, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          planId,
          professorId,
          planData.title,
          planData.description || null,
          formatLocalDate(planData.startDate),
          formatLocalDate(planData.endDate),
          totalDays,
          daysPerWeek,
          totalWeeks,
          planData.isTemplate ? "template" : "custom",
          null,
          planData.isTemplate ? 1 : 0,
          0,
          now,
        ]
      );

      // 2. Insert days and build temp_id -> real_id map
      const dayIdMap = new Map<string, string>();
      for (let i = 0; i < planData.days.length; i++) {
        const day = planData.days[i];
        const dayId = crypto.randomUUID();
        dayIdMap.set(day.id, dayId);
        await db.execute(
          `INSERT INTO training_plan_days (id, plan_id, day_number, day_name, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [dayId, planId, day.number, day.name, i]
        );
      }

      // 3. Insert exercises
      for (const ex of planData.exercises) {
        const realDayId = dayIdMap.get(ex.day_id);
        if (!realDayId) continue;
        await db.execute(
          `INSERT INTO training_plan_exercises (id, day_id, stage_id, stage_name, exercise_name, video_url, series, reps, carga, pause, notes, coach_instructions, display_order, write_weight)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            realDayId,
            ex.stage_id || null,
            ex.stage_name,
            ex.exercise_name,
            ex.video_url || null,
            ex.series,
            ex.reps,
            ex.carga || "-",
            ex.pause,
            ex.notes || null,
            null,
            0,
            ex.write_weight ? 1 : 0,
          ]
        );
      }

      // Add to UI immediately (optimistic update)
      optimisticAddPlan({
        id: planId,
        coach_id: professorId,
        title: planData.title,
        description: planData.description || null,
        start_date: formatLocalDate(planData.startDate),
        end_date: formatLocalDate(planData.endDate),
        total_days: totalDays,
        days_per_week: daysPerWeek,
        total_weeks: totalWeeks,
        plan_type: planData.isTemplate ? "template" : "custom",
        difficulty_level: null,
        is_template: planData.isTemplate,
        is_archived: false,
        created_at: now,
        assignedCount: 0,
      });

      // Invalidate cache for next fetch
      invalidatePlans();

      toast.success("Plan guardado exitosamente");
      return planId;
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Error al guardar el plan");
      return null;
    }
  };

  // DELETE PLAN (soft delete) - Query EXACTA con optimistic update
  const deletePlan = async (planId: string): Promise<boolean> => {
    // Optimistic update - remove from UI immediately
    optimisticDeletePlan(planId);

    try {
      const { error } = await supabase
        .from("training_plans")
        .update({ is_archived: true })
        .eq("id", planId);

      if (error) throw error;

      // Success - invalidate cache for next fetch
      invalidatePlans();

      toast.success("Plan eliminado");
      return true;
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Error al eliminar el plan");
      
      // Rollback - refetch to restore state
      if (professorId) {
        await fetchPlans(professorId);
      }
      
      return false;
    }
  };

  // DUPLICATE PLAN - Local read + inserts via PowerSync
  const duplicatePlan = async (planId: string): Promise<string | null> => {
    if (!professorId) {
      toast.error("Usuario no autenticado");
      return null;
    }

    try {
      // 1. Read the original plan locally
      const originalPlans = await db.getAll<{
        id: string; coach_id: string; title: string; description: string | null;
        start_date: string; end_date: string; total_days: number; days_per_week: number;
        total_weeks: number; plan_type: string; difficulty_level: string | null;
        is_template: number; is_archived: number; created_at: string;
      }>("SELECT * FROM training_plans WHERE id = ?", [planId]);

      if (!originalPlans.length) throw new Error("Plan no encontrado");
      const original = originalPlans[0];

      const newPlanId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 2. Insert new plan
      await db.execute(
        `INSERT INTO training_plans (id, coach_id, title, description, start_date, end_date, total_days, days_per_week, total_weeks, plan_type, difficulty_level, is_template, is_archived, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newPlanId, professorId, `${original.title} (Copia)`, original.description,
          original.start_date, original.end_date, original.total_days, original.days_per_week,
          original.total_weeks, original.plan_type, original.difficulty_level,
          original.is_template, 0, now,
        ]
      );

      // 3. Read and copy days
      const originalDays = await db.getAll<{
        id: string; day_number: number; day_name: string; display_order: number;
      }>("SELECT * FROM training_plan_days WHERE plan_id = ? ORDER BY display_order", [planId]);

      for (const day of originalDays) {
        const newDayId = crypto.randomUUID();
        await db.execute(
          `INSERT INTO training_plan_days (id, plan_id, day_number, day_name, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [newDayId, newPlanId, day.day_number, day.day_name, day.display_order]
        );

        // 4. Read and copy exercises for each day
        const dayExercises = await db.getAll<{
          stage_id: string | null; stage_name: string | null; exercise_name: string;
          video_url: string | null; series: number; reps: string; carga: string;
          pause: string; notes: string | null; coach_instructions: string | null;
          display_order: number; write_weight: number;
        }>("SELECT * FROM training_plan_exercises WHERE day_id = ? ORDER BY display_order", [day.id]);

        for (const ex of dayExercises) {
          await db.execute(
            `INSERT INTO training_plan_exercises (id, day_id, stage_id, stage_name, exercise_name, video_url, series, reps, carga, pause, notes, coach_instructions, display_order, write_weight)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(), newDayId, ex.stage_id, ex.stage_name,
              ex.exercise_name, ex.video_url, ex.series, ex.reps, ex.carga,
              ex.pause, ex.notes, ex.coach_instructions, ex.display_order, ex.write_weight,
            ]
          );
        }
      }

      // Optimistic UI update
      optimisticAddPlan({
        id: newPlanId,
        coach_id: professorId,
        title: `${original.title} (Copia)`,
        description: original.description,
        start_date: original.start_date,
        end_date: original.end_date,
        total_days: original.total_days,
        days_per_week: original.days_per_week,
        total_weeks: original.total_weeks,
        plan_type: original.plan_type,
        difficulty_level: original.difficulty_level,
        is_template: !!original.is_template,
        is_archived: false,
        created_at: now,
        assignedCount: 0,
      });

      invalidatePlans();
      toast.success("Plan duplicado exitosamente");
      return newPlanId;
    } catch (error) {
      console.error("Error duplicating plan:", error);
      toast.error("Error al duplicar el plan");

      // Rollback - refetch to restore state
      if (professorId) {
        await fetchPlans(professorId);
      }

      return null;
    }
  };

  // ASSIGN PLAN TO STUDENTS - Query EXACTA
  const assignPlan = async (
    planId: string,
    studentIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> => {
    if (!professorId) {
      toast.error("Usuario no autenticado");
      return false;
    }

    try {
      const assignments = studentIds.map((studentId) => ({
        plan_id: planId,
        student_id: studentId,
        coach_id: professorId,
        start_date: formatLocalDate(startDate),
        end_date: formatLocalDate(endDate),
        status: "active",
        current_day_number: 1,
        completed_days: 0,
      }));

      const { error } = await supabase
        .from("training_plan_assignments")
        .insert(assignments);

      if (error) throw error;

      // Update assignment count optimistically
      optimisticUpdatePlan(planId, {
        assignedCount: (plans.find(p => p.id === planId)?.assignedCount || 0) + studentIds.length,
      });

      // Invalidate cache for next fetch
      invalidatePlans();

      toast.success(
        `Plan asignado a ${studentIds.length} alumno${studentIds.length > 1 ? "s" : ""}`,
      );
      return true;
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error("Error al asignar el plan");
      return false;
    }
  };

  return {
    plans,
    loading: plansLoading,
    savePlan,
    deletePlan,
    duplicatePlan,
    assignPlan,
    refresh: () => professorId && fetchPlans(professorId),
  };
}
