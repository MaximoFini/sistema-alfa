---
name: "audit"
description: "Analiza el archivo abierto o flujo seleccionado buscando cuellos de botella de performance. Devuelve una tabla con los problemas encontrados y el código refactorizado."
---

# Auditor de Performance (/audit)

## Objetivo
Analizar el código proporcionado (archivo abierto o flujo seleccionado) para detectar problemas de rendimiento y cuellos de botella, ofreciendo soluciones optimizadas.

## Instrucciones de Ejecución

Cuando el usuario active este flujo mediante el comando `/audit`, el agente deberá realizar los siguientes pasos de manera automática:

1. **Lectura del Contexto:**
   - Analiza inmediatamente el archivo que el usuario tiene abierto o el fragmento de código que ha seleccionado/compartido.

2. **Detección de Cuellos de Botella:**
   Inspecciona el código buscando los siguientes anti-patrones:
   - **Llamadas redundantes:** Peticiones repetitivas a la base de datos o a APIs externas (ej. N+1 queries).
   - **Bloqueos del Hilo Principal:** Tareas síncronas pesadas, funciones bloqueantes, o uso ineficiente de asincronía (`async/await`, `Promise.all`).
   - **Re-renders Innecesarios:** Componentes de la interfaz (ej. React) que se renderizan sin control por falta de `useMemo`, `useCallback`, o mal manejo de dependencias.
   - **Fugas de Memoria / Bucles Infinitos:** Suscripciones no canceladas o iteraciones mal diseñadas.

3. **Generación del Reporte:**
   - Responde con una tabla estructurada en Markdown que contenga las siguientes columnas:
     - **Problema Encontrado**: Descripción concisa del cuello de botella.
     - **Ubicación (Líneas)**: Dónde se encuentra el problema.
     - **Impacto**: Alto / Medio / Bajo.
     - **Explicación**: Por qué es un problema y cómo afecta la velocidad de respuesta.

4. **Propuesta de Código Refactorizado:**
   - Debajo de la tabla, provee el bloque de **código refactorizado**. Este código debe resolver todos los problemas listados en la tabla, aplicando las mejores prácticas de performance y estando listo para ser utilizado.
