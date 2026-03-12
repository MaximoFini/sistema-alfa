// Hook de etapas de ejercicios - Migrado desde StabilitySistema
// ⚠️ Query EXACTA del código original

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ExerciseStage } from "@/lib/types/exercises";
import { toast } from "sonner";

export function useExerciseStages() {
  const [stages, setStages] = useState<ExerciseStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // FETCH - Query EXACTA del código original
  const fetchStages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercise_stages")
        .select("id, name, color")
        .order("name", { ascending: true });

      if (error) throw error;

      setStages(data || []);
    } catch (error) {
      console.error("Error fetching stages:", error);
      toast.error("Error al cargar las etapas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  // CREATE - Query EXACTA del código original
  const createStage = async (name: string, color: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("exercise_stages")
        .insert({ name, color });

      if (error) throw error;

      await fetchStages();
      toast.success("Etapa creada");
      return true;
    } catch (error) {
      console.error("Error creating stage:", error);
      toast.error("Error al crear la etapa");
      return false;
    }
  };

  return {
    stages,
    isLoading,
    refresh: fetchStages,
    createStage,
  };
}
