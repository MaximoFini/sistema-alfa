import { useQuery } from "@powersync/react";
import { ExerciseCategory } from "@/lib/types/exercises";

export function useCategories() {
  const { data: categories, isLoading: loading } = useQuery<ExerciseCategory>(
    "SELECT id, name, color FROM exercise_categories ORDER BY name"
  );

  return {
    categories: (categories ?? []) as ExerciseCategory[],
    loading,
    refresh: () => {},
  };
}
