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

import { useExportPlanPDF } from "@/hooks/use-export-plan-pdf";
import PlanPDFTemplate from "@/components/PlanPDFTemplate";
import { PlanPreviewModal } from "@/components/PlanPreviewModal";
import { useRouter } from "next/navigation";
import { useTrainingPlans } from "@/hooks/use-training-plans";

export default function PlanesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [previewPlanId, setPreviewPlanId] = useState<string | null>(null);
  const router = useRouter();

  const { plans, loading, deletePlan, duplicatePlan } = useTrainingPlans();
  const { templateRef, pdfData, isExporting, exportPDF } = useExportPlanPDF();

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

  const handleEdit = (planId: string) => {
    // Navigate to planificador with planId
    router.push(`/planificacion/planificador?id=${planId}`);
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
                onClick={() => setPreviewPlanId(plan.id)}
                className="bg-white border-gray-200 hover:shadow-xl hover:border-[#DC2626]/20 transition-all duration-300 group cursor-pointer rounded-2xl flex flex-col pt-2 shadow-sm relative overflow-hidden"
              >
                <CardHeader className="pb-0 px-5 pt-4 flex-none space-y-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg text-[#0f172a] tracking-tight leading-tight line-clamp-2 pr-6">
                      {plan.title}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white border-gray-200 shadow-xl rounded-xl z-50 w-48 p-1"
                      >
                        <DropdownMenuItem 
                          className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(plan.id);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4 text-gray-500" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <UserPlus className="mr-2 h-4 w-4 text-gray-500" /> Asignar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(plan.id);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4 text-gray-500" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg py-2"
                           disabled={isExporting}
                           onClick={(e) => {
                             e.stopPropagation();
                             exportPDF(plan.id);
                           }}
                         >
                           <FileDown className="mr-2 h-4 w-4 text-gray-500" />
                           {isExporting ? "Generando PDF..." : "Exportar PDF"}
                         </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100 my-1 mx-2" />
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg py-2 focus:bg-red-50 focus:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(plan.id, plan.title);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* The Badges */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-50/70 border border-orange-100/50 text-orange-600">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{plan.total_weeks} Semanas</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200/60 text-slate-600">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{plan.days_per_week} Días/Sem</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 py-4">
                   {/* Spacing for alignment, screenshot doesn't show description inside card immediately below badges, but keeping it empty and letting flex-1 handle stretching */}
                </CardContent>

                <CardFooter className="pt-4 pb-4 px-5 border-t border-gray-50 mt-auto flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Asignado a:</span>
                  <div className="flex items-center gap-1.5 text-orange-700">
                    <div className="bg-orange-600 rounded-full h-7 w-7 flex items-center justify-center p-1.5 shadow-sm overflow-hidden text-white relative">
                       <Users className="h-4 w-4 shrink-0 absolute -ml-1.5 -mb-0.5" />
                       <Users className="h-5 w-5 shrink-0 ml-1.5" />
                    </div>
                    <span className="text-[15px] font-semibold tracking-tight">
                      {plan.assignedCount || 1} alumno{plan.assignedCount !== 1 ? "s" : ""}
                    </span>
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

      {/* Template oculto fuera del viewport para captura con html2canvas */}
      <PlanPDFTemplate ref={templateRef} data={pdfData} />

      {/* Plan Preview Modal */}
      <PlanPreviewModal
        planId={previewPlanId}
        isOpen={!!previewPlanId}
        onClose={() => setPreviewPlanId(null)}
        onEdit={handleEdit}
        onDownload={exportPDF}
      />
    </div>
  );
}
