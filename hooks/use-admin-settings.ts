import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SystemSettings {
  id: string;
  notify_days_before_expiration: number;
  alert_1_days_no_attendance: number;
  alert_2_days_no_attendance: number;
  alert_3_days_no_attendance: number;
  days_after_expiration_inactive: number;
  days_without_renewal_lost: number;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  duracion_dias: number;
  activo: boolean;
}

interface PaymentMethod {
  id: string;
  nombre: string;
  activo: boolean;
}

interface SystemUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface AdminSettingsState {
  // System settings
  settings: SystemSettings | null;
  settingsLoading: boolean;
  settingsLastFetched: number | null;

  // Plans
  planes: Plan[];
  planesLoading: boolean;
  planesLastFetched: number | null;

  // Payment methods
  metodos: PaymentMethod[];
  metodosLoading: boolean;
  metodosLastFetched: number | null;

  // Users
  usuarios: SystemUser[];
  usuariosLoading: boolean;
  usuariosLastFetched: number | null;

  // Actions
  fetchSettings: () => Promise<void>;
  fetchPlanes: () => Promise<void>;
  fetchMetodos: () => Promise<void>;
  fetchUsuarios: () => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  togglePlan: (planId: string) => Promise<void>;
  updatePlan: (planId: string, updates: { nombre: string; precio: number; duracion_dias: number }) => Promise<void>;
  addPlan: (plan: { nombre: string; precio: number; duracion_dias: number }) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  toggleMetodo: (metodoId: string) => Promise<void>;
  updateMetodo: (metodoId: string, nombre: string) => Promise<void>;
  addMetodo: (nombre: string) => Promise<void>;
  deleteMetodo: (metodoId: string) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;
  toggleUserAdmin: (userId: string) => Promise<void>;
  updateUser: (userId: string, updates: { username: string; email: string }) => Promise<void>;
  addUser: (user: { username: string; email: string; password: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  generatePassword: (userId: string) => Promise<string>;
  invalidateAll: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useAdminSettingsStore = create<AdminSettingsState>((set, get) => ({
  // Initial state
  settings: null,
  settingsLoading: false,
  settingsLastFetched: null,

  planes: [],
  planesLoading: false,
  planesLastFetched: null,

  metodos: [],
  metodosLoading: false,
  metodosLastFetched: null,

  usuarios: [],
  usuariosLoading: false,
  usuariosLastFetched: null,

  // Fetch Settings
  fetchSettings: async () => {
    const state = get();
    const now = Date.now();

    // Return cache if valid
    if (
      state.settingsLastFetched &&
      now - state.settingsLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.settingsLoading) return;

    set({ settingsLoading: true });

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      set({
        settings: data,
        settingsLastFetched: Date.now(),
        settingsLoading: false,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ settingsLoading: false });
    }
  },

  // Fetch Planes
  fetchPlanes: async () => {
    const state = get();
    const now = Date.now();

    if (
      state.planesLastFetched &&
      now - state.planesLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.planesLoading) return;

    set({ planesLoading: true });

    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;

      set({
        planes: (data || []).map((p: any) => ({
          id: p.id,
          nombre: p.name,
          precio: p.price,
          duracion_dias: p.duration_days,
          activo: p.is_active,
        })),
        planesLastFetched: Date.now(),
        planesLoading: false,
      });
    } catch (error) {
      console.error('Error fetching planes:', error);
      set({ planesLoading: false });
    }
  },

  // Fetch Métodos
  fetchMetodos: async () => {
    const state = get();
    const now = Date.now();

    if (
      state.metodosLastFetched &&
      now - state.metodosLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.metodosLoading) return;

    set({ metodosLoading: true });

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      set({
        metodos: (data || []).map((m: any) => ({
          id: m.id,
          nombre: m.name,
          activo: m.is_active,
        })),
        metodosLastFetched: Date.now(),
        metodosLoading: false,
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      set({ metodosLoading: false });
    }
  },

  // Fetch Usuarios
  fetchUsuarios: async () => {
    const state = get();
    const now = Date.now();

    if (
      state.usuariosLastFetched &&
      now - state.usuariosLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.usuariosLoading) return;

    set({ usuariosLoading: true });

    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('username', { ascending: true });

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
      console.error('Error fetching users:', error);
      set({ usuariosLoading: false });
    }
  },

  // Update Settings
  updateSettings: async (updates) => {
    const state = get();
    if (!state.settings) return;

    try {
      const { error } = await supabase
        .from('system_settings')
        .update(updates)
        .eq('id', state.settings.id);

      if (error) throw error;

      set({
        settings: { ...state.settings, ...updates },
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  },

  // Toggle Plan
  togglePlan: async (planId) => {
    const state = get();
    const plan = state.planes.find((p) => p.id === planId);
    if (!plan) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !plan.activo })
        .eq('id', planId);

      if (error) throw error;

      set({
        planes: state.planes.map((p) =>
          p.id === planId ? { ...p, activo: !p.activo } : p
        ),
      });
    } catch (error) {
      console.error('Error toggling plan:', error);
    }
  },

  // Update Plan
  updatePlan: async (planId, updates) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: updates.nombre,
          price: updates.precio,
          duration_days: updates.duracion_dias,
        })
        .eq('id', planId);

      if (error) throw error;

      const state = get();
      set({
        planes: state.planes.map((p) =>
          p.id === planId
            ? { ...p, nombre: updates.nombre, precio: updates.precio, duracion_dias: updates.duracion_dias }
            : p
        ),
      });
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  },

  // Add Plan
  addPlan: async (plan) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: plan.nombre,
          price: plan.precio,
          duration_days: plan.duracion_dias,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        planes: [
          ...state.planes,
          {
            id: data.id,
            nombre: data.name,
            precio: data.price,
            duracion_dias: data.duration_days,
            activo: data.is_active,
          },
        ],
      });
    } catch (error) {
      console.error('Error adding plan:', error);
    }
  },

  // Delete Plan
  deletePlan: async (planId) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      const state = get();
      set({
        planes: state.planes.filter((p) => p.id !== planId),
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  },

  // Toggle Método
  toggleMetodo: async (metodoId) => {
    const state = get();
    const metodo = state.metodos.find((m) => m.id === metodoId);
    if (!metodo) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !metodo.activo })
        .eq('id', metodoId);

      if (error) throw error;

      set({
        metodos: state.metodos.map((m) =>
          m.id === metodoId ? { ...m, activo: !m.activo } : m
        ),
      });
    } catch (error) {
      console.error('Error toggling payment method:', error);
    }
  },

  // Update Método
  updateMetodo: async (metodoId, nombre) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ name: nombre })
        .eq('id', metodoId);

      if (error) throw error;

      const state = get();
      set({
        metodos: state.metodos.map((m) =>
          m.id === metodoId ? { ...m, nombre } : m
        ),
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  },

  // Add Método
  addMetodo: async (nombre) => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({ name: nombre, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        metodos: [
          ...state.metodos,
          {
            id: data.id,
            nombre: data.name,
            activo: data.is_active,
          },
        ],
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  },

  // Delete Método
  deleteMetodo: async (metodoId) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', metodoId);

      if (error) throw error;

      const state = get();
      set({
        metodos: state.metodos.filter((m) => m.id !== metodoId),
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  },

  // Toggle User Active
  toggleUserActive: async (userId) => {
    const state = get();
    const user = state.usuarios.find((u) => u.id === userId);
    if (!user) return;

    try {
      const { error } = await supabase
        .from('system_users')
        .update({ is_active: !user.is_active })
        .eq('id', userId);

      if (error) throw error;

      set({
        usuarios: state.usuarios.map((u) =>
          u.id === userId ? { ...u, is_active: !u.is_active } : u
        ),
      });
    } catch (error) {
      console.error('Error toggling user active:', error);
    }
  },

  // Toggle User Admin
  toggleUserAdmin: async (userId) => {
    const state = get();
    const user = state.usuarios.find((u) => u.id === userId);
    if (!user) return;

    try {
      const { error } = await supabase
        .from('system_users')
        .update({ is_admin: !user.is_admin })
        .eq('id', userId);

      if (error) throw error;

      set({
        usuarios: state.usuarios.map((u) =>
          u.id === userId ? { ...u, is_admin: !u.is_admin } : u
        ),
      });
    } catch (error) {
      console.error('Error toggling user admin:', error);
    }
  },

  // Update User
  updateUser: async (userId, updates) => {
    try {
      const { error } = await supabase
        .from('system_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      const state = get();
      set({
        usuarios: state.usuarios.map((u) =>
          u.id === userId ? { ...u, ...updates } : u
        ),
      });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  },

  // Add User
  addUser: async (user) => {
    try {
      const { data, error } = await supabase
        .from('system_users')
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
          {
            id: data.id,
            username: data.username,
            email: data.email,
            is_admin: data.is_admin,
            is_active: data.is_active,
          },
        ],
      });
    } catch (error) {
      console.error('Error adding user:', error);
    }
  },

  // Delete User
  deleteUser: async (userId) => {
    try {
      const { error } = await supabase
        .from('system_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      const state = get();
      set({
        usuarios: state.usuarios.filter((u) => u.id !== userId),
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  },

  // Generate Password
  generatePassword: async (userId) => {
    // Generar contraseña aleatoria
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      const { error } = await supabase
        .from('system_users')
        .update({ password_hash: password }) // En producción, hashear en servidor
        .eq('id', userId);

      if (error) throw error;

      return password;
    } catch (error) {
      console.error('Error generating password:', error);
      throw error;
    }
  },

  // Invalidate all cache
  invalidateAll: () => {
    set({
      settingsLastFetched: null,
      planesLastFetched: null,
      metodosLastFetched: null,
      usuariosLastFetched: null,
    });
  },
}));

// ─── Custom Hook with Realtime ────────────────────────────────────────────────
export function useAdminSettings() {
  const store = useAdminSettingsStore();

  useEffect(() => {
    // Fetch initial data
    store.fetchSettings();
    store.fetchPlanes();
    store.fetchMetodos();
    store.fetchUsuarios();

    // Subscribe to Realtime changes
    const settingsChannel = supabase
      .channel('admin-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
        },
        () => {
          store.fetchSettings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_plans',
        },
        () => {
          store.fetchPlanes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_methods',
        },
        () => {
          store.fetchMetodos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_users',
        },
        () => {
          store.fetchUsuarios();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  return store;
}
