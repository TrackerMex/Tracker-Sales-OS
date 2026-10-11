# Implementación 82-frontend-typecheck

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`.

## Cambio

`frontend/package.json`: el script `typecheck` ejecuta `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json`.

El comando anterior usaba el proyecto raíz con `files: []`, que no comprueba las referencias al invocarse sin modo build. Los proyectos efectivos existentes incluyen respectivamente `src` y `vite.config.ts`. No se modificaron los tsconfig ni sus opciones, dependencias, lockfile, core, módulos o CI; CI ya llama `pnpm run typecheck`.

Scope ampliado por el Líder: `backend/src/main.ts` recibió únicamente saltos de línea en el ternario `HOST` de `app.listen`, para corregir un fallo de formato Prettier del baseline. No cambia la expresión ni su comportamiento.

## Verificación

Comandos desde `frontend/`:

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` con archivo temporal `src/typecheck-negative-probe.ts` asignando string a number exportado | Falla esperada: `TS2322: Type 'string' is not assignable to type 'number'.`, exit 2. |
| Limpieza de prueba negativa | `Path.unlink(missing_ok=True)` en bloque `finally`; ausencia del archivo comprobada después. |
| `pnpm exec tsc --noEmit -p tsconfig.node.json --listFilesOnly` | Exit 0; listado incluye `/home/claude/sites/Tracker-Sales-OS/frontend/vite.config.ts`. |
| `pnpm run typecheck` después de eliminar el temporal | Exit 0; ejecuta `tsc --noEmit` con ambos proyectos reales. |
| `pnpm run lint` | Exit 0. |
| `pnpm run build` | Exit 0; TypeScript build y Vite completados. |

Evidencia persistida el 2026-10-11 UTC, con directorio de ejecución, comando, timestamps y exits:

- Negativo repetido y limpieza: [`/tmp/tracker-sales-bugfix-qa/82-negative.log`](/tmp/tracker-sales-bugfix-qa/82-negative.log). Error TS2322 y exit 2; limpieza en `finally` y `test ! -e src/typecheck-negative-probe.ts` con exit 0.
- Build repetido después de eliminar el temporal: [`/tmp/tracker-sales-bugfix-qa/82-build.log`](/tmp/tracker-sales-bugfix-qa/82-build.log), `pnpm run build` con exit 0.
- Lint backend sin modificaciones automáticas: [`/tmp/tracker-sales-bugfix-qa/82-backend-lint.log`](/tmp/tracker-sales-bugfix-qa/82-backend-lint.log), `pnpm exec eslint "{src,apps,libs,test}/**/*.ts"` desde `backend/`, exit 0. Incluye el diff exacto de `backend/src/main.ts`, únicamente formato.

El build conserva la advertencia de importación dinámica inefectiva del adaptador de drag-and-drop de Atlaskit, compartido entre Agenda y Pipeline. No bloquea el build y está fuera de este lote.

Se leyeron AGENTS.md, `docs/conventions.md`, `docs/bugfix-execution.md`, el CHECKPOINT 82 y los contratos core requeridos. El único cambio funcional es el script de comprobación. La revisión independiente queda a cargo del Reviewer. No se realizaron commits, push ni acciones en producción.
