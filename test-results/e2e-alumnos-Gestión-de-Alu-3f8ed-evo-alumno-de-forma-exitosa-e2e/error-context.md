# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\alumnos.spec.ts >> Gestión de Alumnos >> Debería registrar un nuevo alumno de forma exitosa
- Location: tests\e2e\alumnos.spec.ts:8:7

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  locator('h2:has-text("Nuevo Alumno")')
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "not toBeVisible" with timeout 5000ms
  - waiting for locator('h2:has-text("Nuevo Alumno")')
    13 × locator resolved to <h2 class="text-base font-bold text-gray-900">Nuevo Alumno</h2>
       - unexpected value "visible"

```

```yaml
- heading "Nuevo Alumno" [level=2]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Gestión de Alumnos', () => {
  4   |   // Generar datos únicos para cada corrida de test
  5   |   const testDni = `99${Math.floor(100000 + Math.random() * 900000)}`; // DNI de 8 dígitos único
  6   |   const testNombre = `Test Alumno E2E ${Math.floor(1000 + Math.random() * 9000)}`;
  7   | 
  8   |   test('Debería registrar un nuevo alumno de forma exitosa', async ({ page }) => {
  9   |     test.slow();
  10  |     // 1. Ir a la pantalla de inicio
  11  |     await page.goto('/inicio');
  12  |     await expect(page).toHaveURL(/.*\/inicio/);
  13  | 
  14  |     // 2. Abrir el modal de creación de alumnos
  15  |     const btnCrear = page.getByRole('button', { name: 'Crear Alumno' });
  16  |     await expect(btnCrear).toBeVisible();
  17  |     await btnCrear.click();
  18  | 
  19  |     // 3. Rellenar los campos requeridos en el Paso 1
  20  |     await page.fill('input[placeholder="Ej: Juan García"]', testNombre);
  21  |     await page.fill('input[placeholder="Ej: 38765432"]', testDni);
  22  |     await page.fill('input[placeholder="Ej: 11-4521-0011"]', '1122334455');
  23  |     await page.fill('input[placeholder="Ej: Av. Corrientes 1234"]', 'Avenida General Paz 4567');
  24  |     await page.fill('input[placeholder="Ej: juan@gmail.com"]', 'alumno-test@example.com');
  25  |     await page.fill('input[type="date"]', '1995-08-15'); // Fecha de nacimiento
  26  |     await page.selectOption('label:has-text("Género *") + div select', { label: 'Masculino' });
  27  | 
  28  |     // 4. Guardar datos de alumno (sin cobro)
  29  |     const btnGuardarSoloDatos = page.getByRole('button', { name: 'Guardar Datos Alumnos' });
  30  |     await expect(btnGuardarSoloDatos).toBeVisible();
  31  |     await btnGuardarSoloDatos.click();
  32  | 
  33  |     // El modal debería cerrarse
  34  |     const modalHeader = page.locator('h2:has-text("Nuevo Alumno")');
> 35  |     await expect(modalHeader).not.toBeVisible();
      |                                   ^ Error: expect(locator).not.toBeVisible() failed
  36  | 
  37  |     // 5. Buscar al alumno creado en el buscador
  38  |     const buscador = page.getByPlaceholder('Buscar por nombre o DNI...');
  39  |     await expect(buscador).toBeVisible();
  40  |     await buscador.fill(testDni);
  41  |     
  42  |     // Esperar un momento a que aplique el debounce y filtre
  43  |     await page.waitForTimeout(500);
  44  | 
  45  |     // Validar que el alumno figure en la lista
  46  |     const tarjetaAlumno = page.locator(`p:has-text("${testNombre}")`);
  47  |     await expect(tarjetaAlumno).toBeVisible();
  48  |   });
  49  | 
  50  |   test('Debería permitir editar la información personal de un alumno', async ({ page }) => {
  51  |     test.slow();
  52  |     // 1. Ir a la pantalla de inicio y buscar al alumno creado en el test anterior
  53  |     await page.goto('/inicio');
  54  |     const buscador = page.getByPlaceholder('Buscar por nombre o DNI...');
  55  |     await buscador.fill(testDni);
  56  |     await page.waitForTimeout(500);
  57  | 
  58  |     const tarjetaAlumno = page.locator(`p:has-text("${testNombre}")`);
  59  |     await expect(tarjetaAlumno).toBeVisible();
  60  | 
  61  |     // 2. Hacer click en la tarjeta para entrar al perfil
  62  |     await tarjetaAlumno.click();
  63  |     await expect(page).toHaveURL(/\/inicio\/.+/);
  64  | 
  65  |     // 3. Abrir la edición de información personal
  66  |     // El botón Editar está dentro del panel de info personal
  67  |     const btnEditar = page.locator('button:has-text("Editar")').first();
  68  |     await expect(btnEditar).toBeVisible();
  69  |     await btnEditar.click();
  70  | 
  71  |     // 4. Modificar el teléfono de contacto y notas/observaciones
  72  |     await page.fill('input[placeholder="Ej: 11-4521-0011"]', '1199887766');
  73  |     await page.fill('textarea[placeholder="Ej: Alergia al polvo, lesión en rodilla derecha"]', 'Observación editada por test funcional');
  74  | 
  75  |     // 5. Guardar los cambios
  76  |     const btnGuardarCambios = page.getByRole('button', { name: 'Guardar' });
  77  |     await expect(btnGuardarCambios).toBeVisible();
  78  |     await btnGuardarCambios.click();
  79  | 
  80  |     // 6. Verificar que los cambios se visualicen
  81  |     await expect(page.locator('span:has-text("1199887766")')).toBeVisible();
  82  |     await expect(page.locator('p:has-text("Observación editada por test funcional")')).toBeVisible();
  83  |   });
  84  | 
  85  |   test('Debería permitir registrar un alumno en Clase de Prueba', async ({ page }) => {
  86  |     test.slow();
  87  |     const pruebaDni = `98${Math.floor(100000 + Math.random() * 900000)}`;
  88  |     const pruebaNombre = `Prueba E2E ${Math.floor(1000 + Math.random() * 9000)}`;
  89  | 
  90  |     await page.goto('/inicio');
  91  | 
  92  |     const btnCrear = page.getByRole('button', { name: 'Crear Alumno' });
  93  |     await btnCrear.click();
  94  | 
  95  |     // Completar datos del alumno
  96  |     await page.fill('input[placeholder="Ej: Juan García"]', pruebaNombre);
  97  |     await page.fill('input[placeholder="Ej: 38765432"]', pruebaDni);
  98  |     await page.fill('input[placeholder="Ej: 11-4521-0011"]', '1188223344');
  99  |     await page.fill('input[type="date"]', '2000-01-01');
  100 |     await page.selectOption('label:has-text("Género *") + div select', { label: 'Femenino' });
  101 | 
  102 |     // Marcar como Clase de Prueba si existe la opción en la UI
  103 |     // Miremos el esquema: es_prueba=true. Busquemos un checkbox en la UI
  104 |     const checkboxPrueba = page.locator('input[type="checkbox"][name="es_prueba"], label:has-text("Clase de Prueba") input[type="checkbox"]').first();
  105 |     if (await checkboxPrueba.count() > 0) {
  106 |       await checkboxPrueba.check();
  107 |       // Si se abre el select de actividad de interés
  108 |       const selectActividad = page.locator('select[name="actividad_interes"], select:has-text("Actividad")').first();
  109 |       if (await selectActividad.count() > 0) {
  110 |         await selectActividad.selectOption({ index: 1 });
  111 |       }
  112 |     }
  113 | 
  114 |     const btnGuardarSoloDatos = page.getByRole('button', { name: 'Guardar Datos Alumnos' });
  115 |     await btnGuardarSoloDatos.click();
  116 | 
  117 |     // Buscar en la lista
  118 |     const buscador = page.getByPlaceholder('Buscar por nombre o DNI...');
  119 |     await buscador.fill(pruebaDni);
  120 |     await page.waitForTimeout(500);
  121 | 
  122 |     const tarjetaPrueba = page.locator(`p:has-text("${pruebaNombre}")`);
  123 |     await expect(tarjetaPrueba).toBeVisible();
  124 |   });
  125 | });
  126 | 
```