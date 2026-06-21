export * from "./use-system-settings-store";
export * from "./use-subscription-plans-store";
export * from "./use-payment-methods-store";
export * from "./use-system-users-store";
export * from "./use-business-expenses-store";
export * from "./use-business-salaries-store";
export * from "./use-accepted-cards-store";
export * from "./use-product-categories-store";
export * from "./store-constants";

import { useSystemSettingsStore } from "./use-system-settings-store";
import { useSubscriptionPlansStore } from "./use-subscription-plans-store";
import { usePaymentMethodsStore } from "./use-payment-methods-store";
import { useSystemUsersStore } from "./use-system-users-store";
import { useBusinessExpensesStore } from "./use-business-expenses-store";
import { useBusinessSalariesStore } from "./use-business-salaries-store";
import { useAcceptedCardsStore } from "./use-accepted-cards-store";
import { useProductCategoriesStore } from "./use-product-categories-store";
import { useMemo } from "react";

export function useAdminSettingsStore() {
  const systemSettings = useSystemSettingsStore();
  const subscriptionPlans = useSubscriptionPlansStore();
  const paymentMethods = usePaymentMethodsStore();
  const systemUsers = useSystemUsersStore();
  const businessExpenses = useBusinessExpensesStore();
  const businessSalaries = useBusinessSalariesStore();
  const acceptedCards = useAcceptedCardsStore();
  const productCategories = useProductCategoriesStore();

  return useMemo(() => ({
    settings: systemSettings.settings,
    settingsLoading: systemSettings.settingsLoading,
    fetchSettings: systemSettings.fetchSettings,
    updateSettings: systemSettings.updateSettings,

    planes: subscriptionPlans.planes,
    planesLoading: subscriptionPlans.planesLoading,
    fetchPlanes: subscriptionPlans.fetchPlanes,
    togglePlan: subscriptionPlans.togglePlan,
    updatePlan: subscriptionPlans.updatePlan,
    addPlan: subscriptionPlans.addPlan,
    deletePlan: subscriptionPlans.deletePlan,

    metodos: paymentMethods.metodos,
    metodosLoading: paymentMethods.metodosLoading,
    fetchMetodos: paymentMethods.fetchMetodos,
    toggleMetodo: paymentMethods.toggleMetodo,
    updateMetodo: paymentMethods.updateMetodo,
    addMetodo: paymentMethods.addMetodo,
    deleteMetodo: paymentMethods.deleteMetodo,

    usuarios: systemUsers.usuarios,
    usuariosLoading: systemUsers.usuariosLoading,
    fetchUsuarios: systemUsers.fetchUsuarios,
    toggleUserActive: systemUsers.toggleUserActive,
    toggleUserAdmin: systemUsers.toggleUserAdmin,
    updateUser: systemUsers.updateUser,
    addUser: systemUsers.addUser,
    deleteUser: systemUsers.deleteUser,
    generatePassword: systemUsers.generatePassword,

    expenses: businessExpenses.expenses,
    expensesLoading: businessExpenses.expensesLoading,
    fetchExpenses: businessExpenses.fetchExpenses,
    toggleExpense: businessExpenses.toggleExpense,
    updateExpense: businessExpenses.updateExpense,
    addExpense: businessExpenses.addExpense,
    deleteExpense: businessExpenses.deleteExpense,

    salaries: businessSalaries.salaries,
    salariesLoading: businessSalaries.salariesLoading,
    fetchSalaries: businessSalaries.fetchSalaries,
    toggleSalary: businessSalaries.toggleSalary,
    updateSalary: businessSalaries.updateSalary,
    addSalary: businessSalaries.addSalary,
    deleteSalary: businessSalaries.deleteSalary,

    cards: acceptedCards.cards,
    cardsLoading: acceptedCards.cardsLoading,
    fetchCards: acceptedCards.fetchCards,
    toggleCard: acceptedCards.toggleCard,
    updateCard: acceptedCards.updateCard,
    addCard: acceptedCards.addCard,
    deleteCard: acceptedCards.deleteCard,

    productCategories: productCategories.productCategories,
    productCategoriesLoading: productCategories.productCategoriesLoading,
    fetchProductCategories: productCategories.fetchProductCategories,
    toggleProductCategory: productCategories.toggleProductCategory,
    updateProductCategory: productCategories.updateProductCategory,
    addProductCategory: productCategories.addProductCategory,
    deleteProductCategory: productCategories.deleteProductCategory,

    invalidateAll: () => {},
  }), [
    systemSettings, subscriptionPlans, paymentMethods, systemUsers,
    businessExpenses, businessSalaries, acceptedCards, productCategories,
  ]);
}

// PowerSync keeps data reactive automatically — no realtime subscriptions needed
export function useAdminSettings() {
  return useAdminSettingsStore();
}
