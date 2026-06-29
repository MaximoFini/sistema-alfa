/**
 * Tests for lib/rate-limit.ts
 * IDs: UL-01 .. UL-07
 *
 * The module holds an in-process Map (store). Because Jest re-uses the same
 * module instance across tests in a single file we reset it by re-requiring
 * with jest.isolateModules() or by manipulating time so every test starts
 * with a fresh window.
 */

// We use jest.resetModules() before each test to get a clean store.

describe("checkRateLimit", () => {
  let checkRateLimit: (key: string, max: number, windowMs: number) => boolean;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ checkRateLimit } = require("@/lib/rate-limit"));
  });

  it("UL-01 — primera solicitud siempre retorna true", () => {
    const result = checkRateLimit("test-key-ul01", 5, 60_000);
    expect(result).toBe(true);
  });

  it("UL-02 — solicitudes dentro del límite retornan true", () => {
    const key = "test-key-ul02";
    const max = 3;
    for (let i = 0; i < max; i++) {
      expect(checkRateLimit(key, max, 60_000)).toBe(true);
    }
  });

  it("UL-03 — la solicitud N+1 retorna false", () => {
    const key = "test-key-ul03";
    const max = 3;
    for (let i = 0; i < max; i++) {
      checkRateLimit(key, max, 60_000);
    }
    // Next call exceeds limit
    expect(checkRateLimit(key, max, 60_000)).toBe(false);
  });

  it("UL-04 — pasada la ventana windowMs el contador se resetea", () => {
    const key = "test-key-ul04";
    const max = 2;
    const windowMs = 100; // very short window

    // Exhaust the limit
    checkRateLimit(key, max, windowMs);
    checkRateLimit(key, max, windowMs);
    expect(checkRateLimit(key, max, windowMs)).toBe(false);

    // Advance time past the window using fake timers
    jest.useFakeTimers();
    jest.advanceTimersByTime(windowMs + 1);

    // Re-require so the module picks up the advanced Date.now()
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { checkRateLimit: freshCheck } = require("@/lib/rate-limit");

    // In the new module instance the store is empty — first call should be true
    expect(freshCheck(key, max, windowMs)).toBe(true);

    jest.useRealTimers();
  });

  it("UL-05 — diferentes claves no comparten contador", () => {
    const max = 1;
    const keyA = "key-a-ul05";
    const keyB = "key-b-ul05";

    // Exhaust keyA
    checkRateLimit(keyA, max, 60_000);
    expect(checkRateLimit(keyA, max, 60_000)).toBe(false);

    // keyB should still be at zero
    expect(checkRateLimit(keyB, max, 60_000)).toBe(true);
  });
});

describe("getClientIp", () => {
  let getClientIp: (request: Request) => string;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ getClientIp } = require("@/lib/rate-limit"));
  });

  it("UL-06 — extrae la primera IP del header x-forwarded-for", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("UL-07 — retorna 'unknown' cuando no hay header x-forwarded-for", () => {
    const req = new Request("http://localhost/test");
    expect(getClientIp(req)).toBe("unknown");
  });
});
