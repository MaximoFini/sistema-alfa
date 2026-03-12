import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PlanPDFData } from "@/components/PlanPDFTemplate";

interface UseExportPlanPDFReturn {
  templateRef: React.RefObject<HTMLDivElement | null>;
  pdfData: PlanPDFData | null;
  isExporting: boolean;
  exportPDF: (planId: string) => Promise<void>;
}

export function useExportPlanPDF(): UseExportPlanPDFReturn {
  const templateRef = useRef<HTMLDivElement | null>(null);
  const [pdfData, setPdfData] = useState<PlanPDFData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const sanitizeFileName = (name: string): string => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/[^a-zA-Z0-9_\- ]/g, "") // solo alfanumérico, guiones y espacios
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 80);
  };

  const exportPDF = useCallback(async (planId: string) => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      // 1. Fetch en paralelo: plan + días + ejercicios
      const [planResult, daysResult] = await Promise.all([
        supabase
          .from("training_plans")
          .select("*")
          .eq("id", planId)
          .single(),
        supabase
          .from("training_plan_days")
          .select(`
            id,
            day_number,
            day_name,
            display_order,
            training_plan_exercises (
              id,
              exercise_name,
              stage_name,
              series,
              reps,
              carga,
              pause,
              notes,
              display_order
            )
          `)
          .eq("plan_id", planId)
          .order("display_order", { ascending: true }),
      ]);

      if (planResult.error) throw planResult.error;
      if (daysResult.error) throw daysResult.error;

      const plan = planResult.data;
      const rawDays = daysResult.data ?? [];

      // 2. Normalizar estructura de días con sus ejercicios ordenados
      const days: PlanPDFData["days"] = rawDays.map((day) => ({
        id: day.id,
        day_number: day.day_number,
        day_name: day.day_name,
        exercises: (
          (day.training_plan_exercises as any[]) ?? []
        )
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((ex: any) => ({
            id: ex.id,
            exercise_name: ex.exercise_name,
            stage_name: ex.stage_name,
            series: ex.series,
            reps: ex.reps,
            carga: ex.carga,
            pause: ex.pause,
            notes: ex.notes,
          })),
      }));

      // 3. Inyectar datos al template
      const data: PlanPDFData = {
        title: plan.title,
        description: plan.description,
        start_date: plan.start_date,
        end_date: plan.end_date,
        total_days: plan.total_days,
        total_weeks: plan.total_weeks,
        days_per_week: plan.days_per_week,
        plan_type: plan.plan_type,
        is_template: plan.is_template,
        created_at: plan.created_at,
        days,
      };

      setPdfData(data);

      // 4. Esperar un frame + 150ms para que React termine de renderizar
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 150);
        });
      });

      const element = templateRef.current;
      if (!element) throw new Error("Template ref no disponible");

      // 5. Capturar con html2canvas
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      // 6. Generar PDF con jsPDF (A4)
      const { jsPDF } = await import("jspdf");

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pageWidth = 210; // mm A4
      const pageHeight = 297; // mm A4
      const pxToMm = pageWidth / canvas.width;
      const contentHeightMm = canvas.height * pxToMm;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Si el contenido es más alto que una página, paginar
      if (contentHeightMm <= pageHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, contentHeightMm);
      } else {
        let yOffset = 0;
        while (yOffset < contentHeightMm) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, -yOffset, pageWidth, contentHeightMm);
          yOffset += pageHeight;
        }
      }

      const fileName = `Plan_${sanitizeFileName(data.title)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      // 7. Limpiar estado siempre, haya faltado o no
      setPdfData(null);
      setIsExporting(false);
    }
  }, [isExporting]);

  return {
    templateRef,
    pdfData,
    isExporting,
    exportPDF,
  };
}
