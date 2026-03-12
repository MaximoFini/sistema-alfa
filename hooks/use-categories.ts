// Hook de categorías - Migrado desde StabilitySistema
// ⚠️ Query EXACTA del código original (dataCacheStore.ts)

import { useEffect } from "react";
import { useDataCacheStore } from "@/stores/data-cache-store";

export function useCategories() {
  const { categories, categoriesLoading, fetchCategories } =
    useDataCacheStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading: categoriesLoading,
    refresh: fetchCategories,
  };
}
