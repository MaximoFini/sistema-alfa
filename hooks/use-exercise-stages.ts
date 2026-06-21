import { useQuery, usePowerSync } from "@powersync/react";
import { ExerciseStage } from "@/lib/types/exercises";
import { toast } from "sonner";

export function useExerciseStages() {
  const db = usePowerSync();
  const { data: stages, isLoading } = useQuery<ExerciseStage>(
    "SELECT id, name, color FROM exercise_stages ORDER BY name"
  );

  const createStage = async (name: string, color: string): Promise<boolean> => {
    try {
      const id = crypto.randomUUID();
      await db.execute(
        "INSERT INTO exercise_stages (id, name, color) VALUES (?, ?, ?)",
        [id, name, color]
      );
      toast.success("Etapa creada");
      return true;
    } catch (error) {
      console.error("Error creating stage:", error);
      toast.error("Error al crear la etapa");
      return false;
    }
  };

  return {
    stages: (stages ?? []) as ExerciseStage[],
    isLoading,
    refresh: () => {},
    createStage,
  };
}
