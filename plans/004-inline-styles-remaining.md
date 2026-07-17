# Plan 004: Eliminar estilos inline en módulos restantes y componentes raíz

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada comando
> de verificación y confirma el resultado esperado antes de avanzar. Si ocurre
> algo de la sección "STOP conditions", detente y reporta — no improvises.
> Al terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat cc0b102..HEAD -- frontend/src/modules/reports frontend/src/modules/mi-dia frontend/src/modules/clients frontend/src/modules/auth frontend/src/modules/sales frontend/src/modules/settings frontend/src/modules/equipo frontend/src/modules/import-export frontend/src/modules/coaching frontend/src/components/nav-user.tsx frontend/src/components/app-sidebar.tsx frontend/src/shared/components`
> Cambios de los planes 001–003 en estos paths son esperados (LoginPage,
> ClientesPage y CreateTaskForm fueron tocados por el plan 002). Cualquier otro
> cambio: compara extractos y trata desajustes como STOP.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001-tracker-tokens-tailwind.md (obligatorio), plans/003-inline-styles-core-modules.md (recomendado — establece el patrón)
- **Category**: tech-debt
- **Planned at**: commit `cc0b102`, 2026-07-14

## Why this matters

Completa la consolidación del plan 003 en el resto del frontend (~258
`style={{...}}` más). Incluye los dos problemas de performance señalados por la
crítica de UI: transiciones de `width` que fuerzan layout en `MiDiaPage.tsx:348`
y `ExecutiveSlide.tsx:54`. Al terminar, TODO estilo inline del frontend será un
valor dinámico justificado.

## Current state

**Aplican las mismas 6 reglas y la misma tabla de mapeo hex → clase del plan
003** (`plans/003-inline-styles-core-modules.md`, sección "Current state") —
léelas primero; son parte de este plan.

### Inventario y presupuesto por archivo (conteo en cc0b102)

| Archivo | Hoy | Máx. final |
|---|---:|---:|
| `modules/reports/presentation/pages/ReportsPage.tsx` | 24 | 3 |
| `modules/reports/presentation/pages/LaminaPage.tsx` | 5 | 1 |
| `modules/reports/presentation/components/ExecutiveSlide.tsx` | 120 | 12 |
| `modules/mi-dia/presentation/pages/MiDiaPage.tsx` | 30 | 3 |
| `modules/clients/presentation/pages/ClientesPage.tsx` | 4 | 1 |
| `modules/auth/presentation/pages/LoginPage.tsx` | 20 | 1 |
| `modules/sales/presentation/pages/SalesPage.tsx` | 10 | 1 |
| `modules/settings/presentation/pages/SettingsPage.tsx` | 6 | 1 |
| `modules/equipo/presentation/pages/EquipoPage.tsx` | 11 | 1 |
| `modules/import-export/presentation/pages/ImportExportPage.tsx` | 14 | 1 |
| `modules/coaching/presentation/pages/CoachingPage.tsx` | 5 | 1 |
| `components/nav-user.tsx` | 2 | 0 |
| `components/app-sidebar.tsx` | 3 | 0 |
| `shared/components/layout/AppLayout.tsx` | 1 | 0 |
| `shared/components/forms/FormErrorSummary.tsx` | 2 | 0 |
| `shared/components/forms/FieldError.tsx` | 1 | 0 |
| **Total** | **258** | **≤ 27** |

(Header.tsx ya quedó en 0 con el plan 001; AgendaPage/TaskCard etc. en el 003.)

### Casos especiales conocidos

**ExecutiveSlide.tsx** es la lámina ejecutiva mensual (se ve en /reportes y
/lamina). Está escrita 100% con estilos inline. Sus dinámicos legítimos:
porcentajes de barras (`width: ${clamped}%`), colores de salud
(`healthColor(h)`), y valores derivados del reporte. Extracto verificado
(líneas 39–58):

```tsx
function Bar({ pctVal, dark }: { pctVal: number; dark?: boolean }) {
  const clamped = Math.min(100, Math.max(0, pctVal));
  return (
    <div style={{
      height: 3,
      background: dark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
      borderRadius: 99, overflow: 'hidden', marginBottom: 4,
    }}>
      <div style={{
        height: '100%', width: `${clamped}%`,
        background: '#82bc00', borderRadius: 99,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}
```

Forma objetivo de `Bar` (aplica regla 5 — sin transición de `width`):

```tsx
function Bar({ pctVal, dark }: { pctVal: number; dark?: boolean }) {
  const clamped = Math.min(100, Math.max(0, pctVal));
  return (
    <div className={cn("mb-1 h-[3px] overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-tracker-border")}>
      <div
        className="h-full origin-left rounded-full bg-tracker-green transition-transform duration-400"
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  );
}
```

Existe también `executive-slide.utils.ts` con `LABEL_STYLE` exportada — si tras
la migración queda sin usos, elimínala de ambos lados.

**MiDiaPage.tsx:348** tiene una transición de `width` en una barra de progreso:
misma receta `scaleX` de arriba.

**ReportsPage.tsx:124 y 127** referencian la fuente Montserrat: es identidad
documentada de la lámina — CONSÉRVALA (puedes moverla a clase
`font-[Montserrat_Variable]` o dejar esas dos en `style`; cuentan dentro del
presupuesto de 3).

**LoginPage.tsx** es la página branded de acceso (fondo oscuro): estilos
estáticos → clases con tokens (`bg-tracker-dark`, `text-tracker-green`, etc.).

## Commands you will need

Los mismos del plan 003 (desde `frontend/`): `npm run typecheck`,
`npm run lint`, `npm run build`, `npx prettier --write <archivo>`, y
`rg -c 'style=\{\{' <archivo>` desde la raíz del repo.

## Scope

**In scope** (únicos archivos a modificar): los 16 de la tabla, más
`modules/reports/presentation/components/executive-slide.utils.ts` (solo para
retirar consts de estilo huérfanas).

**Out of scope** (NO tocar):
- `frontend/src/index.css` — sin clases globales nuevas.
- Módulos ya migrados (plan 003) y `components/ui/*`.
- Lógica, DOM, textos, handlers (misma restricción que el plan 003).
- La estructura/AST de datos de la lámina — solo presentación.

## Git workflow

- Branch: `advisor/004-inline-styles-remaining`
- Un commit por step; ej. `refactor(reports): replace inline styles with tailwind classes`
- NO hacer push ni abrir PR.

## Steps

Mismo procedimiento por archivo que el plan 003 (leer completo → clasificar →
migrar → prettier → verificar presupuesto + typecheck).

### Step 1: shared y components raíz (AppLayout, FormErrorSummary, FieldError, nav-user, app-sidebar)

Son 9 estilos triviales en 5 archivos; presupuesto 0.

**Verify**: `rg -c 'style=\{\{' frontend/src/shared/components frontend/src/components/nav-user.tsx frontend/src/components/app-sidebar.tsx` → solo archivos de `components/ui` si acaso; los 5 in-scope sin coincidencias. `npm run typecheck` exit 0.

### Step 2: páginas simples (ClientesPage, SettingsPage, CoachingPage, LaminaPage)

**Verify**: conteos ≤ presupuesto; typecheck exit 0.

### Step 3: páginas medianas (SalesPage, EquipoPage, ImportExportPage, LoginPage)

**Verify**: conteos ≤ presupuesto; typecheck exit 0. Manual: login funciona y
se ve igual (es la puerta de entrada — pruébala en `npm run dev`).

### Step 4: MiDiaPage

Incluye el fix de la transición de `width` (línea ~348) con la receta `scaleX`.

**Verify**: conteo ≤ 3; typecheck exit 0;
`rg -n "transition.*width" frontend/src/modules/mi-dia` → sin coincidencias.

### Step 5: reports (ReportsPage → ExecutiveSlide)

El más largo (144 estilos entre ambos). Para ExecutiveSlide avanza sección por
sección de la lámina, compilando entre medias. Aplica el ejemplar de `Bar`.
Conserva Montserrat (ver casos especiales).

**Verify**: conteos ≤ presupuesto; typecheck exit 0;
`rg -n "transition.*width" frontend/src/modules/reports` → sin coincidencias.

### Step 6: verificación global

```
npm run typecheck && npm run lint && npm run build
```

Smoke visual en `npm run dev`: /login, /mi-dia, /reportes (lámina completa,
con datos de un mes que tenga ventas), /ventas, /equipo, /import-export,
/configuracion, /coaching.

**Verify**: exit 0 × 3; la lámina ejecutiva se ve idéntica (es el artefacto que
dirección exporta — máxima fidelidad visual aquí).

## Test plan

Sin tests de frontend. Gates: typecheck + lint + build por step, presupuestos
por archivo, smoke visual del Step 6 con énfasis en la lámina ejecutiva.

## Done criteria

- [ ] Cada archivo de la tabla cumple su presupuesto de `rg -c 'style=\{\{'`
- [ ] `rg -n "transition.*width" frontend/src` → 0 coincidencias
- [ ] Todo `style={{` sobreviviente contiene una expresión dinámica (lista en la nota de estado del README)
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` → exit 0
- [ ] `git status` sin archivos fuera del in-scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

Detente y reporta si:

- El extracto de `Bar` en ExecutiveSlide no coincide (drift).
- La lámina ejecutiva cambia visiblemente de layout tras migrar una sección y
  no logras igualarla en dos intentos — reporta la sección exacta.
- Un archivo excede su presupuesto solo con dinámicos legítimos — reporta la
  lista en lugar de forzar.
- `scaleX` en una barra produce glitch visual (bordes redondeados aplastados):
  usa `width` SIN `transition` como alternativa aceptada y anótalo; si tampoco
  funciona, reporta.

## Maintenance notes

- Al cerrar este plan, agregar a `docs/conventions.md` la regla: "Estilos:
  clases Tailwind con tokens `tracker-*`; `style={{}}` solo para valores
  calculados en runtime; nunca hex literales en TSX".
- La lámina ejecutiva (ExecutiveSlide) queda estilizada con clases: cualquier
  feature futura de export a PDF/imagen debe verificar que el pipeline de
  export resuelva las clases de Tailwind (si usa render fuera del DOM de la
  app, podría requerir volver a estilos computados — documentarlo entonces).
- Los duplicados de `formatCurrency` (SalesPage define el suyo; existe
  `@/shared/lib/format`) NO se tocaron aquí — candidato a limpieza menor futura.
