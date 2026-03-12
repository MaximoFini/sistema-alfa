// Tipos de ejercicios - Migrado desde StabilitySistema
// ⚠️ ESTOS TIPOS DEBEN MANTENERSE IDÉNTICOS AL CÓDIGO ORIGINAL

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

export interface ExerciseStage {
  id: string;
  name: string;
  color: string;
}
