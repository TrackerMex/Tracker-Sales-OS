# Implementación — 77-jev-quality-backtest (T0–T5)

Rama: `77-jev-quality-backtest`. Alcance ejecutado: **T0 a T5**.
**T6 NO se ha ejecutado** (corrida real contra API y base de producción,
bloqueada por decisiones humanas).

Todo el código vive en `backend/scripts/`. No se ha tocado `backend/src/` ni
`frontend/`. La única excepción prevista se ha usado: la entrada
`"test:scripts"` en `backend/package.json`.

---

## 1. Ficheros creados

| Fichero | Qué es |
|---|---|
| `backend/scripts/jest.config.js` | Configuración de jest aislada, `rootDir: __dirname` (D9) |
| `backend/scripts/jev-backtest/types.ts` | Tipos compartidos + `LEVELS` (los cuatro textos literales de R7) |
| `backend/scripts/jev-backtest/stratify.ts` | `BATCH_QUERY`, `classify`, `isEmptyActivity`, `stratify` (R1, R2, R3) |
| `backend/scripts/jev-backtest/labeling.ts` | `shuffleWithSeed`, `buildLabelingFile`, `parseLabelingFile`, `joinLabels` (R6, R7) |
| `backend/scripts/jev-backtest/jev-client.ts` | `requireApproval`, `buildRequestBody`, `parseJevResponse`, `askJev`, `runBatch` (R4, R5, R8, R9, R10) |
| `backend/scripts/jev-backtest/metrics.ts` | Matrices, acuerdos, Spearman, falsos 100, veredicto (R11, R12, R13) |
| `backend/scripts/jev-backtest/run-backtest.ts` | Única capa de E/S: CLI, base de datos, red, ficheros, informe |
| `backend/scripts/jev-backtest/sample-responses.json` | Respuestas de ejemplo para `--dry-run` (R10) |
| `backend/scripts/jev-backtest/stratify.spec.ts` | Tests T1 |
| `backend/scripts/jev-backtest/labeling.spec.ts` | Tests T2 |
| `backend/scripts/jev-backtest/request-gate.spec.ts` | Tests T3 |
| `backend/scripts/jev-backtest/jev-client.spec.ts` | Tests T4 |
| `backend/scripts/jev-backtest/metrics.spec.ts` | Tests T5 |

Modificado: `backend/package.json` (solo `"test:scripts"`).

### Cómo se corre

```bash
# Fase 1 — extracción y fichero de etiquetado (tras la aprobación de R4)
JEV_BACKTEST_APPROVED=si JEV_BACKTEST_DATABASE_URL=postgres://solo_lectura@host/db \
  npx ts-node backend/scripts/jev-backtest/run-backtest.ts --fase extraer

# Fase 2 — consulta a Jev e informe (tras el etiquetado del director)
JEV_BACKTEST_APPROVED=si JEV_API_KEY=... \
  npx ts-node backend/scripts/jev-backtest/run-backtest.ts --fase evaluar \
    --min-falsos-100-detectados 0.70 --max-buenos-degradados 0.15

# Ensayo sin gastar llamadas ni exponer datos (R10)
npx ts-node backend/scripts/jev-backtest/run-backtest.ts --fase evaluar --dry-run
```

Ficheros que produce: `progress/jev-backtest-etiquetado.md` (lo que ve el
director), `progress/jev-backtest-lote.json` (clave local id ↔ posición) y
`progress/explore_jev-backtest.md` (informe de R11).

---

## 2. Mapeo requisito → test → commit

Disciplina TDD: cada tarea es un commit rojo (test que falla) y un commit
verde (implementación). Los `describe` nombran su requisito.

| Req | Test (`describe` → fichero) | Commit rojo | Commit verde |
|---|---|---|---|
| R1 | `R1 (...): consulta de solo lectura` → `stratify.spec.ts` | `83daf8a` | `45974c7` |
| R2 | `R2 (...): estratifica 25/15/10` → `stratify.spec.ts` | `83daf8a` | `45974c7` |
| R3 | `R3 (...): excluye actividades sin texto` → `stratify.spec.ts` | `83daf8a` | `45974c7` |
| R4 | `R4 (...): aprobacion humana antes de salir de la empresa` → `request-gate.spec.ts` | `5158331` | `957d606` |
| R5 | `R5 (...): solo viajan los cuatro campos de texto` → `request-gate.spec.ts` | `5158331` | `957d606` |
| R6 | `R6 (...): orden aleatorio con semilla fija`, `R6 (...): fichero de etiquetado a ciegas`, `R6 (...): lectura del fichero etiquetado` → `labeling.spec.ts` | `6e65405` | `45bbfbf` |
| R7 | `R6 (...): fichero de etiquetado a ciegas` › *incluye la escala de R7 literal y la semilla usada* → `labeling.spec.ts`; y `R5 (...)` › *pregunta al modelo con una sola pregunta score y los criterios de R7 en orden* → `request-gate.spec.ts` | `6e65405`, `5158331` | `45bbfbf`, `957d606` |
| R8 | `R8 (...): consulta al modelo` → `jev-client.spec.ts` | `ba52a1c` | `6262965` |
| R9 | `R9 (...): reintentos con espera exponencial` → `jev-client.spec.ts` | `ba52a1c` | `6262965` |
| R10 | `R10 (...): modo seco` → `jev-client.spec.ts` | `ba52a1c` | `6262965` |
| R11 | `R11 (...): matriz de confusion y acuerdos`, `R11 (...): agregado para el informe` → `metrics.spec.ts` | `adb615f` | `802c0b6` |
| R12 | `R12 (...): tasa de falsos 100` → `metrics.spec.ts` | `adb615f` | `802c0b6` |
| R13 | `R13 (...): veredicto del gate` → `metrics.spec.ts` | `adb615f` | `802c0b6` |

Commits de la rama, en orden:

```
a5d3b1b chore(77-jev-quality-backtest): arnes de test aislado para backend/scripts (D9)   [T0]
83daf8a test(77-jev-quality-backtest): estratificacion del lote falla sin implementacion (R1,R2,R3)
45974c7 feat(77-jev-quality-backtest): estratifica el lote 25/15/10 (R1,R2,R3)
6e65405 test(77-jev-quality-backtest): etiquetado a ciegas falla sin implementacion (R6,R7)
45bbfbf feat(77-jev-quality-backtest): fichero de etiquetado a ciegas con semilla fija (R6,R7)
5158331 test(77-jev-quality-backtest): gate de aprobacion y recorte de campos fallan sin implementacion (R4,R5)
957d606 feat(77-jev-quality-backtest): gate de aprobacion y cuerpo recortado a cuatro campos (R4,R5)
ba52a1c test(77-jev-quality-backtest): cliente con reintentos y modo seco falla sin implementacion (R8,R9,R10)
6262965 feat(77-jev-quality-backtest): cliente de Jev con reintentos y modo seco (R8,R9,R10)
adb615f test(77-jev-quality-backtest): metricas y veredicto fallan sin implementacion (R11,R12,R13)
802c0b6 feat(77-jev-quality-backtest): metricas, veredicto e informe del gate (R11,R12,R13)
7893b20 style(77-jev-quality-backtest): deja backend/scripts limpio tambien para eslint
```

R13 tiene, como pide T5, un caso construido para que el veredicto salga
negativo por cada una de las dos condiciones por separado:
`LOTE_POCOS_DETECTADOS` (detección 60% < 70%, sin degradar buenos) y
`LOTE_MUCHOS_DEGRADADOS` (detección 100%, pero degrada 2 de 7 = 28,6% > 15%).

---

## 3. Salida literal de los cuatro comandos de verificación

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        3.714 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 5 passed, 5 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        0.826 s, estimated 1 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test}/**/*.ts" --fix

exit=0
```

`pnpm test` daba **15 suites / 78 tests** antes de tocar nada (medido en
`5956327`, antes de T0) y sigue dando exactamente lo mismo: la configuración
principal con `rootDir: src` no ve `backend/scripts/`, tal y como exige D9.

Además de los cuatro comandos, se ejercitó el flujo completo con `--dry-run`
sobre un lote sintético de 50 filas (base de datos no implicada, red no
implicada): genera el informe, lo vuelve a generar sin duplicar la parte
escrita a mano, y `--fase evaluar` sin `JEV_BACKTEST_APPROVED` sale con
código 1. Los ficheros de prueba se borraron y
`progress/explore_jev-backtest.md` se restauró a su versión commiteada.
`npx eslint "scripts/**/*.ts"` también sale limpio, aunque CI no lo mire.

---

## 4. Supuestos que he tenido que hacer

Ninguno contradice la spec; son huecos que la spec no cierra.

1. **Consulta candidata**. R1 fija 50 actividades pero no cómo se eligen las
   candidatas. `BATCH_QUERY` lee las **2000 más recientes** no borradas
   (`--limite` lo cambia) y la estratificación se hace en memoria. Sesgo hacia
   lo reciente, deliberado: se mide el comportamiento actual de la fórmula.
2. **Relleno de franja**. R2 dice "franja inmediatamente superior" y así se ha
   implementado: **un solo salto, sin cascada**, procesando alta → media →
   baja. Si la franja alta se queda corta no hay superior y el lote sale de
   menos de 50, con la desviación registrada.
3. **Clave del fichero de etiquetado**. R6 dice "únicamente sus cuatro campos
   de texto y una casilla". Para no enseñar ni siquiera el UUID, la clave es
   la **posición** (`## 1` … `## 50`); el mapa posición ↔ id vive en
   `progress/jev-backtest-lote.json`, que el director no ve.
4. **Alcance del gate de R4**. Se exige la aprobación en **todas** las fases
   salvo `evaluar --dry-run`. Extraer también saca texto comercial de la base
   a disco, y el orden de T6 ya pone la aprobación antes de la extracción.
5. **"Reintentar hasta 3 veces"** se ha leído como 3 reintentos sobre el
   primer intento (4 peticiones como mucho), con esperas 1s / 2s / 4s. Solo se
   reintentan 429 y 529; cualquier otro código o un fallo de red marca la
   actividad como `sin_respuesta` sin reintentar.
6. **Forma de la respuesta de la API, NO verificada**. Se asume
   `{ questions: { nivel: { answer, probabilities, confidence } } }`, tolerando
   `distribution` como alias y que `answer` venga como texto del criterio en
   vez de índice. Si no encaja, `parseJevResponse` devuelve `null` y la
   actividad queda `sin_respuesta`: preferible un fallo ruidoso a un nivel
   inventado que falsee el veredicto. **Hay que confirmarlo con la primera
   respuesta real en T6.**
7. **Falsos 100 sin respuesta de Jev cuentan como NO detectados** (van en el
   denominador de la condición A de R13). Simétricamente, un "bueno" sin
   respuesta **no** cuenta como degradado en la condición B: Jev no lo situó
   en 1 o 2. La asimetría es deliberada, es la lectura literal de R13, y el
   informe publica `falsos100SinRespuesta` aparte para poder rehacer la cuenta.
8. **Lote sin falsos 100** → el veredicto no puede ser positivo, con motivo
   explícito. Sin falsos 100 la prueba no tiene nada que demostrar.
9. **Umbrales**: las banderas aceptan tanto `0.70` como `70`; por encima de 1
   se interpretan como porcentaje. Los valores por defecto son los de R13.
10. **Informe**: se escribe en `progress/explore_jev-backtest.md` **por debajo**
    de la marca `<!-- a partir de aqui escribe run-backtest.ts ... -->`, y todo
    lo que hay por encima (incluida la aprobación de R4 y las secciones §1–§6
    ya escritas) se conserva intacto. Re-ejecutar sustituye solo la parte
    generada. Consecuencia: el informe queda **después** de §6, no dentro de §5.
11. **Spearman** con rangos promediados en los empates (Pearson sobre rangos);
    devuelve 0 si una de las series es constante.
12. **Nomenclatura**: identificadores en inglés y valores/salida de dominio en
    español, que es el patrón del resto del backend (`ActivityType` con valores
    en español). Los `describe` de los tests van en español, como se pidió.
13. **`pg` no trae tipos** y no se ha añadido `@types/pg` (no se añaden
    dependencias): `run-backtest.ts` declara una interfaz local mínima con
    `connect`/`query`/`end`. No tiene método de escritura, a propósito.

---

## 5. Puntos que necesitan decisión humana antes de T6

1. Las cuatro decisiones que bloquean T6 siguen pendientes; T6 no se ha
   ejecutado.
2. **Credencial de solo lectura** (`JEV_BACKTEST_DATABASE_URL`): sigue
   "pendiente de recibir" según §3 de `progress/explore_jev-backtest.md`. El
   script exige esa variable y **no cae hacia atrás** a las credenciales de la
   aplicación, que sí tienen permisos de escritura (D7).
3. **Fuga por el repositorio**: `progress/jev-backtest-etiquetado.md` y
   `progress/jev-backtest-lote.json` contendrán texto comercial real sobre
   clientes, y `progress/` está versionado. **No se ha tocado `.gitignore`**
   porque queda fuera del alcance que se me dio. Hay que decidir si esos dos
   ficheros se ignoran antes de correr `--fase extraer`.
4. **Forma de la respuesta de la API** (supuesto 6): confírmese con la primera
   respuesta real. Si no encaja, salen 50 `sin_respuesta` y el informe lo dirá.
5. **CI no mira `backend/scripts/`**: `pnpm lint` usa el glob
   `{src,apps,libs,test}`. Los ficheros pasan eslint si se les apunta a mano,
   pero ampliar el glob tocaría `backend/package.json` más allá de la entrada
   `test:scripts` que se me autorizó.
6. Los tres ficheros de `specs/77-jev-quality-backtest/` siguen con
   `status: draft` en el frontmatter aunque la spec se declaró aprobada. No los
   he tocado.

---

# Segunda vuelta — cierre de los 4 hallazgos ALTA

Revisión `progress/review_77-jev-quality-backtest.md`: **FAILED** con 4 ALTA.
Los cuatro cerrados. No se han tocado los MEDIA ni los BAJA (ver §9). T6 sigue
sin ejecutarse.

## 6. Qué se cambió, hallazgo a hallazgo

### ALTA-1 — pérdida del lote entero

Tres cierres sobre el mismo riesgo, porque el que importa es el tercero:

1. `aDistribucion` (en `jev-client.ts`) exige que **todos** los elementos sean
   números finitos. Una distribución de cadenas se descarta y el nivel se
   conserva: la actividad no se convierte en `sin_respuesta` por esto.
2. **`evaluarLote` fija el orden `consultar → guardar → informar`.** Las
   respuestas van a `progress/jev-backtest-respuestas.json` en cuanto vuelven,
   antes de calcular métricas y antes de renderizar. Si el render revienta se
   pierde el informe, que es gratis de rehacer, y no las 50 llamadas ni la
   exportación de 50 textos de clientes, que no lo es. El test lo fija incluso
   cuando `guardarInforme` lanza.
3. `askJev` conserva el **cuerpo crudo** y la bandera `--reusar-respuestas`
   rehace el informe desde el fichero guardado sin tocar la red. Así un error
   de lectura por nuestra parte —el supuesto 6— se corrige y se vuelve a sacar
   el informe sin gastar una sola llamada.

Durante la verificación del flujo salió un cuarto agujero por la misma vía: el
modo seco no guardaba el crudo, así que `--reusar-respuestas` después de un
ensayo devolvía 50 `sin_respuesta` y un informe degradado en silencio. La rama
de `dryRun` pasa ahora por el mismo `desdeCrudo` que la respuesta real.

El fichero de respuestas cae bajo el glob `progress/jev-backtest-*` del
`.gitignore`, así que no nace versionado. Contiene niveles y probabilidades,
no texto de actividades.

### ALTA-2 — corrupción silenciosa de la matriz

`aNivel` pasa por `Number.isInteger` antes de aceptar el valor, venga como
número o como cadena. Un `answer: 2.5` deja de ser un nivel: la actividad
queda `sin_respuesta` con su motivo, en vez de escribir en el índice `1.5` de
la matriz 4x4 y ablandar la condición B de R13.

### ALTA-3 — el gate R4 sin test en la fase que importa

El alcance del gate vivía en una condición anónima dentro de `main`. Pasa a
ser `necesitaAprobacion(opciones)`, **con el mismo comportamiento**: la exigen
todas las fases, incluida la desconocida, y solo `evaluar --dry-run` está
exento. Cubiertas las cinco invocaciones contra `main` (código 1, mensaje de
R4, ninguna petición) más una que comprueba que el mensaje es el de R4 y no el
de la base, es decir que aborta antes de abrir conexión.

Comprobado que la red nueva mata los dos mutantes que sobrevivían:

| Mutante | Resultado |
|---|---|
| gate exento para `--fase extraer` | **8 tests rojos** |
| gate exento para cualquier `--dry-run` | **2 tests rojos** |

### ALTA-4 — R5 sin aserción sobre la petición real

Sin cambio de producción: el comportamiento de HEAD ya era correcto, lo que
faltaba era la red. Se captura la llamada a `fetchImpl` y se fija lo que sale
por el cable: cabeceras exactamente `Content-Type` y `Authorization`, `init`
sin nada más que `method`, `headers` y `body`, URL sin query string, y ni el
`id` ni el vendedor ni el cliente ni las fechas en ninguna parte de la
petición serializada.

| Mutante | Resultado |
|---|---|
| el `id` en una cabecera (`X-Activity-Id`) | **2 tests rojos** |
| el `id` en la query string de la URL | **3 tests rojos** |

## 7. Commits de la segunda vuelta, en orden

```
f6be103 test: un nivel fraccionario debe quedar sin_respuesta (ALTA-2)
74056b5 fix:  exige nivel entero en la respuesta del modelo (ALTA-2)
7d26bb7 test: el lote no se puede perder al renderizar (ALTA-1)
299a43d test: importa reparse en el test rojo de ALTA-1
c1ccaaf fix:  salva el lote antes de renderizar el informe (ALTA-1)
013330e test: cubre el gate de R4 en las cinco fases (ALTA-3)
9c8818c fix:  hace explicito y testeable el alcance del gate R4 (ALTA-3)
ab88122 test: afirma sobre la peticion real, no sobre el constructor (ALTA-4)
e4daa76 test: el modo seco tambien debe guardar el crudo (ALTA-1)
1f64c9e fix:  el modo seco guarda el crudo como la corrida real (ALTA-1)
dd9c6c4 style: quita una asercion de tipo innecesaria en el test
```

Fichero nuevo: `backend/scripts/jev-backtest/run-backtest.spec.ts`
(costura `evaluarLote` y gate de R4 por fases). Modificados:
`jev-client.ts`, `jev-client.spec.ts`, `run-backtest.ts`. Nada fuera de
`backend/scripts/`.

Tests: **52 → 81**.

## 8. Salida literal de los cuatro comandos (segunda vuelta)

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        3.543 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 6 passed, 6 total
Tests:       81 passed, 81 total
Snapshots:   0 total
Time:        0.884 s, estimated 1 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix

exit=0
```

`pnpm test` sigue en 15 suites / 78 tests: D9 se mantiene.

Verificación de flujo, además de los cuatro comandos, sobre un lote sintético
de 50 filas (sin base de datos y sin red):

- `--fase evaluar --dry-run` → escribe las 50 respuestas y el informe;
  veredicto NEGATIVO con 46.7% de falsos 100 detectados y 56.0% de buenos
  degradados.
- `--fase evaluar --reusar-respuestas`, **sin `JEV_API_KEY`** → reproduce el
  mismo veredicto y las mismas dos cifras sin una sola llamada.
- Mismo fichero con las probabilidades reescritas a cadenas (el escenario
  exacto de ALTA-1) → el informe se escribe igual, exit 0, sin
  `p.toFixed is not a function`.

Los tres ficheros de prueba se borraron y `progress/explore_jev-backtest.md`
se restauró a su versión commiteada.

## 9. Lo que NO se ha tocado, y por qué

Los 7 MEDIA y los 9 BAJA de la revisión siguen abiertos: el encargo de esta
vuelta era cerrar los cuatro ALTA. Los tres que la propia revisión recomienda
antes de T6 —**MEDIA-1** (`n/d` en vez de `0.0%` cuando no hay pares
comparables), **MEDIA-5** (validar que el fichero etiquetado trae tantos
bloques como filas el lote) y **MEDIA-7** (publicar el reparto por vendedor)—
siguen sin hacer y son decisión del Líder.

Las obsolescencias que señaló la revisión en §5 de este informe (`.gitignore`,
glob de lint) están cerradas por `d39ac93` y `53b7443`; se dejan escritas como
estaban para no reescribir la historia del primer entregable.
