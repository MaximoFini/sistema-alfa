"use client";

import { useState } from "react";
import {
  MessageCircle,
  Send,
  Users,
  ChevronDown,
  CheckCheck,
  Clock,
} from "lucide-react";

interface MensajeEnviado {
  id: number;
  texto: string;
  destinatarios: string;
  fecha: string;
  cantidad: number;
}

const historial: MensajeEnviado[] = [
  {
    id: 1,
    texto: "El gimnasio abre el feriado de 9hs a 13hs. Los esperamos!",
    destinatarios: "Todos los alumnos activos",
    fecha: "08 Mar 2026 - 10:42",
    cantidad: 47,
  },
  {
    id: 2,
    texto:
      "Recordamos que las cuotas deben abonarse antes del día 10. Muchas gracias.",
    destinatarios: "Todos los alumnos activos",
    fecha: "01 Mar 2026 - 09:15",
    cantidad: 47,
  },
  {
    id: 3,
    texto:
      "Este sábado no hay clases por mantenimiento del salón principal. Disculpen las molestias.",
    destinatarios: "Todos los alumnos activos",
    fecha: "22 Feb 2026 - 18:30",
    cantidad: 44,
  },
];

export default function ComunicacionPage() {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [msgs, setMsgs] = useState(historial);
  const [expandido, setExpandido] = useState<number | null>(null);

  const puedeEnviar = mensaje.trim().length > 0;

  async function handleEnviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    await new Promise((r) => setTimeout(r, 1200));
    const nuevo: MensajeEnviado = {
      id: Date.now(),
      texto: mensaje.trim(),
      destinatarios: "Todos los alumnos activos",
      fecha: new Date().toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      cantidad: 47,
    };
    setMsgs((prev) => [nuevo, ...prev]);
    setMensaje("");
    setEnviando(false);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Comunicacion</h1>
        <p className="text-sm text-gray-500 mt-1">
          Envia mensajes de WhatsApp a todos los alumnos activos del gimnasio.
        </p>
      </div>

      {/* Compose card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Card header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <MessageCircle size={18} style={{ color: "#DC2626" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Mensaje General
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Users size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                Todos los alumnos activos · 47 contactos
              </span>
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className="p-5">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={
              "Ej: El gimnasio abre el feriado de 9hs a 13hs. Los esperamos!"
            }
            rows={5}
            className="w-full text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleEnviar}
              disabled={!puedeEnviar || enviando}
              className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#DC2626" }}
            >
              {enviando ? (
                <>
                  <Clock size={14} className="animate-spin" />
                  Enviando...
                </>
              ) : enviado ? (
                <>
                  <CheckCheck size={14} />
                  Enviado
                </>
              ) : (
                <>
                  <Send size={14} />
                  Enviar por WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Aviso de confirmacion */}
      {enviado && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
          <CheckCheck size={16} />
          Mensaje enviado correctamente a 47 alumnos.
        </div>
      )}

      {/* Historial */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Historial de envios
        </p>
        <div className="flex flex-col gap-2">
          {msgs.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <button
                className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpandido(expandido === m.id ? null : m.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate font-medium">
                    {m.texto}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <CheckCheck size={12} className="text-green-500" />
                      <span className="text-xs text-gray-400">
                        {m.cantidad} alumnos
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{m.fecha}</span>
                  </div>
                </div>
                <ChevronDown
                  size={15}
                  className="text-gray-400 shrink-0 mt-0.5 transition-transform"
                  style={{
                    transform:
                      expandido === m.id ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {expandido === m.id && (
                <div className="px-5 pb-4 border-t border-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">
                    {m.texto}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {m.destinatarios}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
