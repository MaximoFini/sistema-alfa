# Configuración de Guardado Automático de Estadísticas Mensuales

## Resumen
El sistema guarda automáticamente las estadísticas financieras de cada mes (ingresos, deuda total, alumnos activos) cuando el mes cambia. El mes actual siempre se calcula en tiempo real desde la tabla `pagos`.

## Opciones de Implementación

### Opción 1: Vercel Cron Jobs (Recomendado para Vercel)

1. **Crear archivo de configuración de cron**

Crea el archivo `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/finanzas/guardar-mensual",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Esto ejecutará la función todos los días a las 2 AM (UTC).

2. **Desplegar a Vercel**

Simplemente despliega tu aplicación:
```bash
vercel --prod
```

### Opción 2: GitHub Actions (Gratis, funciona con cualquier hosting)

1. **Crear archivo de workflow**

Crea `.github/workflows/monthly-stats.yml`:

```yaml
name: Guardar Estadísticas Mensuales

on:
  schedule:
    # Ejecutar todos los días a las 3 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  save-stats:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Monthly Stats Save
        run: |
          curl -X POST https://tu-dominio.com/api/finanzas/guardar-mensual
```

2. **Configurar en GitHub**
   - Haz commit del archivo
   - Ve a Actions en tu repositorio para verificar

### Opción 3: pg_cron (Si tienes acceso a configuración de PostgreSQL)

Ejecuta el SQL proporcionado en `supabase/migrations/create_monthly_financial_tracking.sql`

Luego programa la tarea:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'guardar-estadisticas-mensuales',
  '0 1 * * *',
  'SELECT verificar_y_guardar_estadisticas_mensuales();'
);
```

### Opción 4: Supabase Database Webhooks

1. **Ir al Dashboard de Supabase**
2. **Database > Database Webhooks**
3. **Crear un nuevo webhook**
   - Name: Monthly Stats
   - Table: pagos
   - Events: INSERT
   - Type: HTTP Request
   - URL: https://tu-dominio.com/api/finanzas/guardar-mensual
   - Method: POST

## Ejecutar Manualmente

### Desde el navegador:
```
https://tu-dominio.com/api/finanzas/guardar-mensual
```

### Desde Supabase SQL Editor:
```sql
SELECT verificar_y_guardar_estadisticas_mensuales();
```

### Desde terminal:
```bash
curl -X POST https://tu-dominio.com/api/finanzas/guardar-mensual
```

## Cómo Funciona

1. **Durante el mes**: Los ingresos se calculan en tiempo real sumando todos los pagos del mes actual
2. **Cuando cambia el mes**: La función detecta el cambio y guarda las estadísticas finales del mes anterior en `estadisticas_mensuales`
3. **Historial**: Puedes ver todos los meses anteriores en la tabla `estadisticas_mensuales`
4. **Evita duplicados**: Si ya existe un registro para un mes, no lo vuelve a crear

## Verificación

```sql
-- Ver todas las estadísticas guardadas
SELECT 
  year,
  month,
  ingresos_mes,
  deuda_total,
  alumnos_activos,
  created_at
FROM estadisticas_mensuales
ORDER BY year DESC, month DESC;

-- Ver ingresos del mes actual (calculados en tiempo real)
SELECT 
  COALESCE(SUM(precio), 0) as ingresos_mes_actual
FROM pagos
WHERE fecha_cobro >= DATE_TRUNC('month', CURRENT_DATE)
  AND fecha_cobro < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
```

## Troubleshooting

### La función no se ejecuta automáticamente
- Verifica que el cron job esté configurado correctamente
- Revisa los logs de Vercel/GitHub Actions
- Ejecuta manualmente para verificar que funciona

### Aparecen registros duplicados
- La función tiene protección contra duplicados
- Si aparecen, elimina los duplicados manualmente

### Los números no coinciden
- El mes actual siempre se calcula en tiempo real
- Los meses anteriores se guardan una sola vez al final del mes
- Verifica que la zona horaria sea correcta
