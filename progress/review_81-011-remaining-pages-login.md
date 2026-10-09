# Review 81-011: Coaching, Reportes, Equipo, Configuración, Import/Export y Login

**Veredicto: PASSED.** Hay 0 bloqueantes, 1 menor y 10 notas.

Todo lo que pide el plan cumple:
- scope: solo cambian las 6 páginas de `presentation/pages`;
- lógica intacta: queries, mutaciones, validaciones, payloads y flujo de auth;
- Login conserva `register("username")`, `register("password")` y `type="submit"`;
- `STORAGE_KEY "tracker-report-goals"` y el prefijo `tracker-backup-` siguen igual;
- la Lámina está intacta: `git diff HEAD --stat` de `ExecutiveSlide.tsx`, `LaminaPage.tsx` y `routes/lamina.tsx` está vacío, y el bloque del popup de `ReportsPage.tsx` (`:206-239`) es idéntico byte a byte a HEAD;
- rg del plan con solo los hits aceptados;
- gates en exit 0;
- un h1 por página;
- overflow 0 a 1440 y 390;
- AA en todas las superficies nuevas, en claro y en oscuro;
- 0 controles sin nombre, 0 ids duplicados y 0 Labels con `htmlFor` roto;
- foco visible en todo;
- menús y diálogos funcionan por teclado;
- 0 page errors.

El único menor es M1: el mensaje "Faltan las siguientes secciones" de Import muestra las claves crudas (`clients, contacts, deals…`). El Implementer lo declaró como desviación ("lógica de validación"), pero el arreglo solo cambia el texto, no la regla. Es un micro-fix de una línea y se recomienda aplicarlo antes del commit.

La desviación declarada en Equipo (el foco vuelve al botón `…` al cerrar el AlertDialog) se acepta. Funciona con Escape y con Cancelar en admin y director, a 1440, en claro y en oscuro. Al confirmar, el foco sigue yendo a `body`, igual que en HEAD (N3).

Evidencias en `/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/review011/` (en adelante `R/`):
- `logic.txt`: comparación AST de HEAD contra el estado actual, ignorando atributos de presentación. Las fuentes de HEAD están en `R/orig/`.
- `popup-head.txt` y `popup-now.txt`: el bloque del popup de Reportes en HEAD y ahora (idénticos).
- `live.cjs`: auditoría Playwright de 16 sesiones:
  - admin, director1 y seller1, a 1440 y 390, en claro y en oscuro, sobre `/coaching`, `/reportes`, `/equipo`, `/configuracion` e `/import-export`;
  - login a 1440 y 390, en claro y en oscuro.

  Los resultados están en `R/report.json`, `R/report-login.json` y `R/report-admin-1440-light.json`, y se resumen con `R/sum.cjs`.
- Logs de gates: `R/gate-*.log` y `R/gates.txt`. Salida de rg: `R/rg.txt`.
- Capturas (100): `progress/redesign/phase-011/review/`.

Todas las sesiones son de solo lectura. Un guard `**/*` deja pasar los GET y solo el login real (`POST /api/auth/login|refresh`). El resto se responde dentro del navegador de prueba:
- un 400 falso con mensajes por campo para `PATCH /api/settings`, para ver FieldError y FormErrorSummary;
- un 401 falso para `POST /api/auth/login` en el contexto de login, para ver "Credenciales incorrectas.";
- un 418 para todo lo demás (`PATCH /api/sellers/:id/deactivate` en el camino de confirmar de Equipo).

No se guardó configuración ni se importó nada. Import solo se probó hasta el preview, con archivos locales `.txt`, JSON roto, JSON parcial y JSON completo, y se canceló.

Las TanStack Router Devtools (solo en dev) se excluyen de la auditoría, porque meten texto a 1.16, un botón sin nombre e ids `*-cl-N` de goober. No van en producción y no son hallazgo.

## Criterios

| Criterio | Resultado | Evidencia |
|---|---|---|
| Scope | PASS | `git status`: solo las 6 páginas `M`. `application`, `domain` e `infrastructure` de los 6 módulos tienen diff vacío, y `shared` y `components/ui` no cambian. Fuera de scope: `plans/012-redesign-cleanup.md` y `plans/README.md` (N10). |
| Sin cambios de lógica | PASS | ver el detalle bajo la tabla |
| Login: `name=username`, `name=password` y `type=submit` | PASS | `LoginPage.tsx:75`, `:91` y `:104`. En vivo: `autocomplete` `username` y `current-password`, submit "Entrar". |
| Flujo de auth | PASS | Zod con el mismo schema ("Requerido" y "Mínimo 6 caracteres"): 0 peticiones, `aria-invalid` y `aria-describedby` correctos, y el foco va a `login-username`. El 401 muestra "Credenciales incorrectas." en `FormErrorSummary` sin fallos de contraste. El login real de admin, director1 y seller1 funciona. |
| `STORAGE_KEY` y `tracker-backup-` | PASS | `ReportsPage.tsx:37`, `:45` y `:95`; `useExportData.ts:12` |
| Lámina intacta | PASS | `git diff HEAD --stat` vacío en `ExecutiveSlide.tsx`, `LaminaPage.tsx` y `routes/lamina.tsx`. Popup `:206-239` idéntico a HEAD (`R/popup-*.txt`). |
| rg del plan | PASS, con hits aceptados | `STORAGE_KEY` (`:37`), los hex del popup (`:230`, `:232` y `:235`, intocables) y `tracker-backup-` en el hook. Ver la salida de rg. |
| rg de clases legacy, `text-chart-`/`text-destructive`, `variant` de color, `Accordion` y `h5` | PASS (0) | Solo un comentario en `CoachingPage.tsx:47` ("cards"). |
| Gates `typecheck`, `lint` y `build` | PASS | exit 0 en los tres. `build` solo muestra el aviso previo `INEFFECTIVE_DYNAMIC_IMPORT` de `@atlaskit`. |
| Desviación: retorno de foco en Equipo | Aceptada | Escape y Cancelar devuelven el foco a `seller-actions-<id>` y `user-actions-<id>` con `:focus-visible`. En el trap hay 0 salidas. Al confirmar, el foco va a `body` (N3, ya pasaba en HEAD). |
| Desviación: mensaje de secciones con claves crudas | No aceptada | M1 |
| Un h1 por página | PASS | "Coaching", "Reportes", "Equipo", "Configuración", "Import / Export" y, en Login, un h1 con el logo (`alt` "Tracker México GPS") |
| Overflow horizontal | PASS (0) | `scrollWidth - clientWidth = 0` en las 16 sesiones. La lámina se recorta por dentro a 390 (N8, fuera de scope). |
| Contraste AA | PASS | ver las tablas de contraste |
| Labels asociados e ids únicos | PASS | 0 Labels con `htmlFor` sin destino y 0 ids duplicados: `login-*`, `settings-<campo>`, `import-file` y los campos de Equipo y Reportes |
| Nombre accesible | PASS (0 sin nombre) | El Select de Coaching tiene `aria-label="Filtrar por vendedor"`. El `…` de Reportes tiene "Acciones del informe". Los `…` de Equipo tienen "Acciones de vendedor X" y "Acciones de usuario X". |
| Sin valores enum crudos | PASS, salvo M1 | Los roles salen por `ROLE_LABELS` y las secciones del preview por `SECTION_LABELS`. "Admin" y "deals" son textos que ya estaban en HEAD (N9). |
| Foco visible | PASS (0 sin indicador) | 6 elementos en Coaching, 15 en Reportes, 24 en Equipo, 14 en Configuración, 7 en Import y 6 en Login |
| Menús y diálogos por teclado | PASS | ver el detalle bajo la tabla |
| Radio Lyra | PASS | Cards, menús y AlertDialog con 0px, inputs con 8px y pills `rounded-full` |
| Aspecto frente a la plantilla | PASS a ojo | ver el detalle bajo la tabla; el Login tiene diferencias pequeñas (N1) |
| Page errors | PASS (0) | 16 sesiones. Los 403 de consola ya pasaban en HEAD (N6). |

Detalle de algunas filas:
- **Lógica.** `R/logic.txt` sobre las 6 páginas solo da diferencias de presentación:
  - **Coaching:** `StatCell` pasa a `StatCard`, y los colores hex y `tracker-*` pasan a `StatusTone`. Los umbrales siguen iguales: calidad ≥80/≥50 para el texto y ≥75/≥45 para la barra, y progreso con el mínimo o ≥50. Hay un `SkeletonCard` nuevo mientras cargan los vendedores (antes salía un momento "Sin vendedores activos") y `sellerSpan` para el bento.
  - **Reportes:** el `Accordion` se sustituye por SectionCards. Los inputs ya no se generan desde un array: se escriben uno a uno con los mismos setters (`setMonth`, `setGoalAmount`, `setGoalUnits` y `setGoalPerSeller`, en `:312-345`). "Guardar metas", "Copiar informe" y "Compartir informe" pasan a un DropdownMenu con los mismos handlers. "Reintentar" llama a `refetch()` igual que antes.
  - **Equipo:** se añaden `ROLE_LABELS`, `ListSkeleton`, `DataTable` para vendedores y el retorno de foco (`returnFocusId` y `onCloseAutoFocus`). `onSelect` sigue llamando a `setConfirmAction` con el mismo objeto. Las mutaciones y `onSettled` no cambian.
  - **Configuración:** el `Accordion` se sustituye por secciones. Los ids, `register`, el schema y el `PATCH /settings` siguen iguales. En vivo, el 400 falso marca 3 campos, enfoca `settings-dailyMinPoints` y muestra el resumen.
  - **Import/Export:** `SECTION_LABELS` y `previewRows` son solo para mostrar. Al input se le añade `fieldErrorProps("import-file")`. `REQUIRED_KEYS`, la detección de las secciones que faltan y el flujo de confirmar y cancelar no cambian.
  - **Login:** se quita la lista de `benefits` (el panel de marketing, que no está en la plantilla) y se añade el logo por tema.
- **Teclado.**
  - **Reportes:** el menú abre con Enter, el foco entra en el menú, Esc lo cierra y el foco vuelve a "Acciones del informe".
  - **Coaching:** el Select abre y muestra 5 opciones. Al elegir "Dirección Comercial" se pasa de 32 a 8 tarjetas.
  - **Equipo:** los menús de fila abren y enfocan "Dar baja vendedor" o "Bloquear usuario". El AlertDialog mide 384px, tiene radio 0 y el foco inicial en "Cancelar". Escape y Cancelar cierran y devuelven el foco al trigger.
- **Aspecto.** Revisado a ojo frente a la plantilla:
  - **Coaching:** bento `grid-cols-12 gap-px bg-border` con tarjetas de 2 en 2 a xl. La última tarjeta, si es impar, ocupa toda la fila. Cada tarjeta tiene StatCards en grid hairline, barra `h-1.5` y la caja de IA con h3.
  - **Reportes:** sección "Periodo y metas" con 4 inputs en fila, lámina, "Detalle top vendedores" con DataTable y pill de % meta, y "Resumen para Dirección".
  - **Equipo:** bento de 3 columnas a lg ("Alta comercial", "Crear usuario" y "Usuarios del sistema"), `DottedDivider` y DataTable "Equipo comercial".
  - **Login:** `bg-accent` (igual al token), card cuadrada de 448px a 1440 y de 358px a 390 con `shadow-lg`, logo centrado que cambia según el tema y submit `w-full`.
  - Todo es cuadrado en claro y en oscuro.

### Contraste en vivo (mínimo por superficie; texto 4.5:1)

| Superficie | Claro | Oscuro | Notas |
|---|---|---|---|
| Coaching: página y tarjetas | 4.35 (shell) | 5.86 | En claro, el 4.35 es del kbd "Ctrl K" y de las iniciales del avatar (N7). El mínimo propio de 011 es 4.74. |
| Coaching: badge danger "0 / 30 pts" | 5.35 | 6.19 | |
| Coaching: Calidad y Vencidos danger (`text-2xl`) | 6.42 | 6.85 | |
| Coaching: Calidad success | 5.36 | 6.51 | |
| Coaching: barras de progreso y calidad | n/a | n/a | No son texto. El valor va en el texto de la StatCard. |
| Coaching: caja de IA ("Coach IA" o "Acción recomendada") | pasa | pasa | `text-foreground` sobre `background` |
| Reportes: página, metas, tabla y resumen | 4.35 (shell) | 5.86 | Excluye los 28 fallos internos de la lámina (N8). |
| Reportes: DropdownMenu | 0 fallos | 0 fallos | Para seller, "Copiar informe" está deshabilitado (3.71): no cuenta, por la exención WCAG de controles deshabilitados. |
| Equipo: listas de usuarios y DataTable de vendedores | 4.35 (shell) | 5.86 | |
| Equipo: AlertDialog | 0 fallos | 0 fallos | |
| Configuración, incluido el 400 falso | 4.35 (shell) | 5.86 | |
| Configuración: "Configuración guardada" (`text-status-success`) | 5.36 | 6.51 | inyectado |
| Import/Export: página, errores y preview | 4.35 (shell) | 5.86 | |
| Import/Export: tile de éxito (`STATUS_TILE_CLASS.success`) | 4.63 | 5.85 | inyectado |
| Login (sin devtools) | pasa | 7.66 | El 401 da 0 fallos. "Entrar" mide 17.18 en claro y 14.23 en oscuro. |

Pills (claro / oscuro):

| Pill | Claro | Oscuro |
|---|---|---|
| "Activo" en Equipo (success) | 4.74 | 5.98 |
| % Meta en Reportes, "90.0 %" (pending) | 18.21 | 14.57 |
| Badge success inyectado | 4.74 | 5.98 |
| Badge progress inyectado | 6.43 | 5.13 |
| Badge pending inyectado | 18.21 | 14.57 |
| Badge danger inyectado ("0 / 30 pts" real) | 5.35 | 6.19 |
| Badge neutral inyectado | 14.50 | 12.93 |

### FieldError y estados de error

| Superficie | Claro | Oscuro | Cómo |
|---|---|---|---|
| Login: `username-error` "Requerido" y `password-error` "Mínimo 6 caracteres" | 4.77 | 6.85 | real (Zod) |
| Login: 401 "Credenciales incorrectas." (`FormErrorSummary`) | 0 fallos | 0 fallos | real (401 falso) |
| Configuración: `dailyMinPoints-error`, `monthlyAmountGoal-error` y `coldAccountDays-error` | 4.77 | 6.85 | real (400 falso) |
| Import: "El archivo debe ser un archivo .json" | 4.77 | 6.85 | real |
| Import: "El archivo no contiene JSON válido" | 4.77 | 6.85 | real |
| Import: "Faltan las siguientes secciones: …" | 4.77 | 6.85 | real (M1 por el contenido, no por el contraste) |
| FieldError inyectado en Coaching | 4.77 | 6.85 | inyectado (solo DOM) |

En todos los casos reales, el input tiene `aria-invalid="true"` y `aria-describedby="<name>-error"`.

## Hallazgos

### Bloqueantes

Ninguno.

### Menores

**M1. El error de Import muestra las claves crudas de las secciones.** Responsable: Implementer.
- `frontend/src/modules/import-export/presentation/pages/ImportExportPage.tsx:125`: `` `Faltan las siguientes secciones: ${missing.join(", ")}` ``.
- En vivo, el FieldError y el toast muestran "clients, contacts, deals, tasks, activities, sales, settings". Captura: `admin-1440-light-import-missing.png` y `admin-390-light-import-missing.png`.
- Incumple el criterio de que no se vea ningún valor enum crudo. Las etiquetas ya existen en la misma página (`SECTION_LABELS`, `:39-49`) y el preview las usa (`:160` y `:253`).
- La desviación del impl dice que es "lógica de validación". No es así: la condición (`missing = REQUIRED_KEYS.filter(...)`, `:123`) y el rechazo del archivo no cambian. Solo cambia el texto.
- **Arreglo mínimo:** en `:125`, `` `Faltan las siguientes secciones: ${missing.map((k) => SECTION_LABELS[k] ?? k).join(", ")}` ``. Mover `SECTION_LABELS` a `domain/` es opcional y puede ir en 012.

### Notas

- **N1. Las Labels del Login no siguen la especificación de la plantilla.** Responsable: Implementer.
  - DESIGN y `login-1440` piden labels `text-sm text-muted-foreground` y campos con `space-y-4`.
  - Ahora son `text-xs` en color foreground (en vivo, `12px oklch(0.145 0 0)`), y el form usa `gap-6` (`LoginPage.tsx:68`).
  - Arreglo: `className="text-sm text-muted-foreground"` en `<Label>` (`:71` y `:87`) y `gap-4` en `:68`. Antes de cerrar, medir el contraste de muted sobre `background`.
- **N2. El Login no tiene landmark `<main>`** (`LoginPage.tsx:41`). En HEAD tampoco había.
  - Arreglo (Implementer): cambiar el `div` exterior por `<main>`.
- **N3. Al confirmar en el AlertDialog de Equipo, el foco va a `body` y nunca se ve "Procesando...".**
  - `AlertDialogAction` (`EquipoPage.tsx:511-517`) cierra el diálogo al hacer click. En ese momento `isConfirmPending` todavía es `false`, así que el guard de `onOpenChange` (`:485`) no lo impide.
  - Mientras la mutación está pendiente, el trigger `…` está `disabled` (`:238` y `:426`), así que `trigger.focus()` en `onCloseAutoFocus` (`:489-497`) no hace nada.
  - Tampoco hay toast de error: `blockUser` y `deactivateSeller` no tienen `onError`. En vivo, el 418 no da ningún aviso.
  - En HEAD pasaba lo mismo, así que no es regresión.
  - Arreglo (Implementer):
    1. `onClick={(e) => { e.preventDefault(); handleConfirmAction() }}` en `:514`. Así el diálogo queda abierto con "Procesando..." y se cierra en `onSettled`, cuando el trigger ya está habilitado.
    2. `onError: () => toast.error("No se pudo completar la acción")` en los dos `mutate` (`:124-134`).

    Hay que verificarlo con el backend real.
- **N4. Director ve "Sin usuarios registrados" en Equipo cuando `/api/users` responde 403** (`EquipoPage.tsx:455-458`). Captura: `director1-1440-light-equipo.png`.
  - En HEAD la lista quedaba vacía sin texto. El EmptyState nuevo dice algo falso: hay usuarios, pero el director no puede verlos.
  - Arreglo (decide el Líder; aplica el Implementer): usar `isError` de `useUsers()` y mostrar "Sin acceso a la lista de usuarios", u ocultar la card para Director.
- **N5. `ROLE_LABELS` está duplicado:** `EquipoPage.tsx:62-66` y `components/nav-user.tsx:17`.
  - Arreglo (Líder): exportarlo desde `shared/lib/roles.ts` y reutilizarlo en los dos. Lo anota el impl en "Pendiente Líder 1".
- **N6. Se lanzan 403 desde hooks antes de comprobar el rol.**
  - Director: `GET /api/users`.
  - Seller: `GET /api/reports/monthly`, `GET /api/reports/win-loss` y `GET /api/users`.
  - Seller entra en `/reportes` solo por URL directa (no está en su nav) y ve "Error al cargar el reporte." (`seller1-1440-light-reportes.png`).
  - Ya pasaba en HEAD.
  - Arreglo (Líder; lógica de hooks): `enabled` según el rol en esas queries.
- **N7. Fuera de scope (shell 007):** en claro, el kbd "Ctrl K" y las iniciales del avatar ("A", "CR" y "JP") miden 4.35. Ya estaba anotado en 008 (N7), 009 (N9) y 010 (N12).
- **N8. La lámina (`ExecutiveSlide`) tiene 28 fallos de contraste internos y se recorta a 390** (`scrollWidth` 540 frente a `clientWidth` 340, captura `admin-390-dark-reportes.png`).
  - Está fuera de scope por decisión: la lámina no se toca y su diff está vacío.
  - Va a 012 o a una fase propia, si el Líder lo decide.
- **N9. Textos que ya estaban en HEAD con valores sin traducir o incoherentes:**
  - El select de rol en Equipo dice "Comercial" y "Dirección / Admin" (`EquipoPage.tsx:358-359`), pero la lista dice "Vendedor" y "Administrador".
  - Configuración usa "deals estancados" (`SettingsPage.tsx:22-23`).
  - Es una decisión de copy del Líder. No lo introduce 011.
- **N10. Hay cambios fuera de scope en el árbol de trabajo:** `plans/012-redesign-cleanup.md` y `plans/README.md`. No son del Implementer de 011. El Líder debe confirmar que son suyos antes del commit.

## Salida de gates y rg

```
$ pnpm run typecheck   -> exit 0   (tsc --noEmit)
$ pnpm run lint        -> exit 0   (eslint .)
$ pnpm run build       -> exit 0   (tsc -b && vite build, ✓ built in 3.25s)
  aviso previo: [INEFFECTIVE_DYNAMIC_IMPORT] @atlaskit/pragmatic-drag-and-drop/.../adapter.js

$ rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules/{coaching,equipo,settings,import-export,auth} frontend/src/modules/reports/presentation/pages/ReportsPage.tsx
ReportsPage.tsx:37:const STORAGE_KEY = "tracker-report-goals"
ReportsPage.tsx:230:        body{font-family:'Montserrat','Inter',sans-serif;background:#EEF2F7;...   (popup, intocable)
ReportsPage.tsx:232:        @media print{body{background:#fff;padding:0}#executive-slide{...}}        (popup, intocable)
ReportsPage.tsx:235:        `<p style="font-size:11px;color:#94A3B8;...">Tip: imprime como PDF ...`     (popup, intocable)
import-export/application/hooks/useExportData.ts:12:      a.download = `tracker-backup-${...}.json`;    (hook, prefijo obligatorio)

$ rg clases legacy (slabel|card|prog|ai-box|empty-state|seller-row|page-title|page-subtitle|variant="success"|max-w-[|text-red-|bg-green-|rounded-[|bg-tracker|shadow-[)
CoachingPage.tsx:47:// Seller cards: two per row on xl, one per row below. An odd last card spans   (comentario)

$ rg -n "text-chart-|text-destructive" (6 páginas)
exit 1   (0 coincidencias)

$ rg -n "variant=\"(navy|green|amber|yellow|red|gray|purple|blue)\"" (6 páginas)
exit 1   (0 coincidencias)

$ rg -n "Accordion|\bh5\b|<h5" (6 páginas)
exit 1   (0 coincidencias)

$ rg -n "STORAGE_KEY|tracker-backup-" frontend/src
ReportsPage.tsx:37:const STORAGE_KEY = "tracker-report-goals"
ReportsPage.tsx:45:    const raw = localStorage.getItem(STORAGE_KEY)
ReportsPage.tsx:95:      STORAGE_KEY,
useExportData.ts:12:      a.download = `tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

$ rg -n "name=|type=\"submit\"|register\(" LoginPage.tsx
75:              {...register("username", {
91:              {...register("password", {
104:            type="submit"

$ git diff HEAD --stat -- ExecutiveSlide.tsx LaminaPage.tsx routes/lamina.tsx
(vacío)
$ git diff HEAD --stat -- application/ domain/ infrastructure/ (6 módulos)
(vacío)
```

## Capturas

En `progress/redesign/phase-011/review/` (100 archivos):
- Login: `login-{1440,390}-{light,dark}.png`, más `-zod` (errores de Zod) y `-401` (credenciales incorrectas).
- Páginas: `{admin,director1,seller1}-{1440,390}-{light,dark}-{coaching,reportes,equipo,configuracion,import-export}.png`.
- Flujos (admin y director a 1440):
  - `-coaching-filtered`;
  - `-reportes-menu`;
  - `-equipo-seller-alert` y `-equipo-user-alert`;
  - `-configuracion-400`;
  - `-import-txt`, `-import-badjson`, `-import-missing` y `-import-preview`.

## Qué debe revisar el Líder a ojo

1. **M1:** `admin-1440-light-import-missing.png` muestra las claves crudas en el FieldError y en el toast. Tras el micro-fix, repetir con un JSON parcial.
2. **Login frente a `template/login-1440.png`:** `login-1440-light.png` y `login-1440-dark.png`. Hay que decidir si se aplica N1 (labels muted `text-sm` y `gap-4`).
3. **Smoke real de las acciones que aquí se bloquearon:**
   - guardar metas y copiar o compartir en Reportes;
   - dar de baja un vendedor y bloquear un usuario en Equipo (N3: con el backend real, mirar a dónde va el foco y si se ve "Procesando...");
   - guardar Configuración;
   - importar un respaldo completo.
4. **Equipo como director** (N4): `director1-1440-light-equipo.png`, donde aparece "Sin usuarios registrados".
5. **Lámina a 390** (N8): `admin-390-dark-reportes.png`. Fuera de scope, pero es lo que más se nota en móvil.
6. **Bento de Coaching y Equipo frente a la plantilla:** `admin-1440-light-coaching.png`, `admin-1440-dark-coaching-filtered.png`, `admin-1440-light-equipo.png` y `seller1-390-light-coaching.png`.
