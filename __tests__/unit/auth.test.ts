/**
 * Tests for lib/auth.ts — validateUserForLogin
 * IDs: UA-01 .. UA-05
 *
 * lib/auth.ts imports `supabase` from `@/lib/supabase`, which is a browser
 * client that throws on missing env vars. We mock the whole module.
 */

// ─── Mock @supabase/ssr (used by lib/supabase.ts indirectly) ────────────
jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn().mockReturnValue({
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  }),
  createServerClient: jest.fn(),
}));

// ─── Mock lib/supabase to return a controllable client ───────────────────
const mockMaybeSingle = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: mockFrom,
  },
}));

import { validateUserForLogin } from "@/lib/auth";

// ─── Tests ────────────────────────────────────────────────────────────────

describe("validateUserForLogin", () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset();
    mockFrom.mockReset();
    // Default: from("profiles").select(...).eq(...).maybeSingle() chain
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  it("UA-01 — Administrador válido retorna isValid true con role Administrador", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { role: "Administrador" }, error: null });

    const result = await validateUserForLogin("user-admin-id");

    expect(result.isValid).toBe(true);
    expect(result.role).toBe("Administrador");
    expect(result.errorMessage).toBeUndefined();
  });

  it("UA-02 — Recepcionista válido retorna isValid true con role Recepcionista", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { role: "Recepcionista" }, error: null });

    const result = await validateUserForLogin("user-recep-id");

    expect(result.isValid).toBe(true);
    expect(result.role).toBe("Recepcionista");
  });

  it("UA-03 — usuario sin perfil retorna isValid false con mensaje correcto", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await validateUserForLogin("user-no-profile-id");

    expect(result.isValid).toBe(false);
    expect(result.role).toBeNull();
    expect(result.errorMessage).toBe("Usuario no encontrado en el sistema.");
  });

  it("UA-04 — usuario con rol Alumno retorna isValid false con mensaje de permisos", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { role: "Alumno" }, error: null });

    const result = await validateUserForLogin("user-alumno-id");

    expect(result.isValid).toBe(false);
    expect(result.role).toBeNull();
    expect(result.errorMessage).toBe("No tienes permisos para acceder a este panel.");
  });

  it("UA-05 — error de Supabase retorna isValid false con mensaje de error", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "connection error", code: "500" },
    });

    const result = await validateUserForLogin("user-error-id");

    expect(result.isValid).toBe(false);
    expect(result.role).toBeNull();
    expect(result.errorMessage).toBe("Error al verificar el usuario.");
  });
});

export {};
