// Hook de ejercicios - Migrado desde StabilitySistema
// ⚠️ Queries EXACTAS del código original (trainingStore.ts)

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LibraryExercise } from "@/lib/types/exercises";
import { toast } from "sonner";

interface CreateExerciseData {
  name: string;
  category_id: string;
  video_url?: string;
  notes?: string;
}

interface UpdateExerciseData extends CreateExerciseData {
  id: string;
}

export function useExercises() {
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [professorId, setProfessorId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setProfessorId(user.id);
      }
    };
    getUser();
  }, []);

  // FETCH - Query EXACTA del código original
  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select(
          `
          id, name, category_id, video_url, notes, created_by,
          exercise_categories ( id, name, color )
        `,
        )
        .order("name", { ascending: true });

      if (error) throw error;

      // Transform to match LibraryExercise interface
      const transformedData: LibraryExercise[] = (data || []).map(
        (ex: any) => ({
          id: ex.id,
          name: ex.name,
          category_id: ex.category_id,
          video_url: ex.video_url,
          notes: ex.notes,
          created_by: ex.created_by,
          category: ex.exercise_categories
            ? {
                id: ex.exercise_categories.id,
                name: ex.exercise_categories.name,
                color: ex.exercise_categories.color,
              }
            : undefined,
        }),
      );

      setExercises(transformedData);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast.error("Error al cargar los ejercicios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // CREATE - Payload EXACTO del código original
  const createExercise = async (formData: CreateExerciseData) => {
    if (!professorId) {
      toast.error("Usuario no autenticado");
      return false;
    }

    try {
      const { error } = await supabase.from("exercises").insert({
        name: formData.name.trim(),
        category_id: formData.category_id,
        video_url: formData.video_url?.trim() || null,
        notes: formData.notes?.trim() || null,
        created_by: professorId,
      });

      if (error) throw error;

      await fetchExercises();
      return true;
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast.error("Error al crear el ejercicio");
      return false;
    }
  };

  // UPDATE - Payload EXACTO del código original
  const updateExercise = async (formData: UpdateExerciseData) => {
    try {
      const { error } = await supabase
        .from("exercises")
        .update({
          name: formData.name.trim(),
          category_id: formData.category_id,
          video_url: formData.video_url?.trim() || null,
          notes: formData.notes?.trim() || null,
        })
        .eq("id", formData.id);

      if (error) throw error;

      await fetchExercises();
      return true;
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast.error("Error al actualizar el ejercicio");
      return false;
    }
  };

  // DELETE - Query EXACTA del código original
  const deleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      await fetchExercises();
      toast.success("Ejercicio eliminado");
      return true;
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error("Error al eliminar el ejercicio");
      return false;
    }
  };

  return {
    exercises,
    isLoading,
    refresh: fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}
