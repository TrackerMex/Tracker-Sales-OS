# Feature 24 — Score de calidad de datos por cliente

**Origen**: improve_plan.md 2.2. Mismo patrón que calidad de actividad (campos × peso). Sin tablas nuevas.

## Definición
`dataQuality` = suma de 5 campos, 20% cada uno:
- `domain` no vacío
- `person` (tipo persona) presente
- `source` (fuente) presente
- algún contacto con `phone` no vacío
- algún contacto con `email` no vacío

Rango 0–100. `incomplete` = `dataQuality < 100`.

## Backend (clients)
- `ClientDto.dataQuality: number` expuesto en DTO.
- `GetClientsUseCase.calculateDataQuality(client)`: deriva en memoria sobre contactos ya cargados. Sin queries extra.
- `GetClientsQueryDto.incomplete?: boolean` (Transform string→bool, igual que `cold`).
- `ClientFilters.incomplete` en interface de repo.
- `ClientRepositoryImpl`: filtro `incomplete` con Brackets — domain NULL/'' OR person NULL OR source NULL OR NOT EXISTS contacto con phone<>'' OR NOT EXISTS contacto con email<>'' (excluye deleted_at). Paginación correcta (filtro en query, no post-filtro).

## Frontend (clients)
- `Client.dataQuality` y `ClientFilters.incomplete` en clients.types.ts.
- ClientesPage: estado `incomplete` + toggle "Datos incompletos" (btn-primary/btn-ghost), inyectado en filters useMemo.
- Badge "Datos X%" en detalle de cliente y en cada card de lista. Color: verde=100, rojo<60, ámbar resto.

## Verificación
- tsc backend exit 0.
- tsc frontend exit 0.
- Filtro `incomplete` consistente con `calculateDataQuality` (mismos 5 campos). NOT EXISTS maneja NULL correctamente (phone/email NULL no cuentan).

## Caveat no bloqueante
`calculateDataQuality` cuenta sobre los contactos cargados por TypeORM (soft-deleted excluidos por default); el filtro SQL excluye deleted_at explícito. Consistente.
