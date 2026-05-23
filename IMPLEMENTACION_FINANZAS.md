# Plan de Implementación de Estadísticas Financieras

Este documento describe en detalle las estrategias técnicas para implementar y corregir las estadísticas financieras de la aplicación, integrando ventas de productos, cuotas de alumnos, gastos configurados, sueldos registrados y la distribución dinámica de formas de pago con su respectivo historial.

---

## 1. Ingresos del Mes (Neto)
### Explicación
El KPI de "Ingresos del mes" debe reflejar el resultado neto real del negocio.
- **Fórmula**: `Ingresos del Mes = (Total Ingresos Cuotas + Total Ventas Productos) - (Total Gastos Activos + Total Sueldos Activos)`.
- **Estrategia Técnica**:
  - **API (`/api/finanzas`)**: 
    1. Consultar la tabla `pagos` para el mes actual y sumar `precio`.
    2. Consultar la tabla `ventas` para el mes actual y sumar `total` (que es `cantidad * precio_unitario`).
    3. Consultar la tabla `monthly_expenses_config` para el mes actual donde `is_active = true` y sumar `amount`.
    4. Consultar la tabla `monthly_salaries_config` para el mes actual donde `is_active = true` y sumar `amount`.
    5. Retornar el ingreso neto como `ingresosMes`.
  - **Base de Datos (RPC `verificar_y_guardar_estadisticas_mensuales`)**:
    - Modificar la función PL/pgSQL para que al consolidar el mes anterior sume los pagos de cuotas, las ventas de productos en ese mes, reste los gastos configurados activos y los sueldos activos correspondientes a ese mes, y guarde el resultado en la columna `ingresos_mes` de la tabla `estadisticas_mensuales`.

---

## 2. Ticket Promedio
### Explicación
Refleja el ingreso promedio generado por cada alumno activo en el gimnasio durante el mes.
- **Fórmula**: `Ticket Promedio = Ingresos del Mes (Neto) / Cantidad de Alumnos Activos`.
- **Estrategia Técnica**:
  - **API (`/api/finanzas`)**:
    1. Utilizar el valor de `Ingresos del Mes (Neto)` calculado en el paso anterior.
    2. Obtener la cantidad de alumnos donde `activo = true` (ya implementado).
    3. Calcular `Math.round(ingresosMesNeto / alumnosActivos)` y retornarlo en `ticketPromedio`.

---

## 3. Historial de Ingresos Mensuales con Modal Interactivo (Recharts)
### Explicación
Permite a los administradores visualizar la evolución financiera a lo largo de los meses y años, con un modal interactivo premium a pantalla completa idéntico al de Alumnos Activos.
- **Estrategia Técnica**:
  - **Modal de Historial (`FinanzasHistorialModal`)**:
    - Crear un subcomponente Dialog en `app/(app)/finanzas/page.tsx` o en un archivo independiente.
    - Cargar todos los registros históricos de `estadisticas_mensuales` ordenados por año y mes.
    - **KPIs superiores**: Promedio del año actual, Máximo histórico de ingresos y Total de años registrados.
    - **Vista de Tabla Heatmap**: Mostrar un mapa de calor dinámico con intensidades de color rojo/naranja premium correspondientes al monto de ingresos de cada mes.
    - **Vista de Gráfico**: Un gráfico de líneas o barras multi-año usando Recharts para comparar el rendimiento de los diferentes años.
  - **Interactividad**: Añadir un botón premium de expansión en la esquina del card de "Ingresos Mensuales" en el dashboard de Finanzas para abrir este modal.

---

## 4. Distribución Dinámica de Formas de Pago e Historial
### Explicación
Muestra la distribución de cobros (tanto de cuotas como de productos) agrupada por el medio de pago utilizado, adaptándose dinámicamente a las variables activas en los ajustes de negocio.
- **Estrategia Técnica**:
  - **Ajustes de Negocio**: Consultar la tabla `payment_methods` donde `is_active = true`.
  - **Distribución**:
    - Al cargar la página de Finanzas para un mes y año seleccionados:
      1. Obtener todas las ventas y pagos de ese período.
      2. Agrupar la suma total de montos por cada método de pago.
      3. Asegurar que todos los métodos de pago configurados en ajustes aparezcan en la lista (incluso con `$0` si no registraron transacciones).
      4. Calcular el porcentaje correspondiente sobre el total bruto de ingresos.
  - **Historial dinámico**: Al cambiar el mes y año en el `MonthSelector`, actualizar automáticamente este gráfico de barras de distribución de formas de pago para reflejar el historial real de ese período.

---

## 5. Total de Gastos
### Explicación
Suma consolidadas de egresos operativos o fijos del negocio para el mes y año seleccionados.
- **Estrategia Técnica**:
  - Utilizar el hook `useMonthlyExpenses` para traer los gastos de la tabla `monthly_expenses_config` correspondientes al año y mes seleccionados en el `MonthSelector`.
  - Calcular la sumatoria de `amount` de todos los gastos que tengan `is_active = true`.
  - Asegurar la correcta actualización en tiempo real cuando se edite, cree o elimine un gasto en el modal `ExpensesModal`.

---

## 6. Total de Sueldos
### Explicación
Suma consolidada de salarios del personal y profesores registrados para el mes y año seleccionados.
- **Estrategia Técnica**:
  - Utilizar el hook `useMonthlyExpenses` para traer los sueldos de la tabla `monthly_salaries_config` correspondientes al año y mes seleccionados.
  - Calcular la sumatoria de `amount` de todos los sueldos donde `is_active = true`.
  - Garantizar la actualización y refresco inmediato en la UI al gestionar los sueldos.
