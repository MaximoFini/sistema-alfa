import { useQuery, usePowerSync } from "@powersync/react";

export interface ProductCategory {
  id: string;
  name: string;
  is_active: boolean;
  color?: string | null;
  created_at: string;
}

export function useProductCategoriesStore() {
  const db = usePowerSync();
  const { data: rawCategories, isLoading: productCategoriesLoading } = useQuery<{
    id: string;
    name: string;
    is_active: number;
    color: string | null;
    created_at: string;
  }>("SELECT id, name, is_active, color, created_at FROM product_categories ORDER BY name");

  const productCategories: ProductCategory[] = (rawCategories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    is_active: !!c.is_active,
    color: c.color,
    created_at: c.created_at,
  }));

  const toggleProductCategory = async (categoryId: string) => {
    const category = productCategories.find((c) => c.id === categoryId);
    if (!category) return;
    await db.execute("UPDATE product_categories SET is_active = ? WHERE id = ?", [
      category.is_active ? 0 : 1,
      categoryId,
    ]);
  };

  const updateProductCategory = async (categoryId: string, name: string, color: string) => {
    await db.execute("UPDATE product_categories SET name = ?, color = ? WHERE id = ?", [
      name,
      color,
      categoryId,
    ]);
  };

  const addProductCategory = async (name: string, color: string) => {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO product_categories (id, name, color, is_active, created_at) VALUES (?, ?, ?, 1, ?)",
      [id, name, color, new Date().toISOString()]
    );
  };

  const deleteProductCategory = async (categoryId: string) => {
    await db.execute("DELETE FROM product_categories WHERE id = ?", [categoryId]);
  };

  return {
    productCategories,
    productCategoriesLoading,
    fetchProductCategories: async () => {},
    toggleProductCategory,
    updateProductCategory,
    addProductCategory,
    deleteProductCategory,
    invalidateProductCategories: () => {},
  };
}
