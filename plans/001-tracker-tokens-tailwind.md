# Plan 001: Registrar los tokens `--tracker-*` en el theme de Tailwind

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada comando
> de verificación y confirma el resultado esperado antes de avanzar. Si ocurre
> algo de la sección "STOP conditions", detente y reporta — no improvises.
> Al terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**: `git diff --stat cc0b102..HEAD -- frontend/src/index.css frontend/src/shared/components/layout/Header.tsx`
> Si algún archivo in-scope cambió desde que se escribió este plan, compara los
> extractos de "Current state" contra el código vivo antes de continuar; si no
> coinciden, trátalo como condición de STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `cc0b102`, 2026-07-14

## Why this matters

El frontend tiene un sistema de tokens (`--tracker-*` en `frontend/src/index.css`)
pero esos tokens NO están registrados en el `@theme` de Tailwind v4, así que no
existen utilidades como `text-tracker-text-muted` o `bg-tracker-blue`. La
consecuencia medible: 461 `style={{...}}` inline y cientos de hex duplicados en
módulos (`#94A3B8` ×77, `#002B49` ×37, `#E2E8F0` ×32, `#82bc00` ×28...), todos
con equivalente `--tracker-*` ya definido. Este plan habilita las clases; los
planes 003 y 004 migran los usos. Sin este plan, esa migración no es posible.

## Current state

- `frontend/src/index.css` — único archivo CSS del proyecto. Tiene:
  - Un bloque `@theme inline { ... }` (líneas 7–48) que registra colores shadcn
    (`--color-primary: var(--primary);` etc.) y radios.
  - Un segundo bloque `:root` (líneas ~149–193) con los tokens de marca:

    ```css
    :root {
      --tracker-dark: #001524;
      --tracker-blue: #002b49;
      --tracker-green: #82bc00;
      --tracker-bg: #eef2f7;
      --tracker-surface: #fff;
      --tracker-surface-alt: #f8fafc;
      --tracker-border: #e2e8f0;
      --tracker-text: #0f172a;
      --tracker-text-secondary: #64748b;
      --tracker-text-muted: #94a3b8;
      --tracker-text-dim: #475569;
      --tracker-danger: #dc2626;
      --tracker-danger-dark: #b91c1c;
      --tracker-success: #16a34a;
      --tracker-success-dark: #4a7c00;
      --tracker-warning: #d97706;
      --tracker-warning-dark: #b45309;
      --tracker-purple: #6d28d9;
      ...
    }
    ```

- `frontend/src/shared/components/layout/Header.tsx` — header global; contiene
  6 `style={{...}}` con valores 100% estáticos. Se usa aquí como smoke test de
  los tokens nuevos. Extracto actual (líneas 36–50):

  ```tsx
  <header
    className="flex h-[54px] shrink-0 items-center justify-between border-b bg-white px-4"
    style={{ borderColor: '#E2E8F0' }}
  >
    <div className="flex items-center gap-3">
      <SidebarTrigger className="-ml-1" />
      <div style={{ lineHeight: 1.2 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{resolvedTitle}</span>
        {resolvedSubtitle && (
          <span className="hidden md:inline" style={{ fontSize: 11, color: '#94A3B8', marginLeft: 10 }}>
            {resolvedSubtitle}
          </span>
        )}
      </div>
    </div>
  ```

  Y más abajo (líneas 74–78):

  ```tsx
  <div style={{ width: 1, height: 20, background: '#E2E8F0', margin: '0 4px' }} />

  <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>
    {currentUser?.name ?? currentUser?.username}
  </span>
  ```

- Convención del repo: Tailwind v4 CSS-first (sin `tailwind.config`). El patrón
  para exponer una CSS var como color de Tailwind ya existe en el mismo bloque
  `@theme inline`: `--color-sidebar: var(--sidebar);`. Replícalo.

## Commands you will need

Ejecutar desde `frontend/`:

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Lint      | `npm run lint`      | exit 0              |
| Build     | `npm run build`     | exit 0              |
| Format    | `npx prettier --write <archivo>` | archivo formateado (ordena clases Tailwind) |

No hay tests de frontend; los gates son typecheck + lint + build (igual que CI).

## Scope

**In scope** (únicos archivos a modificar):
- `frontend/src/index.css`
- `frontend/src/shared/components/layout/Header.tsx`

**Out of scope** (NO tocar aunque parezca relacionado):
- Cualquier archivo bajo `frontend/src/modules/` — los migran los planes 003/004.
- Las clases utilitarias legacy de `index.css` (`.card`, `.btn-*`, `.tag-*`...) —
  se limpian en planes posteriores.
- Los valores hex de los tokens — este plan los REGISTRA, no los cambia.

## Git workflow

- Branch: `advisor/001-tracker-tokens-tailwind`
- Commits: conventional commits en inglés, ej. `refactor(ui): register tracker tokens in tailwind theme`
- NO hacer push ni abrir PR; el usuario revisa y mergea manualmente.

## Steps

### Step 1: Registrar los tokens en `@theme inline`

En `frontend/src/index.css`, dentro del bloque `@theme inline { ... }` (líneas
7–48), justo antes de la línea `--radius-sm: ...`, agrega:

```css
  --color-tracker-dark: var(--tracker-dark);
  --color-tracker-blue: var(--tracker-blue);
  --color-tracker-green: var(--tracker-green);
  --color-tracker-bg: var(--tracker-bg);
  --color-tracker-surface: var(--tracker-surface);
  --color-tracker-surface-alt: var(--tracker-surface-alt);
  --color-tracker-border: var(--tracker-border);
  --color-tracker-text: var(--tracker-text);
  --color-tracker-text-secondary: var(--tracker-text-secondary);
  --color-tracker-text-muted: var(--tracker-text-muted);
  --color-tracker-text-dim: var(--tracker-text-dim);
  --color-tracker-danger: var(--tracker-danger);
  --color-tracker-danger-dark: var(--tracker-danger-dark);
  --color-tracker-success: var(--tracker-success);
  --color-tracker-success-dark: var(--tracker-success-dark);
  --color-tracker-warning: var(--tracker-warning);
  --color-tracker-warning-dark: var(--tracker-warning-dark);
  --color-tracker-purple: var(--tracker-purple);
```

Esto genera utilidades `bg-tracker-*`, `text-tracker-*`, `border-tracker-*`, etc.

**Verify**: `npm run build` → exit 0.

### Step 2: Migrar Header.tsx como smoke test

Reemplaza los 6 `style={{...}}` de `Header.tsx` por clases:

| Línea aprox. | style actual | Reemplazo |
|---|---|---|
| 38 | `style={{ borderColor: '#E2E8F0' }}` | quitar style; agregar `border-tracker-border` al className del `<header>` |
| 43 | `style={{ lineHeight: 1.2 }}` | `className="leading-tight"` |
| 44 | `fontSize: 14, fontWeight: 700, color: '#0F172A'` | `className="text-sm font-bold text-tracker-text"` |
| 46 | `fontSize: 11, color: '#94A3B8', marginLeft: 10` | agregar a su className: `ml-2.5 text-[11px] text-tracker-text-muted` |
| 74 | divisor `width:1, height:20, background:'#E2E8F0', margin:'0 4px'` | `className="mx-1 h-5 w-px bg-tracker-border"` |
| 76 | `fontSize: 12, fontWeight: 500, color: '#64748B'` | `className="text-xs font-medium text-tracker-text-secondary"` |

Después: `npx prettier --write src/shared/components/layout/Header.tsx`.

**Verify**:
- `rg -c 'style=\{\{' frontend/src/shared/components/layout/Header.tsx` → sin coincidencias (rg sale con código 1)
- `npm run typecheck && npm run lint && npm run build` → exit 0

### Step 3: Verificación visual rápida

Levanta `npm run dev` y abre http://localhost:5173 (o el puerto que indique
Vite). Inicia sesión y confirma que el header se ve igual: borde inferior gris
claro, título oscuro, subtítulo gris, divisor vertical antes del nombre.

**Verify**: sin diferencias visibles respecto a `main` (compara si tienes duda con `git stash` temporal).

## Test plan

No hay infraestructura de tests de frontend en el repo (sin script `test` en
`frontend/package.json`). Gates: typecheck + lint + build + smoke visual del
Step 3. No crear infraestructura de tests en este plan.

## Done criteria

- [ ] Las 18 líneas `--color-tracker-*` existen en el bloque `@theme inline` de `frontend/src/index.css`
- [ ] `rg 'style=\{\{' frontend/src/shared/components/layout/Header.tsx` → 0 coincidencias
- [ ] `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run build` exit 0 (en `frontend/`)
- [ ] `git status` no muestra archivos modificados fuera del in-scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

Detente y reporta si:

- El bloque `@theme inline` de `index.css` no coincide con el extracto (drift).
- El build falla después del Step 1 con un error de Tailwind sobre variables no
  resueltas — indicaría que la versión de Tailwind maneja distinto el `@theme
  inline` con `var()`; no intentes reordenar bloques del CSS por tu cuenta.
- Alguna clase `text-tracker-*`/`bg-tracker-*` no genera CSS (verifícalo con el
  smoke visual): reporta en lugar de volver a hex.

## Maintenance notes

- A partir de este plan, TODO color nuevo en el frontend debe usar clases
  `*-tracker-*` o la paleta estándar de Tailwind — nunca hex inline. Conviene
  agregar esa regla a `docs/conventions.md` cuando el plan 004 termine.
- Los planes 003 y 004 dependen de estas utilidades; si se renombra un token,
  hay que actualizar sus tablas de mapeo.
