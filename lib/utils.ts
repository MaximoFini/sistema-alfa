import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Dispara haptic feedback (vibración) en dispositivos móviles que lo soporten.
 * Solo funciona en navegadores que implementan la Vibration API.
 *
 * @param pattern - Duración en milisegundos o patrón de vibración
 *                  Número simple: vibración continua (ej: 50)
 *                  Array: patrón alternado [vibrar, pausar, vibrar, ...] (ej: [50, 100, 50])
 * @returns boolean - true si la vibración se ejecutó, false si no está soportada
 *
 * @example
 * // Vibración simple de 50ms (efecto de "tap" ligero)
 * triggerHapticFeedback(50);
 *
 * @example
 * // Vibración más fuerte para confirmación
 * triggerHapticFeedback(100);
 *
 * @example
 * // Patrón personalizado: tap-pausa-tap
 * triggerHapticFeedback([50, 100, 50]);
 */
export function triggerHapticFeedback(
  pattern: number | number[] = 50,
): boolean {
  // Verificar que estamos en el navegador y que la API está disponible
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch (error) {
      // Silenciar errores si la vibración falla
      console.debug("[Haptic] Vibration API error:", error);
      return false;
    }
  }
  return false;
}

/**
 * Presets de haptic feedback para diferentes interacciones.
 * Usar estos presets mantiene consistencia en toda la aplicación.
 */
export const HapticPresets = {
  /** Tap ligero - para botones normales, selección de items */
  light: 50,

  /** Tap medio - para botones de acción, confirmación */
  medium: 100,

  /** Tap fuerte - para acciones críticas, eliminar, guardar importante */
  heavy: 150,

  /** Doble tap - para éxito, completado */
  success: [50, 100, 50] as number[],

  /** Triple tap - para advertencia, error */
  warning: [100, 50, 100, 50, 100] as number[],

  /** Tap largo - para error crítico, rechazo */
  error: 200,
} as const;
