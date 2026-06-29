/**
 * Tests for app/api/trial-registration/route.ts
 * IDs: UT-01 .. UT-10
 */

// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue(true),
  getClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

const mockSupabaseClient = {
  from: jest.fn(),
  auth: { getUser: jest.fn() },
};

jest.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue(mockSupabaseClient),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return {
    headers: { get: jest.fn().mockReturnValue("127.0.0.1") },
    json: jest.fn().mockResolvedValue(body),
  };
}

const VALID_BODY = {
  nombre: "Juan Perez",
  dni: "12345678",
  telefono: "1123456789",
  fecha_nacimiento: "2000-05-15",
  direccion: "Av. Corrientes 1234",
  genero: "Masculino",
  actividad: "Boxeo",
};

function setupNoExistingAlumno() {
  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "alumnos") {
      const insertChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { nombre: VALID_BODY.nombre, id: "new-id", actividad_interes: VALID_BODY.actividad },
          error: null,
        }),
      };
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockReturnValue(insertChain),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

function setupExistingAlumno(es_prueba: boolean) {
  mockSupabaseClient.from.mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { id: "existing", es_prueba, nombre: "Existing" },
      error: null,
    }),
  }));
}

// ─── Import route ─────────────────────────────────────────────────────────
import { POST } from "@/app/api/trial-registration/route";

type Res = { body: Record<string, unknown>; status: number };

// ─── Tests ────────────────────────────────────────────────────────────────

describe("POST /api/trial-registration", () => {
  beforeEach(() => {
    mockSupabaseClient.from.mockReset();
    const { createSupabaseServerClient } = require("@/lib/supabase-server");
    (createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    setupNoExistingAlumno();
  });

  // ── UT-01: DNI de 7 dígitos válido ──────────────────────────────────────
  it("UT-01 — DNI de 7 dígitos pasa validación y retorna 201", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, dni: "1234567" }) as never) as unknown as Res;
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  // ── UT-02: DNI de 8 dígitos válido ──────────────────────────────────────
  it("UT-02 — DNI de 8 dígitos pasa validación y retorna 201", async () => {
    const res = await POST(makeRequest(VALID_BODY) as never) as unknown as Res;
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  // ── UT-03: DNI de 6 dígitos retorna 400 ─────────────────────────────────
  it("UT-03 — DNI de 6 dígitos retorna 400", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, dni: "123456" }) as never) as unknown as Res;
    expect(res.status).toBe(400);
    expect(res.body.error as string).toMatch(/7 u 8 dígitos/);
  });

  // ── UT-04: DNI con letras retorna 400 ───────────────────────────────────
  it("UT-04 — DNI con letras retorna 400", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, dni: "1234abc8" }) as never) as unknown as Res;
    expect(res.status).toBe(400);
    expect(res.body.error as string).toMatch(/7 u 8 dígitos/);
  });

  // ── UT-05: actividad fuera de la lista retorna 400 ──────────────────────
  it("UT-05 — actividad no permitida retorna 400", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, actividad: "Yoga" }) as never) as unknown as Res;
    expect(res.status).toBe(400);
    expect(res.body.error as string).toMatch(/actividad/i);
  });

  // ── UT-06: fecha de nacimiento con formato inválido retorna 400 ──────────
  it("UT-06 — fecha de nacimiento con formato inválido retorna 400", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, fecha_nacimiento: "15/05/2000" }) as never) as unknown as Res;
    expect(res.status).toBe(400);
    expect(res.body.error as string).toMatch(/YYYY-MM-DD/);
  });

  // ── UT-07: campo requerido vacío retorna 400 ────────────────────────────
  it("UT-07a — campo nombre vacío retorna 400 mencionando 'nombre'", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, nombre: "" }) as never) as unknown as Res;
    expect(res.status).toBe(400);
    expect(res.body.error as string).toMatch(/nombre/);
  });

  it("UT-07b — campo telefono vacío retorna 400 mencionando 'telefono'", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, telefono: "" }) as never) as unknown as Res;
    expect(res.status).toBe(400);
    expect(res.body.error as string).toMatch(/telefono/);
  });

  it("UT-07c — campo direccion vacío retorna 400 mencionando 'direccion'", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, direccion: "" }) as never) as unknown as Res;
    expect(res.status).toBe(400);
    expect(res.body.error as string).toMatch(/direccion/);
  });

  // ── UT-08: DNI con clase de prueba ya usada → 409 ────────────────────────
  it("UT-08 — DNI con clase de prueba ya registrada retorna 409 TRIAL_ALREADY_REGISTERED", async () => {
    setupExistingAlumno(true);

    const res = await POST(makeRequest(VALID_BODY) as never) as unknown as Res;
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("TRIAL_ALREADY_REGISTERED");
  });

  // ── UT-09: DNI de alumno regular → 409 ALREADY_MEMBER ──────────────────
  it("UT-09 — DNI de alumno regular retorna 409 ALREADY_MEMBER", async () => {
    setupExistingAlumno(false);

    const res = await POST(makeRequest(VALID_BODY) as never) as unknown as Res;
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ALREADY_MEMBER");
  });

  // ── UT-10: registro exitoso retorna 201 ──────────────────────────────────
  it("UT-10 — registro exitoso retorna 201 con success y datos del alumno", async () => {
    const res = await POST(makeRequest(VALID_BODY) as never) as unknown as Res;
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const data = res.body.data as Record<string, string>;
    expect(data.nombre).toBe(VALID_BODY.nombre);
    expect(data.actividad).toBe(VALID_BODY.actividad);
  });
});

export {};
