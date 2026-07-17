# Implementation 005: command palette + deal peek

Execution ID: `005-command-palette-and-deal-peek`

Date: 2026-07-16

Branch: `advisor/005-command-palette-and-deal-peek`, based on `review-ui`@`063cfc0`
(the assigned worktree was stale at an unrelated old commit `481b55f` with no
`plans/` directory; it was reset to `review-ui` before starting — see Notes).

## Result

Implemented all 7 steps of the plan: extended `command.tsx` with
`CommandDialog`/`CommandSeparator`/`CommandShortcut`, extracted the sidebar
navigation to a shared `NAV_SECTIONS` source of truth, built a global
`CommandPalette` (Ctrl+K, role-gated, mounted once in `AppLayout`), added a
"Buscar" trigger in `Header`, built the `Peek` layout primitives, and added
`DealPeek` wired into `DealCard` via a `Popover` with a `ViewIcon` trigger.

## Verification by step

- **Step 1** (`command.tsx`): added the three primitives. Read `dialog.tsx`
  first — `DialogContent` wraps a Radix `DialogPrimitive.Content`, which
  expects `DialogTitle`/`DialogDescription` as DOM descendants for correct
  `aria-labelledby`/`aria-describedby` wiring and to avoid Radix's dev-mode
  "missing DialogTitle" warning. Moved `DialogHeader` (with `sr-only`) inside
  `DialogContent` as the first child, per the plan's own fallback instruction.
  `npm run typecheck` exit 0.
- **Step 2** (`nav-items.tsx`): moved `NavItemDef`/`SECTIONS` verbatim to
  `frontend/src/shared/navigation/nav-items.tsx`, renamed to `NAV_SECTIONS`.
  `app-sidebar.tsx` now imports `{ NAV_SECTIONS }` and its role-filter logic is
  untouched. One deviation from the plan's literal snippet: I did **not**
  import `type NavItemDef` in `app-sidebar.tsx` because it's unused there and
  `tsconfig.app.json` has `noUnusedLocals: true` — importing it as written
  fails `npm run build` (`tsc -b`) with `TS6133`, even though `npm run
  typecheck` (root `tsc --noEmit` with `files: []`) doesn't catch it since it
  doesn't build project references. `npm run typecheck && npm run lint && npm
  run build` all exit 0.
- **Step 3** (`CommandPalette.tsx`): filters `NAV_SECTIONS` by
  `currentUser.role` replicating `app-sidebar.tsx` exactly (`role ?
  items.filter(i => i.roles.includes(role)) : items`, sections with 0 items
  dropped). `npm run typecheck` exit 0.
- **Step 4** (mount + trigger): mounted `<CommandPalette />` as a sibling
  inside `SidebarProvider` in `AppLayout.tsx`. Added the "Buscar" button in
  `Header.tsx`. **Decision**: chose the `CustomEvent` mechanism over the raw
  `KeyboardEvent` dispatch the plan offered as the default — the plan itself
  calls it "más limpia" and it avoids synthesizing a fake `KeyboardEvent` on
  `document`. `Header.tsx` does
  `window.dispatchEvent(new CustomEvent("open-command-palette"))`;
  `CommandPalette.tsx` listens on `window` and calls `setOpen(true)`.
- **Step 5** (`Peek.tsx`): `PeekHeader`/`PeekRow`/`PeekActions` created
  verbatim from the plan. `npm run typecheck` exit 0.
- **Step 6** (`DealPeek.tsx` + `DealCard.tsx`): icon chosen —
  `ViewIcon` from `@hugeicons/core-free-icons` (confirmed exported; the plan's
  own suggested candidate). `PopoverContent` needed `className="w-auto p-3"`
  added (not in the plan's snippet) because the shared `PopoverContent`
  defaults to `w-72 p-0` and `DealPeek` renders its own `w-64` unpadded div —
  without this the peek would show flush against the popover edges at the
  wrong width. Both `onClick={(e) => e.stopPropagation()}` handlers (trigger
  and content) are in place per the plan.

## Gates

- `npm run typecheck` — exit 0
- `npm run lint` — exit 0
- `npm run build` — exit 0 (`tsc -b && vite build`, 1592 modules transformed;
  the `[INEFFECTIVE_DYNAMIC_IMPORT]` warning about
  `@atlaskit/pragmatic-drag-and-drop` is pre-existing/unrelated to this plan)

## Manual checklist — verified live

The sandbox had a running Docker backend + Postgres (`tracker-sales-api` on
`localhost:3000`, proxied by Vite's existing `/api` proxy), so I ran
`npm run dev` and drove the real authenticated app with Playwright instead of
just reading code, logging in as `admin` / `Admin123!`.

**Step 4 checklist** (done twice: Admin, then Seller — role swapped via the
persisted `currentUser.role` in `localStorage`, same account, since I didn't
have Seller credentials and didn't want to touch other users' passwords):

- (a) Ctrl+K opens the dialog on `/dashboard` and `/pipeline`; pressing it
  again closes it (verified).
- (b) The "Buscar" button in the header opens the palette (verified).
- (c) Selecting "Pipeline" navigates to `/pipeline` and closes the dialog
  (verified).
- (d) With `role: "Seller"`, the palette's "Principal" group only shows "Mi
  día" (no "Dashboard"), "Análisis" only shows "Coaching comercial" (no
  "Reportes"), and "Configuración" only shows "Configuración" (no "Equipo
  comercial" / "Import / Export") — matches the sidebar's own role-gated list
  exactly (verified).
- (e) Escape closes the dialog (verified).

**Step 6 checklist** (Admin, `/pipeline`, deal "QA SinDeal E2E"):

- (a) The "Vista rápida" icon opens the popover with Monto, Probabilidad,
  Vendedor, Última actividad and the stage badge (verified).
- (b) Clicking the icon does not open the client detail Sheet (verified — the
  page stayed on the kanban, no dialog appeared until "Abrir expediente" was
  clicked separately).
- (c) "Abrir expediente" opens the full detail Sheet (verified).
- (d) "Registrar avance" navigates to
  `/actividades/nueva?clientId=<id>&clientName=QA+SinDeal+E2E` (verified).
- (e) Card drag still works: dragged "QA SinDeal E2E" from Contactado to
  Interesado (toast "Movido a Interesado", column counts updated), then
  dragged it back to Contactado to restore state (verified — grabbing from the
  card body, away from the popover trigger button, still initiates the native
  HTML5 drag unaffected by the added icon).

One earlier drag attempt (source locator overlapping the popover trigger
button's bounding box) produced an unexplained side effect — the command
palette opened instead of a drag — but a clean retry grabbing the card's
client-name text (away from the trigger) worked correctly and reproducibly,
including the return drag. I attribute the first attempt to Playwright's text
locator resolving to a point inside the nested button rather than a real
regression; the `DealCard.tsx` diff doesn't touch the outer draggable
`ref`/`useEffect`, only adds nested content to the header row.

## STOP conditions

None triggered. Specifically the two riskiest ones did not occur:

- `command.tsx`/`app-sidebar.tsx` matched the plan's extracts exactly (per the
  Líder's drift check, reconfirmed by reading both files before editing).
- The popover trigger inside the draggable `DealCard` opens reliably on the
  first click; drag-from-card-body is unaffected (see checklist e above).

## Commits

- `840f901` `feat(ui): add CommandDialog primitives`
- `b6a96aa` `refactor(shared): extract nav sections to shared/navigation/nav-items`
- `31ee6b4` `feat(shared): add global command palette`
- `782d4a4` `feat(shared): mount command palette and add header trigger`
- `20ef6ae` `feat(shared): add peek layout primitives`
- `7902bf7` `feat(pipeline): add deal peek popover`

`git diff --stat review-ui..HEAD` touches exactly the 9 files listed in the
plan's "In scope" section — no drift.

## Notes

- The worktree assigned for this task (`agent-a2124ba445c58fad3`) started on
  an unrelated, much older commit (`481b55f`) with no `plans/` directory and
  none of the recent tailwind-consolidation commits. Working tree was clean,
  so I renamed its branch to `advisor/005-command-palette-and-deal-peek` and
  `git reset --hard review-ui` before starting, per the branch instruction in
  the task. This is worth flagging in case other worktrees in this batch have
  the same staleness issue.
- `npm install` was required — `frontend/node_modules` was empty in this
  worktree (no junction to the main repo's `node_modules` like some prior
  executors used).
- No destructive action was taken against the shared dev database beyond the
  temporary drag/drag-back on one existing deal (state restored) and a
  transient client-side `role` override in `localStorage` for the same admin
  account (also restored to `Admin` at the end). No users, deals, or other
  records were created or deleted.
- `plans/README.md` row for Plan 005 updated to DONE.
