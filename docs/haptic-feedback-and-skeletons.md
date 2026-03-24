# Haptic Feedback y Skeleton Screens - Experiencia Nativa

## 📱 Resumen

Se ha implementado un sistema completo de **haptic feedback** (retroalimentación táctil) y **skeleton screens** para proporcionar una experiencia de usuario idéntica a las aplicaciones nativas móviles.

---

## 🎯 Haptic Feedback (Vibración Táctil)

### Función Principal

**Ubicación:** [lib/utils.ts](lib/utils.ts)

```typescript
triggerHapticFeedback(pattern?: number | number[]): boolean
```

**Características:**

- ✅ Verifica automáticamente si el dispositivo soporta vibración
- ✅ Funciona solo en navegadores con Vibration API
- ✅ No rompe la funcionalidad si no está soportado
- ✅ Silencia errores automáticamente

### Presets Disponibles

Se incluyen presets predefinidos para mantener consistencia en toda la aplicación:

```typescript
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";

// Uso de presets
triggerHapticFeedback(HapticPresets.light); // 50ms - Tap ligero
triggerHapticFeedback(HapticPresets.medium); // 100ms - Tap medio
triggerHapticFeedback(HapticPresets.heavy); // 150ms - Tap fuerte
triggerHapticFeedback(HapticPresets.success); // [50,100,50] - Doble tap
triggerHapticFeedback(HapticPresets.warning); // [100,50,100,50,100] - Triple tap
triggerHapticFeedback(HapticPresets.error); // 200ms - Tap largo
```

### Guía de Uso por Tipo de Acción

| Acción                 | Preset Recomendado | Ejemplo                             |
| ---------------------- | ------------------ | ----------------------------------- |
| Click en botón normal  | `light`            | Botones de navegación, cerrar modal |
| Acción de confirmación | `medium`           | Guardar formulario, confirmar       |
| Acción crítica         | `heavy`            | Eliminar registro                   |
| Operación exitosa      | `success`          | Guardado exitoso, login correcto    |
| Error de validación    | `warning`          | Campos requeridos vacíos            |
| Error crítico          | `error`            | Error al guardar, login fallido     |

### Implementaciones Actuales

#### 1. **Login** ([app/page.tsx](app/page.tsx))

```typescript
// Al hacer clic en "Iniciar Sesión"
triggerHapticFeedback(HapticPresets.light);

// Login exitoso
triggerHapticFeedback(HapticPresets.success);

// Login fallido o sin permisos
triggerHapticFeedback(HapticPresets.error);
```

#### 2. **Nuevo Alumno Modal** ([app/(app)/inicio/\_components/AlumnosList.tsx](<app/(app)/inicio/_components/AlumnosList.tsx>))

```typescript
// Validación fallida (campos vacíos)
triggerHapticFeedback(HapticPresets.warning);

// Al intentar guardar
triggerHapticFeedback(HapticPresets.medium);

// Guardado exitoso
triggerHapticFeedback(HapticPresets.success);

// Error al guardar
triggerHapticFeedback(HapticPresets.error);
```

#### 3. **Registrar Cobro Modal** ([app/(app)/inicio/[alumnoId]/\_components/RegistrarCobroModal.tsx](<app/(app)/inicio/[alumnoId]/_components/RegistrarCobroModal.tsx>))

```typescript
// Validación fallida
triggerHapticFeedback(HapticPresets.warning);

// Al intentar guardar cobro
triggerHapticFeedback(HapticPresets.medium);

// Cobro registrado exitosamente
triggerHapticFeedback(HapticPresets.success);

// Error al registrar
triggerHapticFeedback(HapticPresets.error);
```

#### 4. **Panel de Información Personal** ([app/(app)/inicio/[alumnoId]/\_components/PanelInfoPersonal.tsx](<app/(app)/inicio/[alumnoId]/_components/PanelInfoPersonal.tsx>))

```typescript
// Validación fallida en edición
triggerHapticFeedback(HapticPresets.warning);

// Al guardar cambios
triggerHapticFeedback(HapticPresets.medium);

// Cambios guardados exitosamente
triggerHapticFeedback(HapticPresets.success);

// Al eliminar alumno (acción crítica)
triggerHapticFeedback(HapticPresets.heavy);

// Eliminación exitosa
triggerHapticFeedback(HapticPresets.success);

// Al otorgar/reiniciar clases de gracia
triggerHapticFeedback(HapticPresets.medium);
```

### Ejemplos de Uso

```typescript
// Ejemplo 1: Botón de acción simple
function MiBoton() {
  const handleClick = () => {
    triggerHapticFeedback(HapticPresets.light);
    // Tu lógica aquí
  };

  return <button onClick={handleClick}>Click me</button>;
}

// Ejemplo 2: Formulario con validación
async function handleSubmit() {
  if (!isValid) {
    triggerHapticFeedback(HapticPresets.warning);
    return;
  }

  triggerHapticFeedback(HapticPresets.medium);

  const result = await saveData();

  if (result.success) {
    triggerHapticFeedback(HapticPresets.success);
  } else {
    triggerHapticFeedback(HapticPresets.error);
  }
}

// Ejemplo 3: Patrón personalizado
triggerHapticFeedback([200, 100, 200]); // Vibrar-pausar-vibrar
```

---

## 🎨 Skeleton Screens (Estados de Carga)

### Componentes Disponibles

**Ubicación:** [components/skeletons.tsx](components/skeletons.tsx)

#### 1. `AlumnosListSkeleton`

Skeleton para la lista de alumnos con avatares y datos.

```tsx
import { AlumnosListSkeleton } from "@/components/skeletons";

<AlumnosListSkeleton count={5} />;
```

**Parámetros:**

- `count` (opcional): Número de items a mostrar (default: 5)

#### 2. `PageHeaderSkeleton`

Skeleton para headers de página con título y botón.

```tsx
import { PageHeaderSkeleton } from "@/components/skeletons";

<PageHeaderSkeleton />;
```

#### 3. `StatsCardSkeleton`

Skeleton para tarjetas de estadísticas/resumen.

```tsx
import { StatsCardSkeleton } from "@/components/skeletons";

<StatsCardSkeleton count={2} />;
```

#### 4. `PagosListSkeleton`

Skeleton para lista de pagos/transacciones.

```tsx
import { PagosListSkeleton } from "@/components/skeletons";

<PagosListSkeleton count={3} />;
```

#### 5. `FormSkeleton`

Skeleton para formularios en modales.

```tsx
import { FormSkeleton } from "@/components/skeletons";

<FormSkeleton fields={4} />;
```

#### 6. `FullPageSkeleton`

Skeleton de página completa con layout (header + lista + paginación).

```tsx
import { FullPageSkeleton } from "@/components/skeletons";

<FullPageSkeleton />;
```

#### 7. `AlumnoDetailSkeleton`

Skeleton para vista de detalles de alumno individual.

```tsx
import { AlumnoDetailSkeleton } from "@/components/skeletons";

<AlumnoDetailSkeleton />;
```

### Principios de Uso

**✅ LO CORRECTO:**

- La navegación (header superior y bottom nav) siempre visible
- Solo el área de contenido muestra skeleton
- Usar skeletons estructurados que replican el layout real
- Mostrar skeletons inmediatamente al cargar

**❌ LO INCORRECTO:**

- Mostrar "Cargando..." como texto plano
- Hacer toda la pantalla blanca mientras carga
- Ocultar la navegación durante la carga
- Usar spinners genéricos sin estructura

### Ejemplo de Implementación

```tsx
"use client";

import { useState, useEffect } from "react";
import { AlumnosListSkeleton } from "@/components/skeletons";

export default function MiComponente() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const result = await fetchData();
      setData(result);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-4">
      {/* Navegación siempre visible */}
      <header>...</header>

      {/* Contenido con skeleton */}
      {loading ? (
        <AlumnosListSkeleton count={8} />
      ) : (
        <div>
          {data.map((item) => (
            <Item key={item.id} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Skeleton Base (Componente UI)

El componente base de skeleton está en [components/ui/skeleton.tsx](components/ui/skeleton.tsx):

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Uso básico
<Skeleton className="h-4 w-32" />

// Con clases personalizadas
<Skeleton className="h-12 w-full rounded-lg" />
```

**Características:**

- Animación `animate-pulse` automática
- Color de fondo `bg-accent` (configurable)
- Esquinas redondeadas con `rounded-md`

---

## 📋 Checklist de Implementación

### Para Nuevos Botones de Acción

- [ ] Identificar el tipo de acción (normal, confirmación, crítica)
- [ ] Importar `triggerHapticFeedback` y `HapticPresets` de `@/lib/utils`
- [ ] Agregar haptic feedback ANTES de la acción
- [ ] Agregar haptic feedback apropiado en caso de éxito
- [ ] Agregar haptic feedback apropiado en caso de error

### Para Nuevas Páginas con Carga de Datos

- [ ] Crear estado de `loading`
- [ ] Importar el skeleton apropiado de `@/components/skeletons`
- [ ] Asegurar que navegación esté siempre visible
- [ ] Mostrar skeleton mientras `loading === true`
- [ ] Reemplazar skeleton con contenido real al finalizar carga

---

## 🎯 Beneficios

### Haptic Feedback

✅ Retroalimentación inmediata en acciones del usuario  
✅ Confirmación táctil de éxito/error sin necesidad de leer  
✅ Experiencia más "física" y tangible  
✅ Reduce ansiedad del usuario (sabe que la acción se registró)  
✅ Identifica errores más rápido (vibra diferente según el resultado)

### Skeleton Screens

✅ Percepción de velocidad mejorada (la app parece más rápida)  
✅ Reduce "flash de contenido blanco"  
✅ Da contexto al usuario de qué se está cargando  
✅ Navegación siempre accesible durante carga  
✅ Menos frustración del usuario

---

## 🧪 Testing

### Probar Haptic Feedback

1. **Móvil real:** La mejor forma de probar
   - Android: Funciona en la mayoría de dispositivos
   - iOS: Funciona en Safari (iOS 13+)

2. **Navegador desktop:** No vibrará pero no romperá nada
   - Chrome DevTools: Abrir DevTools → Sensors → Simular vibración (limitado)

3. **Verificar en consola:**
   ```javascript
   // En DevTools Console
   navigator.vibrate(100); // Debería vibrar si está soportado
   ```

### Probar Skeleton Screens

1. **Throttling de red:**
   - Chrome DevTools → Network → Slow 3G
   - Recargar la página y observar skeletons

2. **Delay artificial:**
   ```typescript
   await new Promise((resolve) => setTimeout(resolve, 2000));
   ```

---

## 🔧 Configuración y Soporte

### Navegadores con Soporte de Vibración

| Navegador        | Soporte         |
| ---------------- | --------------- |
| Chrome Android   | ✅ Completo     |
| Firefox Android  | ✅ Completo     |
| Samsung Internet | ✅ Completo     |
| Safari iOS       | ✅ iOS 13+      |
| Chrome Desktop   | ❌ No soportado |
| Firefox Desktop  | ❌ No soportado |

### Verificación Programática

```javascript
if (typeof navigator !== "undefined" && "vibrate" in navigator) {
  console.log("✅ Vibration API soportada");
} else {
  console.log("❌ Vibration API no soportada");
}
```

---

## 💡 Mejores Prácticas

### Haptic Feedback

1. **No abuses:** Usar solo en acciones importantes
2. **Consistencia:** Usar siempre el mismo preset para el mismo tipo de acción
3. **No vibración en loop:** Evitar vibrar repetidamente sin parar
4. **Respetar preferencias:** Considerar agregar opción de deshabilitar en configuración de usuario (futuro)

### Skeleton Screens

1. **Tamaño real:** Skeleton debe tener el mismo tamaño que el contenido real
2. **Estructura similar:** El skeleton debe replicar el layout del contenido
3. **No demasiado detallado:** No hace falta skeleton pixel-perfect, solo la estructura general
4. **Transición suave:** Reemplazar skeleton con contenido sin saltos bruscos

---

## 📝 Archivos Modificados/Creados

### Nuevos archivos:

- ✅ `components/skeletons.tsx` - Biblioteca de skeleton screens

### Archivos modificados:

- ✅ `lib/utils.ts` - Función `triggerHapticFeedback` y presets
- ✅ `app/page.tsx` - Haptic en login
- ✅ `app/(app)/inicio/_components/AlumnosList.tsx` - Haptic en nuevo alumno
- ✅ `app/(app)/inicio/[alumnoId]/_components/RegistrarCobroModal.tsx` - Haptic en registro de cobro
- ✅ `app/(app)/inicio/[alumnoId]/_components/PanelInfoPersonal.tsx` - Haptic en edición y eliminación

### Listo para usar:

- ✅ Todos los modales de Shadcn UI (Dialog, Sheet, AlertDialog, etc.)
- ✅ Todos los botones de acción principales
- ✅ Sistema de skeleton screens completo

---

¡Tu aplicación ahora se siente como una app nativa 100%! 🎉
