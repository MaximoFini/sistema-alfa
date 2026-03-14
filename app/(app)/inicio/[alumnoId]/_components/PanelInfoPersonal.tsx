"use client";

import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Dumbbell,
  Clock,
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
  abono_ultima_inscripcion: string | null;
  actividad_proximo_vencimiento: string | null;
  fecha_ultimo_inicio: string | null;
  fecha_ultima_asistencia: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return "-";
  const clean = dateStr.split("T")[0];
  const [y, m, d] = clean.split("-");
  return `${d}/${m}/${y}`;
}

function getInitials(nombre: string | null): string {
  if (!nombre) return "?";
  const words = nombre.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

const AVATAR_COLORS = [
  "#374151", "#6b7280", "#dc2626", "#4338ca",
  "#0f766e", "#9a3412", "#1e40af", "#78716c",
];

function getAvatarColor(nombre: string | null): string {
  if (!nombre) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function DataField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 pt-5 pb-1">
      {children}
    </p>
  );
}

export default function PanelInfoPersonal({ alumno }: { alumno: Alumno }) {
  const hoy = new Date();
  const vencimiento = alumno.fecha_proximo_vencimiento
    ? new Date(alumno.fecha_proximo_vencimiento)
    : null;
  const estaActivo = vencimiento ? vencimiento >= hoy : false;

  const initials = getInitials(alumno.nombre);
  const avatarColor = getAvatarColor(alumno.nombre);
  const telefonoLimpio = alumno.telefono?.replace(/\D/g, "") ?? "";

  return (
    <div className="flex flex-col">
      {/* Header del panel: avatar + nombre + estado */}
      <div
        className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4"
        style={{ backgroundColor: "#111111" }}
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black tracking-tight shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>

        {/* Nombre */}
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight text-balance">
            {alumno.nombre ?? "Sin nombre"}
          </h2>
          {alumno.edad_actual != null && (
            <p className="text-xs text-white/50 mt-0.5">{alumno.edad_actual} años</p>
          )}
        </div>

        {/* Badge de estado */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
            estaActivo
              ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30"
              : "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
          }`}
        >
          {estaActivo ? (
            <CheckCircle size={11} strokeWidth={2.5} />
          ) : (
            <XCircle size={11} strokeWidth={2.5} />
          )}
          {estaActivo ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Sección: Datos personales */}
      <SectionTitle>Datos personales</SectionTitle>
      <div className="px-6 divide-y divide-border">
        {alumno.dni && (
          <DataField
            icon={<CreditCard size={14} />}
            label="DNI"
            value={alumno.dni}
          />
        )}
        {alumno.genero && (
          <DataField
            icon={<User size={14} />}
            label="Género"
            value={alumno.genero}
          />
        )}
        {alumno.domicilio && (
          <DataField
            icon={<MapPin size={14} />}
            label="Domicilio"
            value={alumno.domicilio}
          />
        )}
        {alumno.telefono && (
          <DataField
            icon={<Phone size={14} />}
            label="Teléfono"
            value={
              <span className="flex flex-col gap-1.5">
                <span>{alumno.telefono}</span>
                <a
                  href={`https://wa.me/${telefonoLimpio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-2.5 py-1.5 rounded-lg transition-colors w-fit"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </span>
            }
          />
        )}
        {alumno.fecha_registro && (
          <DataField
            icon={<Calendar size={14} />}
            label="Alumno desde"
            value={formatFecha(alumno.fecha_registro)}
          />
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mt-2" />

      {/* Sección: Plan actual */}
      <SectionTitle>Plan actual</SectionTitle>
      <div className="px-6 divide-y divide-border mb-6">
        {alumno.actividad_proximo_vencimiento && (
          <DataField
            icon={<Dumbbell size={14} />}
            label="Actividad"
            value={alumno.actividad_proximo_vencimiento}
          />
        )}
        {alumno.abono_ultima_inscripcion && (
          <DataField
            icon={<CreditCard size={14} />}
            label="Abono"
            value={alumno.abono_ultima_inscripcion}
          />
        )}
        {alumno.fecha_ultimo_inicio && (
          <DataField
            icon={<Calendar size={14} />}
            label="Inicio"
            value={formatFecha(alumno.fecha_ultimo_inicio)}
          />
        )}
        {alumno.fecha_proximo_vencimiento && (
          <DataField
            icon={<Clock size={14} />}
            label="Vencimiento"
            value={
              <span className={estaActivo ? "text-green-600" : "text-red-500"}>
                {formatFecha(alumno.fecha_proximo_vencimiento)}
              </span>
            }
          />
        )}
        {alumno.fecha_ultima_asistencia && (
          <DataField
            icon={<Calendar size={14} />}
            label="Última asistencia"
            value={formatFecha(alumno.fecha_ultima_asistencia)}
          />
        )}
      </div>
    </div>
  );
}
