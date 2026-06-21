import { useQuery, usePowerSync } from "@powersync/react";

export interface BusinessExpense {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category: string | null;
  description: string | null;
  is_system: boolean;
}

export function useBusinessExpensesStore() {
  const db = usePowerSync();
  const { data: rawExpenses, isLoading: expensesLoading } = useQuery<{
    id: string;
    name: string;
    amount: number;
    is_active: number;
    category: string | null;
    description: string | null;
    is_system: number;
  }>("SELECT id, name, amount, is_active, category, description, is_system FROM business_expenses ORDER BY name");

  const expenses: BusinessExpense[] = (rawExpenses ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    is_active: !!e.is_active,
    category: e.category,
    description: e.description,
    is_system: !!e.is_system,
  }));

  const toggleExpense = async (expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;
    await db.execute("UPDATE business_expenses SET is_active = ? WHERE id = ?", [
      expense.is_active ? 0 : 1,
      expenseId,
    ]);
  };

  const updateExpense = async (
    expenseId: string,
    updates: { name: string; amount: number; description?: string; category?: string }
  ) => {
    await db.execute(
      "UPDATE business_expenses SET name = ?, amount = ?, description = ?, category = ? WHERE id = ?",
      [updates.name, updates.amount, updates.description || null, updates.category || null, expenseId]
    );
  };

  const addExpense = async (expense: {
    name: string;
    amount: number;
    description?: string;
    category?: string;
  }) => {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO business_expenses (id, name, amount, description, category, is_active, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)",
      [
        id,
        expense.name,
        expense.amount,
        expense.description || null,
        expense.category || null,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
  };

  const deleteExpense = async (expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (expense?.is_system) {
      alert("No se pueden eliminar los gastos predefinidos del sistema.");
      return;
    }
    await db.execute("DELETE FROM business_expenses WHERE id = ?", [expenseId]);
  };

  return {
    expenses,
    expensesLoading,
    fetchExpenses: async () => {},
    toggleExpense,
    updateExpense,
    addExpense,
    deleteExpense,
    invalidateExpenses: () => {},
  };
}
