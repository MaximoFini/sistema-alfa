import { useQuery, usePowerSync } from "@powersync/react";

export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  duracion_dias: number;
  activo: boolean;
}

export function useSubscriptionPlansStore() {
  const db = usePowerSync();
  const { data: rawPlanes, isLoading: planesLoading } = useQuery<{
    id: string;
    name: string;
    price: number;
    duration_days: number;
    is_active: number;
  }>("SELECT id, name, price, duration_days, is_active FROM subscription_plans ORDER BY price");

  const planes: Plan[] = (rawPlanes ?? []).map((p) => ({
    id: p.id,
    nombre: p.name,
    precio: p.price,
    duracion_dias: p.duration_days,
    activo: !!p.is_active,
  }));

  const togglePlan = async (planId: string) => {
    const plan = planes.find((p) => p.id === planId);
    if (!plan) return;
    await db.execute("UPDATE subscription_plans SET is_active = ? WHERE id = ?", [
      plan.activo ? 0 : 1,
      planId,
    ]);
  };

  const updatePlan = async (
    planId: string,
    updates: { nombre: string; precio: number; duracion_dias: number }
  ) => {
    await db.execute(
      "UPDATE subscription_plans SET name = ?, price = ?, duration_days = ? WHERE id = ?",
      [updates.nombre, updates.precio, updates.duracion_dias, planId]
    );
  };

  const addPlan = async (plan: { nombre: string; precio: number; duracion_dias: number }) => {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO subscription_plans (id, name, price, duration_days, is_active) VALUES (?, ?, ?, ?, 1)",
      [id, plan.nombre, plan.precio, plan.duracion_dias]
    );
  };

  const deletePlan = async (planId: string) => {
    await db.execute("DELETE FROM subscription_plans WHERE id = ?", [planId]);
  };

  return {
    planes,
    planesLoading,
    fetchPlanes: async () => {},
    togglePlan,
    updatePlan,
    addPlan,
    deletePlan,
    invalidatePlanes: () => {},
  };
}
