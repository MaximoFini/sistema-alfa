import { useState, useEffect, useCallback } from "react";
import { useQuery, usePowerSync } from "@powersync/react";

const seedingLocks = new Set<string>();

export interface MonthlyExpense {
  id: string;
  year: number;
  month: number;
  name: string;
  amount: number;
  is_active: boolean;
  category: string | null;
  description: string | null;
}

export interface MonthlySalary {
  id: string;
  year: number;
  month: number;
  name: string;
  amount: number;
  is_active: boolean;
  description: string | null;
}

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function useMonthlyExpenses(year: number, month: number) {
  const db = usePowerSync();
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  const { data: rawExpenses } = useQuery<{
    id: string;
    year: number;
    month: number;
    name: string;
    amount: number;
    is_active: number;
    category: string | null;
    description: string | null;
  }>(
    "SELECT id, year, month, name, amount, is_active, category, description FROM monthly_expenses_config WHERE year = ? AND month = ? ORDER BY name",
    [year, month]
  );

  const { data: rawSalaries } = useQuery<{
    id: string;
    year: number;
    month: number;
    name: string;
    amount: number;
    is_active: number;
    description: string | null;
  }>(
    "SELECT id, year, month, name, amount, is_active, description FROM monthly_salaries_config WHERE year = ? AND month = ? ORDER BY name",
    [year, month]
  );

  const expenses: MonthlyExpense[] = (rawExpenses ?? []).map((e) => ({
    ...e,
    is_active: !!e.is_active,
  }));

  const salaries: MonthlySalary[] = (rawSalaries ?? []).map((s) => ({
    ...s,
    is_active: !!s.is_active,
  }));

  const loading = rawExpenses === undefined || rawSalaries === undefined;

  // Auto-seed from previous months or base tables
  useEffect(() => {
    if (loading || seedDone) return;
    if (expenses.length > 0 || salaries.length > 0) {
      setSeedDone(true);
      return;
    }

    const seedData = async () => {
      const expLock = `${year}-${month}-expenses`;
      const salLock = `${year}-${month}-salaries`;
      if (seedingLocks.has(expLock) && seedingLocks.has(salLock)) return;

      setSeeding(true);

      const prevMonths: { year: number; month: number }[] = [];
      let py = year, pm = month;
      for (let i = 0; i < 6; i++) {
        const p = prevMonth(py, pm);
        py = p.year;
        pm = p.month;
        prevMonths.push({ year: py, month: pm });
      }

      // Seed expenses
      if (!seedingLocks.has(expLock)) {
        seedingLocks.add(expLock);
        try {
          let seeded = false;
          for (const pm of prevMonths) {
            const prev = await db.getAll<{ name: string; amount: number; is_active: number; category: string | null; description: string | null }>(
              "SELECT name, amount, is_active, category, description FROM monthly_expenses_config WHERE year = ? AND month = ?",
              [pm.year, pm.month]
            );
            if (prev.length > 0) {
              for (const r of prev) {
                await db.execute(
                  "INSERT INTO monthly_expenses_config (id, year, month, name, amount, is_active, category, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                  [crypto.randomUUID(), year, month, r.name, r.amount, r.is_active, r.category, r.description, new Date().toISOString(), new Date().toISOString()]
                );
              }
              seeded = true;
              break;
            }
          }
          if (!seeded) {
            const base = await db.getAll<{ name: string; amount: number; is_active: number; category: string | null; description: string | null }>(
              "SELECT name, amount, is_active, category, description FROM business_expenses ORDER BY name"
            );
            for (const r of base) {
              await db.execute(
                "INSERT INTO monthly_expenses_config (id, year, month, name, amount, is_active, category, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [crypto.randomUUID(), year, month, r.name, r.amount, r.is_active, r.category, r.description, new Date().toISOString(), new Date().toISOString()]
              );
            }
          }
        } finally {
          seedingLocks.delete(expLock);
        }
      }

      // Seed salaries
      if (!seedingLocks.has(salLock)) {
        seedingLocks.add(salLock);
        try {
          let seeded = false;
          for (const pm of prevMonths) {
            const prev = await db.getAll<{ name: string; amount: number; is_active: number; description: string | null }>(
              "SELECT name, amount, is_active, description FROM monthly_salaries_config WHERE year = ? AND month = ?",
              [pm.year, pm.month]
            );
            if (prev.length > 0) {
              for (const r of prev) {
                await db.execute(
                  "INSERT INTO monthly_salaries_config (id, year, month, name, amount, is_active, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                  [crypto.randomUUID(), year, month, r.name, r.amount, r.is_active, r.description, new Date().toISOString(), new Date().toISOString()]
                );
              }
              seeded = true;
              break;
            }
          }
          if (!seeded) {
            const base = await db.getAll<{ name: string; amount: number; is_active: number; description: string | null }>(
              "SELECT name, amount, is_active, description FROM business_salaries ORDER BY name"
            );
            for (const r of base) {
              await db.execute(
                "INSERT INTO monthly_salaries_config (id, year, month, name, amount, is_active, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [crypto.randomUUID(), year, month, r.name, r.amount, r.is_active, r.description, new Date().toISOString(), new Date().toISOString()]
              );
            }
          }
        } finally {
          seedingLocks.delete(salLock);
        }
      }

      setSeedDone(true);
      setSeeding(false);
    };

    seedData();
  }, [loading, seedDone, expenses.length, salaries.length, year, month, db]);

  // Reset seed state when month changes
  useEffect(() => {
    setSeedDone(false);
  }, [year, month]);

  // CRUD operations
  const toggleExpense = useCallback(async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    await db.execute(
      "UPDATE monthly_expenses_config SET is_active = ?, updated_at = ? WHERE id = ?",
      [expense.is_active ? 0 : 1, new Date().toISOString(), id]
    );
  }, [expenses, db]);

  const updateExpense = useCallback(async (
    id: string,
    updates: { name: string; amount: number; description?: string; category?: string }
  ) => {
    await db.execute(
      "UPDATE monthly_expenses_config SET name = ?, amount = ?, description = ?, category = ?, updated_at = ? WHERE id = ?",
      [updates.name, updates.amount, updates.description || null, updates.category || null, new Date().toISOString(), id]
    );
  }, [db]);

  const addExpense = useCallback(async (expense: {
    name: string;
    amount: number;
    description?: string;
    category?: string;
  }) => {
    await db.execute(
      "INSERT INTO monthly_expenses_config (id, year, month, name, amount, is_active, category, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)",
      [crypto.randomUUID(), year, month, expense.name, expense.amount, expense.category || null, expense.description || null, new Date().toISOString(), new Date().toISOString()]
    );
  }, [year, month, db]);

  const deleteExpense = useCallback(async (id: string) => {
    await db.execute("DELETE FROM monthly_expenses_config WHERE id = ?", [id]);
  }, [db]);

  const toggleSalary = useCallback(async (id: string) => {
    const salary = salaries.find((s) => s.id === id);
    if (!salary) return;
    await db.execute(
      "UPDATE monthly_salaries_config SET is_active = ?, updated_at = ? WHERE id = ?",
      [salary.is_active ? 0 : 1, new Date().toISOString(), id]
    );
  }, [salaries, db]);

  const updateSalary = useCallback(async (
    id: string,
    updates: { name: string; amount: number; description?: string }
  ) => {
    await db.execute(
      "UPDATE monthly_salaries_config SET name = ?, amount = ?, description = ?, updated_at = ? WHERE id = ?",
      [updates.name, updates.amount, updates.description || null, new Date().toISOString(), id]
    );
  }, [db]);

  const addSalary = useCallback(async (salary: { name: string; amount: number; description?: string }) => {
    await db.execute(
      "INSERT INTO monthly_salaries_config (id, year, month, name, amount, is_active, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)",
      [crypto.randomUUID(), year, month, salary.name, salary.amount, salary.description || null, new Date().toISOString(), new Date().toISOString()]
    );
  }, [year, month, db]);

  const deleteSalary = useCallback(async (id: string) => {
    await db.execute("DELETE FROM monthly_salaries_config WHERE id = ?", [id]);
  }, [db]);

  return {
    expenses,
    salaries,
    loading,
    seeding,
    toggleExpense,
    updateExpense,
    addExpense,
    deleteExpense,
    toggleSalary,
    updateSalary,
    addSalary,
    deleteSalary,
  };
}
