# impl_fix_lamina_popup_styles

## Causa raíz

`openLamina()` en `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx` abre una ventana nueva con `window.open("", "_blank")` y escribe en ella el `outerHTML` del nodo `#executive-slide`, pero solo inyectaba ~5 líneas de CSS inline (reset, background del body, ancho máximo y reglas `@media print`). En el commit 14645ee `ExecutiveSlide.tsx` migró de estilos inline `style={{}}` a clases Tailwind (`bg-tracker-dark`, `text-tracker-green`, `border-tracker-border`, etc.). El documento del popup es un documento nuevo que no carga `index.css`, así que esas clases no resolvían a ninguna regla y la lámina se renderizaba como HTML crudo sin estilos.

## Cambio realizado

Único archivo modificado: `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`, solo dentro de `openLamina()` (líneas 169-185).

- Se clonan las hojas de estilo del documento padre antes de escribir el popup:
  ```ts
  const appStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((el) => el.outerHTML)
    .join("")
  ```
  Esto cubre dev (Vite inyecta `<style>`) y prod (`<link href="/assets/index-*.css">`, mismo origen). Los tokens `--tracker-*` se declaran en `:root` dentro de `index.css`, por lo que al clonar la hoja el popup hereda tanto las utilidades Tailwind como las variables de color.
- El markup clonado se inserta en el `<head>` **antes** del `<style>` inline existente, de modo que el inline (background del body, padding, `#executive-slide{max-width}` y las reglas `@media print`) sigue ganando en cascada.
- Se eliminó del `<style>` inline la línea `*{box-sizing:border-box;margin:0;padding:0}` (ver "Hallazgo: conflicto de cascade layers").
- Se conserva sin cambios todo lo demás: el `<link>` de Google Fonts Montserrat, las reglas `body{...}`, `#executive-slide{...}` y `@media print{...}` del `<style>` inline, el párrafo "Tip: imprime como PDF...", los dos early-returns con `window.print()` y el `win.document.close()`. No se añadió `win.print()` automático ni dependencias nuevas.

## Hallazgo: conflicto de cascade layers (el detalle no obvio del fix)

Clonar las hojas de estilo era necesario pero **no suficiente**. Tailwind v4 emite `@layer theme, base, components, utilities;` y coloca las utilidades (`mb-1`, `px-7`, `p-4`, `py-[22px]`...) dentro de `@layer utilities`. El `<style>` inline que se escribe en el popup no está dentro de ninguna capa, y en CSS **las declaraciones normales sin capa ganan a las que están en capa, sin importar la especificidad** (las capas se ordenan por debajo del estilo unlayered).

Consecuencia: la línea `*{box-sizing:border-box;margin:0;padding:0}` del `<style>` inline pisaba **todas** las utilidades de margin/padding de Tailwind del slide clonado. La lámina habría salido con colores y tipografía correctos pero con el espaciado colapsado a 0. Verificado en navegador: con el reset unlayered presente, `.mb-1` computaba `marginBottom: 0px` y `.px-7` computaba `paddingLeft: 0px`.

Por eso se eliminó esa línea. Queda redundante: el preflight de Tailwind ya viene dentro de `appStyles` (en `@layer base`) y aplica exactamente el mismo reset, con la diferencia de que al estar en capa las utilidades sí lo pisan correctamente.

Las reglas `body{...}`, `#executive-slide{...}` y `@media print{...}` **sí deben permanecer sin capa**: así ganan sobre `body{@apply bg-background}` de `index.css`, que es justo el comportamiento deseado para el fondo claro de la lámina y el print.

Verificado en navegador tras el ajuste:
- Las utilidades ganan: `marginBottom: 4px` (`.mb-1`), `paddingLeft: 28px` (`.px-7`).
- El preflight sigue reseteando elementos sin clases: `margin: 0px`.
- El `body` del popup conserva `background: rgb(238, 242, 247)` y `padding: 32px`.

## Verificación

Ejecutado desde `C:\Users\alex\Documents\sites\Tracker-Sales-OS\frontend`:

```
> pnpm typecheck
> frontend@0.0.1 typecheck C:\Users\alex\Documents\sites\Tracker-Sales-OS\frontend
> tsc --noEmit

(sin errores)
```

```
> pnpm lint
> frontend@0.0.1 lint C:\Users\alex\Documents\sites\Tracker-Sales-OS\frontend
> eslint .

(sin errores)
```

Ambos pasan limpios. No se detectaron errores preexistentes.

## Pendiente de validación manual

Ya validado en navegador (dev): estilos Tailwind resueltos, espaciado correcto tras eliminar el reset unlayered, y `body` del popup con su fondo/padding propios.

Queda por confirmar:

- El build de producción: los `<link>` clonados apuntan a `/assets/index-*.css` (mismo origen) y cargan de forma asíncrona; verificar que no haya un flash de contenido sin estilo perceptible al abrir el popup.
- Que `Ctrl+P` en el popup produce el PDF con las reglas `@media print` (fondo blanco, sin bordes ni radius en `#executive-slide`).
