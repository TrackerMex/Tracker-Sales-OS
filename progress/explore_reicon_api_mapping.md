# Explore — API de `reicon-react` y mapeo desde HugeIcons

**Fecha:** 2026-07-16
**Versión analizada:** `reicon-react@1.1.301` (2674 iconos) · comparada contra `@hugeicons/core-free-icons@4.2.0` + `@hugeicons/react@1.1.6`
**Alcance:** solo exploración. No se modificó código.

> **Convención de este documento**
> ✅ **VERIFICADO** = leído en el código de la librería o comprobado renderizando con `react-dom/server`.
> 🔶 **SUPOSICIÓN** = juicio visual/semántico mío, no comprobado en navegador.
> Todas las afirmaciones sobre geometría provienen de leer el path SVG real de ambas librerías.

---

## Resumen ejecutivo (leer esto primero)

| Pregunta | Respuesta |
|---|---|
| ¿Reenvía `className`? | ✅ Sí, pero **prefijado con `reicon `** |
| ¿Reenvía `ref`? | ✅ Sí, `forwardRef` real hacia el `<svg>` |
| ¿Spread de props arbitrarias (`data-*`, `aria-*`, `onClick`)? | ✅ Sí |
| ¿Migración de primitivas shadcn viable sin wrapper? | ⚠️ **Técnicamente sí, pero NO conviene** — hay 3 trampas serias (abajo) |
| Iconos con mapeo de confianza **alta** | **17 de 23** |
| Iconos problemáticos | `Tick02Icon`, `CheckListIcon`, `SidebarLeftIcon`, `OfficeIcon`, `MoreHorizontalCircle01Icon` (nombre engañoso), `ArrowReloadHorizontalIcon` |

**Los 3 hallazgos que deciden la migración:**

1. **El `<svg>` siempre lleva `style="color:currentColor"` inline** → las clases Tailwind `text-*` puestas **sobre el icono** dejan de funcionar (inline gana a class). Afecta 2 sitios reales hoy. ✅ VERIFICADO
2. **`strokeWidth` es un no-op en ~59% de los iconos** (1565/2674 son fill-based, sin `stroke`). La app pasa `strokeWidth={2}` en ~25 sitios. ✅ VERIFICADO
3. **154 iconos llevan `transform="scale(1.33333)"`**, lo que multiplica el grosor visual ×1.33. Pasar `strokeWidth={2}` a un chevron da un grosor efectivo de **2.67**, no 2. ✅ VERIFICADO

---

## PARTE 1 — API real de `reicon-react`

### 1.1 Código fuente completo del factory

Toda la librería es un único factory de 57 líneas: `frontend/node_modules/reicon-react/createIcon.js`.
Los 2674 iconos son llamadas a `createIcon('Name', { O: '<svg string>', F: '<svg string>' })`.

```js
// createIcon.js:37-48 — el núcleo entero
return createElement('svg', {
  ref,                                                   // :38  forwardRef
  xmlns: 'http://www.w3.org/2000/svg',
  width: size, height: size,                             // :40-41 atributos, no CSS
  viewBox: '0 0 24 24',
  fill: 'none',
  className: className ? 'reicon ' + className : 'reicon', // :44 prefijo forzado
  style: { color, ...style },                            // :45 ⚠️ color inline SIEMPRE
  ...rest,                                               // :46 spread después de todo
  dangerouslySetInnerHTML: { __html: html },             // :47
});
```

### 1.2 Formas de importar

| Forma | Ejemplo | Tree-shaking con Vite |
|---|---|---|
| Named desde root | `import { ChevronDown } from 'reicon-react'` | ✅ Correcto |
| Subpath directo | `import ChevronDown from 'reicon-react/icons/ChevronDown'` | ✅ Correcto, salta el barrel |

`package.json:29` declara `"sideEffects": false` y `exports["./icons/*"]` (`package.json:16-19`). El barrel `index.js` son 2674 re-exports planos.

**Recomendación:** usar **named desde el root**. Con `sideEffects:false` + ESM plano, Rollup elimina lo no usado en build de producción. El subpath solo aporta en **dev** (Vite pre-bundlea/parsea el barrel de 135 KB); si el arranque de dev se resiente, el subpath lo evita. 🔶 SUPOSICIÓN: no medí el impacto en dev-server.

### 1.3 Props y defaults ✅ VERIFICADO (`createIcon.js:18-27` + `createIcon.d.ts:5-16`)

| Prop | Tipo | Default | Comportamiento real |
|---|---|---|---|
| `color` | `string` | `'currentColor'` | Se escribe como **`style.color` inline** (no atributo `fill`/`stroke`) |
| `secondaryColor` | `string` | — | ⚠️ **NO-OP.** Se desestructura en `createIcon.js:20` y **nunca se usa**. 0/2674 iconos lo referencian. Documentado en el README pero muerto en v1.1.301 |
| `size` | `number \| string` | `24` | Atributos `width`/`height` del `<svg>` |
| `weight` | `'Filled' \| 'Outline'` | `'Outline'` | Elige la clave `F`/`O`. Los 2674 iconos tienen ambas; **94 tienen `F` idéntico a `O`** (weight es no-op ahí) |
| `strokeWidth` | `number \| string` | — (no toca nada) | **Regex string-replace**: `html.replace(/stroke-width="[^"]*"/g, ...)` (`createIcon.js:34`) |

Extiende `Omit<SVGAttributes<SVGSVGElement>, 'color'>` (`createIcon.d.ts:5`).

### 1.4 🔴 CRÍTICO — Passthrough, className y ref

Comprobado renderizando con `react-dom/server`:

| Caso | Salida real |
|---|---|
| `<ChevronDown />` | `<svg ... class="reicon" style="color:currentColor">` |
| `<ChevronDown className="size-4 text-muted-foreground" />` | `class="reicon size-4 text-muted-foreground"` ✅ |
| `<MoreH data-slot="x" aria-label="more" id="zz" />` | `... data-slot="x" aria-label="more" id="zz"` ✅ |
| `<ChevronDown style={{color:'red'}} />` | `style="color:red"` (el `style` del usuario gana) |
| `<ChevronDown width={99} />` | `width="99" height="24"` ⚠️ asimétrico |

**Conclusiones:**
- ✅ **`ref` se reenvía** — `forwardRef` real (`createIcon.js:12`, `ref` en `:38`). Radix/shadcn (`asChild`, `Slot`) funcionan.
- ✅ **`className` se reenvía**, pero **siempre prefijado con `reicon`**. La clase `.reicon` **no tiene CSS** (el paquete no envía ningún `.css`; `package.json:30-37` solo lista `.js`/`.d.ts`). Es solo un hook — inofensiva, y de hecho útil para un override global.
- ✅ **`data-*`, `aria-*`, `onClick`, `id`, `style` se reenvían** vía `...rest` (`createIcon.js:46`).
- ⚠️ **`...rest` va DESPUÉS de `width`/`height`/`className`/`style`** pero **ANTES** de `dangerouslySetInnerHTML`. Consecuencias:
  - `width`/`height` sueltos **sí** pisan a `size` (pero solo el que pases → estado inconsistente).
  - `className` y `style` **no** son pisables por `rest` (se desestructuran antes).
  - Pasar `dangerouslySetInnerHTML` como prop **se ignora silenciosamente** (irrelevante en la práctica).

**Veredicto sobre las primitivas shadcn:** el passthrough es suficiente. `data-slot`, `className`, `ref` y `aria-*` — todo lo que shadcn/Radix necesita — funciona. **El bloqueante no es el passthrough, es el `color` inline (§1.5).**

### 1.5 🔴 La trampa del `color` inline

`createIcon.js:45` escribe **siempre** `style={{ color: 'currentColor', ... }}` en el `<svg>`.

Por spec CSS (Color L3/L4): *«si `currentColor` se aplica a la propiedad `color` misma, se trata como `color: inherit`»*. Y un `style` inline **gana a cualquier clase**. Por tanto:

```jsx
<ChevronDown className="text-muted-foreground" />
// -> class="reicon text-muted-foreground" style="color:currentColor"
// El inline gana -> color: inherit -> hereda del padre.
// ❌ text-muted-foreground NO se aplica.
```

✅ VERIFICADO que el inline se emite siempre. 🔶 SUPOSICIÓN (por spec, no probado en navegador): que esto anule visualmente la clase. **Debe confirmarse en navegador antes de migrar.**

**Sitios afectados hoy (2):**
- `frontend/src/components/ui/select.tsx:49` → `className="... text-muted-foreground"`
- `frontend/src/components/nav-projects.tsx:79` → `className="text-sidebar-foreground/70"`

**Workaround ✅ VERIFICADO** — `style={{ color: undefined }}` elimina el atributo `style` por completo y devuelve el control a Tailwind:

| Intento | Resultado |
|---|---|
| `<ChevronDown />` | `style="color:currentColor"` |
| `<ChevronDown color={undefined} />` | `style="color:currentColor"` ❌ (el default de la firma reactiva) |
| `<ChevronDown style={{ color: undefined }} />` | **sin atributo `style`** ✅ |
| `<ChevronDown className="size-4 text-red-500" style={{color:undefined}} />` | `class="reicon size-4 text-red-500"`, sin `style` ✅ |

Este workaround es exactamente el tipo de detalle que justifica un wrapper (§3).

### 1.6 Tamaño: prop `size` vs clase Tailwind `size-4`

- `size` escribe **atributos** `width`/`height` en el `<svg>` (`createIcon.js:40-41`).
- Tailwind `size-4` genera **CSS** `width:1rem; height:1rem`.
- En SVG2 `width`/`height` del `<svg>` son *geometry properties* presentacionales → **CSS gana sobre el atributo**.

**Precedencia real: `size-4` (clase) > `size={24}` (atributo).** ✅ VERIFICADO que se emiten como atributos; 🔶 SUPOSICIÓN (por spec SVG2, no probado en navegador) que la clase gana.

**No pelean, pero conviven mal:** el `size={24}` por defecto queda siempre en el DOM aunque no aplique. Si alguna vez el CSS no carga o un `size-*` no matchea, el icono salta a 24px. **Recomendación: usar clases Tailwind `size-*` y no tocar `size`**, que es lo que ya hace la app.

### 1.7 🔴 Grosor: la librería no es homogénea

✅ VERIFICADO por escaneo de los 2674 archivos:

| Categoría | Cantidad | `strokeWidth` funciona | Grosor efectivo por defecto |
|---|---|---|---|
| Stroke **escalados** (`scale(1.33333)`) | **154** | ✅ sí | `1.5 × 1.333` = **2.0** |
| Stroke **sin escalar** (grid 24) | **955** | ✅ sí | **1.5** |
| **Fill-based** (sin `stroke`) | **1565** | ❌ **NO-OP** | ~**1.5** fijo, inmutable |

**Todos los stroke usan `stroke-width="1.5"`** (4558 ocurrencias, valor único).

Medición real (`react-dom/server`):

```
ChevronDown  default        -> stroke-width="1.5"  × scale 1.333 = 2.0 efectivo
ChevronDown  strokeWidth=2  -> stroke-width="2"    × scale 1.333 = 2.67 efectivo  ⚠️
SidebarLeft  default        -> stroke-width="1.5"  (sin scale)   = 1.5 efectivo
SidebarLeft  strokeWidth=2  -> stroke-width="2"    (sin scale)   = 2.0 efectivo  ✅
Check        strokeWidth=3  -> (ningún stroke-width)             ❌ NO-OP
```

**Equivalencia con la app actual.** HugeIcons: grid 24, `stroke-width` 1.5 base, la app pasa `strokeWidth={2}` → **grosor efectivo 2.0**. Para replicar ese 2.0 en reicon la regla **no es uniforme**:

| Tipo de icono reicon | Qué pasar para obtener ≈2.0 |
|---|---|
| Escalado (`ChevronDown/Up/Left/Right`, `ChevronExpandY`, `Xmark`, `Office`, `EyeOpen`) | **NADA** — el default ya es 2.0 |
| Stroke sin escalar (`SidebarLeft`, `Edit2`, `TickCircle`, `Repeat3`, `Add`, `SearchNormal`, `Calendar3`, `Folder4`, `User4`) | `strokeWidth={2}` |
| Fill (`Check`, `Trash`, `Logout`, `MoreH`, `ArrowRight`, `Checklist`) | **Imposible** — quedan en ~1.5, **se verán más finos** |

⚠️ **Un wrapper que fije `strokeWidth={2}` globalmente sería un error**: engordaría los chevrons a 2.67. Este es el argumento más fuerte contra un default único (§3).

**Casos concretos de regresión:**
- `frontend/src/components/ui/checkbox.tsx:25` usa `Tick02Icon strokeWidth={3}` → `Check` es fill ⇒ el tick del checkbox quedará **fijo en ~1.5 en vez de 3**. Regresión visible. 🔶 SUPOSICIÓN: magnitud no medida en navegador.
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx:162,173,184` usan `strokeWidth={1.8}` → sobre `Office` (escalado) daría 2.4.

### 1.8 Otros hallazgos de la librería

- **52 iconos usan `url(#id)` con IDs hardcodeados** (p.ej. `MoreHCircle` → `clip0_17007_17240`). Renderizar el mismo icono 2× en una página produce **IDs duplicados en el DOM** (HTML inválido). Impacto práctico bajo: los `clipPath` son un `<rect width="24" height="24">` (no-op) y el navegador resuelve al primero. ✅ VERIFICADO.
- **`dangerouslySetInnerHTML`** (`createIcon.js:47`): el contenido es un string estático del propio paquete (sin input de usuario) ⇒ sin riesgo XSS, pero impide que React inspeccione/optimice los paths.
- **El README miente en su propio ejemplo**: `import { AltArrowDown } from 'reicon-react'` (README.md:66) — **`AltArrowDown` no existe** en `index.d.ts`. Los nombres del README parecen copiados del set *Solar*. ⇒ **No confiar en el README para nombres; verificar siempre contra `index.d.ts`.** ✅ VERIFICADO.

### 1.9 Diferencias vs HugeIcons — qué se gana y qué se pierde

Modelo actual: `<HugeiconsIcon icon={X} strokeWidth={2} />` — un solo componente, el icono es **dato** (array de paths).

**Se gana:**
- Import más natural (`<ChevronDown />` vs `<HugeiconsIcon icon={ChevronDown01Icon} />`).
- `ref` real al `<svg>`.
- Dos pesos (Outline/Filled) en los 2674.
- Zero-dependencias, MIT.

**Se pierde (importante):**
- ❌ **El punto único de acoplamiento.** Hoy `HugeiconsIcon` es *un* componente; el icono viaja como prop. Con reicon **cada icono es un componente** ⇒ la dependencia se esparce por **24 archivos**.
- ❌ **Grosor uniforme.** HugeIcons: todos stroke, todos grid 24 ⇒ `strokeWidth={2}` es consistente en todo el set. Reicon: 3 regímenes distintos (§1.7) que no se pueden unificar.
- ❌ **`strokeWidth` fiable** → no-op en 59% de los iconos.
- ❌ **Control de color por clase** → roto por el `color` inline (§1.5).
- ❌ **`secondaryColor`** → documentado pero muerto.
- ⚠️ **Implementación menos robusta**: regex sobre HTML + `dangerouslySetInnerHTML` + IDs hardcodeados vs. el render estructurado de HugeIcons.

---

## PARTE 2 — Mapeo de iconos

### 2.0 Corrección al brief: son **23**, no 24

`CheckIcon` **no es un icono de HugeIcons**. Es un componente local hecho a mano en
`frontend/src/modules/auth/presentation/pages/LoginPage.tsx:26-41`:

```jsx
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
     stroke="#82bc00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
  <polyline points="20 6 9 17 4 12" />
</svg>
```

Verificado extrayendo todos los `import { ... } from '@hugeicons/core-free-icons'` del árbol `src/`: **23 nombres**. `CheckIcon` no aparece.

⚠️ **Además responde la pregunta del brief `Tick02Icon` vs `CheckIcon`:** no son dos iconos de la misma librería usados en contextos distintos. `Tick02Icon` es HugeIcons (checkbox, dropdown, select, combobox); `CheckIcon` es SVG a mano con **color de marca hardcodeado `#82bc00`** y `strokeWidth` 2.5, usado solo en la lista de features del login. **Queda fuera del alcance de esta migración** (o se sustituye por `Check` de reicon, pero perdería el 2.5 al ser fill-based).

### 2.1 Tabla de mapeo

Columna «Existe» verificada contra `index.d.ts` **y** la presencia de `icons/<Name>.js`.
`(S)` = stroke-based · `(F)` = fill-based (`strokeWidth` no-op) · `(×1.33)` = escalado.

| HugeIcons | Reicon propuesto | ¿Existe? | Confianza | Nota semántica |
|---|---|---|---|---|
| `ArrowDown01Icon` | `ChevronDown` (S ×1.33) | ✅ | **alta** | Huge = chevron curvo con bezier (`M18 9C18 9 13.58 15 12 15...`); reicon = polyline recta (`15.25 6.5 → 9 12.75 → 2.75 6.5`). Semántica idéntica; el reicon es más anguloso. Default ya = 2.0 ⇒ **no pasar `strokeWidth`** |
| `ArrowUp01Icon` | `ChevronUp` (S ×1.33) | ✅ | **alta** | Ídem |
| `ArrowLeft01Icon` | `ChevronLeft` (S ×1.33) | ✅ | **alta** | Ídem |
| `ArrowRight01Icon` | `ChevronRight` (S ×1.33) | ✅ | **alta** | Ídem |
| `UnfoldMoreIcon` | `ChevronExpandY` (S ×1.33) | ✅ | **alta** | **Coincidencia exacta.** Huge = chevron arriba (y=5) + chevron abajo (y=19), apuntando hacia fuera. Reicon = `12.5 6.25 → 9 2.75 → 5.5 6.25` (arriba) + `12.5 11.75 → 9 15.25 → 5.5 11.75` (abajo). Mismo concepto |
| `Cancel01Icon` | `Xmark` (S ×1.33) | ✅ | **alta** | Dos `<line>` en X. Default 2.0 ⇒ no pasar `strokeWidth` |
| `CheckmarkCircle02Icon` | `TickCircle` (S) | ✅ | **alta** | Círculo + tick, stroke ⇒ respeta `strokeWidth={2}`. Alternativa fill: `CheckCircle` |
| `Calendar01Icon` | `Calendar3` (S) | ✅ | **alta** | Estructura calcada: Huge `M16 2V6 M8 2V6` + `M3 10H21`; reicon `M8 2V5` + `M16 2V5` + `M3.5 9.09H20.5`. Preferir sobre `Calendar` (F). Huge tiene glifos "1/4" internos que reicon no |
| `Search01Icon` | `SearchNormal` (S) | ✅ | **alta** | Lupa + mango. Preferir sobre `Search` (F) |
| `PlusSignIcon` | `Add` (S) | ✅ | **alta** | Huge = `M12 4V20M20 12H4` (cruz simple). `Add` es stroke ⇒ respeta `strokeWidth`. Preferir sobre `Plus` (F) |
| `ViewIcon` | `EyeOpen` (S ×1.33) | ✅ | **alta** | Ojo + pupila. Preferir sobre `Eye` (F). Default 2.0 ⇒ no pasar `strokeWidth` |
| `User02Icon` | `User4` (S) | ✅ | **alta** | Huge = cabeza + hombros (`M18.5 20V17.97...`). `User4` = círculo cabeza + arco hombros. Preferir sobre `User2` (F) |
| `FolderIcon` | `Folder4` (S) | ✅ | **alta** | Carpeta con pestaña. Preferir sobre `Folder` (F) |
| `PencilEdit02Icon` | `Edit2` (S) | ✅ | **alta** | Lápiz diagonal. Stroke ⇒ respeta `strokeWidth`. Alternativa fill: `Pen` |
| `ArrowRightIcon` | `ArrowRight` (F) | ✅ | **alta** (semántica) / media (peso) | Flecha con cola. **Sin variante stroke usable**: `ArrowRight4`/`ArrowRight5` son stroke pero de forma curva/swoosh (no flecha recta). ⇒ se queda fill ⇒ **~1.5, más fino que el resto** |
| `Delete02Icon` | `Trash` (F) | ✅ | **alta** (semántica) / media (peso) | **Sí, es bote de basura** (tapa + cuerpo + asa), coincide con Huge. `Trash2/3/4` también fill ⇒ **no hay versión stroke** ⇒ ~1.5 fijo |
| `LogoutIcon` | `Logout` (F) | ✅ | **alta** (semántica) / media (peso) | `Logout2/3/4` **todas fill** ⇒ sin opción stroke ⇒ ~1.5 fijo |
| `MoreHorizontalCircle01Icon` | **`MoreH`** (F) | ✅ | **alta** ⚠️ | 🚨 **NO usar `MoreHCircle`.** Verificado: el Huge `MoreHorizontalCircle01Icon` son **3 paths y ninguno es un círculo envolvente** — «Circle01» describe que *los puntos* son círculos, no que haya un aro. `MoreH` = 3 puntos sueltos ✅. `MoreHCircle` **sí** añade un aro (`M12 0.25C5.51...`) ⇒ sería un icono distinto. El mapeo por nombre aquí engaña |
| `ArrowReloadHorizontalIcon` | `Repeat3` (S) | ✅ | **media-alta** | Estructura equivalente: Huge = 2 líneas horizontales curvadas (y=5.5, y=18.5) + 2 puntas de flecha. `Repeat3` = línea y=5.16 + punta izq. + línea y=18.84 + punta der. Misma idea de bucle de recarga. **Diferencia visual:** Huge curva los extremos en semicírculo, `Repeat3` usa esquinas redondeadas tipo rect. `Refresh`/`ArrowsRotate` son circulares ⇒ peor match. Stroke ⇒ respeta `strokeWidth={2}` |
| `SidebarLeftIcon` | `SidebarLeft` (S) | ✅ | **media** | **Riesgo:** contenido interno distinto. Huge = rect + divisoria en `x=9.5` + **2 guiones** (`M5 7H6M5 10H6`). Reicon = rect + divisoria en `x=7.97` + **un chevron ←** (`M14.97 9.44 L12.41 12 L14.97 14.56`). El chevron sugiere «colapsar», los guiones sugieren «menú». Se usa en `ui/sidebar.tsx:252` (botón toggle) ⇒ el chevron **hasta encaja mejor** semánticamente, pero **cambia el dibujo**. Sin escalar ⇒ pasar `strokeWidth={2}`. Alternativas: `Sidebar`, `Sidebar2` (ambas F, divisoria a la **derecha** en `x=15.75` ⇒ peores) |
| `OfficeIcon` | `Office` (S ×1.33) | ✅ | **media** | **Riesgo:** Huge = **un** edificio alto (x=2→14) con rejilla de ventanas (`M6.5 11H5.5M10.5 11H9.5...`). Reicon `Office` = **dos** edificios (uno alto der. + uno bajo izq.). Distinta silueta, misma semántica «empresa». Alternativas reales: `Building2` (S), `Buildings` (F), `Building`, `City`. 🔶 Si el criterio es «un edificio», evaluar `Building2` |
| `Tick02Icon` | `Check` (F) | ✅ | **media** | Forma correcta (`Check` es un stroke de 1.5 convertido a fill — offsets de 1.06 ≈ 1.5·√2/2). **Problema: es fill ⇒ `strokeWidth` no-op.** No existe **ningún** checkmark simple stroke-based en reicon: todos los `*Tick`/`*Check` stroke traen contenedor (`TickCircle`, `TickSquare`, `BagTick`, `ShieldTick`…). ⚠️ **`Check3` NO es un checkmark** pese al nombre (es un panel dividido). Impacto: `checkbox.tsx:25` (`strokeWidth={3}`) perderá grosor |
| `CheckListIcon` | `Checklist` (F) | ✅ | **baja** | **El peor mapeo.** Huge = 3 líneas (`M11 6L21 6`, `M11 12L21 12`, `M11 18L21 18`) + 2 ticks a la izq., **sin contenedor**. Reicon `Checklist` = **caja redondeada envolvente** (`1.25`→`22.75`) con la lista dentro ⇒ silueta distinta. ⚠️ **`ListCheck` NO sirve**: verificado, son **solo líneas horizontales sin ningún tick** (nombre engañoso). Otras: `ChecklistAlt` (F), `CheckListSquare` (F, también con caja), `ClipboardTick`, `Task`, `Tasks`. **Requiere decisión del usuario**: ninguna reproduce «líneas + ticks sin caja» |

### 2.2 Recuento

| Confianza | Nº | Iconos |
|---|---|---|
| **Alta** | **17** | ChevronDown/Up/Left/Right, ChevronExpandY, Xmark, TickCircle, Calendar3, SearchNormal, Add, EyeOpen, User4, Folder4, Edit2, ArrowRight, Trash, Logout, MoreH |
| **Media-alta** | 1 | Repeat3 |
| **Media** | 4 | SidebarLeft, Office, Tick02→Check, (y el peso de ArrowRight/Trash/Logout) |
| **Baja** | 1 | CheckList→Checklist |

*(17 incluye los 3 que son «alta en semántica / media en peso» — ArrowRight, Trash, Logout — cuyo único defecto es el grosor fill.)*

### 2.3 Trampas de nombres detectadas ⚠️

| Nombre que parece obvio | Realidad verificada |
|---|---|
| `MoreHCircle` para `MoreHorizontalCircle01Icon` | ❌ El Huge **no tiene aro**. Usar `MoreH` |
| `Check3` para un checkmark | ❌ Es un panel dividido, no un tick |
| `ListCheck` para `CheckListIcon` | ❌ Solo líneas, **sin ticks** |
| `AltArrowDown` (README.md:66) | ❌ **No existe** en la librería |

---

## PARTE 3 — Recomendaciones

### 3.1 Wrapper propio: **SÍ, recomendado** — `frontend/src/shared/components/Icon.tsx`

**Razones (en orden de peso):**

1. **Recuperar el punto único de acoplamiento.** Hoy `HugeiconsIcon` es *el* único punto de contacto con la librería. Migrar a componentes directos esparce `reicon-react` por **24 archivos**, incluidas **12 primitivas shadcn** (`select`, `dropdown-menu`, `accordion`, `breadcrumb`, `checkbox`, `dialog`, `sheet`, `sidebar`, `command`, `calendar`…). Dado que ya se migró una vez de librería de iconos, la probabilidad de volver a hacerlo no es cero: **el wrapper hace que la próxima migración sean 1 archivo y no 24.**

2. **Encapsular el bug del `color` inline (§1.5).** El wrapper puede aplicar `style={{ color: undefined }}` una sola vez y devolver el comportamiento Tailwind que la app ya asume. Sin wrapper hay que recordarlo en cada sitio — y falla en silencio (color heredado ≠ color pedido), que es el peor modo de fallo.

3. **Absorber la asimetría del grosor (§1.7).** Es *imposible* que cada call-site acierte con `strokeWidth` sin saber si el icono está escalado. El wrapper puede mantener el mapa de qué icono lleva qué.

4. **Aislar los nombres engañosos (§2.3).** `MoreH` vs `MoreHCircle` es un error a un carácter de distancia. Un alias semántico (`icon="more"`) lo blinda.

**⚠️ Lo que el wrapper NO debe hacer:**
- ❌ **No fijar `strokeWidth={2}` global** — engordaría los 154 escalados a 2.67 (§1.7).
- ❌ **No fijar `size` numérico** — la app ya usa `size-*` de Tailwind; un `size` fijo solo mete atributos muertos en el DOM.

**Forma sugerida** (🔶 propuesta de diseño, no implementada — no es mi tarea):

```
Icon.tsx expone un mapa nombre-semántico -> { Cmp, strokeWidth? }
- strokeWidth se define POR ICONO (2 para los sin escalar; nada para los escalados)
- aplica style={{ color: undefined }} siempre
- reenvía className / ref / data-* / aria-* sin tocar
```

Coste: ~1 archivo + 23 entradas. Beneficio: 24 archivos quedan agnósticos y los 3 bugs de la librería se arreglan una vez.

**Alternativa mínima si se rechaza el wrapper:** un CSS global sobre la clase `.reicon` (que la librería ya inyecta en todos los `<svg>`) puede mitigar el color:
```css
.reicon { color: inherit; }  /* no basta: el inline sigue ganando */
```
❌ No funciona — el inline gana igual. Haría falta `!important`, lo cual rompería el prop `color`. **⇒ El wrapper es la vía limpia.**

### 3.2 Equivalencia de grosor — resumen accionable

| Origen (HugeIcons) | Grosor efectivo hoy | Destino reicon | Cómo replicarlo |
|---|---|---|---|
| `strokeWidth={2}` sobre chevrons/X/eye/office | 2.0 | escalados ×1.33 | **no pasar nada** (default = 2.0) ✅ |
| `strokeWidth={2}` sobre sidebar/edit/tick-circle/repeat/add/search/calendar/folder/user | 2.0 | stroke sin escalar | `strokeWidth={2}` ✅ |
| `strokeWidth={2}` sobre arrow-right/trash/logout/more/checklist | 2.0 | **fill** | ❌ imposible → quedan ~1.5 (**más finos**) |
| `strokeWidth={3}` en `checkbox.tsx:25` | 3.0 | `Check` (fill) | ❌ imposible → ~1.5 (**regresión visible**) |
| `strokeWidth={1.8}` en `ActivitiesPage.tsx:162,173,184` | 1.8 | `Office` (×1.33) | pasar `1.35` (1.35×1.33≈1.8) |

**Conclusión sobre homogeneidad:** con HugeIcons todos los iconos comparten grosor 2.0. Con reicon el set quedará mezclado: **2.0** (stroke) y **~1.5** (fill), y **esa diferencia no se puede eliminar** — es geometría horneada en el path. 🔶 SUPOSICIÓN: a 16px de tamaño la diferencia 2.0 vs 1.5 es sutil pero perceptible al comparar iconos adyacentes (p.ej. el chevron y el tick de un `select`, que se ven juntos). **Recomiendo una prueba visual lado a lado antes de comprometerse con la migración.**

### 3.3 Riesgos abiertos / verificar en navegador

1. 🔴 ¿La clase `text-muted-foreground` se anula de verdad por el `color` inline? (spec dice que sí)
2. 🔴 ¿El tick del checkbox a ~1.5 se ve aceptable vs el 3 actual?
3. 🟡 ¿La mezcla 2.0/1.5 canta en `select.tsx` (chevron + tick juntos)?
4. 🟡 `SidebarLeft` con chevron vs los guiones actuales — ¿es aceptable el cambio de dibujo?
5. 🟡 `Checklist` con caja vs sin caja — el mapeo de baja confianza.
6. 🟢 IDs duplicados de `clipPath` si se usara `MoreHCircle` (se evita usando `MoreH`).

---

## Apéndice — Archivos consultados

| Archivo | Para qué |
|---|---|
| `frontend/node_modules/reicon-react/createIcon.js:1-57` | Implementación completa (la fuente de verdad real) |
| `frontend/node_modules/reicon-react/createIcon.d.ts:1-26` | Tipos de props |
| `frontend/node_modules/reicon-react/package.json:10-29` | `exports`, `sideEffects` |
| `frontend/node_modules/reicon-react/README.md` | Doc oficial (⚠️ con errores: `AltArrowDown`, `secondaryColor`) |
| `frontend/node_modules/reicon-react/index.d.ts` | 2674 exports — verificación de nombres |
| `frontend/node_modules/reicon-react/icons/*.js` | Geometría real (escaneo de los 2674) |
| `frontend/node_modules/@hugeicons/core-free-icons/dist/esm/index.js` | Geometría de los 23 iconos origen |
| `frontend/src/modules/auth/presentation/pages/LoginPage.tsx:26-41` | `CheckIcon` local (no es HugeIcons) |
| `frontend/src/components/ui/checkbox.tsx:25` | `strokeWidth={3}` — caso de regresión |
| `frontend/src/components/ui/select.tsx:49` | `text-muted-foreground` sobre icono |
| `frontend/src/components/nav-projects.tsx:79` | `text-sidebar-foreground/70` sobre icono |
| `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx:162,173,184` | `strokeWidth={1.8}` |
