# Prioridad 2 — 21 de Mayo (Estadísticas y Rankings Dinámicos)

Este archivo contiene la planificación, especificación técnica y los prompts de desarrollo para implementar con éxito las mejoras y nuevos reportes en el panel de **Estadísticas** del **Sistema Alfa**.

---

## 📋 Lista de Actividades

1. [ ] **Histórico de Asistencias por Horario**: Panel/gráfico interactivo para visualizar y comparar la distribución horaria de ingresos en meses históricos.
2. [ ] **Histórico de Alumnos Activos por Género**: Gráfico evolutivo temporal del porcentaje de hombres y mujeres activos (mes a mes) utilizando datos de snapshots históricos.
3. [ ] **Ranking Dinámico de Asistencias (Top 10 por Género)**:
    - Ampliar el ranking actual de Top 5 a **Top 10**.
    - Crear 3 rankings paralelos: **General**, **Hombres** y **Mujeres**.
    - Implementar un selector dinámico (tabs/botones) de género en la UI, mostrando el general por defecto.

---

## ⚡ Prompts de Desarrollo Detallados

A continuación, se detalla el análisis de afectación técnica y el prompt específico que guiará a la IA para ejecutar cada tarea con éxito y excelencia visual.

---

### 1. Histórico de Asistencias por Horario
* **Descripción:** Actualmente se calcula la distribución de ingresos por hora para el mes en curso y se persiste en la tabla `estadisticas_mensuales` (columna `asistencia_por_hora` de tipo JSON). La mejora consiste en crear una UI interactiva que permita consultar este histórico.
* **Archivos a Modificar:**
  - [estadisticas/page.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/estadisticas/page.tsx): 
    - Crear un componente de modal o una sección plegable de historial horaria (`AsistenciasHorarioHistorialModal`).
    - Consultar a Supabase la columna `asistencia_por_hora`, `year` y `month` de la tabla `estadisticas_mensuales` de los meses anteriores.
    - Renderizar los datos en un gráfico comparativo multi-línea o de barras apiladas (usando Recharts si está instalado, o barras CSS estilizadas) para visualizar las variaciones de las horas pico mes a mes.

> [!NOTE]
> **Prompt para ejecución:**
> "Modificá el panel de estadísticas en `estadisticas/page.tsx`. Añadí un botón premium 'Ver histórico de horarios' al lado del bloque de asistencias por horario. Creá un modal interactivo (`AsistenciasHorarioHistorialModal`) que consulte la tabla `estadisticas_mensuales` filtrando por registros que tengan el campo `asistencia_por_hora` con datos históricos. Mostrá un selector de meses para que la administración elija un mes anterior y cargue su distribución horaria en una gráfica de barras estilizada, o mostrá un gráfico multi-línea comparando las horas pico de los últimos 3 meses (por ejemplo, mañana vs tarde). Asegurá que las interacciones sean fluidas e incorporen sutiles micro-animaciones en los gráficos."

---

### 2. Histórico de Porcentaje de Alumnos Activos por Género
* **Descripción:** Mostrar la evolución histórica de la composición de alumnos activos por género. Se deben recuperar los porcentajes mensuales persistidos en las columnas `pct_hombres` y `pct_mujeres` de la tabla `estadisticas_mensuales` de los últimos 6 a 12 meses.
* **Archivos a Modificar:**
  - [estadisticas/page.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/estadisticas/page.tsx):
    - Consultar las columnas `year`, `month`, `pct_hombres` y `pct_mujeres` de la tabla `estadisticas_mensuales`.
    - Diseñar e implementar una nueva sección de visualización histórica en la pestaña de distribución por género.
    - Utilizar un gráfico de área apilada o de líneas cruzadas (usando componentes gráficos de la app o barras de porcentaje evolutivas estilizadas) que muestre cómo ha variado el porcentaje de participación masculina vs. femenina en el gimnasio a lo largo del año.

> [!NOTE]
> **Prompt para ejecución:**
> "Implementá la sección de histórico por género en `estadisticas/page.tsx`. Consultá en Supabase los registros históricos de la tabla `estadisticas_mensuales` de los últimos 12 meses trayendo los campos `year`, `month`, `pct_hombres` y `pct_mujeres`. Debajo de la gráfica circular (donut) de género actual, integrá un nuevo bloque visual premium con un gráfico evolutivo de área o líneas (hombres vs mujeres) que muestre la tendencia de activos por género mes a mes. Si no se cuenta con gráficos complejos instalados, diseñá un listado visual interactivo o una tabla contable con barras horizontales de progreso porcentuales comparativas para cada mes de forma sumamente premium y moderna."

---

### 3. Ranking Dinámico de Asistencias (Top 10 por Género)
* **Descripción:** Ampliar la capacidad del ranking de asistencias de Top 5 a Top 10 y dotarlo de dinamismo por género. En lugar de una sola lista estática, la administración podrá alternar rápidamente mediante un selector entre el ranking general de alumnos, el ranking exclusivo de hombres y el ranking de mujeres.
* **Archivos a Modificar:**
  - [estadisticas/page.tsx](file:///c:/Users/Maximo/Documents/sistema-alfa/app/(app)/estadisticas/page.tsx):
    - Modificar la función `fetchRanking` para traer el nombre y el **género** del alumno asociado a la asistencia: `.select('alumno_id, alumnos!inner(nombre, genero)')`.
    - Ampliar el procesamiento en memoria (Map) para agrupar y ordenar a los alumnos más asistidores, extrayendo el **Top 10** general, Top 10 masculinos y Top 10 femeninos.
    - Crear un estado local en el componente React (`const [filtroGenero, setFiltroGenero] = useState<'todos' | 'Masculino' | 'Femenino'>('todos')`) para rastrear qué ranking se debe mostrar.
    - En el bloque de UI del Ranking, reemplazar el título estático de 'Top 5' por 'Top 10 Asistencias' e incorporar un selector dinámico premium (estilo botones de pestañas encapsulados tipo píldora: 'General', 'Hombres', 'Mujeres').
    - Ajustar la medallas (🥇, 🥈, 🥉) para los tres primeros puestos y listar las posiciones 4 a 10 con un estilo visual limpio e integrado.

> [!NOTE]
> **Prompt para ejecución:**
> "Modificá de forma integral el bloque de rankings en `estadisticas/page.tsx`. 1) Modificá la consulta de Supabase en `fetchRanking` para obtener el género del alumno de forma atómica: `alumnos!inner(nombre, genero)`. 2) Procesá las asistencias en JS agrupándolas en 3 listas ordenadas (Top 10 General, Top 10 de alumnos 'Masculino' y Top 10 de alumnas 'Femenino'). 3) En la UI de la tarjeta del ranking, agregá un interruptor selector de género de aspecto premium (tipo Segmented Control o pestañas minimalistas con fondo gris suave y botón activo en contraste naranja/rojo). 4) Al cambiar el selector, mostrá instantáneamente la lista correspondiente de los 10 alumnos con más asistencia con sus medallas de podio e íconos estilizados. Asegurá que el ranking general sea la vista predeterminada al cargar la página."
