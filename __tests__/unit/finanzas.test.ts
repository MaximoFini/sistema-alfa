/**
 * Tests for app/api/finanzas/route.ts — financial calculations
 * IDs: UF-01 .. UF-09
 */

// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status ?? 200,
      headers: init?.headers ?? {},
    }),
  },
}));

// ─── Mock supabase-server directly ────────────────────────────────────────
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: { getUser: jest.fn() },
};

jest.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue(mockSupabaseClient),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────

type QueryResult = { data: unknown; error: unknown };

function createQueryBuilder(result: QueryResult) {
  // Make the builder itself thenable so it resolves when the chain ends
  // at any point (e.g. supabase.from("x").select().gte().lte() — no terminal call)
  const builder: Record<string, unknown> = {
    then: (resolve: (v: QueryResult) => void) => Promise.resolve(result).then(resolve),
    catch: (reject: (e: unknown) => void) => Promise.resolve(result).catch(reject),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
  };
  // Make all chain methods return `this` (the builder itself)
  ["select","eq","gte","lte","neq","order","update","filter","or"].forEach((m) => {
    (builder[m] as jest.Mock).mockReturnValue(builder);
  });
  return builder;
}

interface MockConfig {
  pagos?: QueryResult;
  ventas?: QueryResult;
  payment_methods?: QueryResult;
  expenses?: QueryResult;
  salaries?: QueryResult;
  alumnos?: QueryResult;
  estadisticas?: QueryResult;
  rpc?: QueryResult;
}

function setupMock(config: MockConfig = {}) {
  const defaults: Required<MockConfig> = {
    pagos: { data: [], error: null },
    ventas: { data: [], error: null },
    payment_methods: { data: [], error: null },
    expenses: { data: [], error: null },
    salaries: { data: [], error: null },
    alumnos: { data: [], error: null },
    estadisticas: { data: null, error: null },
    rpc: { data: null, error: { message: "not available" } },
  };
  const merged = { ...defaults, ...config };

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "pagos") return createQueryBuilder(merged.pagos);
    if (table === "ventas") return createQueryBuilder(merged.ventas);
    if (table === "payment_methods") return createQueryBuilder(merged.payment_methods);
    if (table === "monthly_expenses_config") return createQueryBuilder(merged.expenses);
    if (table === "monthly_salaries_config") return createQueryBuilder(merged.salaries);
    if (table === "alumnos") return createQueryBuilder(merged.alumnos);
    if (table === "estadisticas_mensuales") return createQueryBuilder(merged.estadisticas);
    return createQueryBuilder({ data: null, error: null });
  });

  mockSupabaseClient.rpc.mockResolvedValue(merged.rpc);
}

function makeRequest(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params);
  return { url: `http://localhost/api/finanzas?${searchParams.toString()}` };
}

// ─── Import route ─────────────────────────────────────────────────────────
import { GET } from "@/app/api/finanzas/route";

type GETResult = { body: Record<string, unknown>; status: number; headers: Record<string, string> };

// ─── Tests ────────────────────────────────────────────────────────────────

describe("GET /api/finanzas — financial calculations", () => {
  beforeEach(() => {
    // Do NOT use clearAllMocks() — it wipes the from() implementation.
    // Instead clear only call history.
    mockSupabaseClient.from.mockReset();
    mockSupabaseClient.rpc.mockReset();
    const { createSupabaseServerClient } = require("@/lib/supabase-server");
    (createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  // ── UF-01: ingresosBrutos = totalPagos + totalVentas ────────────────────
  it("UF-01 — ingresosBrutos es la suma de pagos y ventas", async () => {
    setupMock({
      pagos: { data: [{ precio: 1000, medio_pago: "Efectivo", alumno_id: "a1", fecha_cobro: "2025-01-15" }, { precio: 500, medio_pago: "Efectivo", alumno_id: "a2", fecha_cobro: "2025-01-20" }], error: null },
      ventas: { data: [{ total: 200, medio_pago: "Efectivo", created_at: "2025-01-10T12:00:00.000Z" }], error: null },
      payment_methods: { data: [{ name: "Efectivo" }], error: null },
      alumnos: { data: [{ saldo: 0 }], error: null },
    });

    const res = await GET(makeRequest() as never) as unknown as GETResult;
    expect(res.status).toBe(200);
    expect(res.body.ingresosBrutos).toBe(1700);
  });

  // ── UF-02: ingresosMes (neto) ────────────────────────────────────────────
  it("UF-02 — ingresosMes es ingresosBrutos menos gastos y sueldos", async () => {
    setupMock({
      pagos: { data: [{ precio: 2000, medio_pago: "Efectivo", alumno_id: "a1", fecha_cobro: "2025-01-15" }], error: null },
      ventas: { data: [{ total: 500, medio_pago: "Efectivo", created_at: "2025-01-10T12:00:00.000Z" }], error: null },
      payment_methods: { data: [{ name: "Efectivo" }], error: null },
      expenses: { data: [{ amount: 300 }], error: null },
      salaries: { data: [{ amount: 200 }], error: null },
      alumnos: { data: [], error: null },
    });

    const res = await GET(makeRequest() as never) as unknown as GETResult;
    expect(res.body.ingresosBrutos).toBe(2500);
    expect(res.body.ingresosMes).toBe(2000);
  });

  // ── UF-03: ticketPromedio ────────────────────────────────────────────────
  it("UF-03 — ticketPromedio correcto; 0 si no hay pagos", async () => {
    setupMock({
      pagos: { data: [
        { precio: 1000, medio_pago: "Efectivo", alumno_id: "a1", fecha_cobro: "2025-01-10" },
        { precio: 500, medio_pago: "Efectivo", alumno_id: "a2", fecha_cobro: "2025-01-11" },
        { precio: 750, medio_pago: "Efectivo", alumno_id: "a3", fecha_cobro: "2025-01-12" },
      ], error: null },
      payment_methods: { data: [{ name: "Efectivo" }], error: null },
      alumnos: { data: [], error: null },
    });

    const res = await GET(makeRequest() as never) as unknown as GETResult;
    expect(res.body.ticketPromedio).toBe(750); // round(2250/3) = 750
  });

  it("UF-03b — ticketPromedio es 0 cuando no hay pagos", async () => {
    setupMock({ alumnos: { data: [], error: null } });

    const res = await GET(makeRequest() as never) as unknown as GETResult;
    expect(res.body.ticketPromedio).toBe(0);
  });

  // ── UF-04: distribución formasPago case-insensitive ─────────────────────
  it("UF-04 — formasPago agrupa pagos y ventas por método (case-insensitive)", async () => {
    setupMock({
      pagos: { data: [
        { precio: 1000, medio_pago: "Efectivo", alumno_id: "a1", fecha_cobro: "2025-01-15" },
        { precio: 500, medio_pago: "transferencia", alumno_id: "a2", fecha_cobro: "2025-01-20" }, // lowercase
      ], error: null },
      ventas: { data: [{ total: 300, medio_pago: "Efectivo", created_at: "2025-01-10T12:00:00.000Z" }], error: null },
      payment_methods: { data: [{ name: "Efectivo" }, { name: "Transferencia" }], error: null },
      alumnos: { data: [], error: null },
    });

    const res = await GET(makeRequest() as never) as unknown as GETResult;
    expect(res.status).toBe(200);
    const formasPago = res.body.formasPago as { medio: string; monto: number; porcentaje: number }[];
    const efectivo = formasPago.find((f) => f.medio === "Efectivo");
    const transferencia = formasPago.find((f) => f.medio === "Transferencia");
    expect(efectivo?.monto).toBe(1300);
    expect(transferencia?.monto).toBe(500);
  });

  // ── UF-05: variación porcentual mes anterior ────────────────────────────
  it("UF-05 — variacion es 0 si no hay estadística previa", async () => {
    setupMock({ alumnos: { data: [], error: null } });

    const res = await GET(makeRequest() as never) as unknown as GETResult;
    expect(res.body.variacion).toBe(0);
  });

  it("UF-05b — variacion correcta cuando hay estadística previa", async () => {
    setupMock({
      pagos: { data: [{ precio: 1500, medio_pago: "Efectivo", alumno_id: "a1", fecha_cobro: "2025-01-15" }], error: null },
      payment_methods: { data: [{ name: "Efectivo" }], error: null },
      alumnos: { data: [], error: null },
      estadisticas: { data: { ingresos_mes: 1000 }, error: null },
    });

    const res = await GET(makeRequest() as never) as unknown as GETResult;
    // ingresosMes = 1500, mesAnterior = 1000, variacion = round((500/1000)*100) = 50
    expect(res.body.variacion).toBe(50);
  });

  // ── UF-06: parámetros year y month vía query string ────────────────────
  it("UF-06 — acepta year y month arbitrarios via query string", async () => {
    setupMock({ alumnos: { data: [], error: null } });

    const res = await GET(makeRequest({ year: "2024", month: "3" }) as never) as unknown as GETResult;
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ingresosMes");
    expect(res.body).toHaveProperty("ingresosHistorial");
  });

  // ── UF-07: ingresosHistorial via RPC ───────────────────────────────────
  it("UF-07 — ingresosHistorial usa datos del RPC cuando responde", async () => {
    const rpcData = [
      { mes: "Ene", monto: "5000" },
      { mes: "Feb", monto: "6000" },
      { mes: "Mar", monto: "7000" },
      { mes: "Abr", monto: "8000" },
      { mes: "May", monto: "9000" },
      { mes: "Jun", monto: "10000" },
    ];
    setupMock({
      alumnos: { data: [], error: null },
      rpc: { data: rpcData, error: null },
    });

    const res = await GET(makeRequest({ year: "2025", month: "3" }) as never) as unknown as GETResult;
    expect(res.status).toBe(200);
    const historial = res.body.ingresosHistorial as { mes: string; monto: number }[];
    expect(historial).toHaveLength(6);
    expect(historial[0]).toEqual({ mes: "Ene", monto: 5000 });
    expect(historial[5]).toEqual({ mes: "Jun", monto: 10000 });
  });

  // ── UF-08: fallback in-memory cuando RPC falla ─────────────────────────
  it("UF-08 — fallback in-memory calcula historial cuando RPC falla", async () => {
    setupMock({
      pagos: { data: [], error: null },
      ventas: { data: [], error: null },
      payment_methods: { data: [], error: null },
      expenses: { data: [], error: null },
      salaries: { data: [], error: null },
      alumnos: { data: [], error: null },
      rpc: { data: null, error: { message: "function not found" } },
    });

    const res = await GET(makeRequest({ year: "2025", month: "3" }) as never) as unknown as GETResult;
    expect(res.status).toBe(200);
    const historial = res.body.ingresosHistorial as { mes: string; monto: number }[];
    expect(historial).toHaveLength(6);
    historial.forEach((h) => {
      expect(h).toHaveProperty("mes");
      expect(typeof h.monto).toBe("number");
    });
  });

  // ── UF-09: rango correcto primer vs segundo semestre ────────────────────
  it("UF-09 — primer semestre (month 1-6) produce meses Ene-Jun", async () => {
    const rpcData = ["Ene","Feb","Mar","Abr","May","Jun"].map((mes) => ({ mes, monto: "1000" }));
    setupMock({
      alumnos: { data: [], error: null },
      rpc: { data: rpcData, error: null },
    });

    const res = await GET(makeRequest({ year: "2025", month: "3" }) as never) as unknown as GETResult;
    const h = res.body.ingresosHistorial as { mes: string }[];
    expect(h.map((e) => e.mes)).toEqual(["Ene","Feb","Mar","Abr","May","Jun"]);
  });

  it("UF-09b — segundo semestre (month 7-12) produce meses Jul-Dic", async () => {
    const rpcData = ["Jul","Ago","Sep","Oct","Nov","Dic"].map((mes) => ({ mes, monto: "2000" }));
    setupMock({
      alumnos: { data: [], error: null },
      rpc: { data: rpcData, error: null },
    });

    const res = await GET(makeRequest({ year: "2025", month: "9" }) as never) as unknown as GETResult;
    const h = res.body.ingresosHistorial as { mes: string }[];
    expect(h.map((e) => e.mes)).toEqual(["Jul","Ago","Sep","Oct","Nov","Dic"]);
  });
});

export {};
