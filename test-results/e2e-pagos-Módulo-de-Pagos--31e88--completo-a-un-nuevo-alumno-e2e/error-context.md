# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\pagos.spec.ts >> Módulo de Pagos >> Debería registrar un cobro completo a un nuevo alumno
- Location: tests\e2e\pagos.spec.ts:4:7

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('p:has-text("Alumno Pago E2E 4947")')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e4]:
      - link "Mejor logo" [ref=e5] [cursor=pointer]:
        - /url: /inicio
        - img "Mejor logo" [ref=e6]
      - navigation [ref=e7]:
        - link "Alumnos" [ref=e8] [cursor=pointer]:
          - /url: /inicio
          - img [ref=e9]
          - generic [ref=e14]: Alumnos
        - button "Planificacion" [ref=e16]:
          - img [ref=e17]
          - generic [ref=e19]: Planificacion
          - img [ref=e20]
        - link "Productos y Ventas" [ref=e22] [cursor=pointer]:
          - /url: /productos-ventas
          - img [ref=e23]
          - generic [ref=e26]: Productos y Ventas
        - link "Comunicacion" [ref=e27] [cursor=pointer]:
          - /url: /comunicacion
          - img [ref=e28]
          - generic [ref=e30]: Comunicacion
        - link "Administracion" [ref=e31] [cursor=pointer]:
          - /url: /administracion
          - img [ref=e32]
          - generic [ref=e35]: Administracion
      - link "Ingreso Web" [ref=e37] [cursor=pointer]:
        - /url: /ingreso-web
        - img [ref=e38]
        - generic [ref=e41]: Ingreso Web
      - generic [ref=e42]:
        - button "Colapsar" [ref=e43]:
          - img [ref=e44]
          - generic [ref=e46]: Colapsar
        - generic [ref=e47]:
          - img [ref=e49]
          - generic [ref=e52]:
            - generic [ref=e53]: Administrador
            - generic [ref=e54]: test@gmail.com
        - button "Cerrar Sesion" [ref=e55]:
          - img [ref=e56]
          - generic [ref=e59]: Cerrar Sesion
    - main [ref=e60]:
      - generic [ref=e61]:
        - generic:
          - img "Sistema Alfa Background"
        - generic [ref=e63]:
          - generic [ref=e64]:
            - generic [ref=e65]:
              - heading "Nuevo Alumno" [level=2] [ref=e66]
              - paragraph [ref=e67]: Completá los datos personales.
              - generic [ref=e69]:
                - generic [ref=e70]: ↵ Enter
                - text: para navegación rápida
            - button "Cerrar" [ref=e71]:
              - img [ref=e72]
          - generic [ref=e75]:
            - generic [ref=e76]:
              - generic [ref=e77]:
                - generic [ref=e78]: Nombre completo *
                - 'textbox "Ej: Juan García" [ref=e79]': Alumno Pago E2E 4947
              - generic [ref=e80]:
                - generic [ref=e81]: DNI *
                - 'textbox "Ej: 38765432" [ref=e82]': "97206883"
              - generic [ref=e83]:
                - generic [ref=e84]: Nacimiento *
                - textbox [ref=e85]: 1990-05-10
              - generic [ref=e86]:
                - generic [ref=e87]: Registro *
                - textbox [ref=e88]: 2026-06-15
              - generic [ref=e89]:
                - generic [ref=e90]: Teléfono *
                - 'textbox "Ej: 11-4521-0011" [ref=e91]': "1122334455"
              - generic [ref=e92]:
                - generic [ref=e93]: Género *
                - generic [ref=e94]:
                  - combobox [ref=e95]:
                    - option "Seleccionar..."
                    - option "Masculino" [selected]
                    - option "Femenino"
                  - img
              - generic [ref=e96]:
                - generic [ref=e97]: Dirección *
                - 'textbox "Ej: Av. Corrientes 1234" [ref=e98]'
                - generic [ref=e99]: La dirección es requerida
              - generic [ref=e100]:
                - generic [ref=e101]: Email
                - 'textbox "Ej: juan@gmail.com" [ref=e102]'
              - generic [ref=e103]:
                - generic [ref=e104]: Contacto de Emergencia *
                - 'textbox "Ej: 11-4521-0012 (Mamá)" [ref=e105]'
                - generic [ref=e106]: El contacto de emergencia es requerido
              - generic [ref=e107]:
                - generic [ref=e108]: Observaciones (Opcional)
                - 'textbox "Ej: Alergia al polvo, lesión en rodilla derecha" [ref=e109]'
            - generic [ref=e110]:
              - button "Guardar y Registrar Cobro" [ref=e111]
              - generic [ref=e112]:
                - button "Cancelar" [ref=e113]
                - button "Guardar Datos Alumnos" [ref=e114]
        - generic [ref=e116]:
          - generic [ref=e118]:
            - generic [ref=e119]:
              - img [ref=e121]
              - generic [ref=e126]:
                - heading "Alumnos" [level=1] [ref=e127]
                - paragraph [ref=e128]: 0 alumnos registrados · ordenados por orden de entrada
            - button "Crear Alumno" [ref=e129]:
              - img [ref=e130]
              - generic [ref=e131]: Crear Alumno
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e135]:
                - img [ref=e136]
                - textbox "Buscar alumno" [active] [ref=e139]:
                  - /placeholder: Buscar por nombre o DNI...
                  - text: "97206883"
                - button "Limpiar búsqueda" [ref=e140]:
                  - img [ref=e141]
              - generic [ref=e144]:
                - img [ref=e145]
                - generic [ref=e147]: Pág. 1/1
            - paragraph [ref=e148]:
              - text: 0 resultados para
              - generic [ref=e149]: “97206883”
    - generic [ref=e242]: Sin conexion — los cambios se sincronizaran al reconectar
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e248] [cursor=pointer]:
    - img [ref=e249]
  - alert [ref=e252]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Módulo de Pagos', () => {
  4  |   test('Debería registrar un cobro completo a un nuevo alumno', async ({ page }) => {
  5  |     test.slow();
  6  |     // Generar datos únicos del alumno
  7  |     const testDni = `97${Math.floor(100000 + Math.random() * 900000)}`;
  8  |     const testNombre = `Alumno Pago E2E ${Math.floor(1000 + Math.random() * 9000)}`;
  9  | 
  10 |     // 1. Crear el alumno
  11 |     await page.goto('/inicio');
  12 |     await page.getByRole('button', { name: 'Crear Alumno' }).click();
  13 | 
  14 |     await page.fill('input[placeholder="Ej: Juan García"]', testNombre);
  15 |     await page.fill('input[placeholder="Ej: 38765432"]', testDni);
  16 |     await page.fill('input[placeholder="Ej: 11-4521-0011"]', '1122334455');
  17 |     await page.fill('input[type="date"]', '1990-05-10');
  18 |     await page.selectOption('label:has-text("Género *") + div select', { label: 'Masculino' });
  19 | 
  20 |     await page.getByRole('button', { name: 'Guardar Datos Alumnos' }).click();
  21 |     await page.waitForTimeout(300); // Pequeña espera para cerrar modal
  22 | 
  23 |     // 2. Buscar al alumno e ingresar a su perfil
  24 |     const buscador = page.getByPlaceholder('Buscar por nombre o DNI...');
  25 |     await buscador.fill(testDni);
  26 |     await page.waitForTimeout(500);
  27 | 
  28 |     const tarjetaAlumno = page.locator(`p:has-text("${testNombre}")`);
> 29 |     await tarjetaAlumno.click();
     |                         ^ Error: locator.click: Test timeout of 90000ms exceeded.
  30 |     await expect(page).toHaveURL(/\/inicio\/.+/);
  31 | 
  32 |     // 3. Abrir el modal de registrar cobro
  33 |     // Como es un alumno nuevo sin pagos previos, el botón dirá "Registrar Primer Cobro" o "Registrar Cobro"
  34 |     const btnCobro = page.locator('button:has-text("Registrar Primer Cobro"), button:has-text("Registrar Cobro")').first();
  35 |     await expect(btnCobro).toBeVisible();
  36 |     await btnCobro.click();
  37 | 
  38 |     // 4. Completar datos de pago
  39 |     // Seleccionar plan/actividad
  40 |     const selectPlan = page.locator('label:has-text("Actividad *") + div select');
  41 |     await expect(selectPlan).toBeVisible();
  42 |     await selectPlan.selectOption({ index: 1 }); // Selecciona el primer plan disponible
  43 | 
  44 |     // Seleccionar medio de pago
  45 |     const selectMedioPago = page.locator('label:has-text("Medio de Pago *") + div select');
  46 |     await expect(selectMedioPago).toBeVisible();
  47 |     // Seleccionar 'Efectivo' (suele estar presente) u opción index 1
  48 |     await selectMedioPago.selectOption({ index: 1 });
  49 | 
  50 |     // 5. Registrar el cobro
  51 |     const btnRegistrarCobro = page.locator('button:has-text("Registrar Cobro")').last();
  52 |     await expect(btnRegistrarCobro).toBeVisible();
  53 |     await btnRegistrarCobro.click();
  54 | 
  55 |     // Validar que el modal se cierre
  56 |     await expect(page.locator('h2:has-text("Registrar Cobro")')).not.toBeVisible();
  57 | 
  58 |     // 6. Verificar que aparezca en el historial de pagos del perfil del alumno
  59 |     // Debe haber un elemento en la lista que muestre la actividad o el plan registrado
  60 |     const listaPagos = page.locator('div:has-text("Historial de Pagos"), div:has-text("Cobros")');
  61 |     await expect(listaPagos).toBeVisible();
  62 |   });
  63 | });
  64 | 
```