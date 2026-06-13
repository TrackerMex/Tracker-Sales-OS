# Impl 21-leaderboard

Ranking mensual de vendedores en el Dashboard (solo Admin/Director). Feature implementada y verificada con `tsc --noEmit` exit 0 en backend y frontend.

## Backend

### 1. MODIFICADO `backend/src/modules/activities/domain/repositories/activity.repository.interface.ts`
Agregada firma al interface `IActivityRepository`:
```ts
sumPointsByDayForSellers(
  from: Date,
  to: Date,
): Promise<{ sellerId: string; day: string; points: number }[]>;
```

### 2. MODIFICADO `backend/src/modules/activities/infrastructure/repositories/activity.repository.impl.ts`
Implementado el método con UNA sola query (sin N+1), GROUP BY seller + día, excluye soft-deleted:
```ts
async sumPointsByDayForSellers(from, to) {
  const rows = await this.repo.createQueryBuilder('activity')
    .select('activity.sellerId', 'sellerId')
    .addSelect("TO_CHAR(activity.executedAt, 'YYYY-MM-DD')", 'day')
    .addSelect('SUM(activity.points)', 'points')
    .where('activity.executedAt >= :from AND activity.executedAt < :to', { from, to })
    .andWhere('activity.deletedAt IS NULL')
    .groupBy('activity.sellerId')
    .addGroupBy("TO_CHAR(activity.executedAt, 'YYYY-MM-DD')")
    .getRawMany<{ sellerId: string; day: string; points: string | null }>();
  return rows.map((r) => ({ sellerId: r.sellerId, day: r.day, points: Number(r.points ?? 0) }));
}
```
TypeORM traduce `activity.sellerId`/`activity.executedAt`/`activity.deletedAt` a las columnas snake_case (mismo patrón que `findDailyBySeller`). `day` se devuelve como string 'YYYY-MM-DD'.

### 3. CREADO `backend/src/modules/dashboard/application/dtos/leaderboard-row.dto.ts`
Clase plana (sin @ApiProperty, consistente con `stalled-deal.dto.ts`):
```ts
export class LeaderboardRowDto {
  rank: number;
  sellerId: string;
  sellerName: string;
  monthlyPoints: number;
  previousMonthPoints: number;
  pointsDelta: number;
  streakDays: number;
}
```

### 4. CREADO `backend/src/modules/dashboard/application/use-cases/get-leaderboard.use-case.ts`
`GetLeaderboardUseCase implements IUseCase<void, LeaderboardRowDto[]>`.
- Inyecta `@Inject(ACTIVITY_REPOSITORY) IActivityRepository`, `@InjectRepository(SellerTypeormEntity) Repository` (mismo patrón de sellers que get-sellers-score) y `GetSettingsUseCase`.
- Lee sellers activos (`active: true, deletedAt: IsNull()`).
- Rango de query: `from = new Date(y, m-1, 1)` (inicio mes anterior), `to = new Date(y, m, today+1)` (mañana exclusivo). Una sola llamada a `sumPointsByDayForSellers`.
- Deriva en memoria: `monthlyPoints` (días con prefijo del mes actual), `previousMonthPoints` (prefijo mes anterior), `pointsDelta = monthly - previous`.
- `streakDays`: cuenta días consecutivos hacia atrás desde hoy con `puntos_del_día >= dailyMinPoints`; si hoy no cumple pero ayer sí, empieza desde ayer (gracia día en curso); para en el primer día que no cumple. Acotado al `lowerBound` (inicio mes anterior) para evitar loops infinitos si `dailyMinPoints === 0`.
- Orden `monthlyPoints` DESC, `rank` 1..N por índice (estable; sellers de 0 puntos al final).
- Fechas locales con `new Date(y, m, d)` (consistente con get-sellers-score).

### 5. MODIFICADO `backend/src/modules/dashboard/presentation/dashboard.controller.ts`
Agregado endpoint protegido:
```ts
@Get('leaderboard')
@UseGuards(RolesGuard)
@Roles(UserRole.Admin, UserRole.Director)
getLeaderboard() { return this.getLeaderboardUseCase.execute(); }
```
(+ import e inyección del use-case en el constructor).

### 6. MODIFICADO `backend/src/modules/dashboard/dashboard.module.ts`
- Importado `ActivitiesModule` (exporta `ACTIVITY_REPOSITORY`) — necesario porque el use-case inyecta el token del repositorio de activities. Sin ciclo: ActivitiesModule no importa DashboardModule.
- Registrado `GetLeaderboardUseCase` en `providers`.

## Frontend

### 7. MODIFICADO `frontend/src/modules/dashboard/domain/dashboard.types.ts`
Agregada interface `LeaderboardEntry { rank; sellerId; sellerName; monthlyPoints; previousMonthPoints; pointsDelta; streakDays }`.

### 8. MODIFICADO `frontend/src/modules/dashboard/infrastructure/dashboard.api.ts`
```ts
getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
  const res = await api.get<LeaderboardEntry[]>('/dashboard/leaderboard');
  return res.data;
},
```

### 9. CREADO `frontend/src/modules/dashboard/application/hooks/useLeaderboard.ts`
`useQuery` con `queryKey: ['dashboard', 'leaderboard']`, `queryFn: dashboardApi.getLeaderboard` (mismo patrón que useStalledDeals).

### 10. CREADO `frontend/src/modules/dashboard/presentation/components/LeaderboardTable.tsx`
Props `{ entries: LeaderboardEntry[]; isLoading: boolean }`. Tabla con clase `.dt`. Columnas: # (rank), Vendedor, Puntos mes, Delta, Racha.
- Top 3: badge destacado (`.tag tag-amber` / `.tag-gray` / `.tag-navy` para rank 1/2/3); resto número muted.
- Delta: verde con "+" si >0, rojo si <0, muted "0" si 0.
- Racha: badge `.tag tag-green` "N d" si >0, si no muted "0 d". Sin emojis.
- Loading: skeleton con pulse. Empty: "Sin datos del mes".
- Puntos con `toLocaleString('es-MX')`.

### 11. MODIFICADO `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx`
- Imports de `useLeaderboard` y `LeaderboardTable`; `const leaderboard = useLeaderboard()`.
- Nueva sección `{isAdminOrDirector && (...)}` con título "Leaderboard del mes", ubicada ENTRE el card de "Desempeño del equipo" (SellerSemaphoreTable) y "Deals en riesgo" (stalled deals). Maneja error con botón Reintentar y delega loading/empty/tabla a `<LeaderboardTable>`.

## Nota / desviación
- MODIFICADO `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts`: añadida una sola línea `sumPointsByDayForSellers: jest.fn()` al mock `jest.Mocked<IActivityRepository>`. Sin este stub mecánico el repo no compila (`tsc` falla) tras extender el interface. Es el mismo patrón ya aplicado en ese archivo para `findStalledDeals` (feature 20). No se cambió ninguna lógica ni assertion de tests.

## Verificación
- Backend: `cd backend && npx tsc --noEmit` -> exit 0.
- Frontend: `cd frontend && npx tsc --noEmit` -> exit 0.
- No se crearon tablas nuevas (solo lectura sobre `activities` + `sellers`).
- No se agregaron dependencias.

## Checkpoints "## 21-leaderboard" — todos satisfechos
- [x] `IActivityRepository.sumPointsByDayForSellers(from, to)` — una query, GROUP BY, excluye soft-deleted.
- [x] `LeaderboardRowDto` con los 7 campos.
- [x] `GetLeaderboardUseCase` calcula puntos mes actual/anterior, delta, racha (dailyMinPoints de Settings), orden DESC + rank 1..N.
- [x] Incluye todos los sellers activos (0 puntos al final).
- [x] Racha consecutiva con gracia día en curso.
- [x] `GET /api/dashboard/leaderboard` solo Admin/Director.
- [x] Dashboard muestra "Leaderboard del mes" con rank, nombre, puntos, delta (+/-), racha (solo Admin/Director).
- [x] No tablas nuevas.
- [x] `tsc --noEmit` sin errores en backend y frontend.
