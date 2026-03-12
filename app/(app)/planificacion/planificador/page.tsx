"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Save,
  UserPlus,
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

import { useExercises } from "@/hooks/use-exercises";
import { useExerciseStages } from "@/hooks/use-exercise-stages";
import { useTrainingPlans } from "@/hooks/use-training-plans";
import { PlanExercise, Day } from "@/lib/types/plans";

// Generate unique IDs
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function PlanificadorPage() {
  // Plan state
  const [planTitle, setPlanTitle] = useState("Nuevo Plan de Entrenamiento");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [days, setDays] = useState<Day[]>([
    { id: generateId(), number: 1, name: "Día 1" },
  ]);
  const [activeDay, setActiveDay] = useState<string>(days[0].id);
  const [exercises, setExercises] = useState<PlanExercise[]>([]);

  // Modal states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);

  // Hooks
  const { exercises: libraryExercises } = useExercises();
  const { stages } = useExerciseStages();
  const { savePlan } = useTrainingPlans();

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    setStartDate(today.toISOString().split("T")[0]);
    setEndDate(nextWeek.toISOString().split("T")[0]);
  }, []);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("planificador-draft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.planTitle) setPlanTitle(data.planTitle);
        if (data.startDate) setStartDate(data.startDate);
        if (data.endDate) setEndDate(data.endDate);
        if (data.days) setDays(data.days);
        if (data.exercises) setExercises(data.exercises);
        if (data.activeDay) setActiveDay(data.activeDay);
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(
        "planificador-draft",
        JSON.stringify({
          planTitle,
          startDate,
          endDate,
          days,
          exercises,
          activeDay,
        }),
      );
    }, 1000);

    return () => clearTimeout(timeout);
  }, [planTitle, startDate, endDate, days, exercises, activeDay]);

  // Get exercises for active day
  const activeDayExercises = exercises.filter((ex) => ex.day_id === activeDay);

  // Add day
  const handleAddDay = () => {
    if (days.length >= 7) {
      toast.error("Máximo 7 días por semana");
      return;
    }
    const newDay: Day = {
      id: generateId(),
      number: days.length + 1,
      name: `Día ${days.length + 1}`,
    };
    setDays([...days, newDay]);
    setActiveDay(newDay.id);
  };

  // Remove day
  const handleRemoveDay = (dayId: string) => {
    if (days.length === 1) {
      toast.error("Debe haber al menos un día");
      return;
    }
    setDays(days.filter((d) => d.id !== dayId));
    setExercises(exercises.filter((ex) => ex.day_id !== dayId));
    if (activeDay === dayId) {
      setActiveDay(days[0].id);
    }
  };

  // Rename day
  const handleRenameDay = (dayId: string, newName: string) => {
    setDays(days.map((d) => (d.id === dayId ? { ...d, name: newName } : d)));
  };

  // Add exercise
  const handleAddExercise = () => {
    const newExercise: PlanExercise = {
      id: generateId(),
      day_id: activeDay,
      stage_id: null,
      stage_name: null,
      exercise_name: "",
      video_url: null,
      series: 3,
      reps: "10",
      carga: "-",
      pause: "60s",
      notes: null,
      order: activeDayExercises.length,
      write_weight: false,
    };
    setExercises([...exercises, newExercise]);
  };

  // Update exercise
  const handleUpdateExercise = (
    exerciseId: string,
    field: keyof PlanExercise,
    value: any,
  ) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex,
      ),
    );
  };

  // Delete exercise
  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  // Move exercise
  const handleMoveExercise = (exerciseId: string, direction: "up" | "down") => {
    const index = activeDayExercises.findIndex((ex) => ex.id === exerciseId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === activeDayExercises.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...activeDayExercises];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[index],
    ];

    // Update all exercises
    const otherExercises = exercises.filter((ex) => ex.day_id !== activeDay);
    setExercises([...otherExercises, ...reordered]);
  };

  // Save plan
  const handleSave = async () => {
    // Validations
    if (!planTitle.trim()) {
      toast.error("El título del plan es requerido");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Las fechas de inicio y fin son requeridas");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("La fecha de fin debe ser posterior a la de inicio");
      return;
    }

    // Prepare data
    const planData = {
      title: planTitle,
      description: "",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isTemplate,
      days: days.map((day) => ({
        id: day.id,
        number: day.number,
        name: day.name,
      })),
      exercises: exercises.map((ex) => ({
        day_id: ex.day_id,
        stage_id: ex.stage_id,
        stage_name: ex.stage_name,
        exercise_name: ex.exercise_name,
        video_url: ex.video_url,
        series: ex.series,
        reps: ex.reps,
        carga: ex.carga,
        pause: ex.pause,
        notes: ex.notes,
        write_weight: ex.write_weight,
      })),
    };

    const planId = await savePlan(planData);
    if (planId) {
      setSaveDialogOpen(false);
      // Clear draft
      localStorage.removeItem("planificador-draft");
      // Redirect to plans library
      window.location.href = "/planificacion/planes";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          {/* Breadcrumb/indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Planificación</span>
              <span>/</span>
              <span className="text-orange-600 font-medium">Planificador</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Cambios guardados</span>
            </div>
          </div>

          {/* Title and actions */}
          <div className="flex items-center justify-between gap-4">
            <Input
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 max-w-2xl"
              placeholder="Nombre del plan..."
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 min-h-[40px] rounded-lg"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar en Biblioteca
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white min-h-[40px] rounded-lg">
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar a Alumno
              </Button>
            </div>
          </div>

          {/* Date pickers */}
          <div className="flex gap-4 items-end flex-wrap">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha de inicio</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 bg-white border-gray-200 rounded-lg min-h-[44px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha de fin</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 bg-white border-gray-200 rounded-lg min-h-[44px]"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 pb-2">
              {startDate && endDate && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {Math.ceil(
                      (new Date(endDate).getTime() -
                        new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    días
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="font-semibold">
                    {Math.ceil(
                      (new Date(endDate).getTime() -
                        new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 7),
                    )}{" "}
                    semanas
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => (
              <div key={day.id} className="flex gap-1">
                <Button
                  variant={activeDay === day.id ? "default" : "outline"}
                  className={`min-w-fit rounded-lg transition-all ${
                    activeDay === day.id
                      ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                  }`}
                  onClick={() => setActiveDay(day.id)}
                >
                  <input
                    value={day.name}
                    onChange={(e) => handleRenameDay(day.id, e.target.value)}
                    className="bg-transparent border-none outline-none w-20 text-center font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Button>
                {days.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => handleRemoveDay(day.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleAddDay}
              disabled={days.length >= 7}
              className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Día
            </Button>
          </div>
        </div>
      </div>

      {/* Exercise table */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-base text-gray-900">
              Ejercicios - {days.find((d) => d.id === activeDay)?.name}
            </h3>
            <Button
              onClick={handleAddExercise}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Ejercicio
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Etapa</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ejercicio</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Series</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Reps</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Carga</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Pausa</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDayExercises.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-gray-500"
                    >
                      No hay ejercicios. Haz clic en "Agregar Ejercicio" para
                      comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeDayExercises.map((ex, index) => (
                    <TableRow
                      key={ex.id}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      <TableCell className="text-gray-600 font-mono text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ex.stage_id || "none"}
                          onValueChange={(value) => {
                            const stage = stages.find((s) => s.id === value);
                            handleUpdateExercise(ex.id, "stage_id", value);
                            handleUpdateExercise(
                              ex.id,
                              "stage_name",
                              stage?.name || null,
                            );
                          }}
                        >
                          <SelectTrigger className="w-40 bg-white border-gray-200 rounded-lg">
                            <SelectValue placeholder="Sin etapa" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                            <SelectItem value="none">Sin etapa</SelectItem>
                            {stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: stage.color }}
                                  />
                                  {stage.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ex.exercise_name || ""}
                          onValueChange={(value) => {
                            const exercise = libraryExercises.find(
                              (e) => e.name === value,
                            );
                            handleUpdateExercise(ex.id, "exercise_name", value);
                            if (exercise?.video_url) {
                              handleUpdateExercise(
                                ex.id,
                                "video_url",
                                exercise.video_url,
                              );
                            }
                          }}
                        >
                          <SelectTrigger className="min-w-[200px] bg-white border-gray-200 rounded-lg">
                            <SelectValue placeholder="Seleccionar ejercicio" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                            {libraryExercises.map((exercise) => (
                              <SelectItem key={exercise.id} value={exercise.name}>
                                {exercise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ex.series}
                          onChange={(e) =>
                            handleUpdateExercise(
                              ex.id,
                              "series",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-16 bg-white border-gray-200"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ex.reps}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, "reps", e.target.value)
                          }
                          className="w-20 bg-white border-gray-200"
                          placeholder="10"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ex.carga}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, "carga", e.target.value)
                          }
                          className="w-20 bg-white border-gray-200"
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ex.pause}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, "pause", e.target.value)
                          }
                          className="w-20 bg-white border-gray-200"
                          placeholder="60s"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                            onClick={() => handleMoveExercise(ex.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                            onClick={() => handleMoveExercise(ex.id, "down")}
                            disabled={
                              index === activeDayExercises.length - 1
                            }
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteExercise(ex.id)}
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
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Guardar Plan en Biblioteca
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Este plan se guardará y podrás asignarlo a tus alumnos más tarde.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isTemplate"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <Label htmlFor="isTemplate" className="text-gray-700">
                Guardar como plantilla
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Guardar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
