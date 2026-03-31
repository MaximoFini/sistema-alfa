"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Play, Dumbbell, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useExercises } from "@/hooks/use-exercises";
import { useCategories } from "@/hooks/use-categories";
import { useDataCacheStore } from "@/stores/data-cache-store";
import { supabase } from "@/lib/supabase";
import { LibraryExercise } from "@/lib/types/exercises";

export default function BaseEjerciciosPage() {
  // Estados para filtro y modal
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<LibraryExercise | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Category management state
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    id: "",
    name: "",
    color: "#10b981",
  });
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    video_url: "",
    notes: "",
  });

  // Usar hooks con lógica original
  const {
    exercises,
    isLoading,
    refresh,
    createExercise,
    updateExercise,
    deleteExercise,
  } = useExercises();
  const { categories, refresh: refreshCategories } = useCategories();
  const { invalidateCategories } = useDataCacheStore();

  // Reset form cuando se cierra el dialog
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingExercise(null);
      setFormData({
        name: "",
        category_id: "",
        video_url: "",
        notes: "",
      });
    }
  }, [isDialogOpen]);

  // Load exercise data when editing
  useEffect(() => {
    if (editingExercise) {
      setFormData({
        name: editingExercise.name,
        category_id: editingExercise.category_id,
        video_url: editingExercise.video_url || "",
        notes: editingExercise.notes || "",
      });
    }
  }, [editingExercise]);

  // Filtrado
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || ex.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handler para crear/editar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones del código original
    if (!formData.name.trim()) {
      toast.error("El nombre del ejercicio es requerido");
      return;
    }
    if (!formData.category_id) {
      toast.error("Debes seleccionar una categoría");
      return;
    }

    let success = false;
    if (editingExercise) {
      success = await updateExercise({ ...formData, id: editingExercise.id });
      if (success) {
        toast.success("Ejercicio actualizado exitosamente");
      }
    } else {
      success = await createExercise(formData);
      if (success) {
        toast.success("Ejercicio creado exitosamente");
      }
    }

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (exercise: LibraryExercise) => {
    setEditingExercise(exercise);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setExerciseToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (exerciseToDelete) {
      await deleteExercise(exerciseToDelete.id);
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };

  // HANDLERS FOR CATEGORIES
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir propagación al modal padre

    if (!categoryFormData.name.trim()) {
      toast.error("El nombre de la categoría es requerido");
      return;
    }

    try {
      if (isEditingCategory) {
        const { error } = await supabase
          .from("exercise_categories")
          .update({
            name: categoryFormData.name.trim(),
            color: categoryFormData.color,
          })
          .eq("id", categoryFormData.id);
        if (error) throw error;
        toast.success("Categoría actualizada");
      } else {
        const { error } = await supabase.from("exercise_categories").insert({
          name: categoryFormData.name.trim(),
          color: categoryFormData.color,
        });
        if (error) throw error;
        toast.success("Categoría creada");
      }

      invalidateCategories();
      await refreshCategories();

      // Cerrar solo el segundo modal
      setIsNewCategoryDialogOpen(false);
      setCategoryFormData({ id: "", name: "", color: "#10b981" });
      setIsEditingCategory(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Error al guardar la categoría");
    }
  };

  const handleEditCategory = (cat: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Prevenir propagación
    }
    setCategoryFormData({
      id: cat.id,
      name: cat.name,
      color: cat.color,
    });
    setIsEditingCategory(true);
    setIsNewCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if category has exercises
    const hasExercises = exercises.some((ex) => ex.category_id === id);
    if (hasExercises) {
      toast.error("No se puede eliminar una categoría que tiene ejercicios");
      return;
    }

    try {
      const { error } = await supabase
        .from("exercise_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;

      toast.success("Categoría eliminada");
      invalidateCategories();
      await refreshCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar la categoría");
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="w-full p-4 md:p-8 space-y-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Base de Ejercicios
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gestiona tu biblioteca de ejercicios
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-700 font-semibold shadow-sm h-11 px-6 rounded-xl border-2 hover:bg-gray-50 hover:text-gray-700 transition-all"
                onClick={() => setIsCategoriesDialogOpen(true)}
              >
                Gestionar Categorías
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md h-11 px-6 rounded-xl hover:shadow-lg transition-all font-semibold">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Ejercicio
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-100 rounded-2xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-gray-900">
                      {editingExercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400 mt-0.5">
                      {editingExercise
                        ? "Modifica los datos del ejercicio"
                        : "Completa los datos para crear un nuevo ejercicio"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="name"
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Nombre del ejercicio *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ej: Sentadilla búlgara"
                        className="border border-gray-200 rounded-lg px-4 py-3 text-base min-h-[44px] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="category"
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Categoría *
                      </Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category_id: value })
                        }
                        required
                      >
                        <SelectTrigger className="border border-gray-200 rounded-lg px-4 py-3 text-base min-h-[44px]">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-100 rounded-xl shadow-lg">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="video_url"
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        URL del Video
                      </Label>
                      <Input
                        id="video_url"
                        type="url"
                        value={formData.video_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            video_url: e.target.value,
                          })
                        }
                        placeholder="https://youtube.com/..."
                        className="border border-gray-200 rounded-lg px-4 py-3 text-base min-h-[44px] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="notes"
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Notas
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Indicaciones técnicas, variantes, etc."
                        className="border border-gray-200 rounded-lg px-4 py-3 text-base min-h-[100px] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all resize-none"
                      />
                    </div>

                    <DialogFooter className="flex flex-col md:flex-row gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 min-h-[44px] bg-orange-600 hover:bg-orange-700 text-white text-base font-semibold rounded-lg hover:brightness-110 transition-all shadow-md"
                      >
                        {editingExercise
                          ? "Guardar Cambios"
                          : "Crear Ejercicio"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ejercicios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 border border-gray-200 rounded-lg py-3 text-base min-h-[44px] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={categoryFilter === "all" ? "default" : "outline"}
                className={`cursor-pointer transition-all min-h-[32px] px-3 py-1.5 rounded-full ${
                  categoryFilter === "all"
                    ? "bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                    : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                }`}
                onClick={() => setCategoryFilter("all")}
              >
                Todos ({exercises.length})
              </Badge>
              {categories.map((cat) => {
                const count = exercises.filter(
                  (ex) => ex.category_id === cat.id,
                ).length;
                return (
                  <Badge
                    key={cat.id}
                    variant={categoryFilter === cat.id ? "default" : "outline"}
                    className={`cursor-pointer transition-all min-h-[32px] px-3 py-1.5 rounded-full ${
                      categoryFilter === cat.id
                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                        : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                    }`}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-md overflow-hidden hover:shadow-lg transition-all">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-gray-100 hover:bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">
                    Video
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Nombre
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Categoría
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Notas
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-16 text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-base font-medium">
                          Cargando ejercicios...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredExercises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Dumbbell className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-base text-gray-900 font-semibold">
                          {searchQuery || categoryFilter !== "all"
                            ? "No se encontraron ejercicios con esos filtros"
                            : "No hay ejercicios guardados"}
                        </p>
                        {!searchQuery && categoryFilter === "all" && (
                          <p className="text-sm text-gray-500">
                            Crea tu primer ejercicio haciendo clic en "Nuevo
                            Ejercicio"
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExercises.map((ex) => (
                    <TableRow
                      key={ex.id}
                      className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        {ex.video_url ? (
                          <a
                            href={ex.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-all"
                          >
                            <Play className="h-5 w-5" />
                          </a>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Dumbbell className="h-5 w-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 text-base">
                        {ex.name}
                      </TableCell>
                      <TableCell>
                        {ex.category ? (
                          <Badge
                            className="border-0 shadow-sm rounded-full px-3 py-1"
                            style={{
                              backgroundColor: ex.category.color + "20",
                              color: ex.category.color,
                            }}
                          >
                            {ex.category.name}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-gray-200 text-gray-600 rounded-full px-3 py-1"
                          >
                            Sin categoría
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                        {ex.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-all"
                            onClick={() => handleEdit(ex)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500 transition-all"
                            onClick={() => handleDeleteClick(ex.id, ex.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-white border-gray-100 rounded-2xl shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-gray-900">
                ¿Estás seguro?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-500">
                Esta acción no se puede deshacer. Se eliminará el ejercicio{" "}
                <span className="font-semibold text-gray-900">
                  "{exerciseToDelete?.name}"
                </span>{" "}
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col md:flex-row gap-3">
              <AlertDialogCancel className="flex-1 min-h-[44px] border border-gray-200 text-gray-600 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-700 text-white text-base font-semibold rounded-lg hover:brightness-110 transition-all shadow-md"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={isCategoriesDialogOpen}
          onOpenChange={setIsCategoriesDialogOpen}
        >
          <DialogContent className="bg-white border-gray-100 rounded-2xl shadow-2xl max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden text-gray-900">
            <DialogHeader className="p-6 border-b border-gray-100">
              <DialogTitle className="text-xl font-bold flex items-center justify-between">
                Gestionar Categorías
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevenir cierre del modal padre
                  setCategoryFormData({ id: "", name: "", color: "#10b981" });
                  setIsEditingCategory(false);
                  setIsNewCategoryDialogOpen(true);
                }}
                className="w-full py-4 border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center gap-2 text-blue-600 font-bold hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nueva Categoría
              </button>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Categorías Existentes ({categories.length})
                </h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-gray-700">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory(cat, e);
                          }}
                          className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isNewCategoryDialogOpen}
          onOpenChange={(open) => {
            // Solo permitir cerrar el segundo modal, no el primero
            setIsNewCategoryDialogOpen(open);
            if (!open) {
              // Al cerrar, limpiar el formulario
              setCategoryFormData({ id: "", name: "", color: "#10b981" });
              setIsEditingCategory(false);
            }
          }}
          disableHistoryIntegration={true}
        >
          <DialogContent
            className="bg-white border-gray-100 rounded-2xl shadow-2xl max-w-sm text-gray-900"
            onInteractOutside={(e) => {
              // Solo cerrar este modal, no propagar al padre
              const target = e.target as HTMLElement;
              // Verificar si el click fue en el overlay del primer modal
              if (!target.closest('[data-slot="dialog-content"]')) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {isEditingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Nombre
                </Label>
                <Input
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ej: Core, Empujes..."
                  className="h-11 rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-12 h-11 p-1 rounded-xl border-gray-200 shrink-0"
                  />
                  <Input
                    type="text"
                    value={categoryFormData.color}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        color: e.target.value,
                      })
                    }
                    className="h-11 rounded-xl border-gray-200 font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevenir cierre del modal padre
                    setIsNewCategoryDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  Guardar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
