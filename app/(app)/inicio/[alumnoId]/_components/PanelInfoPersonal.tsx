"use client";

import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Alumno {
  id: string;
  nombre: string | null;
  edad_actual: number | null;
  fecha_registro: string | null;
  dni: string | null;
  domicilio: string | null;
  telefono: string | null;
  fecha_proximo_vencimiento: string | null;
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getInitials(nombre: string | null): string {
  if (!nombre) return "?";
  const words = nombre.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

const COLORS = [
  "#374151",
  "#6b7280",
  "#dc2626",
  "#4338ca",
  "#0f766e",
  "#9a3412",
  "#1e40af",
  "#78716c",
  "#a1a1aa",
  "#4b5563",
];

function getColor(nombre: string | null): string {
  if (!nombre) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide block">
          {label}
        </span>
        <span className="text-sm text-gray-800 font-medium">{value}</span>
      </div>
    </div>
  );
}

export default function PanelInfoPersonal({ alumno }: { alumno: Alumno }) {
  // Calcular si está activo comparando fecha_proximo_vencimiento con hoy
  const hoy = new Date();
  const vencimiento = alumno.fecha_proximo_vencimiento
    ? new Date(alumno.fecha_proximo_vencimiento)
    : null;
  const estaActivo = vencimiento ? vencimiento >= hoy : false;

  // Iniciales y color
  const initials = getInitials(alumno.nombre);
  const color = getColor(alumno.nombre);

  // Número de WhatsApp (solo dígitos)
  const telefonoLimpio = alumno.telefono?.replace(/\D/g, "") ?? "";
  const whatsappUrl = `https://wa.me/${telefonoLimpio}`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-5 sticky top-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {alumno.nombre ?? "Sin nombre"}
          </h2>
          {alumno.edad_actual != null && (
            <p className="text-sm text-gray-500">{alumno.edad_actual} años</p>
          )}
        </div>
        {/* Badge activo/inactivo */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
            estaActivo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {estaActivo ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {estaActivo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <hr className="border-gray-100" />

      {/* Datos */}
      <div className="flex flex-col gap-4">
        {/* DNI */}
        {alumno.dni && (
          <InfoRow
            icon={<CreditCard size={15} className="text-gray-400" />}
            label="DNI"
            value={alumno.dni}
          />
        )}

        {/* Domicilio */}
        {alumno.domicilio && (
          <InfoRow
            icon={<MapPin size={15} className="text-gray-400" />}
            label="Domicilio"
            value={alumno.domicilio}
          />
        )}

        {/* Teléfono con link a WhatsApp */}
        {alumno.telefono && (
          <div className="flex items-start gap-3">
            <Phone size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Teléfono
              </span>
              <span className="text-sm text-gray-800 font-medium">
                {alumno.telefono}
              </span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors w-fit mt-1"
              >
                {/* Ícono WhatsApp SVG simple */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Alumno desde */}
        {alumno.fecha_registro && (
          <InfoRow
            icon={<Calendar size={15} className="text-gray-400" />}
            label="Alumno desde"
            value={formatFecha(alumno.fecha_registro)}
          />
        )}

        {/* Próximo vencimiento */}
        {alumno.fecha_proximo_vencimiento && (
          <InfoRow
            icon={<Calendar size={15} className="text-gray-400" />}
            label="Vence"
            value={formatFecha(alumno.fecha_proximo_vencimiento)}
          />
        )}
      </div>
    </div>
  );
}
