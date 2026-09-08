# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: city-autocomplete.spec.ts >> City autocomplete in property form >> should autocomplete city and assign department/locality ids
- Location: e2e\city-autocomplete.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder="Ej: Mendoza"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('input[placeholder="Ej: Mendoza"]')

```

```yaml
- banner:
  - button "Ir al inicio": PropFind
  - navigation:
    - button "Inicio"
    - button "Propiedades"
    - button "Publicar"
  - button "Iniciar sesión":
    - img
    - text: Ingresar
- main:
  - heading "Iniciar sesión" [level=1]
  - paragraph: Ingresá con tu cuenta de Google o con tu email y contraseña.
  - button "Google":
    - img
    - text: Google
  - text: o Email
  - textbox "tu@email.com"
  - text: Contraseña
  - textbox "••••••••"
  - button "Ingresar"
  - paragraph:
    - text: ¿No tenés cuenta?
    - button "Crear cuenta"
- contentinfo:
  - text: PropFind
  - paragraph: Encontrá tu próxima propiedad.
  - button "Explorar"
  - button "Publicar"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('City autocomplete in property form', () => {
  4  |   test('should autocomplete city and assign department/locality ids', async ({ page }) => {
  5  |     await page.goto('/publicar');
  6  |     await page.waitForTimeout(2000);
  7  | 
  8  |     const anonymousButton = page.locator('button:has-text("Continuar sin registrarse")');
  9  |     if (await anonymousButton.count() > 0) {
  10 |       await anonymousButton.click();
  11 |       await page.waitForTimeout(2000);
  12 |     }
  13 | 
  14 |     await page.screenshot({ path: 'city-autocomplete-debug.png' });
  15 | 
  16 |     const cityInput = page.locator('input[placeholder="Ej: Mendoza"]');
> 17 |     await expect(cityInput).toBeVisible({ timeout: 10000 });
     |                             ^ Error: expect(locator).toBeVisible() failed
  18 | 
  19 |     await cityInput.fill('Mendoza');
  20 |     await page.waitForTimeout(500);
  21 | 
  22 |     const suggestion = page.locator('text=Ciudad de Mendoza').first();
  23 |     if (await suggestion.count() > 0) {
  24 |       await suggestion.click();
  25 |       await page.waitForTimeout(300);
  26 |     }
  27 | 
  28 |     const cityValue = await cityInput.inputValue();
  29 |     expect(cityValue.length).toBeGreaterThan(0);
  30 |   });
  31 | });
  32 | 
```