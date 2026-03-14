# 🏋️ GUÍA DE MIGRACIÓN: Módulo de Planificación

> **Origen:** `MaximoFini/StabilitySistema` (professors-platform)  
> **Destino:** `MaximoFini/sistema-alfa` (Next.js App Router)

Este documento contiene las instrucciones completas para migrar el **Planificador**, la **Biblioteca de Planes** y la **Base de Ejercicios** desde StabilitySistema hacia sistema-alfa.

---

## ⚠️ REGLAS CRÍTICAS DE MIGRACIÓN

### 1. LÓGICA INTACTA (NO MODIFICAR)

- **Nombres de tablas** en Supabase: `exercises`, `exercise_categories`, `training_plans`, `training_plan_days`, `training_plan_exercises`, `training_plan_assignments`
- **Payloads de INSERT/UPDATE/DELETE** deben ser idénticos al código original
- **Estructura de queries** Supabase debe mantenerse exacta

### 2. UI COMPLETAMENTE NUEVA

- Usar componentes de `@/components/ui/` (shadcn/ui)
- **Paleta ALPHA** (deportes de combate):
  - Fondos: `bg-zinc-950`, `bg-black`, `bg-zinc-900`
  - Textos: `text-white`, `text-zinc-400`
  - Acentos primarios: `bg-orange-600`, `text-orange-500`, `hover:bg-orange-700`, `border-orange-500`
  - Acentos destructivos: `bg-red-600`, `text-red-500`
- Mobile-First con scroll horizontal en tablas

### 3. COMPONENTES DISPONIBLES EN SISTEMA-ALFA

- `Table`, `Dialog`, `Button`, `Input`, `Select`, `Badge`, `Card`, `Skeleton`, `DropdownMenu`, `Popover`, `Accordion`, `Switch`, `Sonner (Toaster)`

---

## 📂 ESTRUCTURA DE ARCHIVOS A CREAR

```
sistema-alfa/
├── lib/
│   ├── supabase.ts                 # Cliente Supabase (FASE 0)
│   └── types/
│       ├── exercises.ts            # Tipos de ejercicios
│       └── plans.ts                # Tipos de planes
├── stores/
│   └── data-cache-store.ts         # Store Zustand global
├── hooks/
│   ├── use-exercises.ts            # Hook ejercicios
│   ├── use-categories.ts           # Hook categorías
│   ├── use-training-plans.ts       # Hook planes
│   └── use-exercise-stages.ts      # Hook etapas
├── app/(app)/planificacion/
│   ├── layout.tsx                  # Layout compartido
│   ├── base-ejercicios/
│   │   └── page.tsx               # CRUD ejercicios (FASE 1)
│   ├── planes/
│   │   └── page.tsx               # Biblioteca de planes (FASE 2)
│   └── planificador/
│       └── page.tsx               # Editor de planes (FASE 3)
└── components/planificacion/
    ├── exercise-table.tsx          # Tabla de ejercicios
    ├── exercise-dialog.tsx         # Modal crear/editar ejercicio
    ├── category-manager.tsx        # Gestor de categorías
    ├── plan-card.tsx               # Card de plan
    ├── plan-preview.tsx            # Preview de plan
    ├── assign-plan-modal.tsx       # Modal asignar plan
    └── plan-editor/
        ├── day-tabs.tsx            # Tabs de días
        ├── exercise-row.tsx        # Fila de ejercicio editable
        └── sortable-exercise-row.tsx # Con drag & drop
```

---

# 🔧 FASE 0: Configuración Base

## Objetivo

Crear la infraestructura base: cliente Supabase, tipos y store global.

---

## 0.1 Crear Cliente Supabase

**Archivo:** `lib/supabase.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

---

## 0.2 Crear Tipos de Ejercicios

**Archivo:** `lib/types/exercises.ts`

```typescript
// Copiar EXACTAMENTE del código original
export interface ExerciseCategory {
  id: string;
  name: string;
  color: string;
}

export interface LibraryExercise {
  id: string;
  name: string;
  category_id: string;
  video_url: string | null;
  notes: string | null;
  created_by: string;
  category?: ExerciseCategory;
}
```

---

## 0.3 Crear Tipos de Planes

**Archivo:** `lib/types/plans.ts`

```typescript
// Copiar EXACTAMENTE del código original
export interface Day {
  id: string;
  number: number;
  name: string;
}

export interface PlanExercise {
  id: string;
  day_id: string;
  stage_id: string | null;
  stage_name: string | null;
  exercise_name: string;
  video_url?: string | null;
  series: number;
  reps: string;
  carga: string;
  pause: string;
  notes: string | null;
  order: number;
  write_weight?: boolean;
}

export interface TrainingPlanSummary {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  days_per_week: number;
  total_weeks: number;
  plan_type: string | null;
  difficulty_level: string | null;
  is_template: boolean;
  is_archived: boolean;
  created_at: string;
  assignedCount: number;
}
```

---

## 0.4 Crear Store Global (Zustand)

**Archivo:** `stores/data-cache-store.ts`

Copiar la lógica COMPLETA de `professors-platform/src/store/dataCacheStore.ts`:

**Funciones a preservar:**

- `fetchCategories()` → Query: `supabase.from("exercise_categories").select("id, name, color").order("name")`
- `fetchPlans(professorId)` → Query: `supabase.from("training_plans").select("*, training_plan_assignments(count)").eq("is_archived", false).order("created_at", { ascending: false })`

---

# 🎯 FASE 1: Base de Ejercicios (CRUD)

## Objetivo

Implementar el CRUD completo de ejercicios en `app/(app)/planificacion/base-ejercicios/page.tsx`

---

## 1.1 Hook de Ejercicios

**Archivo:** `hooks/use-exercises.ts`

**Lógica ORIGINAL a preservar (de `trainingStore.ts`):**

```typescript
// FETCH - Query EXACTA:
const { data, error } = await supabase
  .from("exercises")
  .select(
    `
    id, name, category_id, video_url, notes, created_by,
    exercise_categories ( id, name, color )
  `,
  )
  .order("name", { ascending: true });

// INSERT - Payload EXACTO:
const { error } = await supabase.from("exercises").insert({
  name: formData.name.trim(),
  category_id: formData.category_id,
  video_url: formData.video_url.trim() || null,
  notes: formData.notes.trim() || null,
  created_by: professor.id,
});

// UPDATE - Payload EXACTO:
const { error } = await supabase
  .from("exercises")
  .update({
    name: formData.name.trim(),
    category_id: formData.category_id,
    video_url: formData.video_url.trim() || null,
    notes: formData.notes.trim() || null,
  })
  .eq("id", exerciseId);

// DELETE:
const { error } = await supabase
  .from("exercises")
  .delete()
  .eq("id", exerciseId);
```

---

## 1.2 Hook de Categorías

**Archivo:** `hooks/use-categories.ts`

**Lógica ORIGINAL (de `dataCacheStore.ts`):**

```typescript
// FETCH:
const { data, error } = await supabase
  .from("exercise_categories")
  .select("id, name, color")
  .order("name", { ascending: true });
```

---

## 1.3 Página Base de Ejercicios

**Archivo:** `app/(app)/planificacion/base-ejercicios/page.tsx`

**Estructura de UI (estilo ALPHA):**

```tsx
"use client";

import { useState } from "react";
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
import { Plus, Pencil, Trash2, Play, Dumbbell, Search } from "lucide-react";
import { toast } from "sonner";

// Importar hooks que preservan la lógica original
import { useExercises } from "@/hooks/use-exercises";
import { useCategories } from "@/hooks/use-categories";

export default function BaseEjerciciosPage() {
  // Estados para filtro y modal
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<LibraryExercise | null>(null);

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
  const { categories } = useCategories();

  // Filtrado
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || ex.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handlers usando la lógica ORIGINAL
  const handleCreate = async (e: React.FormEvent) => {
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

    await createExercise(formData); // Usa payload original
    setIsDialogOpen(false);
    toast.success("Ejercicio creado exitosamente");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Base de Ejercicios</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ejercicio
              </Button>
            </DialogTrigger>
            {/* DialogContent con formulario */}
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar ejercicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={categoryFilter === "all" ? "default" : "outline"}
              className={
                categoryFilter === "all"
                  ? "bg-orange-600"
                  : "border-zinc-700 hover:bg-zinc-800"
              }
              onClick={() => setCategoryFilter("all")}
            >
              Todos
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "outline"}
                className={
                  categoryFilter === cat.id
                    ? "bg-orange-600"
                    : "border-zinc-700 hover:bg-zinc-800"
                }
                onClick={() => setCategoryFilter(cat.id)}
              >
                <div
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-zinc-800 overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-900">
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400 w-16">Video</TableHead>
              <TableHead className="text-zinc-400">Nombre</TableHead>
              <TableHead className="text-zinc-400">Categoría</TableHead>
              <TableHead className="text-zinc-400">Notas</TableHead>
              <TableHead className="text-zinc-400 w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-zinc-500"
                >
                  Cargando ejercicios...
                </TableCell>
              </TableRow>
            ) : filteredExercises.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-zinc-500"
                >
                  No se encontraron ejercicios
                </TableCell>
              </TableRow>
            ) : (
              filteredExercises.map((ex) => (
                <TableRow
                  key={ex.id}
                  className="border-zinc-800 hover:bg-zinc-900/50"
                >
                  <TableCell>
                    {ex.video_url ? (
                      <a
                        href={ex.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 hover:bg-orange-500/20"
                      >
                        <Play className="h-5 w-5" />
                      </a>
                    ) : (
                      <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{ex.name}</TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: ex.category?.color || "#3B82F6",
                      }}
                    >
                      {ex.category?.name || "Sin categoría"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {ex.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => handleEdit(ex)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => handleDelete(ex.id, ex.name)}
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
  );
}
```

---

## 1.4 Gestor de Categorías

**Archivo:** `components/planificacion/category-manager.tsx`

Copiar la lógica de `professors-platform/src/features/library/CategoryManager.tsx`:

**Queries ORIGINALES:**

```typescript
// CREATE:
await supabase.from("exercise_categories").insert({ name, color });

// UPDATE:
await supabase.from("exercise_categories").update({ name, color }).eq("id", id);

// DELETE:
await supabase.from("exercise_categories").delete().eq("id", id);
```

---

# 📚 FASE 2: Biblioteca de Planes

## Objetivo

Implementar la vista de planes/rutinas en `app/(app)/planificacion/planes/page.tsx`

---

## 2.1 Hook de Planes

**Archivo:** `hooks/use-training-plans.ts`

**Lógica COMPLETA a copiar de `professors-platform/src/hooks/useTrainingPlans.ts`:**

### Queries y funciones a preservar:

```typescript
// 1. FETCH PLANS (de dataCacheStore):
const { data: plansData, error } = await supabase
  .from("training_plans")
  .select(`*, training_plan_assignments(count)`)
  .eq("is_archived", false)
  .order("created_at", { ascending: false });

// 2. SAVE PLAN - INSERT principal:
const { data: insertedPlan, error: planError } = await supabase
  .from("training_plans")
  .insert([
    {
      coach_id: professor.id,
      title: planData.title,
      description: planData.description || null,
      start_date: formatLocalDate(planData.startDate),
      end_date: formatLocalDate(planData.endDate),
      total_days: totalDays,
      days_per_week: daysPerWeek,
      total_weeks: totalWeeks,
      plan_type: planData.isTemplate ? "template" : "custom",
      difficulty_level: null,
      is_template: planData.isTemplate,
      is_archived: false,
    },
  ])
  .select()
  .single();

// 3. INSERT DAYS:
const daysToInsert = planData.days.map((day, index) => ({
  plan_id: insertedPlan.id,
  day_number: day.number,
  day_name: day.name,
  display_order: index,
}));
await supabase.from("training_plan_days").insert(daysToInsert).select();

// 4. INSERT EXERCISES:
const exercisesToInsert = planData.exercises.map((ex, index) => ({
  day_id: newDayId,
  stage_id: ex.stage_id || null,
  stage_name: ex.stage_name,
  exercise_name: ex.exercise_name,
  video_url: ex.video_url || null,
  series: ex.series,
  reps: ex.reps,
  carga: ex.carga || "-",
  pause: ex.pause,
  notes: ex.notes || null,
  coach_instructions: null,
  display_order: index,
  write_weight: ex.write_weight ?? false,
}));
await supabase.from("training_plan_exercises").insert(exercisesToInsert);

// 5. DELETE (soft delete):
await supabase
  .from("training_plans")
  .update({ is_archived: true })
  .eq("id", planId);

// 6. DUPLICATE - Ver lógica completa en useTrainingPlans.ts

// 7. ASSIGN TO STUDENTS:
const assignments = studentIds.map((studentId) => ({
  plan_id: planId,
  student_id: studentId,
  coach_id: professor.id,
  start_date: formatLocalDate(startDate),
  end_date: formatLocalDate(endDate),
  status: "active",
  current_day_number: 1,
  completed_days: 0,
}));
await supabase.from("training_plan_assignments").insert(assignments);
```

---

## 2.2 Página Biblioteca de Planes

**Archivo:** `app/(app)/planificacion/planes/page.tsx`

**Estructura UI (estilo ALPHA con grid de Cards):**

```tsx
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
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";

import { useTrainingPlans } from "@/hooks/use-training-plans";

export default function PlanesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { plans, loading, deletePlan, duplicatePlan } = useTrainingPlans();

  const filteredPlans = plans.filter((plan) =>
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Biblioteca de Planes</h1>
          <Link href="/planificacion/planificador">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Plan
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar planes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>
      </div>

      {/* Grid de planes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500">Cargando planes...</div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 mb-2">
            {searchQuery
              ? "No se encontraron planes"
              : "No hay planes guardados"}
          </p>
          <p className="text-sm text-zinc-500">
            {searchQuery
              ? "Intenta con otros términos"
              : "Crea planes desde el Planificador"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlans.map((plan) => (
            <Card
              key={plan.id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {plan.total_days} días · {plan.total_weeks} semanas
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-zinc-900 border-zinc-800"
                    >
                      <DropdownMenuItem className="text-white hover:bg-zinc-800">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-zinc-800">
                        <UserPlus className="mr-2 h-4 w-4" /> Asignar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-white hover:bg-zinc-800"
                        onClick={() => duplicatePlan(plan.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-zinc-800">
                        <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 hover:bg-red-500/10"
                        onClick={() => deletePlan(plan.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {plan.start_date} - {plan.end_date}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-zinc-700 text-zinc-400"
                  >
                    <Users className="mr-1 h-3 w-3" />
                    {plan.assignedCount} asignados
                  </Badge>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 2.3 Componentes Auxiliares

### Preview de Plan (Dialog)

**Archivo:** `components/planificacion/plan-preview.tsx`

Copiar la lógica de `professors-platform/src/features/library/PlanPreview.tsx`:

```typescript
// Query ORIGINAL para fetch de detalle:
const { data: planData, error } = await supabase
  .from("training_plans")
  .select(
    `
    *,
    training_plan_days (
      *,
      training_plan_exercises (*)
    ),
    training_plan_assignments (count)
  `,
  )
  .eq("id", planId)
  .single();
```

### Modal Asignar Plan

**Archivo:** `components/planificacion/assign-plan-modal.tsx`

Copiar la lógica de `professors-platform/src/components/AssignPlanModal.tsx`:

- Validación de conflictos de fechas
- Selección múltiple de estudiantes
- Payload de asignación

---

# 🗓️ FASE 3: Planificador (Editor de Planes)

## Objetivo

Implementar el editor completo de planes en `app/(app)/planificacion/planificador/page.tsx`

---

## 3.1 Hook de Etapas

**Archivo:** `hooks/use-exercise-stages.ts`

**Query ORIGINAL:**

```typescript
// FETCH:
const { data, error } = await supabase
  .from("exercise_stages")
  .select("id, name, color")
  .order("name");

// INSERT:
await supabase.from("exercise_stages").insert({ name, color });
```

---

## 3.2 Página del Planificador

**Archivo:** `app/(app)/planificacion/planificador/page.tsx`

**IMPORTANTE:** Esta es la página más compleja. Copiar la lógica COMPLETA de `professors-platform/src/features/plans/NewPlan.tsx`:

### Estados a preservar:

- `exercises: PlanExercise[]`
- `days: Day[]`
- `activeDay: string`
- `startDate, endDate: Date`
- `planTitle: string`
- `savedPlanId: string | null`

### Funcionalidades clave:

1. **LocalStorage draft** - Auto-guardado en localStorage
2. **Tabs de días** - Agregar/eliminar días (máx 7)
3. **Tabla de ejercicios** - Edición inline
4. **Drag & drop** - Reordenar ejercicios (usar `@dnd-kit/core`)
5. **Selección de ejercicios** - Autocomplete desde base de ejercicios
6. **Guardar en biblioteca** - Modal con validaciones
7. **Asignar a alumnos** - Modal de asignación

### UI Estilo ALPHA:

```tsx
// Header con breadcrumb y acciones
<header className="bg-zinc-900 border-b border-zinc-800 p-6">
  <div className="flex justify-between items-start">
    <div>
      <Input
        value={planTitle}
        onChange={(e) => setPlanTitle(e.target.value)}
        className="text-2xl font-bold bg-transparent border-none p-0 focus-visible:ring-0"
        placeholder="Nombre del plan..."
      />
    </div>
    <div className="flex gap-3">
      <Button variant="outline" className="border-zinc-700">
        Guardar en Biblioteca
      </Button>
      <Button className="bg-orange-600 hover:bg-orange-700">
        Asignar a Alumno
      </Button>
    </div>
  </div>

  {/* Date pickers */}
  <div className="flex gap-4 mt-4">
    <DatePicker label="Desde" value={startDate} onChange={setStartDate} />
    <DatePicker label="Hasta" value={endDate} onChange={setEndDate} />
  </div>

  {/* Day tabs */}
  <div className="flex gap-1 mt-4 overflow-x-auto">
    {days.map((day) => (
      <Button
        key={day.id}
        variant={activeDay === day.id ? "default" : "ghost"}
        className={activeDay === day.id ? "bg-orange-600" : "text-zinc-400"}
        onClick={() => setActiveDay(day.id)}
      >
        {day.name}
      </Button>
    ))}
    <Button variant="ghost" onClick={handleAddDay} disabled={days.length >= 7}>
      + Agregar Día
    </Button>
  </div>
</header>;

{
  /* Tabla de ejercicios con drag & drop */
}
<main className="p-6">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Etapa</TableHead>
        <TableHead>#</TableHead>
        <TableHead>Ejercicio</TableHead>
        <TableHead>Video</TableHead>
        <TableHead>Series</TableHead>
        <TableHead>Reps</TableHead>
        <TableHead>Carga</TableHead>
        <TableHead>Pausa</TableHead>
        <TableHead>Peso?</TableHead>
        <TableHead>Notas</TableHead>
        <TableHead></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>{/* SortableContext con dnd-kit */}</TableBody>
  </Table>
</main>;
```

---

## 3.3 Fila de Ejercicio Sortable

**Archivo:** `components/planificacion/plan-editor/sortable-exercise-row.tsx`

Copiar la lógica de `professors-platform/src/features/plans/SortableExerciseRow.tsx`:

- Usar `@dnd-kit/sortable`
- Inputs editables inline
- Select de etapa con color
- Autocomplete de ejercicio desde base de datos

---

# ✅ CHECKLIST DE VERIFICACIÓN

## Fase 0

- [ ] Cliente Supabase funcional
- [ ] Tipos definidos correctamente
- [ ] Store Zustand configurado

## Fase 1 - Base de Ejercicios

- [ ] Listar ejercicios con categorías
- [ ] Crear ejercicio (payload idéntico)
- [ ] Editar ejercicio (payload idéntico)
- [ ] Eliminar ejercicio
- [ ] Filtrar por categoría
- [ ] Buscar por nombre
- [ ] Gestionar categorías

## Fase 2 - Biblioteca de Planes

- [ ] Listar planes en grid
- [ ] Ver preview de plan
- [ ] Duplicar plan
- [ ] Eliminar plan (soft delete)
- [ ] Asignar plan a estudiantes
- [ ] Ver estudiantes asignados
- [ ] Exportar PDF (opcional)

## Fase 3 - Planificador

- [ ] Crear nuevo plan
- [ ] Editar plan existente
- [ ] Agregar/eliminar días
- [ ] Agregar/editar/eliminar ejercicios
- [ ] Drag & drop para reordenar
- [ ] Seleccionar ejercicio de la base
- [ ] Auto-guardado en localStorage
- [ ] Guardar en biblioteca
- [ ] Asignar durante creación

---

# 🔗 REFERENCIAS

## Archivos Originales (StabilitySistema)

- `professors-platform/src/features/library/ExerciseList.tsx` - CRUD ejercicios
- `professors-platform/src/features/library/RoutineList.tsx` - Lista de planes
- `professors-platform/src/features/library/PlanPreview.tsx` - Preview
- `professors-platform/src/features/plans/NewPlan.tsx` - Editor completo
- `professors-platform/src/hooks/useTrainingPlans.ts` - Lógica de planes
- `professors-platform/src/store/dataCacheStore.ts` - Cache global
- `professors-platform/src/components/AssignPlanModal.tsx` - Modal asignar

## Tablas Supabase

| Tabla                       | Descripción                          |
| --------------------------- | ------------------------------------ |
| `exercises`                 | Base de ejercicios                   |
| `exercise_categories`       | Categorías de ejercicios             |
| `exercise_stages`           | Etapas (Activación, Principal, etc.) |
| `training_plans`            | Planes de entrenamiento              |
| `training_plan_days`        | Días de cada plan                    |
| `training_plan_exercises`   | Ejercicios por día                   |
| `training_plan_assignments` | Asignaciones a estudiantes           |
