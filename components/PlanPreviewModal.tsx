"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PlayCircle, Check, Download, Pencil, Loader2, X, Dumbbell, AlertCircle } from "lucide-react";

interface Exercise {
  id: string;
  stage_name: string | null;
  exercise_name: string;
  video_url: string | null;
  series: number;
  reps: string;
  carga: string;
  pause: string;
  notes: string | null;
  write_weight: boolean;
  display_order: number;
}

interface Day {
  id: string;
  day_number: number;
  day_name: string;
  display_order: number;
  training_plan_exercises: Exercise[];
}

interface PlanDetails {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
  days_per_week: number;
  training_plan_days: Day[];
}

interface PlanPreviewModalProps {
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (planId: string) => void;
  onDownload: (planId: string) => void;
}

export function PlanPreviewModal({ planId, isOpen, onClose, onEdit, onDownload }: PlanPreviewModalProps) {
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlanDetails(planId);
      setActiveDayIndex(0);
    } else {
      setPlan(null);
      setError(null);
    }
  }, [isOpen, planId]);

  const fetchPlanDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("training_plans")
        .select(`
          id, title, start_date, end_date, total_weeks, days_per_week,
          training_plan_days (
            id, day_number, day_name, display_order,
            training_plan_exercises (
              id, stage_name, exercise_name, video_url, series, reps, carga, pause, notes, write_weight, display_order
            )
          )
        `)
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Sort days
        data.training_plan_days.sort((a, b) => a.display_order - b.display_order);
        // Sort exercises per day
        data.training_plan_days.forEach(day => {
          day.training_plan_exercises.sort((a, b) => a.display_order - b.display_order);
        });
        setPlan(data as unknown as PlanDetails);
      } else {
        setError("No se encontro el plan");
      }
    } catch (err) {
      console.error("Error fetching plan details:", err);
      setError("No se pudo cargar el plan");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!planId) return;
    setIsExporting(true);
    try {
      await onDownload(planId);
      // Let's assume onDownload is synchronous or we don't await the actual pdf generation inside this component.
      // Usually exportPDF sets its own state, so we just add a small delay to show feedback if needed.
      setTimeout(() => setIsExporting(false), 2000); 
    } catch (e) {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Añadimos [&>button]:hidden para ocultar la cruz por defecto de DialogContent ya que usamos la nuestra */}
      <DialogContent 
        className="max-w-[95vw] lg:max-w-[1200px] w-full p-0 overflow-hidden bg-white shadow-2xl rounded-2xl flex flex-col border-0 [&>button]:hidden" 
        style={{ maxHeight: '90vh' }}
        aria-describedby={undefined}
      >
        <div id="dialog-title" className="sr-only">Previsualización del plan</div>
        
        {loading ? (
          <div className="flex-1 min-h-[400px] flex items-center justify-center p-8 bg-white">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4 mx-auto" />
              <p className="text-slate-600">Cargando plan...</p>
            </div>
          </div>
        ) : error || !plan ? (
          <div className="flex-1 min-h-[400px] flex items-center justify-center p-8 bg-white">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mb-4 mx-auto" />
              <p className="text-slate-600 mb-6">{error || "No se pudo cargar el plan"}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#0369a1] text-white rounded-lg hover:bg-[#0369a1]/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {plan.title}
                </h2>
                <p className="text-sm text-slate-500">
                  {format(new Date(plan.start_date), "d MMM", { locale: es })} - {format(new Date(plan.end_date), "d MMM", { locale: es })} · {plan.total_weeks} semanas · {plan.days_per_week} días/sem
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 px-6 pt-4 border-b border-slate-200 overflow-x-auto">
              {plan.training_plan_days.map((day, index: number) => (
                <button
                  key={day.id}
                  onClick={() => setActiveDayIndex(index)}
                  className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    activeDayIndex === index
                      ? "bg-[#0369a1] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {day.day_name || `Día ${day.day_number}`}
                </button>
              ))}
            </div>

            {/* Exercise Table */}
            <div className="flex-1 overflow-auto p-6 bg-white min-h-[300px]">
              {plan.training_plan_days[activeDayIndex]?.training_plan_exercises.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No hay ejercicios en este día</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Etapa</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ejercicio</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Video</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Series</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reps</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Carga</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pausa</th>
                        <th className="text-center py-3 px-1 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-normal w-24 leading-tight">Peso requerido</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.training_plan_days[activeDayIndex]?.training_plan_exercises.map((exercise, index: number) => (
                        <tr
                          key={exercise.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-[11px] font-semibold tracking-wide border border-blue-100/60">
                              {exercise.stage_name || "SIN ETAPA"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-sm font-medium text-slate-700">
                            {index + 1}
                          </td>
                          <td className="py-4 px-4 text-sm font-bold text-slate-800">
                            {exercise.exercise_name}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {exercise.video_url ? (
                              <a
                                href={exercise.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center hover:bg-red-50 text-red-500 rounded-full transition-colors w-8 h-8"
                              >
                                <PlayCircle className="w-5 h-5" />
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center text-sm font-medium text-slate-700">{exercise.series}</td>
                          <td className="py-4 px-4 text-center text-sm font-medium text-slate-700">{exercise.reps}</td>
                          <td className="py-4 px-4 text-center text-sm font-medium text-slate-700">{exercise.carga || "-"}</td>
                          <td className="py-4 px-4 text-center text-sm font-medium text-slate-700">{exercise.pause}</td>
                          <td className="py-4 px-4 text-center">
                            {exercise.write_weight ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100">
                                <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                              </span>
                            ) : (
                              <span className="text-slate-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-500 max-w-xs whitespace-normal break-words">
                            {exercise.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm shadow-sm"
              >
                Cerrar
              </button>
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="px-6 py-2.5 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Descargar PDF
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (planId) onEdit(planId);
                }}
                className="px-6 py-2.5 bg-[#0369a1] text-white rounded-lg hover:bg-[#0284c7] transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm"
              >
                <Pencil className="w-4 h-4" />
                Editar Plan
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
