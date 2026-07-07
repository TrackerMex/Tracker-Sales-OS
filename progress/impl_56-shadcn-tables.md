# Implementación 56-shadcn-tables

## Feature

`56-shadcn-tables` - Migrar tablas/listados tabulares legacy a componentes `Table` de shadcn, manteniendo densidad tracker, acciones por fila, empty states y responsividad.

## Archivos modificados

- `frontend/src/components/ui/table.tsx`
- `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx`
- `frontend/src/modules/dashboard/presentation/components/LeaderboardTable.tsx`
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`

## Cambios realizados

- Ajusté el componente shadcn `Table` para preservar la densidad visual legacy de Tracker:
  - wrapper con `overflow-x-auto` y `-webkit-overflow-scrolling: touch`
  - tabla `text-[13px]` y `border-collapse`
  - headers compactos, uppercase, `text-[10.5px]`, color secundario y fondo `var(--tracker-surface-alt)`
  - celdas `px-3 py-[10px]`
  - bordes sutiles `#f1f5f9`
  - hover discreto con `var(--tracker-surface-alt)`
- Migré `LeaderboardTable` de `<table className="dt">` a:
  - `Table`
  - `TableHeader`
  - `TableBody`
  - `TableRow`
  - `TableHead`
  - `TableCell`
- Migré la tabla de deals en riesgo de `DashboardPage` y removí el wrapper `dt-scroll`; el scroll horizontal queda cubierto por el wrapper de `Table`.
- Migré la tabla "Detalle Top Vendedores" de `ReportsPage`; el scroll horizontal queda cubierto por el wrapper de `Table`.
- Se preservaron los empty states existentes:
  - `Sin datos del mes`
  - `No hay deals estancados`
  - la tabla de top vendedores se sigue ocultando cuando no hay vendedores.

## ExecutiveSlide

No modifiqué `frontend/src/modules/reports/presentation/components/ExecutiveSlide.tsx`.

Razón: sus tablas son parte de una lámina ejecutiva/print con layout inline muy específico para exportar/imprimir y no usan `className="dt"` ni `dt-scroll`. Migrarlas a shadcn podría alterar medidas, espaciado y salida impresa de la lámina fuera del alcance del checkpoint.

## Verificación

- `rg 'dt-scroll|className="dt"|<table className' frontend/src`
  - Resultado: solo queda `frontend/src/index.css:.dt-scroll`.
  - Justificación: es una definición CSS legacy no referenciada por los componentes migrados. `frontend/src/index.css` no estaba dentro de los paths autorizados para esta feature.
- `npx tsc --noEmit` en `frontend/`
  - Resultado: PASSED.
  - Warnings no bloqueantes de npm:
    - `Unknown project config "node-linker"`
    - `Unknown project config "shamefully-hoist"`

## Dependencias y backend

- No se agregaron dependencias.
- No se modificó backend.
- No se editaron tests.
