/**
 * Tests for determinarEstado via POST /api/verificar-dni/route.ts
 * IDs: UV-01 .. UV-10
 *
 * We mock @/lib/supabase-server directly so createSupabaseServerClient
 * returns a controllable client without touching cookies/Next internals.
 */

// ─── Mock next/server ──────────────────────────────────────────────────────
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

// ─── Mock rate-limit so it never blocks ──────────────────────────────────
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue(true),
  getClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

// ─── Mock supabase-server directly ────────────────────────────────────────
const mockSupabaseClient = { from: jest.fn(), rpc: jest.fn(), auth: { getUser: jest.fn() } };

jest.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue(mockSupabaseClient),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────

function makeFutureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

function makePastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function makeAlumno(overrides: Record<string, unknown> = {}) {
  return {
    id: "alumno-id",
    nombre: "Test Alumno",
    activo: true,
    es_prueba: false,
    actividad_interes: "Boxeo",
    actividad_proximo_vencimiento: "Boxeo",
    clases_gracia_disponibles: 0,
    clases_gracia_usadas: 0,
    fecha_proximo_vencimiento: null,
    fecha_nacimiento: "1990-01-01", // adult
    cus_completado: null,
    cus_clases_presentadas: 0,
    ...overrides,
  };
}

function makeRequest(body: Record<string, unknown>) {
  return {
    headers: { get: jest.fn().mockReturnValue("127.0.0.1") },
    json: jest.fn().mockResolvedValue(body),
  };
}

/**
 * Setup the mock Supabase client for a given alumno and their planes (pagos).
 */
function makeThenable<T>(result: T) {
  const p = Promise.resolve(result);
  return { then: p.then.bind(p), catch: p.catch.bind(p) };
}

function setupMock(alumno: Record<string, unknown>, planes: unknown[], asistencias: unknown[] = []) {
  const updateChain = {
    eq: jest.fn().mockReturnValue(makeThenable({ data: {}, error: null })),
  };
  updateChain.eq.mockReturnValue(makeThenable({ data: {}, error: null }));

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "alumnos") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: alumno, error: null }),
        update: jest.fn().mockReturnValue(updateChain),
      };
    }
    if (table === "asistencias") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: asistencias, error: null }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };
    }
    // pagos table
    const pagosBuilder = {
      then: (resolve: (v: { data: unknown; error: null }) => void) =>
        Promise.resolve({ data: planes, error: null }).then(resolve),
      catch: (reject: (e: unknown) => void) =>
        Promise.resolve({ data: planes, error: null }).catch(reject),
      select: jest.fn(),
      eq: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockResolvedValue({ data: planes, error: null }),
    };
    pagosBuilder.select.mockReturnValue(pagosBuilder);
    pagosBuilder.eq.mockReturnValue(pagosBuilder);
    pagosBuilder.gte.mockReturnValue(pagosBuilder);
    pagosBuilder.lte.mockReturnValue(pagosBuilder);
    pagosBuilder.order.mockReturnValue(pagosBuilder);
    return pagosBuilder;
  });
}

// ─── Import POST after mocks are registered ───────────────────────────────
import { POST } from "@/app/api/verificar-dni/route";

// ─── Tests ────────────────────────────────────────────────────────────────

describe("POST /api/verificar-dni — determinarEstado", () => {
  beforeEach(() => {
    // Reset only call history, not implementations
    mockSupabaseClient.from.mockReset();
    mockSupabaseClient.auth.getUser.mockReset();
    const { createSupabaseServerClient } = require("@/lib/supabase-server");
    (createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  // ── UV-01: plan activo, más de 7 días ───────────────────────────────────
  it("UV-01 — alumno con plan activo >7 días → estado al-dia", async () => {
    const alumno = makeAlumno();
    const planes = [{ fecha_inicio: makePastDate(10), fecha_vencimiento: makeFutureDate(30), actividad: "Boxeo" }];
    setupMock(alumno, planes);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const body = (res as unknown as { body: Record<string, unknown> }).body;
    expect((body.alumno as Record<string, unknown>).estado).toBe("al-dia");
  });

  // ── UV-02: plan activo a 7 días o menos ────────────────────────────────
  it("UV-02 — plan activo a ≤7 días → estado advertencia", async () => {
    const alumno = makeAlumno();
    const planes = [{ fecha_inicio: makePastDate(23), fecha_vencimiento: makeFutureDate(5), actividad: "MMA" }];
    setupMock(alumno, planes);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const body = (res as unknown as { body: Record<string, unknown> }).body;
    expect((body.alumno as Record<string, unknown>).estado).toBe("advertencia");
  });

  // ── UV-03: sin plan → vencido + sin_plan ─────────────────────────────
  it("UV-03 — alumno sin plan → estado vencido, razonBloqueo sin_plan", async () => {
    const alumno = makeAlumno();
    setupMock(alumno, []);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const body = (res as unknown as { body: Record<string, unknown> }).body;
    const a = body.alumno as Record<string, unknown>;
    expect(a.estado).toBe("vencido");
    expect(a.razonBloqueo).toBe("sin_plan");
  });

  // ── UV-04: plan futuro no iniciado ─────────────────────────────────────
  it("UV-04 — plan futuro no iniciado → vencido + plan_no_iniciado", async () => {
    const alumno = makeAlumno();
    const planes = [{ fecha_inicio: makeFutureDate(5), fecha_vencimiento: makeFutureDate(35), actividad: "Lucha" }];
    setupMock(alumno, planes);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const a = ((res as unknown as { body: Record<string, unknown> }).body.alumno) as Record<string, unknown>;
    expect(a.estado).toBe("vencido");
    expect(a.razonBloqueo).toBe("plan_no_iniciado");
  });

  // ── UV-05: período de gracia disponible ────────────────────────────────
  it("UV-05 — período de gracia disponible → estado periodo_gracia", async () => {
    const alumno = makeAlumno({ clases_gracia_disponibles: 3, clases_gracia_usadas: 1 });
    // Need a plan that expired recently (within 2 years) so todosLosPlanes is non-empty,
    // but no plan is active today and no future plans → triggers gracia path.
    const planes = [{ fecha_inicio: makePastDate(30), fecha_vencimiento: makePastDate(5), actividad: "Boxeo" }];
    setupMock(alumno, planes);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const a = ((res as unknown as { body: Record<string, unknown> }).body.alumno) as Record<string, unknown>;
    expect(a.estado).toBe("periodo_gracia");
    expect(a.clasesGracia).toBeDefined();
  });

  // ── UV-06: período de gracia agotado ───────────────────────────────────
  it("UV-06 — gracia agotada → estado vencido", async () => {
    const alumno = makeAlumno({ clases_gracia_disponibles: 2, clases_gracia_usadas: 2 });
    // Expired plan so todosLosPlanes is non-empty (avoids early sin_plan return), no active plan.
    const planes = [{ fecha_inicio: makePastDate(30), fecha_vencimiento: makePastDate(5), actividad: "Boxeo" }];
    setupMock(alumno, planes);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const a = ((res as unknown as { body: Record<string, unknown> }).body.alumno) as Record<string, unknown>;
    expect(a.estado).toBe("vencido");
  });

  // ── UV-07: menor CUS incompleto (<3 clases), plan activo → advertencia ──
  it("UV-07 — menor con CUS incompleto <3 clases + plan activo → advertencia", async () => {
    const alumno = makeAlumno({
      fecha_nacimiento: makePastDate(365 * 15), // 15 years old
      cus_completado: false,
      cus_clases_presentadas: 1,
    });
    const planes = [{ fecha_inicio: makePastDate(10), fecha_vencimiento: makeFutureDate(30), actividad: "Boxeo" }];
    setupMock(alumno, planes);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const a = ((res as unknown as { body: Record<string, unknown> }).body.alumno) as Record<string, unknown>;
    expect(a.estado).toBe("advertencia");
  });

  // ── UV-08: menor CUS >= 3 sin completar → vencido + cus_vencido ─────────
  it("UV-08 — menor con CUS >=3 sin completar → vencido + cus_vencido", async () => {
    const alumno = makeAlumno({
      fecha_nacimiento: makePastDate(365 * 15),
      cus_completado: false,
      cus_clases_presentadas: 3,
    });
    setupMock(alumno, []);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const a = ((res as unknown as { body: Record<string, unknown> }).body.alumno) as Record<string, unknown>;
    expect(a.estado).toBe("vencido");
    expect(a.razonBloqueo).toBe("cus_vencido");
  });

  // ── UV-09: es_prueba=true sin asistencias → estado prueba ────────────────
  it("UV-09 — alumno de prueba sin asistencias previas → estado prueba", async () => {
    const alumno = makeAlumno({ es_prueba: true });
    setupMock(alumno, [], []); // empty asistencias

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const a = ((res as unknown as { body: Record<string, unknown> }).body.alumno) as Record<string, unknown>;
    expect(a.estado).toBe("prueba");
    expect(a.esPrueba).toBe(true);
  });

  // ── UV-10: es_prueba=true con asistencia previa → yaUsoClasePrueba ───────
  it("UV-10 — alumno de prueba con asistencia previa → yaUsoClasePrueba true", async () => {
    const alumno = makeAlumno({ es_prueba: true });
    setupMock(alumno, [], [{ id: "att-1" }]); // HAS an attendance

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const a = ((res as unknown as { body: Record<string, unknown> }).body.alumno) as Record<string, unknown>;
    expect(a.yaUsoClasePrueba).toBe(true);
    expect(a.estado).toBe("vencido");
  });

  // ── UV-11: sin planes registrados pero con clases de gracia disponibles ──
  it("UV-11 — alumno sin planes pero con gracia disponible → estado periodo_gracia", async () => {
    const alumno = makeAlumno({ clases_gracia_disponibles: 2, clases_gracia_usadas: 0 });
    setupMock(alumno, []);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const body = (res as unknown as { body: Record<string, unknown> }).body;
    const a = body.alumno as Record<string, unknown>;
    expect(a.estado).toBe("periodo_gracia");
    expect(a.clasesGracia).toBeDefined();
    expect((a.clasesGracia as { usadas: number }).usadas).toBe(1);
  });

  // ── UV-12: menor con CUS pendiente y gracia disponible ──────────────────
  it("UV-12 — menor con CUS pendiente y gracia disponible → consume ambas clases", async () => {
    const alumno = makeAlumno({
      fecha_nacimiento: makePastDate(365 * 15), // 15 años
      cus_completado: false,
      cus_clases_presentadas: 1,
      clases_gracia_disponibles: 2,
      clases_gracia_usadas: 0,
    });
    setupMock(alumno, []); // sin planes

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const body = (res as unknown as { body: Record<string, unknown> }).body;
    const a = body.alumno as Record<string, unknown>;
    
    // Debería ser advertencia por CUS pendiente
    expect(a.estado).toBe("advertencia");
    // CUS clases presentadas aumenta
    expect(a.cusClasesPresentadas).toBe(2);
    // Y la gracia está definida (se consume)
    expect(a.clasesGracia).toBeDefined();
    expect((a.clasesGracia as { usadas: number }).usadas).toBe(1);
  });

  // ── UV-13: alumno inactivo en la base de datos ──────────────────────────
  it("UV-13 — alumno con activo = false → bloqueado independientemente de planes/gracia", async () => {
    const alumno = makeAlumno({
      activo: false,
      clases_gracia_disponibles: 2,
      clases_gracia_usadas: 0,
    });
    setupMock(alumno, []);

    const res = await POST(makeRequest({ dni: "12345678" }) as never);
    expect((res as unknown as { status: number }).status).toBe(200);
    const body = (res as unknown as { body: Record<string, unknown> }).body;
    const a = body.alumno as Record<string, unknown>;
    expect(a.estado).toBe("vencido");
  });
});

export {};
