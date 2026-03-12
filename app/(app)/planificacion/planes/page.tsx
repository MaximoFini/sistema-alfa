"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Plus,
  MoreVertical,
  Calendar,
  Users,
  Pencil,
  Copy,
  Trash2,
  FileDown,
  UserPlus,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

import { useTrainingPlans } from "@/hooks/use-training-plans";

export default function PlanesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { plans, loading, deletePlan, duplicatePlan } = useTrainingPlans();

  const filteredPlans = plans.filter((plan) =>
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteClick = (id: string, title: string) => {
    setPlanToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (planToDelete) {
      await deletePlan(planToDelete.id);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleDuplicate = async (planId: string) => {
    await duplicatePlan(planId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full p-4 md:p-8 space-y-6">
        {/* Header con navegación */}
        <div className="flex flex-col gap-6">


          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Biblioteca de Planes
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gestiona y organiza tus planes de entrenamiento
              </p>
            </div>
            <Link href="/planificacion/planificador">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md min-h-[44px] rounded-lg hover:shadow-lg transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Plan
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar planes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 border border-gray-200 rounded-lg py-3 text-base min-h-[44px] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
            />
          </div>
        </div>

        {/* Grid de planes */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 text-sm">Cargando planes...</p>
            </div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No se encontraron planes" : "No hay planes guardados"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Crea tu primer plan desde el Planificador"}
            </p>
            {!searchQuery && (
              <Link href="/planificacion/planificador">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Plan
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlans.map((plan) => (
              <Card
                key={plan.id}
                className="bg-white border-gray-200 hover:shadow-xl transition-shadow duration-300 hover:border-orange-200 group cursor-pointer rounded-xl"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-gray-900 truncate">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {plan.total_weeks} semanas · {plan.total_days} días
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white border-gray-200 shadow-xl rounded-xl"
                      >
                        <DropdownMenuItem className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg">
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg">
                          <UserPlus className="mr-2 h-4 w-4" /> Asignar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg"
                          onClick={() => handleDuplicate(plan.id)}
                        >
                          <Copy className="mr-2 h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg">
                          <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-200 my-1" />
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg"
                          onClick={() => handleDeleteClick(plan.id, plan.title)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="py-3 space-y-3">
                  {plan.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(plan.start_date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      -{" "}
                      {new Date(plan.end_date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between w-full">
                    <Badge
                      variant="outline"
                      className="border-gray-200 text-gray-600 bg-gray-50 rounded-full px-3 py-1"
                    >
                      <Users className="mr-1.5 h-3 w-3" />
                      {plan.assignedCount} asignado
                      {plan.assignedCount !== 1 ? "s" : ""}
                    </Badge>
                    {plan.is_template && (
                      <Badge
                        variant="outline"
                        className="border-orange-200 text-orange-700 bg-orange-50 rounded-full px-3 py-1"
                      >
                        Plantilla
                      </Badge>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">
              ¿Estás seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta acción no se puede deshacer. Se archivará el plan{" "}
              <span className="font-semibold text-gray-900">
                "{planToDelete?.title}"
              </span>{" "}
              y ya no estará visible en la biblioteca.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
