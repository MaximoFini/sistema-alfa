# Manejo Nativo del Botón "Atrás" - History API

## 📱 Resumen

Se ha implementado un sistema completo para manejar el botón "Atrás" del navegador/dispositivo en todos los modales, dialogs, sheets y drawers de la aplicación. Esto proporciona una experiencia de usuario idéntica a las aplicaciones nativas móviles.

## 🎯 Comportamiento

**Cuando un modal se abre:**

- Se agrega una entrada al historial del navegador (`window.history.pushState`)
- Si el usuario presiona el botón "Atrás" (gesto nativo en móviles o botón del navegador), el modal se cierra en lugar de navegar a la página anterior

**Cuando un modal se cierra manualmente:**

- Al hacer clic en el botón "X" o fuera del modal
- El historial se limpia automáticamente (`window.history.back()`)
- No quedan estados huérfanos en el historial

## ✅ Componentes con Soporte Automático

Todos estos componentes de Shadcn UI ahora incluyen el manejo del botón "Atrás" de forma automática:

### 1. `<Sheet>` (components/ui/sheet.tsx)

```tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function MiComponente() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>Abrir</SheetTrigger>
      <SheetContent>{/* Contenido del sheet */}</SheetContent>
    </Sheet>
  );
}
```

### 2. `<Dialog>` (components/ui/dialog.tsx)

```tsx
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

function MiComponente() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Abrir</DialogTrigger>
      <DialogContent>{/* Contenido del dialog */}</DialogContent>
    </Dialog>
  );
}
```

### 3. `<AlertDialog>` (components/ui/alert-dialog.tsx)

```tsx
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

function MiComponente() {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>{/* Contenido del alert */}</AlertDialogContent>
    </AlertDialog>
  );
}
```

### 4. `<BottomSheet>` (components/ui/bottom-sheet.tsx)

```tsx
import { BottomSheet } from "@/components/ui/bottom-sheet";

function MiComponente() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
      {/* Contenido del bottom sheet */}
    </BottomSheet>
  );
}
```

### 5. `<Drawer>` (components/ui/drawer.tsx)

```tsx
import { Drawer, DrawerContent } from "@/components/ui/drawer";

function MiComponente() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>{/* Contenido del drawer */}</DrawerContent>
    </Drawer>
  );
}
```

## 🛠️ Para Modales Personalizados

Si tienes un modal personalizado que NO usa los componentes de Shadcn UI, usa el componente wrapper `<ModalWithHistory>`:

### Opción A: Usar el wrapper `<ModalWithHistory>`

```tsx
import { ModalWithHistory } from "@/components/ModalWithHistory";

function MiComponente() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModalWithHistory isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <MiModalPersonalizado onClose={() => setIsOpen(false)} />
    </ModalWithHistory>
  );
}
```

**Ejemplo real del código:**

```tsx
// En AlumnosList.tsx
<ModalWithHistory isOpen={showModal} onClose={() => setShowModal(false)}>
  <NuevoAlumnoModal
    onClose={() => setShowModal(false)}
    onGuardado={handleGuardado}
  />
</ModalWithHistory>
```

### Opción B: Usar el hook directamente

```tsx
import { useModalHistory } from "@/hooks/use-modal-history";

function MiModalPersonalizado({ isOpen, onClose }: Props) {
  // Hook que maneja automáticamente el botón "Atrás"
  useModalHistory(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60" onClick={onClose}>
      {/* Contenido del modal */}
    </div>
  );
}
```

## 📦 Archivos Modificados/Creados

### Nuevos archivos:

- ✅ `hooks/use-modal-history.ts` - Hook principal
- ✅ `components/ModalWithHistory.tsx` - Wrapper para modales personalizados

### Archivos modificados:

- ✅ `components/ui/sheet.tsx` - Integración automática
- ✅ `components/ui/dialog.tsx` - Integración automática
- ✅ `components/ui/alert-dialog.tsx` - Integración automática
- ✅ `components/ui/bottom-sheet.tsx` - Integración automática
- ✅ `components/ui/drawer.tsx` - Integración automática
- ✅ `app/(app)/inicio/_components/AlumnosList.tsx` - Ejemplo de uso
- ✅ `app/(app)/inicio/[alumnoId]/_components/TabPagos.tsx` - Ejemplo de uso

## 🧪 Pruebas Recomendadas

1. **Móvil:**
   - Abrir un modal/sheet/dialog
   - Usar el gesto de "Atrás" del dispositivo
   - Verificar que el modal se cierra en lugar de navegar

2. **Desktop:**
   - Abrir un modal
   - Presionar el botón "Atrás" del navegador
   - Verificar que el modal se cierra

3. **Cierre manual:**
   - Abrir un modal
   - Cerrarlo con el botón "X"
   - Presionar "Atrás" en el navegador
   - Verificar que navega normalmente (no se reabre el modal)

## 🎯 Ventajas

- ✅ **Experiencia nativa:** Los usuarios móviles pueden cerrar modales con el gesto/botón "Atrás"
- ✅ **Sin configuración:** Todos los componentes de Shadcn UI funcionan automáticamente
- ✅ **Sin estados huérfanos:** El historial se limpia correctamente al cerrar manualmente
- ✅ **Compatibilidad:** Funciona en todos los navegadores modernos (iOS Safari, Chrome Android, etc.)
- ✅ **No invasivo:** No rompe la lógica existente de los componentes

## 🔧 Detalles Técnicos

El hook `useModalHistory` implementa:

1. **Push al historial cuando se abre:**

   ```javascript
   window.history.pushState({ modalOpen: true }, "", window.location.href);
   ```

2. **Listener para popstate:**

   ```javascript
   window.addEventListener("popstate", handlePopState);
   ```

3. **Limpieza automática:**
   - Al cerrar manualmente: `window.history.back()`
   - Verifica el estado antes de limpiar para evitar navegación no deseada

## 💡 Notas Importantes

- El hook solo agrega UNA entrada al historial por modal (no múltiples)
- Si abres modal A y luego modal B, cada uno tiene su propia entrada
- El estado se mantiene con refs para evitar problemas de closure
- Compatible con navegación del lado del servidor (Next.js)
