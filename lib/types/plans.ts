// Tipos de planes de entrenamiento - Migrado desde StabilitySistema
// ⚠️ ESTOS TIPOS DEBEN MANTENERSE IDÉNTICOS AL CÓDIGO ORIGINAL

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

export interface TrainingPlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  day_name: string;
  display_order: number;
}

export interface TrainingPlan extends TrainingPlanSummary {
  days?: TrainingPlanDay[];
  exercises?: PlanExercise[];
}
