// Hook de planes de entrenamiento - Migrado desde StabilitySistema
// ⚠️ Queries y payloads EXACTOS del código original (useTrainingPlans.ts)

import { useState, useEffect } from "react";
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
  const [professorId, setProfessorId] = useState<string | null>(null);
  const { plans, plansLoading, fetchPlans, invalidatePlans } =
    useDataCacheStore();

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

  // SAVE PLAN - Query EXACTA del código original
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

      // INSERT PLAN - Payload EXACTO
      const { data: insertedPlan, error: planError } = await supabase
        .from("training_plans")
        .insert([
          {
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
          },
        ])
        .select()
        .single();

      if (planError) throw planError;
      if (!insertedPlan) throw new Error("No se pudo crear el plan");

      // INSERT DAYS - Query EXACTA
      const daysToInsert = planData.days.map((day, index) => ({
        plan_id: insertedPlan.id,
        day_number: day.number,
        day_name: day.name,
        display_order: index,
      }));

      const { data: insertedDays, error: daysError } = await supabase
        .from("training_plan_days")
        .insert(daysToInsert)
        .select();

      if (daysError) throw daysError;
      if (!insertedDays) throw new Error("No se pudieron crear los días");

      // Map old day IDs to new day IDs
      const dayIdMap = new Map<string, string>();
      planData.days.forEach((originalDay, index) => {
        dayIdMap.set(originalDay.id, insertedDays[index].id);
      });

      // INSERT EXERCISES - Query EXACTA
      const exercisesToInsert = planData.exercises
        .map((ex) => {
          const newDayId = dayIdMap.get(ex.day_id);
          if (!newDayId) return null;

          return {
            day_id: newDayId,
            stage_id: ex.stage_id || null,
            stage_name: ex.stage_name,
            exercise_name: ex.exercise_name,
            video_url: ex.video_url || null,
            series: ex.series,
            reps: ex.reps,
            carga: ex.carga || "-",
            pause: ex.pause,
            notes: ex.notes || null,
            coach_instructions: null,
            display_order: 0,
            write_weight: ex.write_weight ?? false,
          };
        })
        .filter((ex) => ex !== null);

      if (exercisesToInsert.length > 0) {
        const { error: exercisesError } = await supabase
          .from("training_plan_exercises")
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      // Invalidate cache
      invalidatePlans();
      if (professorId) {
        await fetchPlans(professorId);
      }

      toast.success("Plan guardado exitosamente");
      return insertedPlan.id;
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Error al guardar el plan");
      return null;
    }
  };

  // DELETE PLAN (soft delete) - Query EXACTA
  const deletePlan = async (planId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("training_plans")
        .update({ is_archived: true })
        .eq("id", planId);

      if (error) throw error;

      // Invalidate cache
      invalidatePlans();
      if (professorId) {
        await fetchPlans(professorId);
      }

      toast.success("Plan eliminado");
      return true;
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Error al eliminar el plan");
      return false;
    }
  };

  // DUPLICATE PLAN - Lógica EXACTA del código original
  const duplicatePlan = async (planId: string): Promise<string | null> => {
    if (!professorId) {
      toast.error("Usuario no autenticado");
      return null;
    }

    try {
      // Fetch complete plan with days and exercises
      const { data: planData, error: fetchError } = await supabase
        .from("training_plans")
        .select(
          `
          *,
          training_plan_days (
            *,
            training_plan_exercises (*)
          )
        `,
        )
        .eq("id", planId)
        .single();

      if (fetchError) throw fetchError;
      if (!planData) throw new Error("Plan no encontrado");

      // Create new plan
      const { data: newPlan, error: planError } = await supabase
        .from("training_plans")
        .insert([
          {
            coach_id: professorId,
            title: `${planData.title} (Copia)`,
            description: planData.description,
            start_date: planData.start_date,
            end_date: planData.end_date,
            total_days: planData.total_days,
            days_per_week: planData.days_per_week,
            total_weeks: planData.total_weeks,
            plan_type: planData.plan_type,
            difficulty_level: planData.difficulty_level,
            is_template: planData.is_template,
            is_archived: false,
          },
        ])
        .select()
        .single();

      if (planError) throw planError;

      // Duplicate days
      const daysToInsert = planData.training_plan_days.map((day: any) => ({
        plan_id: newPlan.id,
        day_number: day.day_number,
        day_name: day.day_name,
        display_order: day.display_order,
      }));

      const { data: newDays, error: daysError } = await supabase
        .from("training_plan_days")
        .insert(daysToInsert)
        .select();

      if (daysError) throw daysError;

      // Map old to new day IDs
      const dayIdMap = new Map<string, string>();
      planData.training_plan_days.forEach((oldDay: any, index: number) => {
        dayIdMap.set(oldDay.id, newDays[index].id);
      });

      // Duplicate exercises
      const exercisesToInsert: any[] = [];
      planData.training_plan_days.forEach((day: any) => {
        const newDayId = dayIdMap.get(day.id);
        if (!newDayId) return;

        day.training_plan_exercises.forEach((ex: any) => {
          exercisesToInsert.push({
            day_id: newDayId,
            stage_id: ex.stage_id,
            stage_name: ex.stage_name,
            exercise_name: ex.exercise_name,
            video_url: ex.video_url,
            series: ex.series,
            reps: ex.reps,
            carga: ex.carga,
            pause: ex.pause,
            notes: ex.notes,
            coach_instructions: ex.coach_instructions,
            display_order: ex.display_order,
            write_weight: ex.write_weight,
          });
        });
      });

      if (exercisesToInsert.length > 0) {
        const { error: exercisesError } = await supabase
          .from("training_plan_exercises")
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      // Invalidate cache
      invalidatePlans();
      if (professorId) {
        await fetchPlans(professorId);
      }

      toast.success("Plan duplicado exitosamente");
      return newPlan.id;
    } catch (error) {
      console.error("Error duplicating plan:", error);
      toast.error("Error al duplicar el plan");
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

      // Invalidate cache to update assignment counts
      invalidatePlans();
      if (professorId) {
        await fetchPlans(professorId);
      }

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
