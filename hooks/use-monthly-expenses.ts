import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helper ───────────────────────────────────────────────────────────────────

function prevMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMonthlyExpenses(year: number, month: number) {
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [salaries, setSalaries] = useState<MonthlySalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // ── Seed expenses from a source list ──────────────────────────────────────

  const seedExpensesFromRows = useCallback(
    async (
      rows: Array<{
        name: string;
        amount: number;
        is_active: boolean;
        category: string | null;
        description: string | null;
      }>,
    ) => {
      if (rows.length === 0) return [];
      const toInsert = rows.map((r) => ({
        year,
        month,
        name: r.name,
        amount: r.amount,
        is_active: r.is_active,
        category: r.category,
        description: r.description,
      }));
      const { data, error } = await supabase
        .from("monthly_expenses_config")
        .insert(toInsert)
        .select();
      if (error) throw error;
      return (data || []) as MonthlyExpense[];
    },
    [year, month],
  );

  const seedSalariesFromRows = useCallback(
    async (
      rows: Array<{
        name: string;
        amount: number;
        is_active: boolean;
        description: string | null;
      }>,
    ) => {
      if (rows.length === 0) return [];
      const toInsert = rows.map((r) => ({
        year,
        month,
        name: r.name,
        amount: r.amount,
        is_active: r.is_active,
        description: r.description,
      }));
      const { data, error } = await supabase
        .from("monthly_salaries_config")
        .insert(toInsert)
        .select();
      if (error) throw error;
      return (data || []) as MonthlySalary[];
    },
    [year, month],
  );

  // ── Fetch (with auto-seed from previous month) ────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch expenses for this month
      const { data: expData, error: expError } = await supabase
        .from("monthly_expenses_config")
        .select("*")
        .eq("year", year)
        .eq("month", month)
        .order("name", { ascending: true });

      if (expError) throw expError;

      // Fetch salaries for this month
      const { data: salData, error: salError } = await supabase
        .from("monthly_salaries_config")
        .select("*")
        .eq("year", year)
        .eq("month", month)
        .order("name", { ascending: true });

      if (salError) throw salError;

      let finalExpenses = (expData || []) as MonthlyExpense[];
      let finalSalaries = (salData || []) as MonthlySalary[];

      // If no data for this month, seed from previous months or base tables
      const needsSeedExpenses = finalExpenses.length === 0;
      const needsSeedSalaries = finalSalaries.length === 0;

      if (needsSeedExpenses || needsSeedSalaries) {
        setSeeding(true);

        // Buscar los últimos 6 meses en una sola query batch en vez de loop N+1
        const prevMonthsList: { year: number; month: number }[] = [];
        let py = year;
        let pm = month;
        for (let i = 0; i < 6; i++) {
          const p = prevMonth(py, pm);
          py = p.year;
          pm = p.month;
          prevMonthsList.push({ year: py, month: pm });
        }

        // Query batch: trae expenses de hasta 6 meses anteriores de una vez
        if (needsSeedExpenses) {
          const { data: prevExpensesData } = await supabase
            .from("monthly_expenses_config")
            .select("*")
            .in(
              "year",
              [...new Set(prevMonthsList.map((m) => m.year))]
            )
            .order("year", { ascending: false })
            .order("month", { ascending: false });

          if (prevExpensesData && prevExpensesData.length > 0) {
            // Encontrar el mes más reciente con datos
            for (const pm of prevMonthsList) {
              const monthData = prevExpensesData.filter(
                (e: any) => e.year === pm.year && e.month === pm.month
              );
              if (monthData.length > 0) {
                const seeded = await seedExpensesFromRows(monthData);
                finalExpenses = seeded;
                break;
              }
            }
          }
        }

        if (needsSeedSalaries) {
          const { data: prevSalariesData } = await supabase
            .from("monthly_salaries_config")
            .select("*")
            .in(
              "year",
              [...new Set(prevMonthsList.map((m) => m.year))]
            )
            .order("year", { ascending: false })
            .order("month", { ascending: false });

          if (prevSalariesData && prevSalariesData.length > 0) {
            // Encontrar el mes más reciente con datos
            for (const pm of prevMonthsList) {
              const monthData = prevSalariesData.filter(
                (s: any) => s.year === pm.year && s.month === pm.month
              );
              if (monthData.length > 0) {
                const seeded = await seedSalariesFromRows(monthData);
                finalSalaries = seeded;
                break;
              }
            }
          }
        }

        // Si aún no hay datos, intentar desde las tablas base
        if (needsSeedExpenses && finalExpenses.length === 0) {
          const { data } = await supabase
            .from("business_expenses")
            .select("name, amount, is_active, category, description")
            .order("name", { ascending: true });
          if (data && data.length > 0) {
            const sourceExpenses = data.map((d: any) => ({
              ...d,
              id: "",
              year,
              month,
            }));
            const seeded = await seedExpensesFromRows(sourceExpenses);
            finalExpenses = seeded;
          }
        }

        if (needsSeedSalaries && finalSalaries.length === 0) {
          const { data } = await supabase
            .from("business_salaries")
            .select("name, amount, is_active, description")
            .order("name", { ascending: true });
          if (data && data.length > 0) {
            const sourceSalaries = data.map((d: any) => ({
              ...d,
              id: "",
              year,
              month,
            }));
            const seeded = await seedSalariesFromRows(sourceSalaries);
            finalSalaries = seeded;
          }
        }

        setSeeding(false);
      }

      setExpenses(finalExpenses);
      setSalaries(finalSalaries);
    } catch (err) {
      console.error("Error fetching monthly expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [year, month, seedExpensesFromRows, seedSalariesFromRows]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Expenses CRUD ─────────────────────────────────────────────────────────

  const toggleExpense = useCallback(
    async (id: string) => {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) return;
      const newVal = !expense.is_active;
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_active: newVal } : e)),
      );
      const { error } = await supabase
        .from("monthly_expenses_config")
        .update({ is_active: newVal, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        console.error("Error toggling expense:", error);
        setExpenses((prev) =>
          prev.map((e) => (e.id === id ? { ...e, is_active: !newVal } : e)),
        );
      }
    },
    [expenses],
  );

  const updateExpense = useCallback(
    async (
      id: string,
      updates: {
        name: string;
        amount: number;
        description?: string;
        category?: string;
      },
    ) => {
      const { error } = await supabase
        .from("monthly_expenses_config")
        .update({
          name: updates.name,
          amount: updates.amount,
          description: updates.description || null,
          category: updates.category || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) {
        console.error("Error updating expense:", error);
        return;
      }
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                name: updates.name,
                amount: updates.amount,
                description: updates.description || null,
                category: updates.category || null,
              }
            : e,
        ),
      );
    },
    [],
  );

  const addExpense = useCallback(
    async (expense: {
      name: string;
      amount: number;
      description?: string;
      category?: string;
    }) => {
      const { data, error } = await supabase
        .from("monthly_expenses_config")
        .insert({
          year,
          month,
          name: expense.name,
          amount: expense.amount,
          description: expense.description || null,
          category: expense.category || null,
          is_active: true,
        })
        .select()
        .single();
      if (error) {
        console.error("Error adding expense:", error);
        return;
      }
      setExpenses((prev) => [...prev, data as MonthlyExpense]);
    },
    [year, month],
  );

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("monthly_expenses_config")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting expense:", error);
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Salaries CRUD ─────────────────────────────────────────────────────────

  const toggleSalary = useCallback(
    async (id: string) => {
      const salary = salaries.find((s) => s.id === id);
      if (!salary) return;
      const newVal = !salary.is_active;
      setSalaries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: newVal } : s)),
      );
      const { error } = await supabase
        .from("monthly_salaries_config")
        .update({ is_active: newVal, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        console.error("Error toggling salary:", error);
        setSalaries((prev) =>
          prev.map((s) => (s.id === id ? { ...s, is_active: !newVal } : s)),
        );
      }
    },
    [salaries],
  );

  const updateSalary = useCallback(
    async (
      id: string,
      updates: { name: string; amount: number; description?: string },
    ) => {
      const { error } = await supabase
        .from("monthly_salaries_config")
        .update({
          name: updates.name,
          amount: updates.amount,
          description: updates.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) {
        console.error("Error updating salary:", error);
        return;
      }
      setSalaries((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                name: updates.name,
                amount: updates.amount,
                description: updates.description || null,
              }
            : s,
        ),
      );
    },
    [],
  );

  const addSalary = useCallback(
    async (salary: { name: string; amount: number; description?: string }) => {
      const { data, error } = await supabase
        .from("monthly_salaries_config")
        .insert({
          year,
          month,
          name: salary.name,
          amount: salary.amount,
          description: salary.description || null,
          is_active: true,
        })
        .select()
        .single();
      if (error) {
        console.error("Error adding salary:", error);
        return;
      }
      setSalaries((prev) => [...prev, data as MonthlySalary]);
    },
    [year, month],
  );

  const deleteSalary = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("monthly_salaries_config")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting salary:", error);
      return;
    }
    setSalaries((prev) => prev.filter((s) => s.id !== id));
  }, []);

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
