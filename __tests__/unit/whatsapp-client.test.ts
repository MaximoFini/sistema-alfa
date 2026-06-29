/**
 * Tests for lib/whatsapp-client.ts — formatWhatsappNumber
 * IDs: UW-01 .. UW-07
 *
 * formatWhatsappNumber is a pure function — no mocks needed.
 * We mock the heavy imports (whatsapp-web.js, qrcode) so the module loads
 * in the Jest/Node environment without Puppeteer.
 */

jest.mock("whatsapp-web.js", () => ({
  Client: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
  LocalAuth: jest.fn(),
}));

jest.mock("qrcode", () => ({
  toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,mockqr"),
}));

import { formatWhatsappNumber } from "@/lib/whatsapp-client";

describe("formatWhatsappNumber", () => {
  it("UW-01 — número con código 549 completo queda igual", () => {
    // 13 dígitos: 549 + 10 dígitos del número local
    expect(formatWhatsappNumber("5491112345678")).toBe("5491112345678@c.us");
  });

  it("UW-02 — número de 10 dígitos sin prefijo agrega 549", () => {
    // 10 dígitos → 549 + 10 = 13
    expect(formatWhatsappNumber("1112345678")).toBe("5491112345678@c.us");
  });

  it("UW-03 — número local con 15 al inicio: elimina 15 y agrega 549", () => {
    // 1512345678 (10 dígitos) → quita 15 → 12345678 (8 dígitos) → 54911 + 8 dígitos
    // But wait: after removing "15" → "12345678" (8 digits) → goes into the 8-digit branch
    // 8-digit path: "54911" + "12345678" = "5491112345678"
    expect(formatWhatsappNumber("1512345678")).toBe("54911" + "12345678" + "@c.us");
  });

  it("UW-04 — número de 8 dígitos (BA sin código de área) agrega 54911", () => {
    expect(formatWhatsappNumber("12345678")).toBe("5491112345678@c.us");
  });

  it("UW-05 — número vacío retorna string vacío", () => {
    expect(formatWhatsappNumber("")).toBe("");
  });

  it("UW-06 — número con caracteres no numéricos los elimina", () => {
    // +54 9 11 1234-5678 → "549111234 5678" → cleaned = "5491112345678" (13 digits)
    expect(formatWhatsappNumber("+54 9 11 1234-5678")).toBe("5491112345678@c.us");
  });

  it("UW-07 — número de 12 dígitos con prefijo 54 pero sin el 9: agrega el 9", () => {
    // 54 + 10 digit number (no 9 after 54) → 12 digits starting with "54" but not "549"
    // Code: cleaned.startsWith("54") && length===12 && !startsWith("549") → "549" + slice(2)
    expect(formatWhatsappNumber("541112345678")).toBe("5491112345678@c.us");
  });
});
