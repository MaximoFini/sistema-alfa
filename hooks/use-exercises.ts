import { useQuery, usePowerSync } from "@powersync/react";
import { LibraryExercise } from "@/lib/types/exercises";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  const db = usePowerSync();
  const [professorId, setProfessorId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setProfessorId(user.id);
    };
    getUser();
  }, []);

  const { data: rawExercises, isLoading } = useQuery<{
    id: string;
    name: string;
    category_id: string;
    video_url: string | null;
    notes: string | null;
    created_by: string;
    cat_id: string | null;
    cat_name: string | null;
    cat_color: string | null;
  }>(
    `SELECT e.id, e.name, e.category_id, e.video_url, e.notes, e.created_by,
            c.id AS cat_id, c.name AS cat_name, c.color AS cat_color
     FROM exercises e
     LEFT JOIN exercise_categories c ON e.category_id = c.id
     ORDER BY e.name`
  );

  const exercises: LibraryExercise[] = (rawExercises ?? []).map((ex) => ({
    id: ex.id,
    name: ex.name,
    category_id: ex.category_id,
    video_url: ex.video_url,
    notes: ex.notes,
    created_by: ex.created_by,
    category: ex.cat_id
      ? { id: ex.cat_id, name: ex.cat_name!, color: ex.cat_color! }
      : undefined,
  }));

  const createExercise = async (formData: CreateExerciseData) => {
    if (!professorId) {
      toast.error("Usuario no autenticado");
      return false;
    }
    try {
      const id = crypto.randomUUID();
      await db.execute(
        "INSERT INTO exercises (id, name, category_id, video_url, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [
          id,
          formData.name.trim(),
          formData.category_id,
          formData.video_url?.trim() || null,
          formData.notes?.trim() || null,
          professorId,
        ]
      );
      return true;
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast.error("Error al crear el ejercicio");
      return false;
    }
  };

  const updateExercise = async (formData: UpdateExerciseData) => {
    try {
      await db.execute(
        "UPDATE exercises SET name = ?, category_id = ?, video_url = ?, notes = ? WHERE id = ?",
        [
          formData.name.trim(),
          formData.category_id,
          formData.video_url?.trim() || null,
          formData.notes?.trim() || null,
          formData.id,
        ]
      );
      return true;
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast.error("Error al actualizar el ejercicio");
      return false;
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    try {
      await db.execute("DELETE FROM exercises WHERE id = ?", [exerciseId]);
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
    refresh: () => {},
    createExercise,
    updateExercise,
    deleteExercise,
  };
}
