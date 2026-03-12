import React from "react";

export interface PlanPDFData {
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  total_weeks: number;
  days_per_week: number;
  plan_type?: string | null;
  is_template?: boolean;
  created_at?: string | null;
  days: Array<{
    id: string;
    day_number: number;
    day_name: string;
    exercises: Array<{
      id: string;
      exercise_name: string;
      stage_name: string | null;
      series: number;
      reps: string;
      carga: string;
      pause: string;
      notes: string | null;
    }>;
  }>;
}

interface PlanPDFTemplateProps {
  data: PlanPDFData | null;
}

const PlanPDFTemplate = React.forwardRef<HTMLDivElement, PlanPDFTemplateProps>(
  ({ data }, ref) => {
    if (!data) return null;

    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const createdDate = data.created_at
      ? new Date(data.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

    // Agrupar ejercicios por etapa dentro de cada día
    const groupByStage = (
      exercises: PlanPDFData["days"][0]["exercises"],
    ) => {
      const groups: Record<string, typeof exercises> = {};
      exercises.forEach((ex) => {
        const key = ex.stage_name || "SIN ETAPA";
        if (!groups[key]) groups[key] = [];
        groups[key].push(ex);
      });
      return Object.entries(groups);
    };

    return (
      /* Contenedor posicionado fuera del viewport */
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <div
          ref={ref}
          style={{
            width: "794px",
            backgroundColor: "#ffffff",
            fontFamily:
              "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            color: "#111827",
          }}
        >
          {/* HEADER con gradiente naranja */}
          <div
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              padding: "40px 48px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {/* Logo */}
                <img
                  src="/Mejor logo.png"
                  alt="Alfa Club"
                  crossOrigin="anonymous"
                  style={{ height: "44px", width: "auto" }}
                />
              </div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#ffffff",
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: "-0.5px",
                }}
              >
                {data.title}
              </h1>
              {data.description && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.85)",
                    margin: "8px 0 0",
                    lineHeight: 1.5,
                    maxWidth: "460px",
                  }}
                >
                  {data.description}
                </p>
              )}
            </div>

            {/* Tipo/Badge */}
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: "12px",
                padding: "12px 20px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.8)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "600",
                }}
              >
                TIPO
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#ffffff",
                  marginTop: "4px",
                }}
              >
                {data.is_template ? "Plantilla" : "Plan Personalizado"}
              </div>
            </div>
          </div>

          {/* TARJETAS INFORMATIVAS */}
          <div
            style={{
              display: "flex",
              gap: "0",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            {[
              { label: "DURACIÓN", value: `${data.total_weeks} semanas` },
              { label: "DÍAS TOTALES", value: `${data.total_days} días` },
              { label: "INICIO", value: formatDate(data.start_date) },
              { label: "FIN", value: formatDate(data.end_date) },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  padding: "20px 24px",
                  borderRight: idx < 3 ? "1px solid #f3f4f6" : "none",
                  backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "#f97316",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: "6px",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#111827",
                    lineHeight: 1.2,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* WATERMARK / Fecha de creación */}
          <div
            style={{
              backgroundColor: "#fff7ed",
              borderLeft: "3px solid #f97316",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{ fontSize: "11px", color: "#9a3412", fontWeight: "500" }}
            >
              📅 Generado el {createdDate} · Sistema Alfa — Alfa Club
            </span>
          </div>

          {/* CONTENIDO PRINCIPAL — Días y ejercicios */}
          <div style={{ padding: "32px 48px" }}>
            {data.days.map((day, dayIdx) => (
              <div
                key={day.id}
                style={{ marginBottom: dayIdx < data.days.length - 1 ? "32px" : "0" }}
              >
                {/* Header del día */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#fff7ed",
                      border: "2px solid #fed7aa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "#ea580c",
                      flexShrink: 0,
                    }}
                  >
                    {day.day_number}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {day.day_name || `Día ${day.day_number}`}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        marginTop: "1px",
                      }}
                    >
                      {day.exercises.length} ejercicio
                      {day.exercises.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Ejercicios por etapa */}
                {day.exercises.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      padding: "16px",
                      fontSize: "13px",
                      color: "#9ca3af",
                      textAlign: "center",
                      border: "1px dashed #e5e7eb",
                    }}
                  >
                    Sin ejercicios asignados
                  </div>
                ) : (
                  groupByStage(day.exercises).map(([stageName, exercises]) => (
                    <div key={stageName} style={{ marginBottom: "12px" }}>
                      {/* Badge de etapa */}
                      {stageName !== "SIN ETAPA" && (
                        <div
                          style={{
                            display: "inline-block",
                            backgroundColor: "#f97316",
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                            padding: "3px 10px",
                            borderRadius: "100px",
                            marginBottom: "8px",
                          }}
                        >
                          {stageName}
                        </div>
                      )}

                      {/* Tabla de ejercicios */}
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "12px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#f9fafb",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {[
                              { label: "EJERCICIO", width: "35%" },
                              { label: "SERIES", width: "10%" },
                              { label: "REPS", width: "15%" },
                              { label: "CARGA", width: "13%" },
                              { label: "PAUSA", width: "12%" },
                              { label: "NOTAS", width: "15%" },
                            ].map((col) => (
                              <th
                                key={col.label}
                                style={{
                                  padding: "8px 10px",
                                  textAlign: "left",
                                  fontSize: "9px",
                                  fontWeight: "700",
                                  color: "#6b7280",
                                  letterSpacing: "0.5px",
                                  width: col.width,
                                }}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {exercises.map((ex, exIdx) => (
                            <tr
                              key={ex.id}
                              style={{
                                backgroundColor:
                                  exIdx % 2 === 0 ? "#ffffff" : "#fafafa",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              <td
                                style={{
                                  padding: "9px 10px",
                                  fontWeight: "600",
                                  color: "#111827",
                                  fontSize: "12px",
                                }}
                              >
                                {ex.exercise_name}
                              </td>
                              <td
                                style={{
                                  padding: "9px 10px",
                                  color: "#374151",
                                  textAlign: "center",
                                  fontWeight: "600",
                                }}
                              >
                                {ex.series}
                              </td>
                              <td
                                style={{
                                  padding: "9px 10px",
                                  color: "#374151",
                                  textAlign: "center",
                                }}
                              >
                                {ex.reps}
                              </td>
                              <td
                                style={{
                                  padding: "9px 10px",
                                  color: "#374151",
                                  textAlign: "center",
                                }}
                              >
                                {ex.carga || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "9px 10px",
                                  color: "#374151",
                                  textAlign: "center",
                                }}
                              >
                                {ex.pause}
                              </td>
                              <td
                                style={{
                                  padding: "9px 10px",
                                  color: "#6b7280",
                                  fontSize: "11px",
                                }}
                              >
                                {ex.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div
            style={{
              borderTop: "1px solid #f3f4f6",
              padding: "18px 48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#fafafa",
            }}
          >
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>
              © {new Date().getFullYear()} Alfa Club · Sistema de Gestión
            </span>
            <span style={{ fontSize: "11px", color: "#d1d5db" }}>
              Documento generado con Sistema Alfa
            </span>
          </div>
        </div>
      </div>
    );
  },
);

PlanPDFTemplate.displayName = "PlanPDFTemplate";

export default PlanPDFTemplate;
