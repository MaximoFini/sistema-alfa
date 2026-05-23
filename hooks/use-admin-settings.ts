import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

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

interface BusinessExpense {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category: string | null;
  description: string | null;
  is_system: boolean;
}

interface BusinessSalary {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  description: string | null;
}

interface AcceptedCard {
  id: string;
  name: string;
  is_active: boolean;
}

interface ProductCategory {
  id: string;
  name: string;
  is_active: boolean;
  color?: string | null;
  created_at: string;
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

  // Business Expenses
  expenses: BusinessExpense[];
  expensesLoading: boolean;
  expensesLastFetched: number | null;

  // Business Salaries
  salaries: BusinessSalary[];
  salariesLoading: boolean;
  salariesLastFetched: number | null;

  // Accepted Cards
  cards: AcceptedCard[];
  cardsLoading: boolean;
  cardsLastFetched: number | null;

  // Product Categories
  productCategories: ProductCategory[];
  productCategoriesLoading: boolean;
  productCategoriesLastFetched: number | null;

  // Actions
  fetchSettings: () => Promise<void>;
  fetchPlanes: () => Promise<void>;
  fetchMetodos: () => Promise<void>;
  fetchUsuarios: () => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  togglePlan: (planId: string) => Promise<void>;
  updatePlan: (
    planId: string,
    updates: { nombre: string; precio: number; duracion_dias: number },
  ) => Promise<void>;
  addPlan: (plan: {
    nombre: string;
    precio: number;
    duracion_dias: number;
  }) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  fetchExpenses: () => Promise<void>;
  toggleExpense: (expenseId: string) => Promise<void>;
  updateExpense: (
    expenseId: string,
    updates: {
      name: string;
      amount: number;
      description?: string;
      category?: string;
    },
  ) => Promise<void>;
  addExpense: (expense: {
    name: string;
    amount: number;
    description?: string;
    category?: string;
  }) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  fetchSalaries: () => Promise<void>;
  toggleSalary: (salaryId: string) => Promise<void>;
  updateSalary: (
    salaryId: string,
    updates: { name: string; amount: number; description?: string },
  ) => Promise<void>;
  addSalary: (salary: {
    name: string;
    amount: number;
    description?: string;
  }) => Promise<void>;
  deleteSalary: (salaryId: string) => Promise<void>;
  toggleMetodo: (metodoId: string) => Promise<void>;
  updateMetodo: (metodoId: string, nombre: string) => Promise<void>;
  addMetodo: (nombre: string) => Promise<void>;
  deleteMetodo: (metodoId: string) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;
  toggleUserAdmin: (userId: string) => Promise<void>;
  updateUser: (
    userId: string,
    updates: { username: string; email: string },
  ) => Promise<void>;
  addUser: (user: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  generatePassword: (userId: string) => Promise<string>;
  
  fetchCards: () => Promise<void>;
  toggleCard: (cardId: string) => Promise<void>;
  updateCard: (cardId: string, name: string) => Promise<void>;
  addCard: (name: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  
  fetchProductCategories: () => Promise<void>;
  toggleProductCategory: (categoryId: string) => Promise<void>;
  updateProductCategory: (categoryId: string, name: string, color: string) => Promise<void>;
  addProductCategory: (name: string, color: string) => Promise<void>;
  deleteProductCategory: (categoryId: string) => Promise<void>;
  
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

  expenses: [],
  expensesLoading: false,
  expensesLastFetched: null,

  salaries: [],
  salariesLoading: false,
  salariesLastFetched: null,

  cards: [],
  cardsLoading: false,
  cardsLastFetched: null,

  productCategories: [],
  productCategoriesLoading: false,
  productCategoriesLastFetched: null,

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
        .from("system_settings")
        .select("id, notify_days_before_expiration, alert_1_days_no_attendance, alert_2_days_no_attendance, alert_3_days_no_attendance, days_after_expiration_inactive, days_without_renewal_lost")
        .limit(1)
        .single();

      if (error) throw error;

      set({
        settings: data,
        settingsLastFetched: Date.now(),
        settingsLoading: false,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
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
        .from("subscription_plans")
        .select("id, name, price, duration_days, is_active")
        .order("price", { ascending: true });

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
      console.error("Error fetching planes:", error);
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
        .from("payment_methods")
        .select("*")
        .order("name", { ascending: true });

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
      console.error("Error fetching payment methods:", error);
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

  // Update Settings
  updateSettings: async (updates) => {
    const state = get();
    if (!state.settings) return;

    try {
      const { error } = await supabase
        .from("system_settings")
        .update(updates)
        .eq("id", state.settings.id);

      if (error) throw error;

      set({
        settings: { ...state.settings, ...updates },
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  },

  // Toggle Plan
  togglePlan: async (planId) => {
    const state = get();
    const plan = state.planes.find((p) => p.id === planId);
    if (!plan) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ is_active: !plan.activo })
        .eq("id", planId);

      if (error) throw error;

      set({
        planes: state.planes.map((p) =>
          p.id === planId ? { ...p, activo: !p.activo } : p,
        ),
      });
    } catch (error) {
      console.error("Error toggling plan:", error);
    }
  },

  // Update Plan
  updatePlan: async (planId, updates) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          name: updates.nombre,
          price: updates.precio,
          duration_days: updates.duracion_dias,
        })
        .eq("id", planId);

      if (error) throw error;

      const state = get();
      set({
        planes: state.planes.map((p) =>
          p.id === planId
            ? {
                ...p,
                nombre: updates.nombre,
                precio: updates.precio,
                duracion_dias: updates.duracion_dias,
              }
            : p,
        ),
      });
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  },

  // Add Plan
  addPlan: async (plan) => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
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
      console.error("Error adding plan:", error);
    }
  },

  // Delete Plan
  deletePlan: async (planId) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      const state = get();
      set({
        planes: state.planes.filter((p) => p.id !== planId),
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  },

  // Toggle Método
  toggleMetodo: async (metodoId) => {
    const state = get();
    const metodo = state.metodos.find((m) => m.id === metodoId);
    if (!metodo) return;

    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: !metodo.activo })
        .eq("id", metodoId);

      if (error) throw error;

      set({
        metodos: state.metodos.map((m) =>
          m.id === metodoId ? { ...m, activo: !m.activo } : m,
        ),
      });
    } catch (error) {
      console.error("Error toggling payment method:", error);
    }
  },

  // Update Método
  updateMetodo: async (metodoId, nombre) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ name: nombre })
        .eq("id", metodoId);

      if (error) throw error;

      const state = get();
      set({
        metodos: state.metodos.map((m) =>
          m.id === metodoId ? { ...m, nombre } : m,
        ),
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
    }
  },

  // Add Método
  addMetodo: async (nombre) => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
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
      console.error("Error adding payment method:", error);
    }
  },

  // Delete Método
  deleteMetodo: async (metodoId) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", metodoId);

      if (error) throw error;

      const state = get();
      set({
        metodos: state.metodos.filter((m) => m.id !== metodoId),
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
    }
  },

  // Toggle User Active
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

      set({
        usuarios: state.usuarios.map((u) =>
          u.id === userId ? { ...u, is_active: !u.is_active } : u,
        ),
      });
    } catch (error) {
      console.error("Error toggling user active:", error);
    }
  },

  // Toggle User Admin
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

      set({
        usuarios: state.usuarios.map((u) =>
          u.id === userId ? { ...u, is_admin: !u.is_admin } : u,
        ),
      });
    } catch (error) {
      console.error("Error toggling user admin:", error);
    }
  },

  // Update User
  updateUser: async (userId, updates) => {
    try {
      const { error } = await supabase
        .from("system_users")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;

      const state = get();
      set({
        usuarios: state.usuarios.map((u) =>
          u.id === userId ? { ...u, ...updates } : u,
        ),
      });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  },

  // Add User
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
      console.error("Error adding user:", error);
    }
  },

  // Delete User
  deleteUser: async (userId) => {
    try {
      const { error } = await supabase
        .from("system_users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      const state = get();
      set({
        usuarios: state.usuarios.filter((u) => u.id !== userId),
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  },

  // Generate Password
  generatePassword: async (userId) => {
    // Generar contraseña aleatoria
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
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

  // ─── Business Expenses ─────────────────────────────────────────────────────

  // Fetch Expenses
  fetchExpenses: async () => {
    const state = get();
    const now = Date.now();

    if (
      state.expensesLastFetched &&
      now - state.expensesLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.expensesLoading) return;

    set({ expensesLoading: true });

    try {
      const { data, error } = await supabase
        .from("business_expenses")
        .select("id, name, amount, is_active, category, description, is_system")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        expenses: (data || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          amount: e.amount,
          is_active: e.is_active,
          category: e.category,
          description: e.description,
          is_system: e.is_system,
        })),
        expensesLastFetched: Date.now(),
        expensesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      set({ expensesLoading: false });
    }
  },

  // Toggle Expense
  toggleExpense: async (expenseId) => {
    const state = get();
    const expense = state.expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    try {
      const { error } = await supabase
        .from("business_expenses")
        .update({ is_active: !expense.is_active })
        .eq("id", expenseId);

      if (error) throw error;

      set({
        expenses: state.expenses.map((e) =>
          e.id === expenseId ? { ...e, is_active: !e.is_active } : e,
        ),
      });
    } catch (error) {
      console.error("Error toggling expense:", error);
    }
  },

  // Update Expense
  updateExpense: async (expenseId, updates) => {
    try {
      const { error } = await supabase
        .from("business_expenses")
        .update({
          name: updates.name,
          amount: updates.amount,
          description: updates.description || null,
          category: updates.category || null,
        })
        .eq("id", expenseId);

      if (error) throw error;

      const state = get();
      set({
        expenses: state.expenses.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                name: updates.name,
                amount: updates.amount,
                description: updates.description || null,
                category: updates.category || null,
              }
            : e,
        ),
      });
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  },

  // Add Expense
  addExpense: async (expense) => {
    try {
      const { data, error } = await supabase
        .from("business_expenses")
        .insert({
          name: expense.name,
          amount: expense.amount,
          description: expense.description || null,
          category: expense.category || null,
          is_active: true,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        expenses: [
          ...state.expenses,
          {
            id: data.id,
            name: data.name,
            amount: data.amount,
            is_active: data.is_active,
            category: data.category,
            description: data.description,
            is_system: data.is_system,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  },

  // Delete Expense
  deleteExpense: async (expenseId) => {
    try {
      // Check if it's a system expense (can't be deleted)
      const state = get();
      const expense = state.expenses.find((e) => e.id === expenseId);
      if (expense?.is_system) {
        alert("No se pueden eliminar los gastos predefinidos del sistema.");
        return;
      }

      const { error } = await supabase
        .from("business_expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      set({
        expenses: state.expenses.filter((e) => e.id !== expenseId),
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  },

  // ─── Business Salaries ──────────────────────────────────────────────────────

  // Fetch Salaries
  fetchSalaries: async () => {
    const state = get();
    const now = Date.now();

    if (
      state.salariesLastFetched &&
      now - state.salariesLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.salariesLoading) return;

    set({ salariesLoading: true });

    try {
      const { data, error } = await supabase
        .from("business_salaries")
        .select("id, name, amount, is_active, description")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        salaries: (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          amount: s.amount,
          is_active: s.is_active,
          description: s.description,
        })),
        salariesLastFetched: Date.now(),
        salariesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching salaries:", error);
      set({ salariesLoading: false });
    }
  },

  // Toggle Salary
  toggleSalary: async (salaryId) => {
    const state = get();
    const salary = state.salaries.find((s) => s.id === salaryId);
    if (!salary) return;

    try {
      const { error } = await supabase
        .from("business_salaries")
        .update({ is_active: !salary.is_active })
        .eq("id", salaryId);

      if (error) throw error;

      set({
        salaries: state.salaries.map((s) =>
          s.id === salaryId ? { ...s, is_active: !s.is_active } : s,
        ),
      });
    } catch (error) {
      console.error("Error toggling salary:", error);
    }
  },

  // Update Salary
  updateSalary: async (salaryId, updates) => {
    try {
      const { error } = await supabase
        .from("business_salaries")
        .update({
          name: updates.name,
          amount: updates.amount,
          description: updates.description || null,
        })
        .eq("id", salaryId);

      if (error) throw error;

      const state = get();
      set({
        salaries: state.salaries.map((s) =>
          s.id === salaryId
            ? {
                ...s,
                name: updates.name,
                amount: updates.amount,
                description: updates.description || null,
              }
            : s,
        ),
      });
    } catch (error) {
      console.error("Error updating salary:", error);
    }
  },

  // Add Salary
  addSalary: async (salary) => {
    try {
      const { data, error } = await supabase
        .from("business_salaries")
        .insert({
          name: salary.name,
          amount: salary.amount,
          description: salary.description || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        salaries: [
          ...state.salaries,
          {
            id: data.id,
            name: data.name,
            amount: data.amount,
            is_active: data.is_active,
            description: data.description,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding salary:", error);
    }
  },

  // Delete Salary
  deleteSalary: async (salaryId) => {
    try {
      const { error } = await supabase
        .from("business_salaries")
        .delete()
        .eq("id", salaryId);

      if (error) throw error;

      const state = get();
      set({
        salaries: state.salaries.filter((s) => s.id !== salaryId),
      });
    } catch (error) {
      console.error("Error deleting salary:", error);
    }
  },

  // Fetch Cards
  fetchCards: async () => {
    const state = get();
    const now = Date.now();

    if (
      state.cardsLastFetched &&
      now - state.cardsLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.cardsLoading) return;

    set({ cardsLoading: true });

    try {
      const { data, error } = await supabase
        .from("accepted_cards")
        .select("id, name, is_active")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        cards: (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          is_active: c.is_active,
        })),
        cardsLastFetched: Date.now(),
        cardsLoading: false,
      });
    } catch (error) {
      console.error("Error fetching accepted cards:", error);
      set({ cardsLoading: false });
    }
  },

  // Toggle Card
  toggleCard: async (cardId) => {
    const state = get();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    try {
      const { error } = await supabase
        .from("accepted_cards")
        .update({ is_active: !card.is_active })
        .eq("id", cardId);

      if (error) throw error;

      set({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, is_active: !c.is_active } : c,
        ),
      });
    } catch (error) {
      console.error("Error toggling accepted card:", error);
    }
  },

  // Update Card
  updateCard: async (cardId, name) => {
    try {
      const { error } = await supabase
        .from("accepted_cards")
        .update({ name })
        .eq("id", cardId);

      if (error) throw error;

      const state = get();
      set({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, name } : c,
        ),
      });
    } catch (error) {
      console.error("Error updating accepted card:", error);
    }
  },

  // Add Card
  addCard: async (name) => {
    try {
      const { data, error } = await supabase
        .from("accepted_cards")
        .insert({ name, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        cards: [
          ...state.cards,
          {
            id: data.id,
            name: data.name,
            is_active: data.is_active,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding accepted card:", error);
    }
  },

  // Delete Card
  deleteCard: async (cardId) => {
    try {
      const { error } = await supabase
        .from("accepted_cards")
        .delete()
        .eq("id", cardId);

      if (error) throw error;

      const state = get();
      set({
        cards: state.cards.filter((c) => c.id !== cardId),
      });
    } catch (error) {
      console.error("Error deleting accepted card:", error);
    }
  },

  // ─── Product Categories ────────────────────────────────────────────────────
  fetchProductCategories: async () => {
    const state = get();
    const now = Date.now();

    if (
      state.productCategoriesLastFetched &&
      now - state.productCategoriesLastFetched < CACHE_DURATION
    ) {
      return;
    }

    if (state.productCategoriesLoading) return;

    set({ productCategoriesLoading: true });

    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, is_active, color, created_at")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        productCategories: (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          is_active: c.is_active,
          color: c.color,
          created_at: c.created_at,
        })),
        productCategoriesLastFetched: Date.now(),
        productCategoriesLoading: false,
      });
    } catch (error) {
      console.error("Error fetching product categories:", error);
      set({ productCategoriesLoading: false });
    }
  },

  toggleProductCategory: async (categoryId) => {
    const state = get();
    const category = state.productCategories.find((c) => c.id === categoryId);
    if (!category) return;

    try {
      const { error } = await supabase
        .from("product_categories")
        .update({ is_active: !category.is_active })
        .eq("id", categoryId);

      if (error) throw error;

      set({
        productCategories: state.productCategories.map((c) =>
          c.id === categoryId ? { ...c, is_active: !c.is_active } : c
        ),
      });
    } catch (error) {
      console.error("Error toggling product category:", error);
    }
  },

  updateProductCategory: async (categoryId, name, color) => {
    try {
      const { error } = await supabase
        .from("product_categories")
        .update({ name, color })
        .eq("id", categoryId);

      if (error) throw error;

      const state = get();
      set({
        productCategories: state.productCategories.map((c) =>
          c.id === categoryId ? { ...c, name, color } : c
        ),
      });
    } catch (error) {
      console.error("Error updating product category:", error);
    }
  },

  addProductCategory: async (name, color) => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .insert({ name, color, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({
        productCategories: [
          ...state.productCategories,
          {
            id: data.id,
            name: data.name,
            is_active: data.is_active,
            color: data.color,
            created_at: data.created_at,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding product category:", error);
    }
  },

  deleteProductCategory: async (categoryId) => {
    try {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      const state = get();
      set({
        productCategories: state.productCategories.filter((c) => c.id !== categoryId),
      });
    } catch (error) {
      console.error("Error deleting product category:", error);
    }
  },

  // Invalidate all cache
  invalidateAll: () => {
    set({
      settingsLastFetched: null,
      planesLastFetched: null,
      metodosLastFetched: null,
      usuariosLastFetched: null,
      expensesLastFetched: null,
      salariesLastFetched: null,
      cardsLastFetched: null,
      productCategoriesLastFetched: null,
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
    store.fetchExpenses();
    store.fetchSalaries();
    store.fetchCards();
    store.fetchProductCategories();

    // Subscribe to Realtime changes
    const settingsChannel = supabase
      .channel("admin-settings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
        },
        () => {
          store.fetchSettings();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscription_plans",
        },
        () => {
          store.fetchPlanes();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_methods",
        },
        () => {
          store.fetchMetodos();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_users",
        },
        () => {
          store.fetchUsuarios();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "business_expenses",
        },
        () => {
          store.fetchExpenses();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "business_salaries",
        },
        () => {
          store.fetchSalaries();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accepted_cards",
        },
        () => {
          store.fetchCards();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_categories",
        },
        () => {
          store.fetchProductCategories();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  return store;
}
