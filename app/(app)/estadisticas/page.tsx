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

const mesesNuevos = [
  { mes: "Oct", nuevos: 1 },
  { mes: "Nov", nuevos: 2 },
  { mes: "Dic", nuevos: 1 },
  { mes: "Ene", nuevos: 3 },
  { mes: "Feb", nuevos: 2 },
  { mes: "Mar", nuevos: 9 },
];
const maxNuevos = Math.max(...mesesNuevos.map((m) => m.nuevos));

const HORAS_FRANJA = Array.from({ length: 15 }, (_, i) => i + 8); // 08..22

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
  const [historialOpen, setHistorialOpen] = useState(false);
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

  // Cargar datos de alumnos activos, nuevos y promedio de edad
  useEffect(() => {
    if (!settings) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const mesActual = hoy.getFullYear() * 100 + (hoy.getMonth() + 1); // yyyyMM
    // Primer día del mes actual (para comparar con vencimiento)
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("alumnos")
        .select(
          "id, nombre, genero, fecha_proximo_vencimiento, fecha_registro, fecha_nacimiento, fecha_ultima_asistencia",
        )
        .eq("es_prueba", false)
        .then(({ data }) => {
          if (!data) return;

          const diasRiesgo = settings.alert_1_days_no_attendance ?? 15;
          const diasInactivo2 = settings.alert_2_days_no_attendance ?? 30;
          const diasInactivo3 = settings.alert_3_days_no_attendance ?? 60;
          const diasPerdido = settings.days_without_renewal_lost ?? 90;

          const umbralRiesgo = new Date(hoy);
          umbralRiesgo.setDate(umbralRiesgo.getDate() - diasRiesgo);

          const umbralInactivo2 = new Date(hoy);
          umbralInactivo2.setDate(umbralInactivo2.getDate() - diasInactivo2);

          const umbralInactivo3 = new Date(hoy);
          umbralInactivo3.setDate(umbralInactivo3.getDate() - diasInactivo3);

          const umbralPerdido = new Date(hoy);
          umbralPerdido.setDate(umbralPerdido.getDate() - diasPerdido);

          const primerDiaMesAnterior = new Date(
            hoy.getFullYear(),
            hoy.getMonth() - 1,
            1,
          );

          let activos = 0;
          let activosMesAnterior = 0;
          let nuevos = 0;
          let enRiesgo = 0;
          let inactivos = 0;
          let perdidos = 0;
          const edades: number[] = [];
          const vidasUtiles: number[] = [];
          const alumnoNombreMap = new Map<string, string>();
          // Update ref for realtime use

          for (const alumno of data) {
            const tieneVenc = !!alumno.fecha_proximo_vencimiento;

            // Activos este mes: vencimiento >= primer día del mes actual
            const activoEsteMes =
              tieneVenc &&
              new Date(alumno.fecha_proximo_vencimiento!) >= primerDiaMes;

            // Activos mes anterior: vencimiento >= primer día del mes anterior
            const activoMesAnterior =
              tieneVenc &&
              new Date(alumno.fecha_proximo_vencimiento!) >=
                primerDiaMesAnterior;

            if (activoEsteMes) activos++;
            if (activoMesAnterior) activosMesAnterior++;

            // Mapa id→nombre para el ranking
            if (alumno.id && alumno.nombre) {
              alumnoNombreMap.set(alumno.id, alumno.nombre);
              alumnoNombreMapRef.current.set(alumno.id, alumno.nombre);
            }

            // En riesgo: última asistencia null o anterior a hoy − alert_1_days_no_attendance
            const ultAsist = alumno.fecha_ultima_asistencia
              ? new Date(alumno.fecha_ultima_asistencia)
              : null;
            if (!ultAsist || ultAsist < umbralRiesgo) enRiesgo++;

            // Clientes Inactivos Recuperables:
            // última asistencia hace más de alert_2 días pero menos de alert_3 días
            if (
              ultAsist &&
              ultAsist < umbralInactivo2 &&
              ultAsist >= umbralInactivo3
            ) {
              inactivos++;
            }

            // Clientes Perdidos:
            // plan vencido hace más de days_without_renewal_lost días
            if (
              alumno.fecha_proximo_vencimiento &&
              new Date(alumno.fecha_proximo_vencimiento) < umbralPerdido
            ) {
              perdidos++;
            }

            // Nuevos este mes
            if (alumno.fecha_registro) {
              const [y, m] = alumno.fecha_registro.split("-").map(Number);
              if (y * 100 + m === mesActual) nuevos++;
            }

            // Promedio de edad
            if (alumno.fecha_nacimiento) {
              edades.push(calcularEdadExacta(alumno.fecha_nacimiento));
            }

            // Vida útil: meses entre fecha_registro y fecha_proximo_vencimiento
            if (alumno.fecha_registro && alumno.fecha_proximo_vencimiento) {
              const inicio = new Date(alumno.fecha_registro);
              const fin = new Date(alumno.fecha_proximo_vencimiento);
              const meses =
                (fin.getFullYear() - inicio.getFullYear()) * 12 +
                (fin.getMonth() - inicio.getMonth());
              if (meses > 0) vidasUtiles.push(meses);
            }
          }

          setAlumnosActivos(activos);
          setNuevosEsteMes(nuevos);
          setAlumnosEnRiesgo(enRiesgo);
          setClientesInactivos(inactivos);
          setClientesPerdidos(perdidos);

          // Género: consulta directa al total de alumnos no prueba
          supabase
            .from("alumnos")
            .select("genero")
            .eq("es_prueba", false)
            .then(({ data: genRows }) => {
              let hombresTotal = 0;
              let mujeresTotal = 0;
              for (const r of genRows ?? []) {
                if (r.genero === "Masculino") hombresTotal++;
                else if (r.genero === "Femenino") mujeresTotal++;
              }
              setGeneroDataReal([
                { name: "Hombres", value: hombresTotal, color: "#DC2626" },
                { name: "Mujeres", value: mujeresTotal, color: "#6b7280" },
              ]);
              const totalGen = hombresTotal + mujeresTotal;
              if (totalGen > 0) {
                supabase
                  .from("estadisticas_mensuales")
                  .upsert(
                    {
                      year: new Date().getFullYear(),
                      month: new Date().getMonth() + 1,
                      pct_hombres: Math.round((hombresTotal / totalGen) * 100),
                      pct_mujeres: Math.round((mujeresTotal / totalGen) * 100),
                    },
                    { onConflict: "year,month" },
                  )
                  .then(() => {});
              }
            });

          const retencionActual =
            activosMesAnterior > 0
              ? Math.min(
                  Math.round((activos / activosMesAnterior) * 100),
                  100,
                )
              : null;

          // Asistencia por horario (mes actual) + upsert + retención histórica
          const primerDiaMesStr = primerDiaMes.toISOString().split("T")[0];
          const hoyStr = hoy.toISOString().split("T")[0];

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
                if (h >= 8 && h <= 22)
                  conteoHora.set(h, (conteoHora.get(h) ?? 0) + 1);
              }
              const horarioData = HORAS_FRANJA.map((h) => ({
                horario: `${String(h).padStart(2, "0")}:00`,
                alumnos: conteoHora.get(h) ?? 0,
              }));
              setAsistenciaHorarioReal(horarioData);

              // Persistir snapshot completo del mes actual
              supabase
                .from("estadisticas_mensuales")
                .upsert(
                  {
                    year: hoy.getFullYear(),
                    month: hoy.getMonth() + 1,
                    alumnos_activos: activos,
                    clientes_inactivos: inactivos,
                    clientes_perdidos: perdidos,
                    tasa_retencion: retencionActual,
                    asistencia_por_hora: horarioData,
                  },
                  { onConflict: "year,month" },
                )
                .then(() => {
                  // Tras upsert, cargar histórico de retención (6 meses)
                  supabase
                    .from("estadisticas_mensuales")
                    .select("year, month, tasa_retencion")
                    .not("tasa_retencion", "is", null)
                    .order("year", { ascending: true })
                    .order("month", { ascending: true })
                    .then(({ data: rows }) => {
                      const hist = (rows ?? [])
                        .slice(-6)
                        .map((r) => ({
                          mes: MESES_ABREV[r.month - 1],
                          tasa: r.tasa_retencion as number,
                        }));
                      setRetencionHistorico(hist);
                    });
                });
            });

          // Ranking inicial
          fetchRanking();

          if (activosMesAnterior > 0) {
            const retencion = Math.round((activos / activosMesAnterior) * 100);
            setTasaRetencion(Math.min(retencion, 100));
            setTasaChurn(Math.max(100 - retencion, 0));
          } else {
            setTasaRetencion(null);
            setTasaChurn(null);
          }

          setPromedioEdad(
            edades.length > 0
              ? Math.round(
                  (edades.reduce((a, b) => a + b, 0) / edades.length) * 10,
                ) / 10
              : null,
          );

          setVidaUtilMeses(
            vidasUtiles.length > 0
              ? Math.round(
                  vidasUtiles.reduce((a, b) => a + b, 0) / vidasUtiles.length,
                )
              : null,
          );
        });
    });
  }, [settings]);

  return (
    <div className="p-6 lg:p-8 w-full space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>

      <HistorialModal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
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
          sub={
            <div className="flex items-end gap-1 mt-1">
              {mesesNuevos.map((m) => (
                <div key={m.mes} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 rounded-sm"
                    style={{
                      height: `${Math.max(4, (m.nuevos / maxNuevos) * 28)}px`,
                      backgroundColor: m.mes === "Mar" ? "#DC2626" : "#e5e7eb",
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: m.mes === "Mar" ? "#DC2626" : "#9ca3af" }}
                  >
                    {m.mes}
                  </span>
                </div>
              ))}
            </div>
          }
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

      {/* Fila 2 — Retención / Churn / Riesgo / Vida útil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Tasa de Retención"
          value={tasaRetencion !== null ? `${tasaRetencion}%` : "—"}
          color="#16a34a"
          description="Alumnos que continuaron este mes respecto al mes anterior."
        />
        <MetricCard
          label="Tasa de Churn"
          value={tasaChurn !== null ? `${tasaChurn}%` : "—"}
          color="#DC2626"
          description="Porcentaje de alumnos que abandonaron en el mes actual."
        />
        <MetricCard
          label="Alumnos en Riesgo"
          value={alumnosEnRiesgo !== null ? String(alumnosEnRiesgo) : "—"}
          color="#d97706"
          description={`Sin actividad registrada en los últimos ${settings?.alert_1_days_no_attendance || 14} días, desde la ultima asistencia.`}
        />
        <MetricCard
          label="Vida Útil del Cliente"
          value={vidaUtilMeses !== null ? `${vidaUtilMeses} m` : "—"}
          color="#2563eb"
          description="Promedio de meses de permanencia activa de cada alumno."
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
              días sin asistir pero con menos de{" "}
              {settings?.alert_3_days_no_attendance || 60} días de baja.
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
              Alumnos con más de {settings?.days_without_renewal_lost || 90}{" "}
              días sin renovar.
            </p>
          </div>
        </div>
      </div>

      {/* Ranking por asistencia */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
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
          <p className="font-semibold text-gray-900">Distribución por Género</p>
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
          <p className="font-semibold text-gray-900 mb-1">
            Tasa de Retención Mensual
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Evolución de la retención en los últimos 6 meses
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
