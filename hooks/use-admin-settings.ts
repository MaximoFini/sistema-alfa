/**
 * use-admin-settings.ts — Barrel File (Fase 3A: Modularización del store)
 *
 * Este archivo mantiene compatibilidad retroactiva con todos los imports existentes.
 * Internamente, cada dominio ahora tiene su propio store Zustand independiente.
 *
 * Re-exportaciones de stores individuales:
 */
export * from "./use-system-settings-store";
export * from "./use-subscription-plans-store";
export * from "./use-payment-methods-store";
export * from "./use-system-users-store";
export * from "./use-business-expenses-store";
export * from "./use-business-salaries-store";
export * from "./use-accepted-cards-store";
export * from "./use-product-categories-store";
export * from "./store-constants";

// ─── Imports de todos los stores para el store combinado ──────────────────────
import { useSystemSettingsStore } from "./use-system-settings-store";
import { useSubscriptionPlansStore } from "./use-subscription-plans-store";
import { usePaymentMethodsStore } from "./use-payment-methods-store";
import { useSystemUsersStore } from "./use-system-users-store";
import { useBusinessExpensesStore } from "./use-business-expenses-store";
import { useBusinessSalariesStore } from "./use-business-salaries-store";
import { useAcceptedCardsStore } from "./use-accepted-cards-store";
import { useProductCategoriesStore } from "./use-product-categories-store";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

/**
 * useAdminSettingsStore — hook de compatibilidad retroactiva.
 *
 * Combina todos los stores modulares en un único objeto con la misma
 * interfaz que el store monolítico original, para que el código existente
 * que usa `useAdminSettingsStore()` continúe funcionando sin cambios.
 */
export function useAdminSettingsStore() {
  const systemSettings = useSystemSettingsStore();
  const subscriptionPlans = useSubscriptionPlansStore();
  const paymentMethods = usePaymentMethodsStore();
  const systemUsers = useSystemUsersStore();
  const businessExpenses = useBusinessExpensesStore();
  const businessSalaries = useBusinessSalariesStore();
  const acceptedCards = useAcceptedCardsStore();
  const productCategories = useProductCategoriesStore();

  return {
    // ─── System Settings ────────────────────────────────────────────────────
    settings: systemSettings.settings,
    settingsLoading: systemSettings.settingsLoading,
    settingsLastFetched: systemSettings.settingsLastFetched,
    fetchSettings: systemSettings.fetchSettings,
    updateSettings: systemSettings.updateSettings,

    // ─── Subscription Plans ─────────────────────────────────────────────────
    planes: subscriptionPlans.planes,
    planesLoading: subscriptionPlans.planesLoading,
    planesLastFetched: subscriptionPlans.planesLastFetched,
    fetchPlanes: subscriptionPlans.fetchPlanes,
    togglePlan: subscriptionPlans.togglePlan,
    updatePlan: subscriptionPlans.updatePlan,
    addPlan: subscriptionPlans.addPlan,
    deletePlan: subscriptionPlans.deletePlan,

    // ─── Payment Methods ────────────────────────────────────────────────────
    metodos: paymentMethods.metodos,
    metodosLoading: paymentMethods.metodosLoading,
    metodosLastFetched: paymentMethods.metodosLastFetched,
    fetchMetodos: paymentMethods.fetchMetodos,
    toggleMetodo: paymentMethods.toggleMetodo,
    updateMetodo: paymentMethods.updateMetodo,
    addMetodo: paymentMethods.addMetodo,
    deleteMetodo: paymentMethods.deleteMetodo,

    // ─── System Users ───────────────────────────────────────────────────────
    usuarios: systemUsers.usuarios,
    usuariosLoading: systemUsers.usuariosLoading,
    usuariosLastFetched: systemUsers.usuariosLastFetched,
    fetchUsuarios: systemUsers.fetchUsuarios,
    toggleUserActive: systemUsers.toggleUserActive,
    toggleUserAdmin: systemUsers.toggleUserAdmin,
    updateUser: systemUsers.updateUser,
    addUser: systemUsers.addUser,
    deleteUser: systemUsers.deleteUser,
    generatePassword: systemUsers.generatePassword,

    // ─── Business Expenses ──────────────────────────────────────────────────
    expenses: businessExpenses.expenses,
    expensesLoading: businessExpenses.expensesLoading,
    expensesLastFetched: businessExpenses.expensesLastFetched,
    fetchExpenses: businessExpenses.fetchExpenses,
    toggleExpense: businessExpenses.toggleExpense,
    updateExpense: businessExpenses.updateExpense,
    addExpense: businessExpenses.addExpense,
    deleteExpense: businessExpenses.deleteExpense,

    // ─── Business Salaries ──────────────────────────────────────────────────
    salaries: businessSalaries.salaries,
    salariesLoading: businessSalaries.salariesLoading,
    salariesLastFetched: businessSalaries.salariesLastFetched,
    fetchSalaries: businessSalaries.fetchSalaries,
    toggleSalary: businessSalaries.toggleSalary,
    updateSalary: businessSalaries.updateSalary,
    addSalary: businessSalaries.addSalary,
    deleteSalary: businessSalaries.deleteSalary,

    // ─── Accepted Cards ─────────────────────────────────────────────────────
    cards: acceptedCards.cards,
    cardsLoading: acceptedCards.cardsLoading,
    cardsLastFetched: acceptedCards.cardsLastFetched,
    fetchCards: acceptedCards.fetchCards,
    toggleCard: acceptedCards.toggleCard,
    updateCard: acceptedCards.updateCard,
    addCard: acceptedCards.addCard,
    deleteCard: acceptedCards.deleteCard,

    // ─── Product Categories ─────────────────────────────────────────────────
    productCategories: productCategories.productCategories,
    productCategoriesLoading: productCategories.productCategoriesLoading,
    productCategoriesLastFetched: productCategories.productCategoriesLastFetched,
    fetchProductCategories: productCategories.fetchProductCategories,
    toggleProductCategory: productCategories.toggleProductCategory,
    updateProductCategory: productCategories.updateProductCategory,
    addProductCategory: productCategories.addProductCategory,
    deleteProductCategory: productCategories.deleteProductCategory,

    // ─── Invalidate All ─────────────────────────────────────────────────────
    invalidateAll: () => {
      systemSettings.invalidateSettings();
      subscriptionPlans.invalidatePlanes();
      paymentMethods.invalidateMetodos();
      systemUsers.invalidateUsuarios();
      businessExpenses.invalidateExpenses();
      businessSalaries.invalidateSalaries();
      acceptedCards.invalidateCards();
      productCategories.invalidateProductCategories();
    },
  };
}

// Compatibility: also expose getState() as a static method proxy
// so code like `useAdminSettingsStore.getState().fetchSettings()` keeps working
useAdminSettingsStore.getState = () => ({
  fetchSettings: useSystemSettingsStore.getState().fetchSettings,
  fetchPlanes: useSubscriptionPlansStore.getState().fetchPlanes,
  fetchMetodos: usePaymentMethodsStore.getState().fetchMetodos,
  fetchUsuarios: useSystemUsersStore.getState().fetchUsuarios,
  fetchExpenses: useBusinessExpensesStore.getState().fetchExpenses,
  fetchSalaries: useBusinessSalariesStore.getState().fetchSalaries,
  fetchCards: useAcceptedCardsStore.getState().fetchCards,
  fetchProductCategories: useProductCategoriesStore.getState().fetchProductCategories,
});

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
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, () => {
        store.fetchSettings();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subscription_plans" }, () => {
        store.fetchPlanes();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_methods" }, () => {
        store.fetchMetodos();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "system_users" }, () => {
        store.fetchUsuarios();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "business_expenses" }, () => {
        store.fetchExpenses();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "business_salaries" }, () => {
        store.fetchSalaries();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "accepted_cards" }, () => {
        store.fetchCards();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "product_categories" }, () => {
        store.fetchProductCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  return store;
}
