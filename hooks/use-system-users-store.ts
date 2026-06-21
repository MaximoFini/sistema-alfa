import { useQuery, usePowerSync } from "@powersync/react";

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
}

export function useSystemUsersStore() {
  const db = usePowerSync();
  const { data: rawUsuarios, isLoading: usuariosLoading } = useQuery<{
    id: string;
    username: string;
    email: string;
    is_admin: number;
    is_active: number;
  }>("SELECT id, username, email, is_admin, is_active FROM system_users ORDER BY username");

  const usuarios: SystemUser[] = (rawUsuarios ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    is_admin: !!u.is_admin,
    is_active: !!u.is_active,
  }));

  const toggleUserActive = async (userId: string) => {
    const user = usuarios.find((u) => u.id === userId);
    if (!user) return;
    await db.execute("UPDATE system_users SET is_active = ? WHERE id = ?", [
      user.is_active ? 0 : 1,
      userId,
    ]);
  };

  const toggleUserAdmin = async (userId: string) => {
    const user = usuarios.find((u) => u.id === userId);
    if (!user) return;
    await db.execute("UPDATE system_users SET is_admin = ? WHERE id = ?", [
      user.is_admin ? 0 : 1,
      userId,
    ]);
  };

  const updateUser = async (userId: string, updates: { username: string; email: string }) => {
    await db.execute("UPDATE system_users SET username = ?, email = ? WHERE id = ?", [
      updates.username,
      updates.email,
      userId,
    ]);
  };

  const addUser = async (user: { username: string; email: string; password: string }) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        email: user.email,
        password: user.password,
        isAdmin: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al crear el usuario");
    }

    return await response.json();
  };

  const deleteUser = async (userId: string) => {
    await db.execute("DELETE FROM system_users WHERE id = ?", [userId]);
  };

  const generatePassword = async (userId: string) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    const array = new Uint32Array(12);
    crypto.getRandomValues(array);
    const password = Array.from(array, (x) => chars[x % chars.length]).join("");

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword: password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al actualizar la contrasena");
    }

    return password;
  };

  return {
    usuarios,
    usuariosLoading,
    fetchUsuarios: async () => {},
    toggleUserActive,
    toggleUserAdmin,
    updateUser,
    addUser,
    deleteUser,
    generatePassword,
    invalidateUsuarios: () => {},
  };
}
