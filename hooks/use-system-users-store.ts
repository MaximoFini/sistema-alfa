import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SystemUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface SystemUsersState {
  usuarios: SystemUser[];
  usuariosLoading: boolean;
  usuariosLastFetched: number | null;

  fetchUsuarios: () => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;
  toggleUserAdmin: (userId: string) => Promise<void>;
  updateUser: (userId: string, updates: { username: string; email: string }) => Promise<void>;
  addUser: (user: { username: string; email: string; password: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  generatePassword: (userId: string) => Promise<string>;
  invalidateUsuarios: () => void;
}

export const useSystemUsersStore = create<SystemUsersState>((set, get) => ({
  usuarios: [],
  usuariosLoading: false,
  usuariosLastFetched: null,

  fetchUsuarios: async () => {
    const state = get();
    const now = Date.now();

    if (state.usuariosLastFetched && now - state.usuariosLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.usuariosLoading) return;

    set({ usuariosLoading: true });

    try {
      const { data, error } = await supabase
        .from("system_users")
        .select("id, username, email, is_admin, is_active")
        .order("username", { ascending: true });

      if (error) throw error;

      set({
        usuarios: (data || []).map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          is_admin: u.is_admin,
          is_active: u.is_active,
        })),
        usuariosLastFetched: Date.now(),
        usuariosLoading: false,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({ usuariosLoading: false });
    }
  },

  toggleUserActive: async (userId) => {
    const state = get();
    const user = state.usuarios.find((u) => u.id === userId);
    if (!user) return;

    try {
      const { error } = await supabase
        .from("system_users")
        .update({ is_active: !user.is_active })
        .eq("id", userId);

      if (error) throw error;

      set({ usuarios: state.usuarios.map((u) => u.id === userId ? { ...u, is_active: !u.is_active } : u) });
    } catch (error) {
      console.error("Error toggling user active:", error);
    }
  },

  toggleUserAdmin: async (userId) => {
    const state = get();
    const user = state.usuarios.find((u) => u.id === userId);
    if (!user) return;

    try {
      const { error } = await supabase
        .from("system_users")
        .update({ is_admin: !user.is_admin })
        .eq("id", userId);

      if (error) throw error;

      set({ usuarios: state.usuarios.map((u) => u.id === userId ? { ...u, is_admin: !u.is_admin } : u) });
    } catch (error) {
      console.error("Error toggling user admin:", error);
    }
  },

  updateUser: async (userId, updates) => {
    try {
      const { error } = await supabase
        .from("system_users")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;

      const state = get();
      set({ usuarios: state.usuarios.map((u) => u.id === userId ? { ...u, ...updates } : u) });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  },

  addUser: async (user) => {
    try {
      const { data, error } = await supabase
        .from("system_users")
        .insert({
          username: user.username,
          email: user.email,
          password_hash: user.password, // En producción, esto debe hashearse en el servidor
          is_admin: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        usuarios: [
          ...state.usuarios,
          { id: data.id, username: data.username, email: data.email, is_admin: data.is_admin, is_active: data.is_active },
        ],
      });
    } catch (error) {
      console.error("Error adding user:", error);
    }
  },

  deleteUser: async (userId) => {
    try {
      const { error } = await supabase
        .from("system_users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      const state = get();
      set({ usuarios: state.usuarios.filter((u) => u.id !== userId) });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  },

  generatePassword: async (userId) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      const { error } = await supabase
        .from("system_users")
        .update({ password_hash: password }) // En producción, hashear en servidor
        .eq("id", userId);

      if (error) throw error;

      return password;
    } catch (error) {
      console.error("Error generating password:", error);
      throw error;
    }
  },

  invalidateUsuarios: () => set({ usuariosLastFetched: null }),
}));
