# Review 81-006: Fundación del rediseño

## Veredicto

**PASSED**

Se cumplen todos los Done criteria del plan 006 y los criterios de `CHECKPOINTS.md` `## 81-visual-redesign` que aplican a esta fase: tokens, modo oscuro cableado, `THIRD_PARTY_NOTICES.md` y gates. No hay bloqueantes. Hay 2 hallazgos menores y 12 notas, todos visuales o de coherencia entre documentos, ninguno de corrección de código.

Review de solo lectura. Base `55b22e1`, comparada con el árbol de trabajo de la rama `81-visual-redesign`. No se editó ningún archivo salvo este.

## Criterios

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `noto-sans-arabic` eliminado | PASSED | `rg -n "noto-sans-arabic" frontend/src frontend/package.json` da 0, y 0 en `pnpm-lock.yaml`. `dist/assets` no contiene ningún asset noto. |
| 2 | Sin teal (`0.508 0.118`) | PASSED | `rg -n "0.508 0.118" frontend/src/index.css` da 0. |
| 3 | Sin `backdrop-blur` en ui | PASSED | `rg -n "backdrop-blur" frontend/src/components/ui` da 0. |
| 4 | Fuente Geist | PASSED | `frontend/src/main.tsx` importa `@fontsource-variable/geist`. `index.css` `@theme inline` tiene `--font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif`. `package.json` tiene `@fontsource-variable/geist ^5.3.0`. El build emite `geist-*-wght-normal-*.woff2`. Montserrat se mantiene para la lámina. |
| 5 | Tokens `:root` y `.dark` = DESIGN.md "Color" = plantilla | PASSED | `frontend/src/index.css:71-104` (`:root`, 32 vars con `--radius: 0.625rem`) y `:106-139` (`.dark`, 31 vars más `color-scheme: dark`). Comparé las variables una por una con un script contra `template-src/app/globals.css` y contra la tabla de DESIGN.md: 0 diferencias en las dos. |
| 6 | Sombras en `@theme` | PASSED | `--shadow-sm/md/lg` en `@theme inline` con los valores literales de DESIGN.md:109-111. |
| 7 | Override navy del sidebar eliminado | PASSED | El segundo `:root` (`index.css:170-204`) solo tiene `--tracker-*`, `--sp-*`, `--sidebar-width` y `--page-gap`. No queda ningún `--sidebar-*` de color. |
| 8 | `@layer base` | PASSED | `index.css:141-164`: `* { border-border outline-ring/50 }`, `body { bg-background text-foreground }`, `h1-h6 font-semibold`. Ya no hay outline verde. |
| 9 | Clases legacy dentro de `@layer components`, sin cambios en sus reglas | PASSED | La capa abre en `index.css:210` y cierra en `:774`. Diff contra `git show 55b22e1:frontend/src/index.css`: dentro de la capa solo desaparece `body{background:var(--tracker-bg)}` (sustituido en base) y se mueven las dos reglas que siguen. El CSS legacy no tiene `!important`, así que meterlo en la capa no invierte ninguna prioridad. |
| 10 | Reduced-motion y la regla móvil `main{…!important}` fuera de la capa | PASSED | `index.css:777-783` y `:786-790`. |
| 11 | Lámina intacta | PASSED | `ExecutiveSlide.tsx` y `LaminaPage.tsx` no se modificaron. Solo usan `--tracker-*`/`bg-tracker-*` (se conservan), Montserrat inline (se conserva) y radios y sombras arbitrarios (`rounded-[10px]`, `shadow-[…]`), que no dependen de los tokens nuevos. El popup de `ReportsPage` añade un `body{background:#EEF2F7}` sin capa, que sigue ganando a `@layer base`. |
| 12 | `ThemeProvider` de next-themes montado | PASSED | `frontend/src/main.tsx:5` y `:21`: `attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange`. Envuelve `QueryClientProvider`, y `<Toaster>` (`routes/__root.tsx:9`) queda dentro. La variante `dark` es `&:is(.dark *)`, compatible con `attribute="class"`. |
| 13 | Sonner con `useTheme()` | PASSED | `components/ui/sonner.tsx:3,7,11`. Los estilos usan `--popover`, `--popover-foreground` y `--border`. |
| 14 | `theme-provider.tsx` borrado | PASSED | `git status` muestra `D frontend/src/components/theme-provider.tsx`. `rg -n "theme-provider" frontend/src` da 0. |
| 15 | `THIRD_PARTY_NOTICES.md` con la MIT completa | PASSED | Contiene nombre, repo, demo, commit `91deb10` y la nota de que el sistema visual de `frontend/` se basa en ella. El texto MIT es idéntico a `template-src/LICENSE`; la única diferencia es el cierre del bloque de código. |
| 16 | APIs públicas de `components/ui` sin cambios | PASSED | Exports y firmas idénticos en todos los archivos ui modificados. Las claves de variantes de button, badge y tabs-list son las mismas que en la base. Variantes que usan los módulos: ghost, destructive, gray, green, link, navy, outline, red, secondary, success. Tamaños: icon-sm, icon-xs, lg, sm, xs. Todos existen. `card` conserva `size`. |
| 17 | Clases por slot según Lyra `.cn-*` | PASSED | Revisados button, input, textarea, select (trigger, content, item), card, badge, table, tabs, dialog, alert-dialog, sheet, dropdown-menu, popover, hover-card, command, checkbox, tooltip, accordion, calendar, label, skeleton, separator, avatar y breadcrumb. Coinciden con `style-lyra.css`. Las únicas desviaciones son las que piden DESIGN.md o el plan: botones y controles de 8px, badge pill, overlay sin blur, `border` en vez de `ring-1` en superficies tipo popover. Están en las notas N1-N4. |
| 18 | Alcance | PASSED | `git status` no muestra cambios en `modules/**`, `shared/**`, `routes/**`, `ui/sidebar.tsx`, `ui/sidebar-context.ts`, `ExecutiveSlide`, `LaminaPage`, `ReportsPage` ni `components.json`. Fuera de la lista in-scope solo aparecen `declarations.d.ts` (editado por el Líder) y el PNG sin trackear de la nota N12. Los docs del Líder no se alteraron. `backend/src/main.ts:39-40` (Step 0, `HOST`) sigue en su sitio. |
| 19 | Gates | PASSED | Ejecutados por mí desde `frontend/`: `pnpm run typecheck` exit 0, `pnpm run lint` exit 0, `pnpm run build` exit 0 (`✓ built in 991ms`). El build solo avisa `INEFFECTIVE_DYNAMIC_IMPORT` de pragmatic-drag-and-drop, que ya existía y no tiene relación con esta fase. |
| 20 | `progress/impl_81-006-foundation.md` | PASSED | Existe y tiene secciones de archivos tocados, decisiones por componente, API pública, gates, Done criteria y riesgos. |

## Hallazgos

### Bloqueantes

Ninguno.

### Menores

- **M1. Badge siempre pill y DESIGN.md con badges cuadrados.** `frontend/src/components/ui/badge-variants.ts:4` fija `rounded-full` en la base, como pide el plan 006 Step 4. Sin embargo, DESIGN.md:107 dice "8px en … badges cuadrados" y DESIGN.md:133 pone un `Badge variant="secondary"` de versión en el header de la fase 007. El código hace lo que dice el plan; la incoherencia está entre el plan y DESIGN. El Líder debe decidir si la fase 007 pasa `className="rounded-md"` o si se añade una variante o prop de forma.
- **M2. La paleta de comandos se estrecha de 448px a 384px.** `components/ui/dialog.tsx:64` pasa de `sm:max-w-md` a `sm:max-w-sm`, como `.cn-dialog-content` de Lyra. `CommandDialog` (`components/ui/command.tsx:125`) no fija ancho propio, y `shared/components/command/CommandPalette.tsx:52` tampoco, así que la paleta ocupa ahora 384px. El resto de `DialogContent` del código ya fijan su ancho. Conviene verlo en pantalla. Si queda apretada, basta con `sm:max-w-lg` en `CommandDialog`; la plantilla no usa `CommandDialog`, así que no hay referencia directa.

### Notas

- **N1.** `button-variants.ts`: los tamaños xs, sm, icon-xs e icon-sm usan `rounded-md`, mientras que Lyra usa `rounded-none`. Lo justifica la regla de 8px de DESIGN.md. Correcto.
- **N2.** `secondary` usa `hover:bg-secondary/80` y `destructive` es la variante suave. Ambas siguen DESIGN.md "Botones" y no Lyra al pie de la letra. Correcto.
- **N3.** Dialog, alert-dialog y sheet: overlay `bg-black/10` sin el `backdrop-blur-xs` de Lyra. Lo exige el Done criterion 3. Correcto.
- **N4.** Dropdown, popover, hover-card, command y select content usan `border bg-popover shadow-md` en vez del `ring-1 ring-foreground/10` de Lyra. Lo pide el plan. Correcto.
- **N5.** `components/ui/popover.tsx:33`: el padding por defecto pasa de `p-0` a `p-2.5 w-72 gap-2.5`. Los tres usos actuales lo sobrescriben (`ClientCombobox:103 p-0`, `DatePickerField:59 p-0`, `DealCard:122 p-3`), así que hoy no tiene impacto.
- **N6.** `components/ui/card.tsx:84`: `CardFooter` lleva siempre `border-t`, como Lyra. Ningún módulo usa `CardFooter`, así que no tiene impacto.
- **N7.** `components/ui/alert-dialog.tsx:59`: el ancho por defecto pasa de md a sm (`sm:max-w-sm`), como Lyra. Los textos largos de confirmación pueden ocupar más líneas.
- **N8.** `index.css:143`: el foco de base es ahora el outline del navegador con color `ring/50`, sin el outline verde de antes. Los primitivos ui tienen su propio `focus-visible:ring-1`. Los enlaces y botones nativos fuera de ui dependen del outline del navegador. Revisarlo para el criterio de foco visible y WCAG de las fases siguientes.
- **N9.** `index.css:212`: `.card` legacy (`rounded-xl shadow-sm`) toma la escala nueva. `rounded-xl` = 1.4 × 0.625rem ≈ 14px, y la sombra es la nueva `--shadow-sm`. Además, las clases legacy pierden ahora frente a las utilities, que era el objetivo, y eso puede cambiar páginas que combinaban ambas. Revisarlo en las páginas con `.card` y `.kpi-*`.
- **N10.** `index.css:202`: `--sidebar-width: 276px` sigue en el segundo `:root` y lo usa el grid legacy de `index.css:308`. Lo resuelve la fase 007.
- **N11.** Modo oscuro: está cableado pero no tiene toggle (fase 007). Los hex y `--tracker-*` legacy no se adaptan a `.dark` hasta las fases 008-011. next-themes inyecta un `<script>` inline, y React 19 puede avisar por ello en la consola de desarrollo. El aviso no tiene efecto funcional.
- **N12.** Fuera de alcance: `frontend/public/brand/trackermexico-dark.png` sin trackear. El plan 007 (líneas 61, 99 y 114) lo atribuye al Líder; no es trabajo del Implementer.

## Verificación visual pendiente para el Líder

Con el runtime local (Vite `localhost:3001`, backend `127.0.0.1:3005`):

1. Login y dashboard en claro: fuente Geist y fondo `bg-background` blanco o neutral, sin teal.
2. Un formulario con select, dialog, dropdown, tabs, tabla y toast. Comprobar inputs h-8 a 8px, foco con `border-primary` sin ring, y popovers con borde y sombra, sin vidrio.
3. Ancho de la paleta de comandos (M2) y AlertDialogs con textos largos (N7).
4. Foco con teclado (Tab) en enlaces y botones nativos fuera de `components/ui` (N8).
5. Páginas que usan `.card`, `.kpi-*`, `.pipe-col*` y `.seller-*` (N9).
6. Badges de estado en pill (tracker green/red/amber/navy, ahora con tokens chart) (M1).
7. Añadir `class="dark"` a `<html>` a mano desde DevTools: los primitivos ui deben invertirse, y que lo legacy no lo haga es lo esperado (N11). Revisar si hay un aviso de `<script>` en la consola.
8. El sidebar se ve claro, ya que sin el override navy usa los tokens `--sidebar` neutros. Es lo esperado hasta la fase 007.
9. `/lamina` y el popup de Reportes se ven igual que antes (capturas en `progress/redesign/current/`).
