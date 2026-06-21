import { useQuery, usePowerSync } from "@powersync/react";

export interface PaymentMethod {
  id: string;
  nombre: string;
  activo: boolean;
}

export function usePaymentMethodsStore() {
  const db = usePowerSync();
  const { data: rawMetodos, isLoading: metodosLoading } = useQuery<{
    id: string;
    name: string;
    is_active: number;
  }>("SELECT id, name, is_active FROM payment_methods ORDER BY name");

  const metodos: PaymentMethod[] = (rawMetodos ?? []).map((m) => ({
    id: m.id,
    nombre: m.name,
    activo: !!m.is_active,
  }));

  const toggleMetodo = async (metodoId: string) => {
    const metodo = metodos.find((m) => m.id === metodoId);
    if (!metodo) return;
    await db.execute("UPDATE payment_methods SET is_active = ? WHERE id = ?", [
      metodo.activo ? 0 : 1,
      metodoId,
    ]);
  };

  const updateMetodo = async (metodoId: string, nombre: string) => {
    await db.execute("UPDATE payment_methods SET name = ? WHERE id = ?", [nombre, metodoId]);
  };

  const addMetodo = async (nombre: string) => {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO payment_methods (id, name, is_active) VALUES (?, ?, 1)",
      [id, nombre]
    );
  };

  const deleteMetodo = async (metodoId: string) => {
    await db.execute("DELETE FROM payment_methods WHERE id = ?", [metodoId]);
  };

  return {
    metodos,
    metodosLoading,
    fetchMetodos: async () => {},
    toggleMetodo,
    updateMetodo,
    addMetodo,
    deleteMetodo,
    invalidateMetodos: () => {},
  };
}
