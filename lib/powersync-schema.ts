import { column, Schema, Table } from "@powersync/web";

const alumnos = new Table({
  nombre: column.text,
  dni: column.text,
  domicilio: column.text,
  telefono: column.text,
  fecha_registro: column.text,
  fecha_ultima_asistencia: column.text,
  fecha_ultimo_vencimiento: column.text,
  abono_ultima_inscripcion: column.text,
  fecha_proximo_vencimiento: column.text,
  actividad_proximo_vencimiento: column.text,
  activo: column.integer,
  genero: column.text,
  edad_actual: column.integer,
  fecha_nacimiento: column.text,
  saldo: column.real,
  fecha_ultimo_inicio: column.text,
  clases_gracia_disponibles: column.integer,
  clases_gracia_usadas: column.integer,
  es_prueba: column.integer,
  actividad_interes: column.text,
  cus_completado: column.integer,
  cus_clases_presentadas: column.integer,
  email: column.text,
  telefono_emergencia: column.text,
  observaciones: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const pagos = new Table({
  alumno_id: column.text,
  actividad: column.text,
  precio: column.real,
  fecha_cobro: column.text,
  medio_pago: column.text,
  fecha_inicio: column.text,
  fecha_vencimiento: column.text,
});

const ventas = new Table({
  producto_id: column.text,
  cantidad: column.integer,
  precio_unitario: column.real,
  precio_costo_unitario: column.real,
  total: column.real,
  ganancia: column.real,
  notas: column.text,
  talle_vendido: column.text,
  created_at: column.text,
  medio_pago: column.text,
  tarjeta: column.text,
  alias_transferencia: column.text,
});

const productos = new Table({
  nombre: column.text,
  precio_venta: column.real,
  precio_costo: column.real,
  stock: column.integer,
  stock_minimo: column.integer,
  activo: column.integer,
  categoria: column.text,
  talles: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const asistencias = new Table({
  alumno_id: column.text,
  fecha: column.text,
  hora: column.text,
});

const exercises = new Table({
  name: column.text,
  category_id: column.text,
  video_url: column.text,
  notes: column.text,
  created_by: column.text,
});

const exercise_categories = new Table({
  name: column.text,
  color: column.text,
});

const exercise_stages = new Table({
  name: column.text,
  color: column.text,
});

const product_categories = new Table({
  name: column.text,
  is_active: column.integer,
  created_at: column.text,
  color: column.text,
});

const subscription_plans = new Table({
  name: column.text,
  duration_days: column.integer,
  price: column.real,
  is_active: column.integer,
});

const payment_methods = new Table({
  name: column.text,
  is_active: column.integer,
});

const accepted_cards = new Table({
  name: column.text,
  is_active: column.integer,
});

const training_plans = new Table({
  coach_id: column.text,
  title: column.text,
  description: column.text,
  start_date: column.text,
  end_date: column.text,
  total_days: column.integer,
  days_per_week: column.integer,
  total_weeks: column.integer,
  plan_type: column.text,
  difficulty_level: column.text,
  is_template: column.integer,
  is_archived: column.integer,
  created_at: column.text,
});

const training_plan_days = new Table({
  plan_id: column.text,
  day_number: column.integer,
  day_name: column.text,
  display_order: column.integer,
});

const training_plan_exercises = new Table({
  day_id: column.text,
  stage_id: column.text,
  stage_name: column.text,
  exercise_name: column.text,
  video_url: column.text,
  series: column.integer,
  reps: column.text,
  carga: column.text,
  pause: column.text,
  notes: column.text,
  coach_instructions: column.text,
  display_order: column.integer,
  write_weight: column.integer,
});

const training_plan_assignments = new Table({
  plan_id: column.text,
});

const monthly_expenses_config = new Table({
  year: column.integer,
  month: column.integer,
  name: column.text,
  amount: column.real,
  is_active: column.integer,
  category: column.text,
  description: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const monthly_salaries_config = new Table({
  year: column.integer,
  month: column.integer,
  name: column.text,
  amount: column.real,
  is_active: column.integer,
  description: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const business_expenses = new Table({
  name: column.text,
  amount: column.real,
  is_active: column.integer,
  category: column.text,
  description: column.text,
  is_system: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const business_salaries = new Table({
  name: column.text,
  amount: column.real,
  is_active: column.integer,
  description: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const estadisticas_mensuales = new Table({
  year: column.integer,
  month: column.integer,
  ingresos_mes: column.real,
  deuda_total: column.real,
  alumnos_activos: column.integer,
  nuevos_este_mes: column.integer,
  promedio_edad: column.real,
  pct_hombres: column.real,
  pct_mujeres: column.real,
  clientes_inactivos: column.integer,
  clientes_perdidos: column.integer,
  antiguedad_promedio: column.real,
  tasa_retencion: column.real,
  tasa_churn: column.real,
  asistencia_por_hora: column.text,
  ranking_top5: column.text,
  es_importado: column.integer,
  origen_importacion: column.text,
  fecha_importacion: column.text,
  notas_importacion: column.text,
  created_at: column.text,
});

const comunicacion_mensajes = new Table({
  texto: column.text,
  filtro: column.text,
  filtro_label: column.text,
  cantidad: column.integer,
  estado: column.text,
  created_at: column.text,
});

const system_settings = new Table({
  notify_days_before_expiration: column.integer,
  alert_1_days_no_attendance: column.integer,
  alert_2_days_no_attendance: column.integer,
  alert_3_days_no_attendance: column.integer,
  days_after_expiration_inactive: column.integer,
  days_without_renewal_lost: column.integer,
});

const profiles = new Table({
  role: column.text,
  full_name: column.text,
});

const system_users = new Table({
  username: column.text,
  email: column.text,
  is_admin: column.integer,
  is_active: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

export const AppSchema = new Schema({
  alumnos,
  pagos,
  ventas,
  productos,
  asistencias,
  exercises,
  exercise_categories,
  exercise_stages,
  product_categories,
  subscription_plans,
  payment_methods,
  accepted_cards,
  training_plans,
  training_plan_days,
  training_plan_exercises,
  training_plan_assignments,
  monthly_expenses_config,
  monthly_salaries_config,
  business_expenses,
  business_salaries,
  estadisticas_mensuales,
  comunicacion_mensajes,
  system_settings,
  profiles,
  system_users,
});

export type Database = (typeof AppSchema)["types"];
