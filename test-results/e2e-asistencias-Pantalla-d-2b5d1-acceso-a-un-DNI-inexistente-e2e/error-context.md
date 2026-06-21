# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\asistencias.spec.ts >> Pantalla de Asistencia y Check-in >> Debería denegar el acceso a un DNI inexistente
- Location: tests\e2e\asistencias.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('p:has-text("DNI no encontrado")')
Expected: visible
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 25000ms
  - waiting for locator('p:has-text("DNI no encontrado")')

```

```yaml
- complementary:
  - link "Mejor logo":
    - /url: /inicio
    - img "Mejor logo"
  - navigation:
    - link "Alumnos":
      - /url: /inicio
    - button "Planificacion"
    - link "Productos y Ventas":
      - /url: /productos-ventas
    - link "Comunicacion":
      - /url: /comunicacion
    - link "Administracion":
      - /url: /administracion
  - link "Ingreso Web":
    - /url: /ingreso-web
  - button "Colapsar"
  - text: Administrador test@gmail.com
  - button "Cerrar Sesion"
- main:
  - main:
    - img "Alfa Club"
    - paragraph: ALFA CLUB
    - paragraph: Control de Ingreso
    - textbox "Ingresá tu DNI..."
    - button "Verificar" [disabled]
    - img "Alfa Club"
    - heading "Verificá tu estado" [level=2]
    - paragraph: Ingresá tu DNI en el campo de arriba para verificar tu cuota
- text: Sin conexion — los cambios se sincronizaran al reconectar
- region "Notifications alt+T"
- alert
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
> 20 |     await expect(msgError).toBeVisible({ timeout: 25000 });
     |                            ^ Error: expect(locator).toBeVisible() failed
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
  49 |     await tarjetaAlumno.click();
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