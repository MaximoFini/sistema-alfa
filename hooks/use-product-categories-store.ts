import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProductCategory {
  id: string;
  name: string;
  is_active: boolean;
  color?: string | null;
  created_at: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface ProductCategoriesState {
  productCategories: ProductCategory[];
  productCategoriesLoading: boolean;
  productCategoriesLastFetched: number | null;

  fetchProductCategories: () => Promise<void>;
  toggleProductCategory: (categoryId: string) => Promise<void>;
  updateProductCategory: (categoryId: string, name: string, color: string) => Promise<void>;
  addProductCategory: (name: string, color: string) => Promise<void>;
  deleteProductCategory: (categoryId: string) => Promise<void>;
  invalidateProductCategories: () => void;
}

export const useProductCategoriesStore = create<ProductCategoriesState>((set, get) => ({
  productCategories: [],
  productCategoriesLoading: false,
  productCategoriesLastFetched: null,

  fetchProductCategories: async () => {
    const state = get();
    const now = Date.now();

    if (state.productCategoriesLastFetched && now - state.productCategoriesLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.productCategoriesLoading) return;

    set({ productCategoriesLoading: true });

    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, is_active, color, created_at")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        productCategories: (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          is_active: c.is_active,
          color: c.color,
          created_at: c.created_at,
        })),
        productCategoriesLastFetched: Date.now(),
        productCategoriesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching product categories:", error);
      set({ productCategoriesLoading: false });
    }
  },

  toggleProductCategory: async (categoryId) => {
    const state = get();
    const category = state.productCategories.find((c) => c.id === categoryId);
    if (!category) return;

    try {
      const { error } = await supabase
        .from("product_categories")
        .update({ is_active: !category.is_active })
        .eq("id", categoryId);

      if (error) throw error;

      set({
        productCategories: state.productCategories.map((c) =>
          c.id === categoryId ? { ...c, is_active: !c.is_active } : c
        ),
      });
    } catch (error) {
      console.error("Error toggling product category:", error);
    }
  },

  updateProductCategory: async (categoryId, name, color) => {
    try {
      const { error } = await supabase
        .from("product_categories")
        .update({ name, color })
        .eq("id", categoryId);

      if (error) throw error;

      const state = get();
      set({
        productCategories: state.productCategories.map((c) =>
          c.id === categoryId ? { ...c, name, color } : c
        ),
      });
    } catch (error) {
      console.error("Error updating product category:", error);
    }
  },

  addProductCategory: async (name, color) => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .insert({ name, color, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        productCategories: [
          ...state.productCategories,
          { id: data.id, name: data.name, is_active: data.is_active, color: data.color, created_at: data.created_at },
        ],
      });
    } catch (error) {
      console.error("Error adding product category:", error);
    }
  },

  deleteProductCategory: async (categoryId) => {
    try {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      const state = get();
      set({ productCategories: state.productCategories.filter((c) => c.id !== categoryId) });
    } catch (error) {
      console.error("Error deleting product category:", error);
    }
  },

  invalidateProductCategories: () => set({ productCategoriesLastFetched: null }),
}));
