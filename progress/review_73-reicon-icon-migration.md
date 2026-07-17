# Review 73 — Migración HugeIcons → reicon-react

**Fecha:** 2026-07-16 · **Rama:** `review-ui` · **Revisor:** subagente Reviewer (validación independiente)
**Alcance revisado:** diff sin commitear de `frontend/src` (24 archivos) + `frontend/src/shared/components/Icon.tsx` (nuevo)

---

## Veredicto: PASSED 18/18 criterios verificables

Los 2 criterios restantes del CHECKPOINT (**smoke autenticado** y **verificación visual de los
sitios de riesgo**) requieren navegador con sesión y quedan **PENDIENTES**. No los cuento como
fallo: el propio CHECKPOINT los define como ojo humano, y el Implementer los declaró
explícitamente pendientes (§4.5 de su reporte).

**Bloqueantes: ninguno.** La migración es correcta. Las 3 desviaciones declaradas son
**correctas**; una de ellas se apoya en un razonamiento parcialmente equivocado que no cambia
el resultado (detalle en §D2).

**Método:** todo lo marcado como VERIFICADO abajo lo comprobé leyendo el código o **renderizando
con `react-dom/server` una réplica exacta de `createIcon()` de `Icon.tsx:63-80`** contra los
call-sites reales. No repetí typecheck/lint/build (ya reconfirmados por el Líder).

---

## 1. Las 3 desviaciones declaradas (§5 del reporte del Implementer)

### D1 — El wrapper acepta `color` en vez de `style={{color: undefined}}` incondicional → **CORRECTA**

El CHECKPOINT pide literalmente `style={{ color: undefined }}` siempre. El Implementer hizo
`style={{ color, ...style }}` (`Icon.tsx:74`). **Verifiqué el orden de precedencia real** contra
`node_modules/reicon-react/createIcon.js:45`:

1. El wrapper **desestructura `color` fuera de `props`** (`Icon.tsx:69`) ⇒ **nunca** llega `color`
   a reicon ⇒ reicon aplica su default `color = 'currentColor'` (`createIcon.js:19`).
2. reicon computa `style: { color, ...style }` (`createIcon.js:45`)
   = `{ color: 'currentColor', ...(style del wrapper) }`.
3. El `style` del wrapper **siempre lleva la clave `color`** (el shorthand `{ color, ... }` crea la
   clave aunque el valor sea `undefined`), y va **después** en el spread ⇒ **pisa** el
   `currentColor` de reicon. **Sí, el spread del wrapper gana.**

Salidas reales (renderizadas, no inferidas):

| Caso | `<svg>` emitido |
|---|---|
| `color` **undefined** (`<ChevronDownIcon className="… text-muted-foreground"/>`) | `class="reicon pointer-events-none size-4 text-muted-foreground"` — **sin atributo `style`** |
| `color="#334155"` (`<BuildingIcon size={12} color="#334155"/>`) | `class="reicon" style="color:#334155"` — hex preservado |
| **control** — reicon crudo sin wrapper | `class="reicon text-muted-foreground" **style="color:currentColor"**` |

La última fila es la prueba de que el bug existe y de que el wrapper lo neutraliza: **el efecto que
pedía el CHECKPOINT (desaparece el atributo `style`, Tailwind manda) se obtiene íntegro**, y
además se preserva el prop `color`. Aplicar el literal del CHECKPOINT **sí** habría roto los 7
call-sites con hex: con `style={{color: undefined}}` incondicional + `color` pasando a reicon, el
paso 3 daría `{color: undefined}` y **el hex se perdería**. El argumento del Implementer es
correcto y la desviación mejora el CHECKPOINT en vez de contradecirlo.

*Nota menor (no bloqueante):* si un call-site pasara `color` **y** `style={{color:…}}` a la vez,
gana el `style`. Nadie lo hace hoy y el orden es defendible.

### D2 — Quitó `color="currentColor"` de los call-sites → **CORRECTA (razón declarada, imprecisa)**

**El resultado es correcto y no se perdió ningún color** — pero el número y la justificación
concreta del reporte no se sostienen del todo:

- **Son 6 instancias, no 7.** VERIFICADO: `git grep -n 'color="currentColor"' HEAD -- frontend/src`
  → 6 (`MiDiaPage.tsx:566`; `TaskCard.tsx:110,174,224,234,248`). El "7" de §5.2 parece arrastrado
  del recuento de §5.1, donde **sí** hay 7 call-sites con hex. Error de documentación, no de código.
- **El caso que el Implementer cita como obligatorio no lo es.** Afirma que conservar
  `color="currentColor"` en `TaskCard.tsx:245` (`Delete02Icon` dentro de
  `DropdownMenuItem variant="destructive"`) **habría perdido el rojo**. Leí
  `dropdown-menu.tsx:76`: el item destructivo lleva **`data-[variant=destructive]:text-destructive`
  sobre sí mismo**, además de `data-[variant=destructive]:*:[svg]:text-destructive` sobre el svg.
  Con `style="color:currentColor"` el svg heredaría el color **del padre, que ya es
  `text-destructive`** ⇒ **seguiría siendo rojo**. Lo mismo en los otros 5 sitios: en todos, el
  color heredado del padre coincide con el que la clase pondría sobre el svg (`Button
  variant="success"` → `text-[var(--tracker-dark)]`, `button-variants.ts:13`; Badge; etc.).

**Aun así la decisión es la correcta**, por razones que el reporte no llega a articular:
1. En HugeIcons `color="currentColor"` era un no-op ⇒ **quitarlo es 1:1 exacto** (verificado: los
   6 sitios renderizan hoy sin atributo `style`, gobernados por clase, igual que antes).
2. Conservarlo en reicon **sí** habría emitido `style="color:currentColor"` (confirmado por la fila
   "control" de D1), que es una mina: rompería el coloreado por clase en cuanto alguien añada un
   `text-*` sobre el icono, y **falla en silencio**.

⇒ Desviación **correcta**; el reporte debería corregir "7 → 6" y suavizar la afirmación sobre el rojo.

### D3 — Conservó los `size` numéricos → **CORRECTA**

VERIFICADO renderizando: reicon emite `size` como **atributos** `width`/`height`
(`createIcon.js:40-41`), exactamente igual que HugeIcons. `<BuildingIcon size={12}/>` →
`width="12" height="12"`. Es 1:1 real. Los sitios donde el CSS del padre ya los anulaba (p. ej.
`badge-variants.ts:4` → `[&>svg]:size-3!`, que pisa el `size={11}` de `ChecklistIcon` en
`TaskCard.tsx:106` y `MiDiaPage.tsx:552`) siguen anulados **igual que antes** ⇒ sin cambio visual.
Coincide con lo declarado en §5.3.

---

## 2. Criterios del CHECKPOINT, uno a uno

### Migración y alcance — 6/6

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | `Icon.tsx` único punto de import de reicon; un componente por icono, nombre semántico | PASS | `rg -l 'reicon-react' frontend/src` → **solo** `frontend/src/shared/components/Icon.tsx`. 23 named exports (`Icon.tsx:86-125`) |
| 2 | Los 24 archivos consumen el wrapper; ninguno importa reicon directo | PASS | 24 archivos modificados, todos importan de `@/shared/components/Icon`. Ídem evidencia #1 |
| 3 | Los 23 iconos con equivalente documentado | PASS | Tabla de mapeo en `impl_73-reicon-icon-migration.md:26-50` (23 filas) |
| 4 | `rg '@hugeicons' frontend/src` → 0 | PASS | **0 coincidencias** (verificado) |
| 5 | `@hugeicons/*` fuera de `package.json` y `pnpm-lock.yaml` | PASS | `git diff frontend/package.json` elimina ambas; `rg -c 'hugeicons' frontend/pnpm-lock.yaml` → **0**; `node_modules/@hugeicons` ausente |
| 6 | No se agregan otras dependencias | PASS | Único añadido: `reicon-react@^1.1.301` (la librería destino). Nada más |

### Correcciones obligatorias de la librería — 5/5

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 7 | El wrapper neutraliza el `color` inline | PASS (vía D1) | Ver §1/D1. Sin `color` ⇒ **sin atributo `style`**. Efecto del CHECKPOINT conseguido; implementación distinta y mejor |
| 8 | `forwardRef` real al `<svg>` | PASS | `Icon.tsx:68` `React.forwardRef`; VERIFICADO: `UnfoldMoreIcon.$$typeof === Symbol.for('react.forward_ref')` → `true`. El wrapper pasa `ref` a `Base` (`Icon.tsx:71`), que lo pone en el `<svg>` (`createIcon.js:38`). Cadena completa ⇒ `<SelectPrimitive.Icon asChild>` de `select.tsx:47-49` funciona |
| 9 | `strokeWidth` por icono, nunca global | PASS | **23/23 correctos.** Ver tabla §3 |
| 10 | El wrapper no inyecta ninguna clase con `size-` | PASS | El wrapper **no toca `className`**. Única clase inyectada: `reicon` (`createIcon.js:44`), que **no contiene la subcadena `size-`**. VERIFICADO: `<SidebarToggleIcon/>` sin className → `class="reicon"` ⇒ `[&_svg:not([class*='size-'])]:size-4` **sí matchea** y hereda el tamaño. Con `size-3` → `class="reicon size-3"` ⇒ `:not` excluye y respeta el `size-3`, como antes |
| 11 | `data-slot`, `aria-*` y `className` llegan al `<svg>` | PASS | VERIFICADO renderizando `accordion.tsx:55`: `<svg … class="reicon pointer-events-none shrink-0" data-slot="accordion-trigger-icon">`. El `data-slot` llega ⇒ `**:data-[slot=accordion-trigger-icon]:size-4` / `:ml-auto` / `:text-…` (`accordion.tsx:49`) siguen aplicando |

> Hallazgo adicional a favor: `accordion.tsx:49` colorea el icono **por clase**
> (`**:data-[slot=accordion-trigger-icon]:text-[var(--tracker-text-muted)]`). Es un **tercer** sitio
> afectado por el bug del `color` inline que `explore_reicon_api_mapping.md:116-118` no listó (solo
> citaba `select.tsx:49` y `nav-projects.tsx:79`). El wrapper lo cubre igualmente.

### Fuera de alcance — 2/2

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 12 | `shared/navigation/nav-items.tsx` intacto | PASS | Ausente de `git status`. Sus 11 iconos siguen siendo SVG inline con `stroke="currentColor"` (`nav-items.tsx:25,47,72,93,115,135,156,181,202,229,250,270`) |
| 13 | `LoginPage.tsx:26-41` intacto | PASS | Ausente de `git status`. `CheckIcon` local con `#82bc00` sin tocar |

**Sin refactors oportunistas.** Filtré el diff quitando todo lo relativo a iconos: los únicos
cambios estructurales son (a) `breadcrumb.tsx:85` — `{children ?? (<Huge…/>)}` colapsa a
`{children ?? <ChevronRightIcon />}`, y (b) `calendar.tsx:51-54` — el ternario pasa de dato a
componente (declarado en §5.4, obligado por los named exports; `chevronProps.className` se sigue
mezclando igual). Ambos son consecuencia directa de la migración. **Nada más.**

### Comportamiento y verificación — 5/5 verificables + 2 pendientes

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 14 | Primitivas `ui/` conservan `data-slot`, clases de estado, tamaño, alineación | PASS | Ver #10 y #11. Todas las `className` se trasladan carácter a carácter (p. ej. `accordion.tsx:55-56` conserva `group-aria-expanded/accordion-trigger:hidden`/`:inline`; `select.tsx:46` conserva `pointer-events-none size-4 text-muted-foreground`) |
| 15 | Iconos icon-only conservan su nombre accesible | PASS | `sr-only` + `aria-label` en los 24 archivos: **21 en HEAD → 21 en working tree**. Ninguna línea eliminada del diff contiene `aria-`, `sr-only` ni `role=` (las 2 que matchean son las líneas de `accordion` cuyo `group-aria-expanded` se conserva íntegro en la línea nueva). Los iconos nunca tuvieron `aria-*` propio; el nombre siempre vino del `<span class="sr-only">` o del `aria-label` del `<Button>` hermano, y todos siguen ahí |
| 16 | typecheck / lint / build pasan sin desactivar reglas | PASS (no re-ejecutado) | Reportados en verde por el Implementer y **reconfirmados por el Líder**. No aportaba repetirlos: esta migración no falla por compilación |
| 17 | **Smoke autenticado sin errores de consola** | **PENDIENTE** | Requiere navegador con sesión. Fuera del alcance de esta revisión estática |
| 18 | **Verificación visual de los sitios de riesgo** | **PENDIENTE** | Ídem. Ver §4 para la lista priorizada |
| 19 | Resumen en `impl_73-reicon-icon-migration.md` | PASS | Existe y es fiel, salvo las 2 imprecisiones de §5 de este review |
| 20 | Review independiente | PASS | Este documento |

---

## 3. `strokeWidth` por icono — auditado 23/23 contra la geometría real

Contrasté **cada** asignación de `Icon.tsx` contra el código de `node_modules/reicon-react/icons/<Name>.js`
(`grep 'scale(1.33333)'` + `grep 'stroke-width='`), no contra el reporte. **Regla del CHECKPOINT:**
escalados ×1.33 → sin `strokeWidth`; stroke sin escalar → `2`; fill → no-op.

| Icono reicon | scale(1.33333) | stroke-width en el path | Clasificación | `Icon.tsx` | ¿Correcto? |
|---|:---:|:---:|---|:---:|:---:|
| `ChevronDown` / `ChevronUp` / `ChevronLeft` / `ChevronRight` | sí | 1.5 | escalado | — | OK |
| `ChevronExpandY` | sí | 1.5 | escalado | — | OK |
| `Xmark` | sí | 1.5 | escalado | — | OK |
| `Office` | sí | 1.5 | escalado | — | OK |
| `EyeOpen` | sí | 1.5 | escalado | — | OK |
| `SidebarLeft` | no | 1.5 | stroke | `2` | OK |
| `Edit2` | no | 1.5 | stroke | `2` | OK |
| `TickCircle` | no | 1.5 | stroke | `2` | OK |
| `Repeat3` | no | 1.5 | stroke | `2` | OK |
| `Add` | no | 1.5 | stroke | `2` | OK |
| `SearchNormal` | no | 1.5 | stroke | `2` | OK |
| `Calendar3` | no | 1.5 | stroke | `2` | OK |
| `Folder4` | no | 1.5 | stroke | `2` | OK |
| `User4` | no | 1.5 | stroke | `2` | OK |
| `Check` / `Trash` / `Logout` / `MoreH` / `ArrowRight` / `Checklist` | no | **ninguno** | fill | — | OK |

**8 escalados + 9 stroke + 6 fill = 23.** Coincide exactamente con la clasificación de
`explore_reicon_api_mapping.md` §1.7 y con la regla del CHECKPOINT. **Ni un solo error.**

Confirmado además por render:

```
ChevronDownIcon (escalado)  => stroke-width="1.5" | scale? true   -> 2.0 efectivo
BuildingIcon/Office(escal.) => stroke-width="1.5" | scale? true   -> 2.0 efectivo
SidebarToggleIcon (stroke)  => stroke-width="2"   | scale? false  -> 2.0 efectivo
CheckIcon (fill)            => (ninguno)                          -> ~1.5 horneado
```

El tipo público `IconProps = Omit<ReiconIconProps, "strokeWidth">` (`Icon.tsx:51`) impide que un
call-site reintroduzca el error. Buena decisión (§5.5).

### Trampas de nombres — limpio

VERIFICADO en `Icon.tsx:3-26` (imports) y `:86-125` (exports):
- `MoreHorizontalIcon` usa **`MoreH`** (`Icon.tsx:17,121`), **no `MoreHCircle`**. Correcto: el
  `MoreHorizontalCircle01Icon` original no tiene aro. Como efecto secundario evita también los IDs
  `clipPath` duplicados de `MoreHCircle` (`explore …:179`).
- **`Check3` y `ListCheck` no aparecen** en ningún import. Solo se mencionan en el comentario
  `Icon.tsx:46-47` que documenta por qué se evitan. `MoreHCircle` idem (`Icon.tsx:120`).
- Ningún `AltArrowDown` (el nombre inexistente del README).

---

## 4. Hallazgos

### Bloqueantes

**Ninguno.** No encontré ninguna regresión silenciosa. Los 5 vectores de fallo mudo que buscaba
(`color` inline pisando Tailwind, `data-slot` perdido, clase con `size-` rompiendo el `:not()`,
`forwardRef` roto bajo `asChild`, `strokeWidth` mal asignado) están **todos cerrados y verificados
por render**.

### No bloqueantes

1. **`strokeWidth={1.8}` → 2.0 en 13 call-sites (desviación real no declarada).** VERIFICADO: en
   HEAD los 52 sitios se repartían `strokeWidth={2}` ×38, **`{1.8}` ×13**, `{3}` ×1. El reporte
   (`impl…:24`) enmarca todo como *"replicar el grosor efectivo 2.0 que daba HugeIcons con
   `strokeWidth={2}`"* y **nunca menciona los 13 sitios que usaban 1.8** (`TaskCard.tsx`,
   `MiDiaPage.tsx`, `ActivitiesPage.tsx`), que ahora rinden **2.0 en vez de 1.8** (+11 % de grosor
   en iconos de 11–13 px). `explore_reicon_api_mapping.md:317` lo había anticipado y proponía
   `strokeWidth={1.35}` para `Office`.
   **No es un defecto del Implementer:** el CHECKPOINT ordena `strokeWidth` **por icono** y no deja
   sitio a un valor por call-site; el propio CHECKPOINT eligió uniformidad sobre fidelidad. Lo dejo
   registrado porque es un cambio visual real que el reporte no documenta. Si molesta, la salida es
   exponer `strokeWidth` en esos sitios — pero contradiría el criterio #9.
2. **`impl…§5.2` dice "7 instancias" de `color="currentColor"`; son 6.** Documentación.
3. **`impl…§5.2` afirma que conservar `color="currentColor"` habría perdido el rojo en
   `TaskCard.tsx:245`; no es así** (el `DropdownMenuItem` destructivo ya propaga `text-destructive`
   por herencia, `dropdown-menu.tsx:76`). La decisión sigue siendo la correcta, por otras razones.
   Ver §1/D2.
4. **`impl…:15` dice que `reicon-react` "ya estaba en `package.json`".** Frente a HEAD el diff **la
   añade** (`+"reicon-react": "^1.1.301"`). Probablemente ya estaba en el working tree antes de su
   turno (el snapshot de sesión ya traía `M frontend/package.json`). Irrelevante para el resultado.

### Riesgos ya aceptados por el CHECKPOINT (no son hallazgos)

Grosores mezclados 2.0/~1.5, tick del checkbox 3 → ~1.5, y los 4 mapeos dudosos (`Checklist` con
caja, `Office` con 2 edificios, `SidebarLeft` con chevron, `Check` fill). El CHECKPOINT los declara
aceptados por adelantado y el reporte los documenta bien (§4.1-4.4). Cambiar cualquiera es **una
línea en `Icon.tsx`**, como afirma — lo confirmo: los 24 call-sites son agnósticos.

---

## 5. Cobertura — 52/52, sin pérdidas ni duplicados

Recuento en HEAD (`git grep -o '<HugeiconsIcon'`) = **52**. Recuento en working tree de los 23
componentes del wrapper = **51** + **1** en `calendar.tsx:54` (renderizado vía alias
`<ChevronIcon/>`, `calendar.tsx:52-53`) = **52**.

**El desglose por archivo coincide 1:1 con el inventario en los 24 archivos**, sin excepción:

```
nav-projects 5·5   nav-user 2·2      team-switcher 2·2   accordion 2·2
breadcrumb 2·2     calendar 1·1      checkbox 1·1        command 1·1
dialog 1·1         dropdown-menu 3·3 select 4·4          sheet 1·1
sidebar 1·1        ActivitiesPage 4·4 ClientesPage 1·1   EquipoPage 2·2
MiDiaPage 3·3      DealCard 1·1      ClientDetailPage 1·1 ReportsPage 1·1
SalesPage 1·1      TaskCard 8·8      ClientCombobox 3·3  DatePickerField 1·1
```
*(HEAD·working tree)*

También verifiqué que los mapeos **no se cruzaron** en los casos donde HugeIcons y el wrapper
comparten nombre: `nav-projects.tsx` mantiene `FolderIcon`→`Folder4` y `ArrowRightIcon`→`ArrowRight`
(flecha con cola, **no** chevron), y `Delete02Icon`→`TrashIcon`. Correcto.

---

## 6. Qué falta (no imputable al Implementer)

Lo único pendiente es **ojo humano en navegador con sesión** (criterios #17 y #18). Prioridad
sugerida, ordenada por riesgo real tras esta revisión —todos son juicios de **estética**, no de
corrección, porque los mecanismos están verificados:

1. `checkbox.tsx:24` — el tick a ~1.5 (antes 3). La regresión visual más probable de molestar.
2. `select.tsx` — chevron (2.0) y tick (~1.5) juntos: es donde la mezcla de grosores canta.
3. `sidebar.tsx:251` — `SidebarLeft` dibuja un chevron donde antes había 2 guiones.
4. `ActivitiesPage` / `MiDiaPage` / `TaskCard` — los 13 iconos que pasan de 1.8 a 2.0 (§4.1).
5. `Checklist` con caja envolvente — el mapeo de menor confianza.

Los sitios de color (`select.tsx:46` `text-muted-foreground`, `nav-projects.tsx:78`
`text-sidebar-foreground/70`, `accordion.tsx:49` `text-[var(--tracker-text-muted)]`) los doy por
**resueltos**: verifiqué por render que no se emite atributo `style`, así que las clases mandan.
Confirmarlos en navegador es rutina, no riesgo.

---

## Conclusión

Trabajo sólido. El wrapper hace exactamente lo que debía: **un único punto de acoplamiento**, los
tres bugs de la librería encapsulados y verificados, `strokeWidth` correcto en **23/23** iconos,
**52/52** instancias migradas sin pérdidas, cero residuo de `@hugeicons`, alcance respetado sin
refactors oportunistas, y accesibilidad intacta (21→21).

Las 3 desviaciones son **correctas**; D1 en particular es una mejora sobre el literal del
CHECKPOINT, no un atajo. Los únicos reparos son de **documentación** (§4.1-4.4 de mis
no-bloqueantes) y no afectan al código. **Apto para merge**, con el smoke visual pendiente como
tarea de seguimiento.
