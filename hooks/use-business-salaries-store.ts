import { useQuery, usePowerSync } from "@powersync/react";

export interface BusinessSalary {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  description: string | null;
}

export function useBusinessSalariesStore() {
  const db = usePowerSync();
  const { data: rawSalaries, isLoading: salariesLoading } = useQuery<{
    id: string;
    name: string;
    amount: number;
    is_active: number;
    description: string | null;
  }>("SELECT id, name, amount, is_active, description FROM business_salaries ORDER BY name");

  const salaries: BusinessSalary[] = (rawSalaries ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    is_active: !!s.is_active,
    description: s.description,
  }));

  const toggleSalary = async (salaryId: string) => {
    const salary = salaries.find((s) => s.id === salaryId);
    if (!salary) return;
    await db.execute("UPDATE business_salaries SET is_active = ? WHERE id = ?", [
      salary.is_active ? 0 : 1,
      salaryId,
    ]);
  };

  const updateSalary = async (
    salaryId: string,
    updates: { name: string; amount: number; description?: string }
  ) => {
    await db.execute(
      "UPDATE business_salaries SET name = ?, amount = ?, description = ? WHERE id = ?",
      [updates.name, updates.amount, updates.description || null, salaryId]
    );
  };

  const addSalary = async (salary: { name: string; amount: number; description?: string }) => {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO business_salaries (id, name, amount, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)",
      [id, salary.name, salary.amount, salary.description || null, new Date().toISOString(), new Date().toISOString()]
    );
  };

  const deleteSalary = async (salaryId: string) => {
    await db.execute("DELETE FROM business_salaries WHERE id = ?", [salaryId]);
  };

  return {
    salaries,
    salariesLoading,
    fetchSalaries: async () => {},
    toggleSalary,
    updateSalary,
    addSalary,
    deleteSalary,
    invalidateSalaries: () => {},
  };
}
