import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";

interface GlobalWhatsappStore {
  client: Client | null;
  status: "DISCONNECTED" | "INITIALIZING" | "QR_CODE" | "CONNECTED" | "ERROR";
  qr: string | null;
  error: string | null;
}

// Extender globalThis para mantener la instancia del cliente durante hot-reloads en desarrollo
const globalForWhatsapp = globalThis as unknown as {
  whatsappStore: GlobalWhatsappStore;
};

if (!globalForWhatsapp.whatsappStore) {
  globalForWhatsapp.whatsappStore = {
    client: null,
    status: "DISCONNECTED",
    qr: null,
    error: null,
  };
}

export const whatsappStatusStore = {
  get status() {
    return globalForWhatsapp.whatsappStore.status;
  },
  set status(val) {
    globalForWhatsapp.whatsappStore.status = val;
  },
  get qr() {
    return globalForWhatsapp.whatsappStore.qr;
  },
  set qr(val) {
    globalForWhatsapp.whatsappStore.qr = val;
  },
  get error() {
    return globalForWhatsapp.whatsappStore.error;
  },
  set error(val) {
    globalForWhatsapp.whatsappStore.error = val;
  },
};

export function getWhatsAppClient(): Client {
  const store = globalForWhatsapp.whatsappStore;

  if (store.client) {
    return store.client;
  }

  console.log("[WhatsApp] Iniciando cliente...");
  store.status = "INITIALIZING";
  store.qr = null;
  store.error = null;

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: "sistema-alfa",
      dataPath: "./.wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // reduce memory usage
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", async (qr) => {
    console.log("[WhatsApp] QR generado, listo para escanear");
    try {
      store.qr = await qrcode.toDataURL(qr);
      store.status = "QR_CODE";
    } catch (err) {
      console.error("[WhatsApp] Error al convertir QR a base64:", err);
      store.status = "ERROR";
      store.error = "Error al generar código QR";
    }
  });

  client.on("ready", () => {
    console.log("[WhatsApp] Cliente conectado y listo");
    store.status = "CONNECTED";
    store.qr = null;
    store.error = null;
  });

  client.on("authenticated", () => {
    console.log("[WhatsApp] Autenticado exitosamente");
  });

  client.on("auth_failure", (msg) => {
    console.error("[WhatsApp] Error de autenticación:", msg);
    store.status = "ERROR";
    store.error = msg;
    store.qr = null;
  });

  client.on("disconnected", (reason) => {
    console.log("[WhatsApp] Cliente desconectado:", reason);
    store.status = "DISCONNECTED";
    store.qr = null;
    store.client = null;
  });

  client.initialize().catch((err) => {
    console.error("[WhatsApp] Error al inicializar cliente:", err);
    store.status = "ERROR";
    store.error = err.message || String(err);
    store.qr = null;
  });

  store.client = client;
  return client;
}

export async function disconnectWhatsApp(): Promise<void> {
  const store = globalForWhatsapp.whatsappStore;
  if (store.client) {
    try {
      await store.client.destroy();
    } catch (err) {
      console.error("[WhatsApp] Error al destruir cliente:", err);
    }
    store.client = null;
  }
  store.status = "DISCONNECTED";
  store.qr = null;
  store.error = null;
}

/**
 * Formatea un número de teléfono de Argentina a formato internacional de WhatsApp.
 * Ejemplo: +54 9 11 1234-5678 -> 5491112345678@c.us
 */
export function formatWhatsappNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("54")) {
    // Si empieza con 54, asegurarse de que tenga el 9 (móvil) después
    if (cleaned.length === 12 && !cleaned.startsWith("549")) {
      cleaned = "549" + cleaned.slice(2);
    }
  } else {
    // Si empieza con local 15 móvil
    if (cleaned.startsWith("15")) {
      cleaned = cleaned.slice(2);
    }
    // Si tiene 10 dígitos (característica + número local)
    if (cleaned.length === 10) {
      cleaned = "549" + cleaned;
    } else if (cleaned.length === 8) {
      // Si no tiene código de área, asumir Buenos Aires (11)
      cleaned = "54911" + cleaned;
    } else {
      // Intentar agregar 549 por defecto para números cortos
      if (cleaned.length < 10) {
        cleaned = "549" + cleaned;
      }
    }
  }

  return `${cleaned}@c.us`;
}
