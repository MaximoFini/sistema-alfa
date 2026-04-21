"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  X,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessExpense {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category: string | null;
  description: string | null;
  is_system?: boolean;
}

interface BusinessSalary {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  description: string | null;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  expenses: BusinessExpense[];
  salaries: BusinessSalary[];
  onToggleExpense: (id: string) => void;
  onUpdateExpense: (
    id: string,
    updates: {
      name: string;
      amount: number;
      description?: string;
      category?: string;
    },
  ) => void;
  onAddExpense: (expense: {
    name: string;
    amount: number;
    description?: string;
    category?: string;
  }) => void;
  onDeleteExpense: (id: string) => void;
  onToggleSalary: (id: string) => void;
  onUpdateSalary: (
    id: string,
    updates: { name: string; amount: number; description?: string },
  ) => void;
  onAddSalary: (salary: {
    name: string;
    amount: number;
    description?: string;
  }) => void;
  onDeleteSalary: (id: string) => void;
}

type TabType = "expenses" | "salaries";

export default function ExpensesModal({
  isOpen,
  onClose,
  year,
  month,
  expenses,
  salaries,
  onToggleExpense,
  onUpdateExpense,
  onAddExpense,
  onDeleteExpense,
  onToggleSalary,
  onUpdateSalary,
  onAddSalary,
  onDeleteSalary,
}: ExpensesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("expenses");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [showNewExpense, setShowNewExpense] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [showNewSalary, setShowNewSalary] = useState(false);
  const [newSalaryName, setNewSalaryName] = useState("");
  const [newSalaryAmount, setNewSalaryAmount] = useState("");
  const [newSalaryDescription, setNewSalaryDescription] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setShowNewExpense(false);
      setShowNewSalary(false);
      resetNewExpenseForm();
      resetNewSalaryForm();
    }
  }, [isOpen]);

  const resetNewExpenseForm = () => {
    setNewName("");
    setNewAmount("");
    setNewDescription("");
    setNewCategory("");
  };

  const resetNewSalaryForm = () => {
    setNewSalaryName("");
    setNewSalaryAmount("");
    setNewSalaryDescription("");
  };

  const startEditExpense = (expense: BusinessExpense) => {
    setEditingId(expense.id);
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description || "");
    setEditCategory(expense.category || "");
  };

  const startEditSalary = (salary: BusinessSalary) => {
    setEditingId(salary.id);
    setEditName(salary.name);
    setEditAmount(String(salary.amount));
    setEditDescription(salary.description || "");
  };

  const saveEditExpense = () => {
    if (!editingId || !editName.trim() || !editAmount) return;
    onUpdateExpense(editingId, {
      name: editName.trim(),
      amount: Number(editAmount),
      description: editDescription.trim() || undefined,
      category: editCategory.trim() || undefined,
    });
    setEditingId(null);
  };

  const saveEditSalary = () => {
    if (!editingId || !editName.trim() || !editAmount) return;
    onUpdateSalary(editingId, {
      name: editName.trim(),
      amount: Number(editAmount),
      description: editDescription.trim() || undefined,
    });
    setEditingId(null);
  };

  const addExpense = () => {
    if (!newName.trim() || !newAmount) return;
    onAddExpense({
      name: newName.trim(),
      amount: Number(newAmount),
      description: newDescription.trim() || undefined,
      category: newCategory.trim() || undefined,
    });
    resetNewExpenseForm();
    setShowNewExpense(false);
  };

  const addSalary = () => {
    if (!newSalaryName.trim() || !newSalaryAmount) return;
    onAddSalary({
      name: newSalaryName.trim(),
      amount: Number(newSalaryAmount),
      description: newSalaryDescription.trim() || undefined,
    });
    resetNewSalaryForm();
    setShowNewSalary(false);
  };

  const deleteExpense = (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este egreso?")) return;
    onDeleteExpense(id);
  };

  const deleteSalary = (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este sueldo?")) return;
    onDeleteSalary(id);
  };

  const totalExpenses = expenses
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSalaries = salaries
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + s.amount, 0);

  const totalAll = totalExpenses + totalSalaries;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <DollarSign size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Gestión de Egresos
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} className="text-orange-500" />
                <span className="text-sm font-semibold text-orange-600">
                  {MONTH_NAMES[month - 1]} {year}
                </span>
                <span className="text-sm text-gray-400">
                  — configuración mensual
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Total Gastos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Total Sueldos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalSalaries.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="text-xs font-medium text-orange-600 mb-1">
                Total General
              </p>
              <p className="text-2xl font-bold text-orange-600">
                ${totalAll.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("expenses")}
              className={cn(
                "px-4 py-2 rounded-t-lg text-sm font-semibold transition-all",
                activeTab === "expenses"
                  ? "bg-white text-orange-600 border-t border-x border-gray-200"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              Gastos ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab("salaries")}
              className={cn(
                "px-4 py-2 rounded-t-lg text-sm font-semibold transition-all",
                activeTab === "salaries"
                  ? "bg-white text-orange-600 border-t border-x border-gray-200"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              Sueldos ({salaries.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "expenses" && (
            <div className="space-y-3">
              {/* Add New Expense Button */}
              {!showNewExpense && (
                <button
                  onClick={() => setShowNewExpense(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 transition-all font-medium"
                >
                  <Plus size={18} />
                  Agregar Nuevo Gasto
                </button>
              )}

              {/* New Expense Form */}
              {showNewExpense && (
                <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Nombre del gasto"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                    />
                    <input
                      type="number"
                      placeholder="Monto"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                    />
                    <input
                      type="text"
                      placeholder="Categoría (opcional)"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                    />
                    <input
                      type="text"
                      placeholder="Descripción (opcional)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addExpense}
                      disabled={!newName.trim() || !newAmount}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setShowNewExpense(false);
                        resetNewExpenseForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Expenses List */}
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle
                    size={48}
                    className="text-gray-300 mx-auto mb-3"
                  />
                  <p className="text-gray-500 font-medium">
                    No hay gastos registrados
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Agrega tu primer gasto para comenzar
                  </p>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className={cn(
                      "rounded-xl border transition-all",
                      expense.is_active
                        ? "bg-white border-gray-200"
                        : "bg-gray-50 border-gray-100 opacity-60",
                    )}
                  >
                    {editingId === expense.id ? (
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          />
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          />
                          <input
                            type="text"
                            placeholder="Categoría"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          />
                          <input
                            type="text"
                            placeholder="Descripción"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditExpense}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm"
                          >
                            <Save size={16} />
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900">
                              {expense.name}
                            </p>
                            {expense.is_system && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">
                                Sistema
                              </span>
                            )}
                            {expense.category && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {expense.category}
                              </span>
                            )}
                          </div>
                          {expense.description && (
                            <p className="text-xs text-gray-500">
                              {expense.description}
                            </p>
                          )}
                          <p className="text-lg font-bold text-orange-600 mt-1">
                            ${expense.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => onToggleExpense(expense.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={expense.is_active ? "Desactivar" : "Activar"}
                          >
                            {expense.is_active ? (
                              <ToggleRight
                                size={20}
                                className="text-green-600"
                              />
                            ) : (
                              <ToggleLeft size={20} className="text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditExpense(expense)}
                            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} className="text-orange-600" />
                          </button>
                          {!expense.is_system && (
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "salaries" && (
            <div className="space-y-3">
              {/* Add New Salary Button */}
              {!showNewSalary && (
                <button
                  onClick={() => setShowNewSalary(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 transition-all font-medium"
                >
                  <Plus size={18} />
                  Agregar Nuevo Sueldo
                </button>
              )}

              {/* New Salary Form */}
              {showNewSalary && (
                <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Nombre/Puesto"
                      value={newSalaryName}
                      onChange={(e) => setNewSalaryName(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                    />
                    <input
                      type="number"
                      placeholder="Monto"
                      value={newSalaryAmount}
                      onChange={(e) => setNewSalaryAmount(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                    />
                    <input
                      type="text"
                      placeholder="Descripción (opcional)"
                      value={newSalaryDescription}
                      onChange={(e) => setNewSalaryDescription(e.target.value)}
                      className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addSalary}
                      disabled={!newSalaryName.trim() || !newSalaryAmount}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setShowNewSalary(false);
                        resetNewSalaryForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Salaries List */}
              {salaries.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle
                    size={48}
                    className="text-gray-300 mx-auto mb-3"
                  />
                  <p className="text-gray-500 font-medium">
                    No hay sueldos registrados
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Agrega el primer sueldo para comenzar
                  </p>
                </div>
              ) : (
                salaries.map((salary) => (
                  <div
                    key={salary.id}
                    className={cn(
                      "rounded-xl border transition-all",
                      salary.is_active
                        ? "bg-white border-gray-200"
                        : "bg-gray-50 border-gray-100 opacity-60",
                    )}
                  >
                    {editingId === salary.id ? (
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          />
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          />
                          <input
                            type="text"
                            placeholder="Descripción"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditSalary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm"
                          >
                            <Save size={16} />
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 mb-1">
                            {salary.name}
                          </p>
                          {salary.description && (
                            <p className="text-xs text-gray-500">
                              {salary.description}
                            </p>
                          )}
                          <p className="text-lg font-bold text-orange-600 mt-1">
                            ${salary.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => onToggleSalary(salary.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={salary.is_active ? "Desactivar" : "Activar"}
                          >
                            {salary.is_active ? (
                              <ToggleRight
                                size={20}
                                className="text-green-600"
                              />
                            ) : (
                              <ToggleLeft size={20} className="text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditSalary(salary)}
                            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} className="text-orange-600" />
                          </button>
                          <button
                            onClick={() => deleteSalary(salary.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              💡 Los egresos activos se reflejan en las estadísticas financieras
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
