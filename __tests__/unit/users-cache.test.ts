/**
 * Tests for app/api/users/route.ts — requireAdminSession + roleCache
 * IDs: UU-01 .. UU-03
 *
 * requireAdminSession is not exported, so we test its behaviour through
 * the POST handler: admin → past auth check → 400/201; non-admin → 401.
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

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue({ data: { user: { id: "new-user" } }, error: null }),
        deleteUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
  }),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

// We control the supabase-server mock per test
const mockSupabaseClient = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue(mockSupabaseClient),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown> = {}) {
  return { json: jest.fn().mockResolvedValue(body) };
}

const VALID_BODY = {
  username: "testuser",
  email: "testuser@example.com",
  password: "securepassword",
  isAdmin: false,
};

function setupAdminMock(role: string = "Administrador") {
  const user = { id: "user-id-1" };

  // single() is called for profiles check
  const profileSingle = jest.fn().mockResolvedValue({
    data: role === "none" ? null : { role },
    error: null,
  });
  // maybeSingle for system_users duplicate check
  const sysUserMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  // insert single for system_users create
  const sysUserInsertSingle = jest.fn().mockResolvedValue({
    data: {
      id: "new-id", username: "testuser", email: "testuser@example.com",
      password_hash: "hashed", is_admin: false, is_active: true,
    },
    error: null,
  });

  mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user }, error: null });

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: profileSingle,
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };
    }
    if (table === "system_users") {
      const insertChain = {
        select: jest.fn().mockReturnThis(),
        single: sysUserInsertSingle,
      };
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: sysUserMaybeSingle,
        insert: jest.fn().mockReturnValue(insertChain),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    };
  });

  return { profileSingle };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("requireAdminSession and roleCache (via POST /api/users)", () => {
  // IMPORTANT: We must reset modules between tests because roleCache is module-level state.
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    const { createSupabaseServerClient } = require("@/lib/supabase-server");
    (createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  // ── UU-01: cache vigente no re-consulta profiles ────────────────────────
  it("UU-01 — segunda llamada usa cache de rol y no re-consulta profiles", async () => {
    const { profileSingle } = setupAdminMock("Administrador");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require("@/app/api/users/route");

    // First call — cold cache, will query profiles
    await POST(makeRequest(VALID_BODY));
    const callsAfterFirst = profileSingle.mock.calls.length;
    expect(callsAfterFirst).toBe(1);

    // Second call — should hit cache (same userId in same module instance)
    await POST(makeRequest({ ...VALID_BODY, username: "user2", email: "user2@test.com" }));
    const callsAfterSecond = profileSingle.mock.calls.length;

    // profiles.single should NOT have been called again
    expect(callsAfterSecond).toBe(1);
  });

  // ── UU-02: cache expirado fuerza re-consulta ────────────────────────────
  it("UU-02 — cache expirado (>5 min) fuerza re-consulta de profiles", async () => {
    jest.useFakeTimers();
    const { profileSingle } = setupAdminMock("Administrador");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require("@/app/api/users/route");

    // First call to warm the cache
    await POST(makeRequest(VALID_BODY));
    const after1 = profileSingle.mock.calls.length;
    expect(after1).toBe(1);

    // Advance time past the TTL (5 minutes)
    jest.advanceTimersByTime(5 * 60 * 1000 + 1);

    // Second call — cache is stale, should re-query profiles
    await POST(makeRequest({ ...VALID_BODY, username: "user3", email: "user3@test.com" }));
    const after2 = profileSingle.mock.calls.length;

    expect(after2).toBeGreaterThan(after1);

    jest.useRealTimers();
  });

  // ── UU-03: rol no-Admin deniega acceso ────────────────────────────────
  it("UU-03 — rol Recepcionista recibe 401", async () => {
    setupAdminMock("Recepcionista");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require("@/app/api/users/route");
    const res = await POST(makeRequest(VALID_BODY)) as { status: number };
    expect(res.status).toBe(401);
  });
});

export {};
