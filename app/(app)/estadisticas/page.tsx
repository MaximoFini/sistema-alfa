"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAdminSettingsStore } from "@/hooks/use-admin-settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Mock data ─────────────────────────────────────────────────────────────────

const HORAS_FRANJA = Array.from({ length: 16 }, (_, i) => i + 7); // 07..22

// ── Subcomponentes ─────────────────────────────────────────────────────────────

// ── Historial de alumnos activos ─────────────────────────────────────────────

type SnapRow = { year: number; month: number; alumnos_activos: number };

const MESES_ABREV = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function HistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<SnapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("estadisticas_mensuales")
        .select("year, month, alumnos_activos")
        .order("year", { ascending: false })
        .order("month")
        .then(({ data: rows }) => {
          setData(rows ?? []);
          setLoading(false);
        });
    });
  }, [open]);

  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);
  const hoyYear = new Date().getFullYear();
  const hoyMonth = new Date().getMonth() + 1;

  const allValues = data.map((r) => r.alumnos_activos);
  const maxVal = allValues.length ? Math.max(...allValues) : 1;
  const minVal = allValues.length ? Math.min(...allValues) : 0;

  const currentYearData = data.filter((r) => r.year === hoyYear);
  const lastYearSameMonths = data.filter(
    (r) =>
      r.year === hoyYear - 1 &&
      currentYearData.some((c) => c.month === r.month),
  );
  const currentAvg = currentYearData.length
    ? Math.round(
        currentYearData.reduce((s, r) => s + r.alumnos_activos, 0) /
          currentYearData.length,
      )
    : null;
  const lastAvg = lastYearSameMonths.length
    ? Math.round(
        lastYearSameMonths.reduce((s, r) => s + r.alumnos_activos, 0) /
          lastYearSameMonths.length,
      )
    : null;
  const growthPct =
    currentAvg !== null && lastAvg !== null && lastAvg > 0
      ? Math.round(((currentAvg - lastAvg) / lastAvg) * 100)
      : null;
  const bestSnap = data.reduce<SnapRow | null>(
    (best, r) => (!best || r.alumnos_activos > best.alumnos_activos ? r : best),
    null,
  );

  const YEAR_COLORS = ["#DC2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

  const chartData = MESES_ABREV.map((mes, i) => {
    const point: Record<string, number | string> = { mes };
    for (const y of years) {
      const found = data.find((r) => r.year === y && r.month === i + 1);
      if (found) point[String(y)] = found.alumnos_activos;
    }
    return point;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Historial — Alumnos Activos
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-400 mt-1">
                {years.length
                  ? `Evolución mensual desde ${Math.min(...years)} hasta ${Math.max(...years)}`
                  : "Sin datos"}
              </p>
            </div>
          </div>

          {/* KPI row */}
          {!loading && data.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Promedio {hoyYear}
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {currentAvg ?? "—"}
                </span>
                {growthPct !== null && (
                  <span
                    className="text-sm font-semibold mt-1"
                    style={{ color: growthPct >= 0 ? "#16a34a" : "#DC2626" }}
                  >
                    {growthPct >= 0 ? "▲" : "▼"} {Math.abs(growthPct)}% vs{" "}
                    {hoyYear - 1}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Máximo histórico
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {bestSnap?.alumnos_activos ?? "—"}
                </span>
                {bestSnap && (
                  <span className="text-sm text-gray-400 mt-1">
                    {MESES_ABREV[bestSnap.month - 1]} {bestSnap.year}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Años registrados
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {years.length}
                </span>
                {years.length > 0 && (
                  <span className="text-sm text-gray-400 mt-1">
                    {Math.min(...years)} – {Math.max(...years)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-8 py-5 flex-1 overflow-y-auto flex flex-col">
          {/* Toggle */}
          <div className="flex gap-2 mb-5 shrink-0">
            {(["tabla", "grafico"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                  vista === v
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {v === "tabla" ? "Tabla" : "Gráfico"}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center flex-1 text-gray-300 text-base">
              Cargando...
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-base">
              No hay datos de historial todavía.
            </div>
          )}

          {/* ── Heatmap tabla ── */}
          {!loading && data.length > 0 && vista === "tabla" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-end gap-2 mb-4">
                <span className="text-xs text-gray-400">Menos</span>
                {[0.08, 0.25, 0.45, 0.65, 0.85].map((t) => (
                  <div
                    key={t}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `rgba(220,38,38,${t})` }}
                  />
                ))}
                <span className="text-xs text-gray-400">Más</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-6 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">
                      Año
                    </th>
                    {MESES_ABREV.map((m) => (
                      <th
                        key={m}
                        className="text-center pb-3 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                      >
                        {m}
                      </th>
                    ))}
                    <th className="text-right pb-3 pl-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Prom.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => {
                    const rowData = data.filter((r) => r.year === y);
                    const rowAvg = rowData.length
                      ? Math.round(
                          rowData.reduce((s, r) => s + r.alumnos_activos, 0) /
                            rowData.length,
                        )
                      : null;
                    return (
                      <tr key={y}>
                        <td className="py-1.5 pr-6">
                          <span
                            className="text-base font-bold"
                            style={{
                              color: y === hoyYear ? "#DC2626" : "#9ca3af",
                            }}
                          >
                            {y}
                          </span>
                        </td>
                        {MESES_ABREV.map((_, i) => {
                          const snap = data.find(
                            (r) => r.year === y && r.month === i + 1,
                          );
                          const isCurrent = y === hoyYear && i + 1 === hoyMonth;
                          const t =
                            snap && maxVal > minVal
                              ? (snap.alumnos_activos - minVal) /
                                (maxVal - minVal)
                              : snap
                                ? 0.5
                                : null;
                          return (
                            <td key={i} className="px-1 py-1.5">
                              <div
                                className="rounded-lg flex items-center justify-center text-sm font-bold"
                                style={{
                                  height: 44,
                                  ...(t !== null
                                    ? {
                                        backgroundColor: isCurrent
                                          ? "#DC2626"
                                          : `rgba(220,38,38,${0.06 + t * 0.58})`,
                                        color: isCurrent
                                          ? "#fff"
                                          : t > 0.55
                                            ? "#fff"
                                            : "#374151",
                                        boxShadow: isCurrent
                                          ? "0 0 0 2px #DC2626"
                                          : "none",
                                      }
                                    : {
                                        backgroundColor: "#f9fafb",
                                        color: "#d1d5db",
                                      }),
                                }}
                              >
                                {snap ? snap.alumnos_activos : "—"}
                              </div>
                            </td>
                          );
                        })}
                        <td className="pl-5 py-1.5 text-right">
                          <span className="text-sm font-bold text-gray-400">
                            {rowAvg ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Gráfico ── */}
          {!loading && data.length > 0 && vista === "grafico" && (
            <div className="flex-1 flex flex-col">
              <div className="flex flex-wrap gap-5 mb-5">
                {years.map((y, idx) => (
                  <div key={y} className="flex items-center gap-2.5">
                    <div
                      className="w-8 rounded-full"
                      style={{
                        backgroundColor: YEAR_COLORS[idx % YEAR_COLORS.length],
                        height: y === hoyYear ? 4 : 2,
                        opacity: y === hoyYear ? 1 : 0.6,
                      }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: y === hoyYear ? YEAR_COLORS[0] : "#9ca3af",
                      }}
                    >
                      {y}
                      {y === hoyYear ? " (actual)" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f5f5f5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 13, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                      fontSize: 14,
                    }}
                  />
                  {years.map((y, idx) => (
                    <Line
                      key={y}
                      type="monotone"
                      dataKey={String(y)}
                      stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
                      strokeWidth={y === hoyYear ? 3 : 1.5}
                      strokeOpacity={y === hoyYear ? 1 : 0.5}
                      dot={
                        y === hoyYear
                          ? {
                              r: 4,
                              fill: YEAR_COLORS[0],
                              strokeWidth: 0,
                            }
                          : false
                      }
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal historial de retención (todos los años) ─────────────────────────────

type RetencionRow = {
  year: number;
  month: number;
  tasa_retencion: number | null;
  tasa_churn: number | null;
};

function RetencionHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<RetencionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"grafico" | "tabla">("grafico");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("estadisticas_mensuales")
        .select("year, month, tasa_retencion, tasa_churn")
        .not("tasa_retencion", "is", null)
        .order("year",  { ascending: true })
        .order("month", { ascending: true })
        .then(({ data: rows }) => {
          setData((rows ?? []) as RetencionRow[]);
          setLoading(false);
        });
    });
  }, [open]);

  const hoyYear = new Date().getFullYear();
  const hoyMonth = new Date().getMonth() + 1;
  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);
  const YEAR_COLORS = ["#DC2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

  const chartData = MESES_ABREV.map((mes, i) => {
    const point: Record<string, number | string> = { mes };
    for (const y of years) {
      const found = data.find((r) => r.year === y && r.month === i + 1);
      if (found?.tasa_retencion != null) point[String(y)] = found.tasa_retencion;
    }
    return point;
  });

  const currentYearRows = data.filter((r) => r.year === hoyYear && r.tasa_retencion != null);
  const avgRet = currentYearRows.length
    ? Math.round(currentYearRows.reduce((s, r) => s + (r.tasa_retencion ?? 0), 0) / currentYearRows.length)
    : null;
  const bestSnap = currentYearRows.reduce<RetencionRow | null>(
    (b, r) => (!b || (r.tasa_retencion ?? 0) > (b.tasa_retencion ?? 0) ? r : b),
    null,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[98vw] max-w-[98vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Historial — Tasa de Retención
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-400 mt-1">
            {years.length
              ? `Datos mensuales desde ${Math.min(...years)} hasta ${Math.max(...years)}`
              : "Sin datos"}
          </p>
          {!loading && data.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Promedio {hoyYear}
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {avgRet !== null ? `${avgRet}%` : "—"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Mejor mes {hoyYear}
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {bestSnap ? `${bestSnap.tasa_retencion}%` : "—"}
                </span>
                {bestSnap && (
                  <span className="text-sm text-gray-400 mt-1">
                    {MESES_ABREV[bestSnap.month - 1]} {bestSnap.year}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Años con datos
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {years.length}
                </span>
                {years.length > 0 && (
                  <span className="text-sm text-gray-400 mt-1">
                    {Math.min(...years)} – {Math.max(...years)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 flex-1 overflow-y-auto flex flex-col">
          <div className="flex gap-2 mb-5 shrink-0">
            {(["grafico", "tabla"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                  vista === v ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {v === "grafico" ? "Gráfico" : "Tabla"}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center flex-1 text-gray-300 text-base">
              Cargando...
            </div>
          )}
          {!loading && data.length === 0 && (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-base">
              No hay datos históricos aún.
            </div>
          )}

          {/* Gráfico multi-año */}
          {!loading && data.length > 0 && vista === "grafico" && (
            <div className="flex-1 flex flex-col">
              <div className="flex flex-wrap gap-5 mb-5">
                {years.map((y, idx) => (
                  <div key={y} className="flex items-center gap-2.5">
                    <div
                      className="w-8 rounded-full"
                      style={{
                        backgroundColor: YEAR_COLORS[idx % YEAR_COLORS.length],
                        height: y === hoyYear ? 4 : 2,
                        opacity: y === hoyYear ? 1 : 0.6,
                      }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: y === hoyYear ? YEAR_COLORS[0] : "#9ca3af" }}
                    >
                      {y}{y === hoyYear ? " (actual)" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 13, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 13, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Retención"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #f0f0f0", fontSize: 14 }}
                  />
                  {years.map((y, idx) => (
                    <Line
                      key={y}
                      type="monotone"
                      dataKey={String(y)}
                      stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
                      strokeWidth={y === hoyYear ? 3 : 1.5}
                      strokeOpacity={y === hoyYear ? 1 : 0.5}
                      dot={y === hoyYear ? { r: 4, fill: YEAR_COLORS[0], strokeWidth: 0 } : false}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla heatmap */}
          {!loading && data.length > 0 && vista === "tabla" && (
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-6 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">
                      Año
                    </th>
                    {MESES_ABREV.map((m) => (
                      <th key={m} className="text-center pb-3 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y}>
                      <td className="py-1.5 pr-6">
                        <span className="text-base font-bold" style={{ color: y === hoyYear ? "#DC2626" : "#9ca3af" }}>
                          {y}
                        </span>
                      </td>
                      {MESES_ABREV.map((_, i) => {
                        const snap = data.find((r) => r.year === y && r.month === i + 1);
                        const isCurrent = y === hoyYear && i + 1 === hoyMonth;
                        const val = snap?.tasa_retencion;
                        const bgColor = val != null
                          ? val >= 80 ? "#16a34a" : val >= 60 ? "#d97706" : "#DC2626"
                          : null;
                        return (
                          <td key={i} className="px-1 py-1.5">
                            <div
                              className="rounded-lg flex items-center justify-center text-sm font-bold"
                              style={{
                                height: 44,
                                backgroundColor: val != null
                                  ? isCurrent ? bgColor! : `${bgColor}22`
                                  : "#f9fafb",
                                color: val != null
                                  ? isCurrent ? "#fff" : bgColor!
                                  : "#d1d5db",
                                boxShadow: isCurrent ? `0 0 0 2px ${bgColor}` : "none",
                              }}
                            >
                              {val != null ? `${val}%` : "—"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



// ── Modal historial de Top 5 asistencia ──────────────────────────────

function RankingHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [dataPorMes, setDataPorMes] = useState<Record<number, {pos: number, nombre: string, clases: number}[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);

  // Obtener años disponibles
  useEffect(() => {
    if (!open) return;
    import("@/lib/supabase").then(({ supabase }) => {
      const current = new Date().getFullYear();
      setAvailableYears([current, current - 1, current - 2]); // fallback simple
      supabase.from("estadisticas_mensuales").select("year").then(({data}) => {
         if (data) {
           const years = [...new Set(data.map(r => r.year))].sort((a,b) => b-a);
           if (years.length > 0) setAvailableYears(years);
         }
      });
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDataPorMes({});
    import("@/lib/supabase").then(({ supabase }) => {
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      supabase
        .from("asistencias")
        .select("fecha, alumno_id, alumnos!inner(nombre)")
        .gte("fecha", yearStart)
        .lte("fecha", yearEnd)
        .then(({ data: asistencias }) => {
          if (!asistencias) {
             setLoading(false);
             return;
          }
          
          // Agrupamos por mes
          const mesesArray = Array.from({length: 12}, () => new Map<string, {nombre: string, clases: number}>());
          
          for (const a of asistencias as any[]) {
             if (!a.fecha || !a.alumno_id) continue;
             const mStr = a.fecha.split("-")[1]; // "01" a "12"
             if (!mStr) continue;
             const mIdx = parseInt(mStr, 10) - 1;
             
             const mapMes = mesesArray[mIdx];
             const prev = mapMes.get(a.alumno_id);
             if (prev) {
                 prev.clases += 1;
             } else {
                 mapMes.set(a.alumno_id, {
                     nombre: a.alumnos?.nombre || "N/N",
                     clases: 1
                 });
             }
          }
          
          const nuevoData: Record<number, {pos: number, nombre: string, clases: number}[]> = {};
          
          mesesArray.forEach((mapMes, mIdx) => {
             const list = Array.from(mapMes.values())
               .sort((a, b) => b.clases - a.clases)
               .slice(0, 5)
               .map((item, i) => ({
                  pos: i + 1,
                  nombre: item.nombre,
                  clases: item.clases
               }));
             nuevoData[mIdx + 1] = list; // key es 1 a 12
          });
          
          setDataPorMes(nuevoData);
          setLoading(false);
        });
    });
  }, [open, selectedYear]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-100 shrink-0 flex items-start justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Historial — Ranking de Asistencia
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-400 mt-1">
                Los 5 alumnos con más clases tomadas en cada mes
              </p>
            </div>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              {availableYears.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    selectedYear === y ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
        </div>

        {/* Body */}
        <div className="px-8 py-5 flex-1 overflow-y-auto bg-gray-50/50">
          {loading ? (
             <div className="flex items-center justify-center h-full text-gray-400 text-base font-medium">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {MESES_ABREV.map((mesNombre, idx) => {
                 const monthNum = idx + 1;
                 const list = dataPorMes[monthNum] || [];
                 // Si estamos en un año vigente, ocultar meses futuros
                 if (selectedYear === new Date().getFullYear() && monthNum > new Date().getMonth() + 1) return null;
                 
                 return (
                   <div key={monthNum} className="border border-gray-200 shadow-sm rounded-xl p-5 bg-white flex flex-col">
                     <h3 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-widest">{mesNombre}</h3>
                     <div className="flex flex-col gap-3 flex-1">
                       {list.length === 0 ? (
                         <div className="text-sm text-gray-400 italic">Sin registros en este mes</div>
                       ) : (
                         list.map(item => {
                           const medalColors: Record<number, { bg: string; text: string; label: string }> = {
                             1: { bg: "#fffbeb", text: "#d97706", label: "🥇" },
                             2: { bg: "#f8fafc", text: "#64748b", label: "🥈" },
                             3: { bg: "#fff7ed", text: "#c2410c", label: "🥉" },
                           };
                           const medal = medalColors[item.pos];
                           return (
                             <div key={item.pos} className="flex items-center gap-3">
                               <div
                                  className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold"
                                  style={medal ? { backgroundColor: medal.bg, color: medal.text } : { backgroundColor: "#f3f4f6", color: "#6b7280" }}
                                >
                                  {medal ? medal.label : item.pos}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-700 truncate" title={item.nombre}>{item.nombre}</p>
                                </div>
                                <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded shadow-sm border border-gray-100">
                                  {item.clases}
                                </div>
                             </div>
                           )
                         })
                       )}
                     </div>
                   </div>
                 )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal historial de nuevos alumnos por mes ──────────────────────────────

function NuevosHistorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<{ year: number; month: number; nuevos_este_mes: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("estadisticas_mensuales")
        .select("year, month, nuevos_este_mes")
        .not("nuevos_este_mes", "is", null)
        .order("year", { ascending: false })
        .order("month")
        .then(({ data: rows }) => {
          setData((rows ?? []) as any);
          setLoading(false);
        });
    });
  }, [open]);

  const years = [...new Set(data.map((r) => r.year))].sort((a, b) => b - a);
  const hoyYear = new Date().getFullYear();
  const hoyMonth = new Date().getMonth() + 1;

  const allValues = data.map((r) => r.nuevos_este_mes);
  const maxVal = allValues.length ? Math.max(...allValues) : 1;
  const minVal = allValues.length ? Math.min(...allValues) : 0;

  const currentYearData = data.filter((r) => r.year === hoyYear);
  const lastYearSameMonths = data.filter(
    (r) =>
      r.year === hoyYear - 1 &&
      currentYearData.some((c) => c.month === r.month),
  );
  const currentTotal = currentYearData.reduce((s, r) => s + r.nuevos_este_mes, 0);
  const lastTotal = lastYearSameMonths.reduce((s, r) => s + r.nuevos_este_mes, 0);

  const currentAvg = currentYearData.length
    ? Math.round(currentTotal / currentYearData.length)
    : null;
  const lastAvg = lastYearSameMonths.length
    ? Math.round(lastTotal / lastYearSameMonths.length)
    : null;
  const growthPct =
    currentAvg !== null && lastAvg !== null && lastAvg > 0
      ? Math.round(((currentAvg - lastAvg) / lastAvg) * 100)
      : null;
  const bestSnap = data.reduce<{ year: number; month: number; nuevos_este_mes: number } | null>(
    (best, r) => (!best || r.nuevos_este_mes > best.nuevos_este_mes ? r : best),
    null,
  );

  const YEAR_COLORS = ["#DC2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

  const chartData = MESES_ABREV.map((mes, i) => {
    const point: Record<string, number | string> = { mes };
    for (const y of years) {
      const found = data.find((r) => r.year === y && r.month === i + 1);
      if (found) point[String(y)] = found.nuevos_este_mes;
    }
    return point;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Historial — Alumnos Nuevos por Mes
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-400 mt-1">
                {years.length
                  ? `Evolución mensual desde ${Math.min(...years)} hasta ${Math.max(...years)}`
                  : "Sin datos"}
              </p>
            </div>
          </div>

          {/* KPI row */}
          {!loading && data.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Promedio {hoyYear}
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {currentAvg ?? "—"}
                </span>
                {growthPct !== null && (
                  <span
                    className="text-sm font-semibold mt-1"
                    style={{ color: growthPct >= 0 ? "#16a34a" : "#DC2626" }}
                  >
                    {growthPct >= 0 ? "▲" : "▼"} {Math.abs(growthPct)}% vs{" "}
                    {hoyYear - 1}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Máximo histórico
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {bestSnap?.nuevos_este_mes ?? "—"}
                </span>
                {bestSnap && (
                  <span className="text-sm text-gray-400 mt-1">
                    {MESES_ABREV[bestSnap.month - 1]} {bestSnap.year}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Total {hoyYear}
                </span>
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {currentTotal > 0 ? currentTotal : "—"}
                </span>
                {years.length > 0 && (
                  <span className="text-sm text-gray-400 mt-1">
                    Acumulado en el año actual
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-8 py-5 flex-1 overflow-y-auto flex flex-col">
          {/* Toggle */}
          <div className="flex gap-2 mb-5 shrink-0">
            {(["tabla", "grafico"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors ${
                  vista === v
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {v === "tabla" ? "Tabla" : "Gráfico"}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center flex-1 text-gray-300 text-base">
              Cargando...
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-base">
              No hay datos de historial todavía.
            </div>
          )}

          {/* ── Heatmap tabla ── */}
          {!loading && data.length > 0 && vista === "tabla" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-end gap-2 mb-4">
                <span className="text-xs text-gray-400">Menos</span>
                {[0.08, 0.25, 0.45, 0.65, 0.85].map((t) => (
                  <div
                    key={t}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `rgba(220,38,38,${t})` }}
                  />
                ))}
                <span className="text-xs text-gray-400">Más</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-6 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">
                      Año
                    </th>
                    {MESES_ABREV.map((m) => (
                      <th
                        key={m}
                        className="text-center pb-3 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                      >
                        {m}
                      </th>
                    ))}
                    <th className="text-right pb-3 pl-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => {
                    const rowData = data.filter((r) => r.year === y);
                    const rowTotal = rowData.length
                      ? rowData.reduce((s, r) => s + r.nuevos_este_mes, 0)
                      : null;
                    return (
                      <tr key={y}>
                        <td className="py-1.5 pr-6">
                          <span
                            className="text-base font-bold"
                            style={{
                              color: y === hoyYear ? "#DC2626" : "#9ca3af",
                            }}
                          >
                            {y}
                          </span>
                        </td>
                        {MESES_ABREV.map((_, i) => {
                          const snap = data.find(
                            (r) => r.year === y && r.month === i + 1,
                          );
                          const isCurrent = y === hoyYear && i + 1 === hoyMonth;
                          const t =
                            snap && maxVal > minVal
                              ? (snap.nuevos_este_mes - minVal) /
                                (maxVal - minVal)
                              : snap
                                ? 0.5
                                : null;
                          return (
                            <td key={i} className="px-1 py-1.5">
                              <div
                                className="rounded-lg flex items-center justify-center text-sm font-bold"
                                style={{
                                  height: 44,
                                  ...(t !== null
                                    ? {
                                        backgroundColor: isCurrent
                                          ? "#DC2626"
                                          : `rgba(220,38,38,${0.06 + t * 0.58})`,
                                        color: isCurrent
                                          ? "#fff"
                                          : t > 0.55
                                            ? "#fff"
                                            : "#374151",
                                        boxShadow: isCurrent
                                          ? "0 0 0 2px #DC2626"
                                          : "none",
                                      }
                                    : {
                                        backgroundColor: "#f9fafb",
                                        color: "#d1d5db",
                                      }),
                                }}
                              >
                                {snap ? snap.nuevos_este_mes : "—"}
                              </div>
                            </td>
                          );
                        })}
                        <td className="pl-5 py-1.5 text-right">
                          <span className="text-sm font-bold text-gray-400">
                            {rowTotal ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Gráfico ── */}
          {!loading && data.length > 0 && vista === "grafico" && (
            <div className="flex-1 flex flex-col">
              <div className="flex flex-wrap gap-5 mb-5">
                {years.map((y, idx) => (
                  <div key={y} className="flex items-center gap-2.5">
                    <div
                      className="w-8 rounded-full"
                      style={{
                        backgroundColor: YEAR_COLORS[idx % YEAR_COLORS.length],
                        height: y === hoyYear ? 4 : 2,
                        opacity: y === hoyYear ? 1 : 0.6,
                      }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: y === hoyYear ? YEAR_COLORS[0] : "#9ca3af",
                      }}
                    >
                      {y}
                      {y === hoyYear ? " (actual)" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f5f5f5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 13, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                      fontSize: 14,
                    }}
                  />
                  {years.map((y, idx) => (
                    <Line
                      key={y}
                      type="monotone"
                      dataKey={String(y)}
                      stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
                      strokeWidth={y === hoyYear ? 3 : 1.5}
                      strokeOpacity={y === hoyYear ? 1 : 0.5}
                      dot={
                        y === hoyYear
                          ? {
                              r: 4,
                              fill: YEAR_COLORS[0],
                              strokeWidth: 0,
                            }
                          : false
                      }
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  note,
  onHistoryClick,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  accent?: string;
  note?: string;
  onHistoryClick?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {onHistoryClick && (
            <button
              onClick={onHistoryClick}
              title="Ver historial"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
            </button>
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: accent ? `${accent}18` : "#f3f4f6" }}
          >
            <span style={{ color: accent ?? "#6b7280" }}>{icon}</span>
          </div>
        </div>
      </div>
      <span className="text-3xl font-bold text-gray-900 leading-none">
        {value}
      </span>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
      {note && <p className="text-xs text-gray-400 leading-relaxed">{note}</p>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: string;
  color: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
        {label}
      </span>
      <span className="text-2xl font-bold leading-none" style={{ color }}>
        {value}
      </span>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcularEdadExacta(fechaNacimiento: string): number {
  const [y, m, d] = fechaNacimiento.split("-").map(Number);
  const hoy = new Date();
  let edad = hoy.getFullYear() - y;
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();
  if (mesActual < m || (mesActual === m && diaActual < d)) edad--;
  return edad;
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function EstadisticasPage() {
  const [mounted, setMounted] = useState(false);
  const { settings, fetchSettings } = useAdminSettingsStore();

  // Estadísticas reales
  const [alumnosActivos, setAlumnosActivos] = useState<number | null>(null);
  const [nuevosEsteMes, setNuevosEsteMes] = useState<number | null>(null);
  const [promedioEdad, setPromedioEdad] = useState<number | null>(null);
  const [tasaRetencion, setTasaRetencion] = useState<number | null>(null);
  const [tasaChurn, setTasaChurn] = useState<number | null>(null);
  const [alumnosEnRiesgo, setAlumnosEnRiesgo] = useState<number | null>(null);
  const [vidaUtilMeses, setVidaUtilMeses] = useState<number | null>(null);
  const [clientesInactivos, setClientesInactivos] = useState<number | null>(
    null,
  );
  const [clientesPerdidos, setClientesPerdidos] = useState<number | null>(null);
  const [generoDataReal, setGeneroDataReal] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [retencionHistorico, setRetencionHistorico] = useState<
    { mes: string; tasa: number }[]
  >([]);
  const [asistenciaHorarioReal, setAsistenciaHorarioReal] = useState<
    { horario: string; alumnos: number }[]
  >([]);
  const [rankingTop5, setRankingTop5] = useState<
    { pos: number; nombre: string; inicial: string; clases: number }[]
  >([]);
  // Historial de nuevos alumnos por mes (últimos 6 meses)
  const [mesesNuevosHistorial, setMesesNuevosHistorial] = useState<
    { mes: string; nuevos: number }[]
  >([]);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [nuevosHistorialOpen, setNuevosHistorialOpen] = useState(false);
  const [retencionHistorialOpen, setRetencionHistorialOpen] = useState(false);
  const [rankingHistorialOpen, setRankingHistorialOpen] = useState(false);
  const [antiguedadMeses, setAntiguedadMeses] = useState<number | null>(null);
  const [prevMesLabel, setPrevMesLabel] = useState<string>("");
  const alumnoNombreMapRef = useRef<Map<string, string>>(new Map());

  const fetchRanking = useCallback(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const primerDiaMesStr = primerDiaMes.toISOString().split("T")[0];
    const hoyStr = hoy.toISOString().split("T")[0];

    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("asistencias")
        .select("alumno_id, alumnos!inner(nombre)")
        .gte("fecha", primerDiaMesStr)
        .lte("fecha", hoyStr)
        .then(({ data: asistencias }) => {
          if (!asistencias) return;
          const conteo = new Map<string, { nombre: string; count: number }>();
          for (const a of asistencias as any[]) {
            const id = a.alumno_id;
            if (!id) continue;
            const nombre =
              a.alumnos?.nombre ||
              alumnoNombreMapRef.current.get(id) ||
              "Alumno";
            const prev = conteo.get(id);
            conteo.set(id, { nombre, count: (prev?.count ?? 0) + 1 });
          }
          const top5 = [...conteo.entries()]
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([, { nombre, count }], i) => ({
              pos: i + 1,
              nombre,
              inicial: nombre.charAt(0).toUpperCase(),
              clases: count,
            }));
          setRankingTop5(top5);
        });
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  // Suscripción realtime a asistencias
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    import("@/lib/supabase").then(({ supabase }) => {
      channel = supabase
        .channel("ranking-asistencias")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "asistencias" },
          () => fetchRanking(),
        )
        .subscribe();
    });
    return () => {
      if (channel) {
        import("@/lib/supabase").then(({ supabase }) =>
          supabase.removeChannel(channel!),
        );
      }
    };
  }, [fetchRanking]);

  // ── Cargar métricas base (Fase 1) ────────────────────────────────────────────
  useEffect(() => {
    if (!settings) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyYear  = hoy.getFullYear();
    const hoyMonth = hoy.getMonth() + 1;

    const primerDiaMes    = new Date(hoyYear, hoy.getMonth(), 1);
    const primerDiaMesStr = primerDiaMes.toISOString().split("T")[0];
    const hoyStr          = hoy.toISOString().split("T")[0];

    import("@/lib/supabase").then(({ supabase }) => {

      // ── 1. Alumnos activos (activo = TRUE, no es_prueba) ─────────────────────
      supabase
        .from("alumnos")
        .select("id, nombre, activo, genero, edad_actual, fecha_registro, fecha_ultima_asistencia, fecha_proximo_vencimiento")
        .eq("es_prueba", false)
        .then(({ data }) => {
          if (!data) return;

          // Fase 3: alumnos en riesgo → fijo 15 días
          const DIAS_RIESGO_FIJO = 15;
          const diasInact2   = settings.alert_2_days_no_attendance ?? 30;
          const diasInact3   = settings.alert_3_days_no_attendance ?? 60;
          const diasPerdidoAsist = 90; // Fase 3: clientes perdidos = sin asistencia > 90 días

          const umbralRiesgo   = new Date(hoy); umbralRiesgo.setDate(hoy.getDate()   - DIAS_RIESGO_FIJO);
          const umbralInact2   = new Date(hoy); umbralInact2.setDate(hoy.getDate()   - diasInact2);
          const umbralInact3   = new Date(hoy); umbralInact3.setDate(hoy.getDate()   - diasInact3);
          const umbralPerdido  = new Date(hoy); umbralPerdido.setDate(hoy.getDate()  - diasPerdidoAsist);

          let activos = 0;
          let nuevos  = 0;
          const antiguedadesArr: number[] = [];
          const vidasUtilesArr: number[] = [];
          let enRiesgo    = 0;
          let inactivos   = 0;
          let perdidos    = 0;
          let hombresActivos = 0;
          let mujeresActivos = 0;
          const edadesActivos: number[] = [];
          const alumnoNombreMap = new Map<string, string>();

          for (const a of data) {
            // ── activo real de DB ──
            const esActivo = (a as any).activo === true;

            if (esActivo) {
              activos++;
              if ((a as any).genero === "Masculino") hombresActivos++;
              else if ((a as any).genero === "Femenino") mujeresActivos++;
              if ((a as any).edad_actual != null) edadesActivos.push((a as any).edad_actual as number);
              // Antigüedad: meses desde fecha_registro hasta hoy
              if ((a as any).fecha_registro) {
                const reg = new Date((a as any).fecha_registro);
                const mesesAntiguedad =
                  (hoyYear - reg.getFullYear()) * 12 + (hoyMonth - 1 - reg.getMonth());
                if (mesesAntiguedad >= 0) antiguedadesArr.push(mesesAntiguedad);
              }
            }

            // Vida útil (Opción B): fecha_registro → fecha_proximo_vencimiento
            if ((a as any).fecha_registro && (a as any).fecha_proximo_vencimiento) {
              const reg = new Date((a as any).fecha_registro);
              const venc = new Date((a as any).fecha_proximo_vencimiento);
              const meses =
                (venc.getFullYear() - reg.getFullYear()) * 12 +
                (venc.getMonth() - reg.getMonth());
              if (meses > 0) vidasUtilesArr.push(meses);
            }

            // Mapa para ranking
            if (a.id && a.nombre) {
              alumnoNombreMap.set(a.id, a.nombre);
              alumnoNombreMapRef.current.set(a.id, a.nombre);
            }

            // Nuevos este mes
            if ((a as any).fecha_registro) {
              const [y, m] = ((a as any).fecha_registro as string).split("-").map(Number);
              if (y === hoyYear && m === hoyMonth) nuevos++;
            }

            // Alumnos en riesgo: TODOS (activos e inactivos), última asistencia <= 15 días
            // Los inactivos pueden estar recién caídos (tras 7 días sin renovar),
            // por eso se evalúan también.
            const ultAsist = (a as any).fecha_ultima_asistencia
              ? new Date((a as any).fecha_ultima_asistencia)
              : null;
            if (ultAsist && ultAsist >= umbralRiesgo) enRiesgo++;

            // Inactivos recuperables: sin asistencia entre 30 y 90 días
            if (ultAsist && ultAsist < umbralInact2 && ultAsist >= umbralPerdido) inactivos++;

            // Perdidos: fecha_ultima_asistencia hace más de 90 días (Fase 3)
            if (ultAsist && ultAsist < umbralPerdido) perdidos++;
            else if (!ultAsist) perdidos++; // sin registro de asistencia también se considera perdido
          }

          // ── setters ──
          setAlumnosActivos(activos);
          setNuevosEsteMes(nuevos);
          setAlumnosEnRiesgo(enRiesgo);
          setClientesInactivos(inactivos);
          setClientesPerdidos(perdidos);

          // Promedio edad (solo activos)
          setPromedioEdad(
            edadesActivos.length > 0
              ? Math.round(edadesActivos.reduce((a, b) => a + b, 0) / edadesActivos.length * 10) / 10
              : null,
          );

          // Antigüedad promedio (solo activos)
          setAntiguedadMeses(
            antiguedadesArr.length > 0
              ? Math.round((antiguedadesArr.reduce((a, b) => a + b, 0) / antiguedadesArr.length) * 10) / 10
              : null,
          );

          // Vida útil promedio (Opción B: fecha_registro → fecha_proximo_vencimiento)
          setVidaUtilMeses(
            vidasUtilesArr.length > 0
              ? Math.round((vidasUtilesArr.reduce((a, b) => a + b, 0) / vidasUtilesArr.length) * 10) / 10
              : null,
          );

          // Género (solo activos)
          const totalGenActivos = hombresActivos + mujeresActivos;
          setGeneroDataReal([
            { name: "Hombres", value: hombresActivos, color: "#DC2626" },
            { name: "Mujeres", value: mujeresActivos, color: "#6b7280" },
          ]);

          // ── Retención/Churn: cargar del mes ANTERIOR desde DB ────────────────
          const prevMonthVal = hoyMonth === 1 ? 12 : hoyMonth - 1;
          const prevYearVal  = hoyMonth === 1 ? hoyYear - 1 : hoyYear;
          const MESES_NOMBRES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
          setPrevMesLabel(`${MESES_NOMBRES[prevMonthVal - 1]} ${prevYearVal}`);

          supabase
            .from("estadisticas_mensuales")
            .select("tasa_retencion, tasa_churn")
            .eq("year", prevYearVal)
            .eq("month", prevMonthVal)
            .maybeSingle()
            .then(({ data: prevData }) => {
              if (prevData?.tasa_retencion != null) {
                setTasaRetencion(Math.round(prevData.tasa_retencion as number));
                setTasaChurn(
                  prevData.tasa_churn != null
                    ? Math.round(prevData.tasa_churn as number)
                    : Math.max(100 - Math.round(prevData.tasa_retencion as number), 0),
                );
              } else {
                setTasaRetencion(null);
                setTasaChurn(null);
              }
            });

          // ── 2. Asistencias por horario ────────────────────────────────────────
          supabase
            .from("asistencias")
            .select("hora")
            .gte("fecha", primerDiaMesStr)
            .lte("fecha", hoyStr)
            .then(({ data: asist }) => {
              const conteoHora = new Map<number, number>();
              for (const h of HORAS_FRANJA) conteoHora.set(h, 0);
              for (const a of asist ?? []) {
                if (!a.hora) continue;
                const h = parseInt((a.hora as string).split(":")[0]);
                if (h >= 7 && h <= 22) conteoHora.set(h, (conteoHora.get(h) ?? 0) + 1);
              }
              const horarioData = HORAS_FRANJA.map((h) => ({
                horario: `${String(h).padStart(2, "0")}:00`,
                alumnos: conteoHora.get(h) ?? 0,
              }));
              setAsistenciaHorarioReal(horarioData);

              // ── 3. Upsert snapshot del mes actual en estadisticas_mensuales ──
              supabase
                .from("estadisticas_mensuales")
                .upsert(
                  {
                    year:               hoyYear,
                    month:              hoyMonth,
                    alumnos_activos:    activos,
                    nuevos_este_mes:    nuevos,
                    promedio_edad:      edadesActivos.length > 0
                      ? Math.round(edadesActivos.reduce((a, b) => a + b, 0) / edadesActivos.length * 10) / 10
                      : null,
                    pct_hombres:        totalGenActivos > 0 ? Math.round((hombresActivos / totalGenActivos) * 100) : null,
                    pct_mujeres:        totalGenActivos > 0 ? Math.round((mujeresActivos / totalGenActivos) * 100) : null,
                    clientes_inactivos: inactivos,
                    clientes_perdidos:  perdidos,
                    asistencia_por_hora: horarioData,
                  },
                  { onConflict: "year,month" },
                )
                .then(() => {
                  // Cargar historial de retención (solo año actual)
                  supabase
                    .from("estadisticas_mensuales")
                    .select("year, month, tasa_retencion")
                    .not("tasa_retencion", "is", null)
                    .eq("year", hoyYear)
                    .order("month", { ascending: true })
                    .then(({ data: rows }) => {
                      setRetencionHistorico(
                        (rows ?? []).map((r) => ({
                          mes:  MESES_ABREV[r.month - 1],
                          tasa: r.tasa_retencion as number,
                        }))
                      );
                    });
                });
            });

          // ── 4. Historial de nuevos por mes (últimos 6 meses completos) ────────
          supabase
            .from("estadisticas_mensuales")
            .select("year, month, nuevos_este_mes")
            .not("nuevos_este_mes", "is", null)
            .order("year",  { ascending: true })
            .order("month", { ascending: true })
            .then(({ data: rows }) => {
              const hist = (rows ?? []).slice(-6).map((r) => ({
                mes:    MESES_ABREV[(r.month as number) - 1],
                nuevos: r.nuevos_este_mes as number,
              }));
              setMesesNuevosHistorial(hist);
            });

          // Ranking inicial
          fetchRanking();
        });
    });
  }, [settings, fetchRanking]);

  return (
    <div className="p-6 lg:p-8 w-full space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>

      <HistorialModal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
      />
      <NuevosHistorialModal
        open={nuevosHistorialOpen}
        onClose={() => setNuevosHistorialOpen(false)}
      />
      <RetencionHistorialModal
        open={retencionHistorialOpen}
        onClose={() => setRetencionHistorialOpen(false)}
      />
      <RankingHistorialModal
        open={rankingHistorialOpen}
        onClose={() => setRankingHistorialOpen(false)}
      />

      {/* Fila 1 — KPIs superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Alumnos Activos (este mes)"
          value={alumnosActivos !== null ? String(alumnosActivos) : "—"}
          accent="#DC2626"
          onHistoryClick={() => setHistorialOpen(true)}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Nuevos Este Mes"
          value={nuevosEsteMes !== null ? `+${nuevosEsteMes}` : "—"}
          accent="#DC2626"
          onHistoryClick={() => setNuevosHistorialOpen(true)}
          sub={(() => {
            const maxN = mesesNuevosHistorial.length
              ? Math.max(...mesesNuevosHistorial.map((m) => m.nuevos), 1)
              : 1;
            const mesActualAbrev = MESES_ABREV[new Date().getMonth()];
            if (mesesNuevosHistorial.length === 0) return null;
            return (
              <div className="flex items-end gap-1 mt-1">
                {mesesNuevosHistorial.map((m) => (
                  <div key={m.mes} className="flex flex-col items-center gap-1">
                    <div
                      className="w-4 rounded-sm"
                      style={{
                        height: `${Math.max(4, (m.nuevos / maxN) * 28)}px`,
                        backgroundColor: m.mes === mesActualAbrev ? "#DC2626" : "#e5e7eb",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: m.mes === mesActualAbrev ? "#DC2626" : "#9ca3af" }}
                    >
                      {m.mes}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          }
        />
        <StatCard
          label="Promedio de Edad"
          value={promedioEdad !== null ? String(promedioEdad) : "—"}
          sub="años"
          accent="#6b7280"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </div>

      {/* Fila 2 — Retención / Churn / Vida útil / Antigüedad / Riesgo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          label="Tasa de Retención"
          value={tasaRetencion !== null ? `${tasaRetencion}%` : "—"}
          color="#16a34a"
          description={`Alumnos que renovaron vs inicio del mes. Datos de ${prevMesLabel || "mes anterior"}.`}
        />
        <MetricCard
          label="Tasa de Churn"
          value={tasaChurn !== null ? `${tasaChurn}%` : "—"}
          color="#DC2626"
          description={`Alumnos que no continuaron. Datos de ${prevMesLabel || "mes anterior"}.`}
        />
        <MetricCard
          label="Vida Útil del Cliente"
          value={vidaUtilMeses !== null ? `${vidaUtilMeses} m` : "—"}
          color="#2563eb"
          description="Promedio de meses pagados por alumno, calculado desde tabla de pagos."
        />
        <MetricCard
          label="Antigüedad Promedio"
          value={antiguedadMeses !== null ? `${antiguedadMeses} m` : "—"}
          color="#7c3aed"
          description="Tiempo promedio (meses) que llevan los alumnos activos desde su fecha de registro."
        />
        <MetricCard
          label="Alumnos en Riesgo"
          value={alumnosEnRiesgo !== null ? String(alumnosEnRiesgo) : "—"}
          color="#d97706"
          description="Alumnos activos sin asistencia en los últimos 15 días."
        />
      </div>

      {/* Fila 3 — Clientes inactivos / perdidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: "#fffbeb", color: "#d97706" }}
          >
            {clientesInactivos ?? "—"}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              Clientes Inactivos Recuperables
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Alumnos con más de {settings?.alert_2_days_no_attendance || 30}{" "}
              días sin asistir pero con menos de 90 días de baja.
              Potencial de reactivación.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: "#fef2f2", color: "#DC2626" }}
          >
            {clientesPerdidos ?? "—"}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              Clientes Perdidos
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Alumnos con más de 90 días sin asistir al gimnasio.
            </p>
          </div>
        </div>
      </div>

      {/* Ranking por asistencia */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
            >
              <path d="M6 9H4a2 2 0 01-2-2V5h4" />
              <path d="M18 9h2a2 2 0 002-2V5h-4" />
              <path d="M12 17v4" />
              <path d="M8 21h8" />
              <path d="M6 5h12v6a6 6 0 01-12 0V5z" />
            </svg>
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
              Ranking
            </span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Top 5 por asistencia
            </span>
          </div>
          
          <button
            onClick={() => setRankingHistorialOpen(true)}
            className="text-xs text-gray-400 hover:text-gray-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Ver historial
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {rankingTop5.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin asistencias registradas este mes.
            </p>
          ) : null}
          {rankingTop5.map(({ pos, nombre, inicial, clases }) => {
            const medalColors: Record<
              number,
              { bg: string; text: string; label: string }
            > = {
              1: { bg: "#fffbeb", text: "#d97706", label: "🥇" },
              2: { bg: "#f8fafc", text: "#64748b", label: "🥈" },
              3: { bg: "#fff7ed", text: "#c2410c", label: "🥉" },
            };
            const medal = medalColors[pos];
            return (
              <div key={pos} className="flex items-center gap-3">
                {/* Posición / medalla */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={
                    medal
                      ? { backgroundColor: medal.bg, color: medal.text }
                      : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                  }
                >
                  {medal ? medal.label : pos}
                </div>
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: pos === 1 ? "#DC2626" : "#9ca3af" }}
                >
                  {inicial}
                </div>
                {/* Nombre */}
                <span
                  className={`flex-1 text-sm ${pos === 1 ? "font-semibold text-gray-900" : "text-gray-600"}`}
                >
                  {nombre}
                </span>
                {/* Clases */}
                <span className="text-xs font-semibold text-gray-400">
                  {clases} clases
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fila 4 — Género + Retención */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Género donut */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Distribución por Género</p>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Solo activos</span>
          </div>
          {(() => {
            const totalGenero = generoDataReal.reduce(
              (s, g) => s + g.value,
              0,
            );
            const hayDatos = totalGenero > 0;
            return (
              <>
                <div className="flex justify-center">
                  <div style={{ width: 160, height: 160 }}>
                    {mounted && hayDatos ? (
                      <PieChart width={160} height={160}>
                        <Pie
                          data={generoDataReal}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {generoDataReal.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [`${v} alumnos`]}
                        />
                      </PieChart>
                    ) : (
                      mounted && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div
                            className="rounded-full border-8 border-gray-100"
                            style={{ width: 140, height: 140 }}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="text-center -mt-4">
                  <p className="text-xs text-gray-400">Total con género</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hayDatos ? totalGenero : "—"}
                  </p>
                </div>
                <div className="flex justify-center gap-6">
                  {generoDataReal.map((g) => (
                    <div
                      key={g.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: g.color }}
                        />
                        <span className="text-xs text-gray-500">{g.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {hayDatos
                          ? Math.round((g.value / totalGenero) * 100)
                          : "—"}
                        {hayDatos ? "%" : ""}
                      </span>
                      <span className="text-xs text-gray-400">
                        {g.value} alumnos
                      </span>
                    </div>
                  ))}
                </div>
                {!hayDatos && mounted && (
                  <p className="text-xs text-center text-gray-400">
                    No hay registros de género en la base de datos.
                  </p>
                )}
              </>
            );
          })()}
        </div>
        {/* Retención mensual */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">Tasa de Retención Mensual</p>
            <button
              onClick={() => setRetencionHistorialOpen(true)}
              className="text-xs text-gray-400 hover:text-gray-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Ver historial
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Año {new Date().getFullYear()} — se renueva cada enero
          </p>
          {mounted && retencionHistorico.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={retencionHistorico}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={(v: number) => [`${v}%`, "Retención"]} />
                <Line
                  type="monotone"
                  dataKey="tasa"
                  stroke="#DC2626"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#DC2626", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{ height: 180 }}
              className="flex items-center justify-center text-gray-300 text-sm"
            >
              {retencionHistorico.length === 0 && mounted
                ? "Sin datos históricos aún."
                : "Cargando..."}
            </div>
          )}
        </div>
      </div>

      {/* Fila 5 — Asistencia por horario (ancho completo) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="font-semibold text-gray-900 mb-1">Asistencia por Horario</p>
        <p className="text-xs text-gray-400 mb-4">
          Total de asistencias por franja horaria — mes actual
        </p>
        {mounted && asistenciaHorarioReal.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={asistenciaHorarioReal} barSize={32}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="horario"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v} asistencias`, "Asistencia"]}
                cursor={{ fill: "#f9fafb" }}
              />
              <Bar dataKey="alumnos" fill="#111111" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{ height: 200 }}
            className="flex items-center justify-center text-gray-300 text-sm"
          >
            Cargando...
          </div>
        )}
      </div>
    </div>
  );
}
