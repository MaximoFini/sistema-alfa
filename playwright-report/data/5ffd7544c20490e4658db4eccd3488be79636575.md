# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\asistencias.spec.ts >> Pantalla de Asistencia y Check-in >> Debería registrar ingreso autorizado para alumno al día
- Location: tests\e2e\asistencias.spec.ts:23:7

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('p:has-text("Alumno Asistencia E2E 2243")')

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
                - 'textbox "Ej: Juan García" [ref=e79]': Alumno Asistencia E2E 2243
              - generic [ref=e80]:
                - generic [ref=e81]: DNI *
                - 'textbox "Ej: 38765432" [ref=e82]': "96836901"
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
                  - text: "96836901"
                - button "Limpiar búsqueda" [ref=e140]:
                  - img [ref=e141]
              - generic [ref=e144]:
                - img [ref=e145]
                - generic [ref=e147]: Pág. 1/1
            - paragraph [ref=e148]:
              - text: 0 resultados para
              - generic [ref=e149]: “96836901”
    - generic [ref=e242]: Sin conexion — los cambios se sincronizaran al reconectar
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e248] [cursor=pointer]:
    - img [ref=e249]
  - alert [ref=e252]: Alfa Club
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Pantalla de Asistencia y Check-in', () => {
  4  |   test('Debería denegar el acceso a un DNI inexistente', async ({ page }) => {
  5  |     // Aumentar timeout por compilación dev
  6  |     test.slow();
  7  | 
  8  |     // Ir a la vista cliente de ingreso web
  9  |     await page.goto('/ingreso-web?view=client');
  10 | 
  11 |     const inputDni = page.getByPlaceholder('Ingresá tu DNI...');
  12 |     await expect(inputDni).toBeVisible();
  13 | 
  14 |     // Ingresar un DNI que no existe
  15 |     await inputDni.fill('12345678');
  16 |     await page.keyboard.press('Enter');
  17 | 
  18 |     // Verificar que muestre el mensaje de error
  19 |     const msgError = page.locator('p:has-text("DNI no encontrado")');
  20 |     await expect(msgError).toBeVisible({ timeout: 25000 });
  21 |   });
  22 | 
  23 |   test('Debería registrar ingreso autorizado para alumno al día', async ({ page }) => {
  24 |     test.slow();
  25 |     // Generar datos únicos
  26 |     const testDni = `96${Math.floor(100000 + Math.random() * 900000)}`;
  27 |     const testNombre = `Alumno Asistencia E2E ${Math.floor(1000 + Math.random() * 9000)}`;
  28 | 
  29 |     // 1. Crear el alumno en la administración
  30 |     await page.goto('/inicio');
  31 |     await page.getByRole('button', { name: 'Crear Alumno' }).click();
  32 | 
  33 |     await page.fill('input[placeholder="Ej: Juan García"]', testNombre);
  34 |     await page.fill('input[placeholder="Ej: 38765432"]', testDni);
  35 |     await page.fill('input[placeholder="Ej: 11-4521-0011"]', '1122334455');
  36 |     await page.fill('input[type="date"]', '1990-05-10');
  37 |     await page.selectOption('label:has-text("Género *") + div select', { label: 'Masculino' });
  38 | 
  39 |     // Guardar alumno
  40 |     await page.getByRole('button', { name: 'Guardar Datos Alumnos' }).click();
  41 |     await page.waitForTimeout(300);
  42 | 
  43 |     // 2. Buscar al alumno y registrarle un pago para que esté "Al Día"
  44 |     const buscador = page.getByPlaceholder('Buscar por nombre o DNI...');
  45 |     await buscador.fill(testDni);
  46 |     await page.waitForTimeout(500);
  47 | 
  48 |     const tarjetaAlumno = page.locator(`p:has-text("${testNombre}")`);
> 49 |     await tarjetaAlumno.click();
     |                         ^ Error: locator.click: Test timeout of 90000ms exceeded.
  50 |     await expect(page).toHaveURL(/\/inicio\/.+/);
  51 | 
  52 |     // Registrar pago
  53 |     const btnCobro = page.locator('button:has-text("Registrar Primer Cobro"), button:has-text("Registrar Cobro")').first();
  54 |     await btnCobro.click();
  55 | 
  56 |     const selectPlan = page.locator('label:has-text("Actividad *") + div select');
  57 |     await selectPlan.selectOption({ index: 1 });
  58 | 
  59 |     const selectMedioPago = page.locator('label:has-text("Medio de Pago *") + div select');
  60 |     await selectMedioPago.selectOption({ index: 1 });
  61 | 
  62 |     const btnRegistrarCobro = page.locator('button:has-text("Registrar Cobro")').last();
  63 |     await btnRegistrarCobro.click();
  64 |     await page.waitForTimeout(500);
  65 | 
  66 |     // 3. Ir a la pantalla de asistencia /ingreso-web?view=client
  67 |     await page.goto('/ingreso-web?view=client');
  68 | 
  69 |     // 4. Ingresar el DNI del alumno al día
  70 |     const inputDni = page.getByPlaceholder('Ingresá tu DNI...');
  71 |     await expect(inputDni).toBeVisible();
  72 |     await inputDni.fill(testDni);
  73 |     await page.keyboard.press('Enter');
  74 | 
  75 |     // 5. Verificar que muestre "INGRESO AUTORIZADO"
  76 |     // Buscamos el texto que se renderiza para el estado al-dia en el tema de la UI cliente
  77 |     // clientEstadoTheme.al-dia.label es "INGRESO AUTORIZADO"
  78 |     const msgAutorizado = page.locator('p:has-text("INGRESO AUTORIZADO")');
  79 |     await expect(msgAutorizado).toBeVisible({ timeout: 10000 });
  80 |   });
  81 | });
  82 | 
```