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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  ArrowRight,
  Pencil,
  GripVertical,
  RotateCcw,
  PlayCircle,
  VideoOff,
  Check,
  ChevronDown,
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
  const [deleteDayDialogOpen, setDeleteDayDialogOpen] = useState(false);
  const [dayToDeleteId, setDayToDeleteId] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Hooks
  const { exercises: libraryExercises } = useExercises();
  const { stages, createStage } = useExerciseStages();
  const { savePlan } = useTrainingPlans();

  // New stage state
  const [newStageDialogOpen, setNewStageDialogOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#f97316");

  // Popover state for exercise selector
  const [openExercisePopover, setOpenExercisePopover] = useState<string | null>(null);

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [canDrag, setCanDrag] = useState(false);

  // Get active day exercises sorted by order
  const activeDayExercises = exercises
    .filter((ex) => ex.day_id === activeDay)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;
    const success = await createStage(newStageName, newStageColor);
    if (success) {
      setNewStageDialogOpen(false);
      setNewStageName("");
      setNewStageColor("#f97316");
    }
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newDayExercises = [...activeDayExercises];
    const draggedItem = newDayExercises[draggedIndex];
    
    newDayExercises.splice(draggedIndex, 1);
    newDayExercises.splice(index, 0, draggedItem);
    
    const updatedWithOrder = newDayExercises.map((ex, i) => ({ ...ex, order: i }));
    
    const otherExercises = exercises.filter(ex => ex.day_id !== activeDay);
    setExercises([...otherExercises, ...updatedWithOrder]);
    
    setDraggedIndex(index);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
    setCanDrag(false);
  };

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

  // Handlers moved up for organization
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

  // Remove day trigger
  const handleRemoveDay = (dayId: string) => {
    if (days.length === 1) {
      toast.error("Debe haber al menos un día");
      return;
    }
    setDayToDeleteId(dayId);
    setDeleteDayDialogOpen(true);
  };

  // Confirm remove day
  const confirmRemoveDay = () => {
    if (!dayToDeleteId) return;
    
    setDays(days.filter((d) => d.id !== dayToDeleteId));
    setExercises(exercises.filter((ex) => ex.day_id !== dayToDeleteId));
    
    if (activeDay === dayToDeleteId) {
      const remainingDays = days.filter((d) => d.id !== dayToDeleteId);
      if (remainingDays.length > 0) {
        setActiveDay(remainingDays[0].id);
      }
    }
    
    setDeleteDayDialogOpen(false);
    setDayToDeleteId(null);
    toast.success("Día eliminado");
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
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex,
      ),
    );
  };

  const handleUpdateExerciseFields = (
    exerciseId: string,
    updates: Partial<PlanExercise>,
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex,
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

  const confirmResetDraft = () => {
    setPlanTitle("Nuevo Plan de Entrenamiento");
    setStartDate("");
    setEndDate("");
    setDays([{ id: generateId(), number: 1, name: "Día 1" }]);
    setActiveDay(""); // Will be set by useEffect if days changes or handled manually
    setExercises([]);
    localStorage.removeItem("planificador-draft");
    setResetDialogOpen(false);
    toast.success("Borrador reiniciado");
    
    // Set active day to the new day
    const newId = generateId();
    const newDay = { id: newId, number: 1, name: "Día 1" };
    setDays([newDay]);
    setActiveDay(newId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 z-10 w-full pt-6">
        <div className="w-full px-6 space-y-4">
          {/* Breadcrumb/indicator */}
          <div className="flex items-center text-sm text-gray-400 font-medium mb-2">
            <span>Planificador</span>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-900">Nuevo Plan</span>
          </div>

          {/* Title and actions */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <Input
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="text-3xl font-extrabold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 w-auto min-w-[300px]"
                placeholder="Nombre del plan..."
              />
              <button className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-md">
                <Pencil className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 text-gray-700 font-semibold shadow-sm h-11 px-5 rounded-xl border-2"
                onClick={() => setResetDialogOpen(true)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Nuevo Borrador
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm h-11 px-5 rounded-xl transition-all"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar en Biblioteca
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm h-11 px-6 rounded-xl">
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar plan a alumno
              </Button>
            </div>
          </div>

          {/* Date pickers */}
          <div className="flex items-center gap-4 mb-4 mt-8">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-2 shadow-sm">
              <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-2">Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none min-h-[40px] text-gray-700 font-semibold w-[150px] shadow-none focus-visible:ring-0 px-2"
              />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 mx-1" />
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-2 shadow-sm">
              <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-2">Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none min-h-[40px] text-gray-700 font-semibold w-[150px] shadow-none focus-visible:ring-0 px-2"
              />
            </div>
            {startDate && endDate && (
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium ml-2">
                <span className="text-gray-200">|</span>
                <span>
                  {Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} días totales
                </span>
                <span className="text-gray-200">·</span>
                <span>
                  {Math.ceil((Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) / 7)} semanas
                </span>
              </div>
            )}
          </div>

          {/* Day tabs */}
          <div className="flex items-center overflow-x-auto w-full pt-4 font-semibold">
            {days.map((day) => (
              <div key={day.id} className="group relative flex items-center">
                <button
                  className={`px-8 py-4 text-[15px] transition-all outline-none flex items-center gap-2 ${
                    activeDay === day.id
                      ? "text-orange-600 border-b-[3px] border-orange-600"
                      : "text-gray-500 hover:text-gray-700 border-b-[3px] border-transparent"
                  }`}
                  onClick={() => setActiveDay(day.id)}
                >
                  <span className="w-14 text-center cursor-default">
                    {day.name}
                  </span>
                  {days.length > 1 && (
                    <span 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-md transition-opacity absolute right-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDay(day.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </span>
                  )}
                </button>
              </div>
            ))}
            <button
              onClick={handleAddDay}
              disabled={days.length >= 7}
              className="px-6 py-4 text-[13px] font-bold tracking-wide text-orange-600 hover:text-orange-700 transition-colors flex items-center outline-none disabled:opacity-50 disabled:cursor-not-allowed border-b-[3px] border-transparent uppercase"
            >
              <Plus className="mr-2 h-[18px] w-[18px] border-2 border-orange-600 rounded-full p-0.5" />
              AGREGAR DÍA
            </button>
          </div>
        </div>
      </div>

      {/* Exercise table */}
      <div className="w-full px-6 pt-6 pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white">
                <TableRow className="border-b border-gray-100 hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest py-6 w-40 text-center">ETAPA</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest w-12 text-center">#</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest">EJERCICIO</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest w-20 text-center">VIDEO</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest w-24 text-center">SERIES</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest w-24 text-center">REPS</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest w-32 text-center">CARGA (KG)</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest w-32 text-center">PAUSA (S)</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest w-40 text-center">ESCRIBIR PESO</TableHead>
                  <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[200px]">NOTAS</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDayExercises.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-12 text-gray-500"
                    >
                      No hay ejercicios para estre día. Haz clic en "Agregar Nuevo Ejercicio" para
                      comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeDayExercises.map((ex, index) => {
                    const stageColor = stages.find(s => s.id === ex.stage_id)?.color || "transparent";
                    return (
                    <TableRow
                      key={ex.id}
                      draggable={canDrag}
                      onDragStart={(e) => onDragStart(e, index)}
                      onDragOver={(e) => onDragOver(e, index)}
                      onDragEnd={onDragEnd}
                      className={`border-b border-gray-100 hover:bg-gray-50/50 group relative transition-all duration-200 ${
                        draggedIndex === index ? "opacity-40 bg-orange-50/50 shadow-inner" : ""
                      }`}
                    >
                      {/* Insertion Line Indicator */}
                      {draggedIndex === index && (
                        <td className="absolute top-0 left-0 right-0 h-[2px] bg-orange-600 z-50 pointer-events-none" style={{ width: '100%' }} />
                      )}
                      <TableCell className="py-2 pl-0 w-40">
                        <div className="flex items-center h-full">
                          <div className="w-[5px] h-[52px] bg-gray-200 rounded-r-md mr-4 shrink-0 transition-colors" style={{ backgroundColor: stageColor !== "transparent" ? stageColor : "#e5e7eb" }} />
                            <Select
                              value={ex.stage_id || "none"}
                              onValueChange={(val) => {
                                const stage = stages.find((s) => s.id === val);
                                handleUpdateExerciseFields(ex.id, {
                                  stage_id: val === "none" ? null : val,
                                  stage_name: stage?.name || null
                                });
                              }}
                            >
                            <SelectTrigger className="w-full bg-white border border-gray-200 shadow-sm rounded-lg text-[11px] font-bold uppercase tracking-wider text-orange-600 shrink-1 h-10 px-3">
                              <SelectValue placeholder="SELECCIONAR ETAPA" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                              <SelectItem value="none">SIN ETAPA</SelectItem>
                              {stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: stage.color }}
                                    />
                                    <span className="font-bold uppercase text-[11px]">{stage.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>

                      <TableCell className="w-12 text-center text-gray-300">
                        <div 
                          className="cursor-grab active:cursor-grabbing p-2 drag-handle"
                          onMouseDown={() => setCanDrag(true)}
                          onMouseUp={() => setCanDrag(false)}
                        >
                          <GripVertical className="h-5 w-5 mx-auto" />
                        </div>
                      </TableCell>

                      <TableCell className="relative w-72">
                        <Popover 
                          open={openExercisePopover === ex.id} 
                          onOpenChange={(open) => setOpenExercisePopover(open ? ex.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <button className="w-full text-left bg-transparent border-none shadow-none p-0 h-auto font-bold text-[14px] text-gray-800 flex justify-between items-center group focus:outline-none">
                              <span className="truncate pr-2">
                                {ex.exercise_name || <span className="text-gray-400 font-medium">Seleccionar ejercicio...</span>}
                              </span>
                              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[380px] p-0 bg-white border border-gray-200 rounded-xl shadow-lg" align="start">
                            <Command className="bg-transparent border-none">
                              <CommandInput 
                                placeholder="Buscar ejercicio..." 
                                className="h-11 border-b border-gray-100 placeholder:text-gray-400"
                              />
                              <CommandList className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
                                <CommandEmpty className="py-6 text-center text-sm text-gray-500">No se encontraron ejercicios.</CommandEmpty>
                                <CommandGroup>
                                  {libraryExercises.map((exercise) => {
                                    // Make sure category exists for color coding
                                    const catColor = (exercise as any).category?.color || "#e5e7eb";
                                    const catName = (exercise as any).category?.name || "SIN CATEGORÍA";
                                    
                                    return (
                                      <CommandItem
                                        key={exercise.id}
                                        value={exercise.name}
                                        onSelect={() => {
                                          handleUpdateExerciseFields(ex.id, {
                                            exercise_name: exercise.name,
                                            video_url: exercise.video_url || null
                                          });
                                          setOpenExercisePopover(null);
                                        }}
                                        className="flex flex-col items-start px-3 py-2.5 cursor-pointer rounded-lg hover:bg-gray-50 aria-selected:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 mb-1"
                                      >
                                        <div className="flex w-full justify-between items-center mb-1.5">
                                          <span className="font-semibold text-[14px] text-gray-800">{exercise.name}</span>
                                          {exercise.video_url && (
                                            <PlayCircle className="h-4 w-4 text-blue-500 shrink-0" />
                                          )}
                                        </div>
                                        <div 
                                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase"
                                          style={{ 
                                            backgroundColor: `${catColor}15`, 
                                            borderColor: `${catColor}30`,
                                            color: catColor
                                          }}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                                          {catName}
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-[11px] font-medium text-gray-400 rounded-b-xl flex justify-between items-center">
                              <span>{libraryExercises.length} ejercicios encontrados</span>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>

                      <TableCell className="text-center">
                        {ex.video_url ? (
                          <a href={ex.video_url} target="_blank" rel="noreferrer" className="inline-flex text-orange-600 hover:text-orange-700">
                            <PlayCircle className="h-5 w-5 mx-auto" />
                          </a>
                        ) : (
                          <VideoOff className="h-5 w-5 mx-auto text-gray-300" />
                        )}
                      </TableCell>

                      <TableCell className="px-2">
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
                          className="w-full text-center bg-gray-50/50 border border-gray-100 font-semibold text-gray-700 h-[38px] shadow-none rounded-lg"
                          min="1"
                        />
                      </TableCell>
                      <TableCell className="px-2">
                        <Input
                          value={ex.reps}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, "reps", e.target.value)
                          }
                          className="w-full text-center bg-gray-50/50 border border-gray-100 font-semibold text-gray-700 h-[38px] shadow-none rounded-lg"
                          placeholder="10"
                        />
                      </TableCell>
                      <TableCell className="px-2">
                        <Input
                          value={ex.carga}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, "carga", e.target.value)
                          }
                          className="w-full text-center bg-gray-50/50 border border-gray-100 font-semibold text-gray-700 h-[38px] shadow-none rounded-lg"
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell className="px-2">
                        <Input
                          value={ex.pause}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, "pause", e.target.value)
                          }
                          className="w-full text-center bg-gray-50/50 border border-gray-100 font-semibold text-gray-700 h-[38px] shadow-none rounded-lg"
                          placeholder="60s"
                        />
                      </TableCell>

                      <TableCell className="text-center px-2">
                        <button
                          onClick={() => handleUpdateExercise(ex.id, "write_weight", !ex.write_weight)}
                          className={`w-[26px] h-[26px] mx-auto rounded-md flex items-center justify-center transition-colors ${ex.write_weight ? 'bg-[#10b981] text-white' : 'border border-gray-300 bg-white hover:border-gray-400'}`}
                        >
                          {ex.write_weight && <Check className="h-4 w-4" strokeWidth={3} />}
                        </button>
                      </TableCell>

                      <TableCell className="pr-4">
                        <Input
                          value={ex.notes || ""}
                          onChange={(e) => handleUpdateExercise(ex.id, "notes", e.target.value)}
                          placeholder="Notas..."
                          className="w-full bg-transparent border-none shadow-none text-gray-400 placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-gray-200 h-[38px] px-2 italic font-medium"
                        />
                      </TableCell>

                      <TableCell className="w-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all rounded-md"
                          onClick={() => handleDeleteExercise(ex.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bottom buttons row */}
          <div className="flex gap-4 p-4 mt-2">
            <button
              onClick={() => setNewStageDialogOpen(true)}
              className="px-6 py-[14px] flex items-center justify-center gap-2 text-[#a855f7] font-bold border-2 border-dashed border-[#e9d5ff] rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-colors w-64 shrink-0 tracking-wide text-sm"
            >
              <Plus className="h-[18px] w-[18px]" />
              Nueva Etapa
            </button>
            <button
              onClick={handleAddExercise}
              className="flex-1 px-6 py-[14px] flex items-center justify-center gap-2 text-orange-600 font-bold border-2 border-dashed border-orange-600/20 rounded-xl hover:bg-orange-50 hover:border-orange-600/40 transition-colors tracking-wide text-[15px]"
            >
              <Plus className="h-5 w-5 bg-orange-600 text-white rounded-full p-0.5" />
              Agregar Nuevo Ejercicio
            </button>
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
      
      {/* New Stage Dialog */}
      <Dialog open={newStageDialogOpen} onOpenChange={setNewStageDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Nueva Etapa
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Crea una nueva etapa para organizar los ejercicios en tu plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre de la Etapa</Label>
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Ej: Calentamiento, Fuerza, etc."
                className="bg-gray-50 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Color de Etiqueta</Label>
              <div className="flex gap-2.5 flex-wrap">
                {["#f97316", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewStageColor(color)}
                    className={`w-8 h-8 rounded-full transition-all focus:outline-none ${newStageColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewStageDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateStage}
              disabled={!newStageName.trim()}
              className="bg-[#a855f7] hover:bg-purple-600 text-white disabled:opacity-50"
            >
              Crear Etapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirm Delete Day Dialog */}
      <AlertDialog open={deleteDayDialogOpen} onOpenChange={setDeleteDayDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">¿Eliminar este día?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Se eliminarán todos los ejercicios configurados para este día. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700 hover:bg-gray-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveDay}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar Día
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reset Draft Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">¿Reiniciar borrador?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Se perderán todos los cambios que no hayas guardado en la biblioteca. ¿Estás seguro de que quieres empezar de cero?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700 hover:bg-gray-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetDraft}
              className="bg-orange-600 hover:bg-orange-700 text-white border-none"
            >
              Reiniciar Borrador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
