# Implementación 76-brand-logos-login-navbar

## Ajuste de logo blanco/verde

- Se reemplazó `frontend/public/brand/trackermexico.png` exactamente, sin editar ni recomprimir, con el PNG proporcionado por el usuario.
- El nuevo wordmark mide 1681 × 280 px y su SHA-256 es `6F6A527898C54A019E0677514D9584DF61838A4CFEB053C019DF6A8704B1BAF3`.
- Login y sidebar expandido actualizan sus dimensiones intrínsecas a 1681 × 280 px.
- Se retiraron los soportes blancos: el wordmark blanco/verde ahora se muestra directamente sobre el fondo navy, conservando `object-contain`, proporción y límites responsivos.
- `frontend/public/brand/tracker.png` y la presentación del sidebar colapsado permanecen sin cambios.

## Alcance

- Se descargaron los dos PNG oficiales a `frontend/public/brand/`.
- Se reemplazó el wordmark textual del login por la marca oficial.
- Se reemplazó el wordmark/isotipo sustituto del sidebar por los assets oficiales.
- No se modificó lógica de autenticación, navegación, API ni dependencias.

## Assets

- `frontend/public/brand/trackermexico.png`
  - Fuente: PNG proporcionado por el usuario.
  - Dimensiones: 1681 × 280 px.
  - Formato: PNG ARGB con transparencia.
  - Uso: wordmark expandido en login y sidebar.
- `frontend/public/brand/tracker.png`
  - Fuente: `https://www.trackermex.com/img/logos/tracker.png`
  - Dimensiones: 162 × 94 px.
  - Formato: PNG ARGB con transparencia.
  - Uso: isotipo en el sidebar colapsado.

Ningún `<img>` depende de las URLs remotas: ambos se sirven desde `/brand/`.

## Decisiones visuales

- El wordmark blanco/verde tiene contraste directo sobre el marino y se renderiza sin soporte blanco en ambas superficies oscuras.
- El isotipo blanco/verde conserva contraste directo sobre el sidebar marino y se centra en un área estable de 32 × 32 px cuando el sidebar está colapsado.
- Ambos `<img>` incluyen dimensiones intrínsecas, `object-contain` y límites de altura para preservar proporción y reducir CLS.
- El login ahora apila paneles en móvil y oculta la lista secundaria de beneficios en ese breakpoint, manteniendo la marca y el formulario visibles sin overflow horizontal. En `md` conserva el layout original de dos paneles.
- Se preservaron `Sidebar collapsible="icon"`, navegación, formulario, autenticación y accesibilidad existentes. Los logos tienen textos alternativos útiles.

## Archivos modificados

- `frontend/src/modules/auth/presentation/pages/LoginPage.tsx`
- `frontend/src/components/app-sidebar.tsx`
- `frontend/public/brand/trackermexico.png`
- `frontend/public/brand/tracker.png`

## Verificación

Ejecutada desde `frontend/`:

- `pnpm run typecheck` — PASS.
- `pnpm run lint` — PASS.
- `pnpm run build` — PASS. El primer intento dentro del sandbox no pudo cargar el binario nativo de Tailwind/Rolldown (`EPERM`); se repitió fuera del sandbox y Vite completó el build de producción correctamente (4267 módulos transformados).
- La sustitución del wordmark blanco/verde se volvió a verificar con los tres comandos anteriores: PASS.
- El PNG instalado es byte-identical al adjunto (SHA-256 coincidente) y su cabecera IHDR confirma 1681 × 280 px.

## Ajuste de hover del encabezado

- El encabezado de marca no es interactivo, por lo que dejó de usar `SidebarMenuButton` y ya no hereda ningún estado hover del menú.
- Su altura pasó de 56 a 48 px y el padding de 8×12 a 4 px, manteniendo intactos el tamaño legible del logo y el estado colapsado de 32×32 px.
- El wordmark expandido quedó anclado a la izquierda y alineado con la guía vertical de los iconos de navegación; el isotipo conserva su centrado al colapsar el sidebar.

El build conserva un warning preexistente de Vite sobre un import dinámico/estático de `@atlaskit/pragmatic-drag-and-drop`; no está relacionado con esta feature.
