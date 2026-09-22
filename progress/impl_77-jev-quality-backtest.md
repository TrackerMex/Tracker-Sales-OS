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
a28a8ed style: quita una asercion de tipo innecesaria en el test
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

---

# Tercera vuelta — los tres MEDIA recomendados antes de T6

Encargo del Líder tras aceptar los cuatro ALTA: cerrar MEDIA-1, MEDIA-5 y
MEDIA-7. Los otros 4 MEDIA y los 9 BAJA siguen abiertos por decisión suya. T6
sigue sin ejecutarse. Punto 4 de mi última entrega (la exención de
`--reusar-respuestas`) resuelto por el Líder: **se queda como está**, una sola
condición sin excepciones.

## 10. MEDIA-1 — el informe ya no afirma lo que no ha medido

`fraccion` devuelve `null` con denominador cero, así que dejan de fabricarse
ceros sobre el conjunto vacío:

| Cifra | Antes, sin datos | Ahora |
|---|---|---|
| Acuerdo exacto | `0.0%` | `n/d` |
| Acuerdo adyacente | `0.0%` | `n/d` |
| Correlación de Spearman | `0.000` | `n/d` |
| Fracción de buenos degradados | `0.0%` | `n/d` |

Spearman devuelve `null` también cuando una de las series es constante: ahí la
correlación no existe, que no es lo mismo que valer cero. **Esto es BAJA-9**,
que quedaba abierto; entra porque es la misma raíz y la misma línea. Si el
Líder lo considera fuera de alcance, revertirlo es cambiar un `null` por un
`0` en `spearman`.

Cuando no hay ni un par comparable el informe añade, bajo las tres cifras, por
qué son `n/d`. **El veredicto no cambia**: la condición B ya pasaba de forma
vacua cuando no hay buenos que degradar; ahora la comparación lo dice en vez
de apoyarse en que `0` no supera el umbral.

## 11. MEDIA-5 — el etiquetado tiene que ser el lote que se entregó

`validarEtiquetado(etiquetas, totalLote)` compara lo que devuelve el director
contra lo que se le dio: número de bloques, posiciones repetidas, posiciones
que faltan y posiciones que el lote no tiene, incluido el **bloque fantasma
sin número** que crea una línea de texto que empieza por `## `. Un bloque sin
marcar no es un error: es una actividad sin etiqueta, y ya se contaba como
tal.

`faseEvaluar` lo llama antes de unir etiquetas con respuestas y antes de medir
nada. Si algo no cuadra, para con código 1 y dice qué. Verificado sobre el
flujo real borrando el bloque 17 de un lote de 50:

```
[jev-backtest] .../progress/jev-backtest-etiquetado.md no cuadra con el lote:
  - el fichero trae 49 bloques y el lote tiene 50 actividades
  - faltan las posiciones: 17
  Revisalo con el director antes de seguir; no se toca a mano.
exit=1
```

## 12. MEDIA-7 — concentración por vendedor, sin publicar a nadie

Las tres restricciones del encargo, en su orden:

1. **`seller_id` entra en `BATCH_QUERY`**, solo para el diagnóstico. Misma
   tabla `activities`, mismo `GRANT` de solo lectura: la credencial de D7 no
   cambia.
2. **No puede salir.** Las filas de prueba de R5 y R6 llevan ahora un
   `seller_id` real, así que la red que se montó para ALTA-4 lo cubre.
   Comprobado inyectando las tres fugas:

   | Mutante | Resultado |
   |---|---|
   | `seller_id` dentro del `state` de la petición | **5 tests rojos** |
   | el vendedor impreso en el fichero del director | **1 test rojo** |
   | el informe publica los `seller_id` reales | **1 test rojo** |

3. **El informe publica el reparto anonimizado.** `sellerSpread` devuelve solo
   recuentos: vendedores distintos, reparto descendente y fracción del que más
   aporta. El índice se asigna al imprimir y no hay camino de vuelta. Salida
   real sobre un lote deliberadamente concentrado (30/14/6):

```
## Reparto por vendedor en el lote (R11, anonimizado)

- Vendedores distintos: 3
- Fraccion del que mas aporta: 60.0% (30 de 50)
- Reparto, de mayor a menor: vendedor 1: 30, vendedor 2: 14, vendedor 3: 6
```

`grep` de los tres `seller_id` del lote y de la cadena `seller_id` sobre el
informe generado: **0 coincidencias**.

Decisión que tomé dentro del encargo: el reparto va **ordenado de mayor a
menor** en vez de en un orden aleatorio. Es lo que hace legible la
concentración de un vistazo, que era el objetivo; el precio es que "vendedor
1" es siempre el que más aporta. Sigue sin ser un identificador.

## 13. Commits de la tercera vuelta, en orden

```
11cb593 test: una cifra sin datos no puede publicarse como cero (MEDIA-1)
2956fbf fix:  el informe dice n/d cuando no hay nada que medir (MEDIA-1)
eb17c89 test: el fichero etiquetado tiene que cuadrar con el lote (MEDIA-5)
fe8c32d fix:  aborta si el etiquetado no cuadra con el lote (MEDIA-5)
9d9fce4 test: concentracion por vendedor, y que no se escape (MEDIA-7)
444db3c test: la fila de R5 lleva seller_id de verdad (MEDIA-7)
dc54587 feat: publica la concentracion por vendedor del lote (MEDIA-7)
9c576fc style: formato prettier en el test de reparto por vendedor
```

Modificados: `types.ts`, `stratify.ts`, `labeling.ts`, `metrics.ts`,
`run-backtest.ts` y sus cinco `.spec.ts`. Ningún fichero nuevo. Nada fuera de
`backend/scripts/`.

Tests: **81 → 99**.

## 14. Salida literal de los cuatro comandos (tercera vuelta)

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        4.106 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 6 passed, 6 total
Tests:       99 passed, 99 total
Snapshots:   0 total
Time:        1.011 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix

exit=0
```

`pnpm test` sigue en 15 suites / 78 tests: D9 intacto.

Verificación de flujo, sobre un lote sintético de 50 filas concentrado en tres
vendedores (sin base de datos y sin red): `--fase evaluar --dry-run` imprime
la sección de reparto sin un solo identificador; con el bloque 17 borrado del
etiquetado aborta con código 1 y dice qué falta; y con todas las respuestas
sin cuerpo crudo el informe publica `n/d` en las tres cifras de acuerdo con su
explicación. Los tres ficheros de prueba se borraron y
`progress/explore_jev-backtest.md` se restauró a su versión commiteada.

## 15. Lo que sigue abierto

Los 4 MEDIA restantes (MEDIA-2, MEDIA-3, MEDIA-4, MEDIA-6) y los 9 BAJA menos
BAJA-9, que ha entrado con MEDIA-1. Dos apuntes por si se reabren:

- **MEDIA-4** queda cerrado de hecho: `fraccion(n, 0)` ya no devuelve `0` sino
  `null`, y hay test.
- **BAJA-7** (pasar `lote.orden` entero a `runBatch` en vez de proyectarlo a
  `TextFields`) pesa algo más desde esta vuelta, porque la fila que cruza esa
  llamada ahora lleva `seller_id`. El recorte de R5 sigue siendo explícito en
  `buildRequestBody` y hay tres tests que lo vigilan, pero la frontera sigue
  descansando en una convención dentro de una función y no en el tipo que
  cruza la llamada.

---

# Cuarta vuelta — BAJA-7: la frontera de R5 pasa a ser del compilador

Encargo del Líder tras aceptar los tres MEDIA. BAJA-9 y el orden descendente
del reparto se quedan como estaban, por decisión suya. T6 sigue sin
ejecutarse.

## 16. Qué cambió

El recorte de R5 vivía en `buildRequestBody`, que elegía sus cuatro campos a
mano sobre un parámetro `TextFields`. Como TypeScript es estructural, la fila
entera de la base —con `id`, `quality` y, desde la vuelta anterior,
`seller_id`— encajaba sin protestar. Protegía de la regresión de hoy, no de la
de dentro de seis meses.

Ahora:

- **`recortarCampos(fila: TextFields): TextoRecortado`** es el único recorte y
  tiene nombre. Ahí, y solo ahí, la fila de la base se convierte en lo que
  puede salir de la empresa.
- **`TextoRecortado`** son exactamente los cuatro campos de texto, sin nulos.
- **`SoloTexto<T>`** tipa como `never` toda clave que sobre, así que
  `buildRequestBody(fila)` **no compila**. Es la única forma de que un tipo
  más ancho no encaje donde se pide uno más estrecho.
- `askJev` llama `buildRequestBody(recortarCampos(actividad))`.

La asignación explícita de las cuatro claves dentro de `buildRequestBody` se
queda: el compilador cubre a quien escribe, esa línea cubre la ejecución, y
los tests de ALTA-4 cubren lo que sale por el cable. Tres capas, no tres
alternativas.

**El recorte ocurre en un solo sitio.** El único punto de producción que
construye la petición es `askJev`; el resto de llamadas a `buildRequestBody`
estaban en los tests. No hizo falta generalizar nada, así que no había nada
que consultar.

## 17. Cómo se comprueba, y dónde

Las dos comprobaciones de tipo son directivas `@ts-expect-error` sobre
`buildRequestBody(fila)`. Las verifica **`npx tsc --noEmit`, no jest**: ts-jest
corre en modo transpilación y no mira tipos. Si algún día la fila completa
vuelve a encajar, la directiva se queda sin usar y `tsc` falla con
`TS2578: Unused '@ts-expect-error' directive`. En el commit rojo fallaba
exactamente así, que es la prueba de que el agujero existía.

Dos mutantes sobre HEAD, los dos muertos en compilación:

| Mutante | Resultado |
|---|---|
| `askJev` se salta el recorte y pasa la fila entera | **tsc rojo**: `TS2345`, `id` no es `never` |
| alguien añade `seller_id` dentro de `recortarCampos` | **tsc rojo**: `TS2353`, más 3 tests |

## 18. Commits de la cuarta vuelta

```
203ab2d test: el compilador tiene que parar la fila completa (BAJA-7)
0737cb4 fix:  el tipo impide que la fila entera llegue a la peticion (BAJA-7)
```

Modificados: `jev-client.ts` y `request-gate.spec.ts`. Nada más, nada fuera de
`backend/scripts/`.

Tests: **99 → 103**.

## 19. Salida literal de los cuatro comandos (cuarta vuelta)

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        3.588 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 6 passed, 6 total
Tests:       103 passed, 103 total
Snapshots:   0 total
Time:        0.981 s, estimated 1 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix

exit=0
```

`pnpm test` sigue en 15 suites / 78 tests: D9 intacto.

Verificación de flujo sobre un lote sintético de 50 filas repartido 22/18/10
entre tres vendedores, sin base de datos y sin red: `--fase evaluar --dry-run`
produce el informe completo (212 líneas) con veredicto NEGATIVO, y `grep` de
los tres `seller_id` y de la cadena `seller_id` da **0 coincidencias**. Los
ficheros de prueba se borraron y `progress/explore_jev-backtest.md` se
restauró a su versión commiteada.

## 20. Estado al cerrar

Cerrados: los 4 ALTA, MEDIA-1, MEDIA-4 (de hecho), MEDIA-5, MEDIA-7, BAJA-7 y
BAJA-9. Siguen abiertos por decisión del Líder: MEDIA-2, MEDIA-3, MEDIA-6 y
los BAJA 1 a 6 y 8.

Para T6 siguen haciendo falta, y no son míos: la credencial de solo lectura de
D7 y la confirmación de la forma real de la respuesta de la API con la primera
llamada.

---

# Quinta vuelta — ALTA-5, ALTA-6, MEDIA-8 y BAJA-10

Segunda revisión: dos ALTA nuevos de la clase de ALTA-1 (rutas por las que se
pierde el lote ya pagado), más un hueco de cableado y un `n/d` sin explicar.
Cerrados los cuatro. MEDIA-2, MEDIA-3, MEDIA-6 y los BAJA 1 a 6 y 8 siguen
abiertos por decisión del Líder; no se han tocado. T6 sigue sin ejecutarse.

Las dos frases de `run-backtest.ts` que afirmaban que ningún fallo posterior
puede costar una segunda exportación vuelven a ser ciertas.

## 21. ALTA-5 — un cuerpo ilegible se llevaba el lote

`await respuesta.json()` estaba fuera del `try`, que cerraba con el `catch` de
red. Un **HTTP 200 cuyo cuerpo no es JSON** —HTML de un proxy o un WAF, cuerpo
truncado, cuerpo vacío— lanzaba ahí: `askJev` no lo convertía en
`sin_respuesta` (incumpliendo R9), la excepción subía por `runBatch` y se
llevaba el array entero, así que `evaluarLote` nunca llegaba a
`guardarRespuestas`. La pérdida de ALTA-1 una línea por encima de la costura
que la arregló.

El parseo entra ahora en el `try` y devuelve `sin_respuesta` con motivo. El
test lo reproduce con el fallo en la 3.ª de 5 actividades: las dos ya pagadas
sobreviven y el lote continúa.

## 22. ALTA-6 — un ensayo en seco machacaba la corrida real

`guardarRespuestas` escribía `RUTA_RESPUESTAS` pasara lo que pasara, y en seco
`consultar` devuelve las de ejemplo: un solo `--fase evaluar --dry-run`
después de la corrida real dejaba el fichero lleno de respuestas inventadas,
sin aviso y sin copia.

`rutaRespuestas(dryRun)` separa las respuestas del ensayo de las reales, al
escribir y al retomar. **No es que se compruebe antes de sobrescribir: es que
el ensayo no apunta ahí.** La ruta nueva cae bajo el mismo glob
`progress/jev-backtest-*` del `.gitignore`.

Sobre la sugerencia de leer el campo `modo`: con las rutas separadas el campo
deja de poder ser la garantía, porque una corrida real nunca lee ni escribe el
fichero del ensayo. Se queda en el fichero como etiqueta para quien lo abra.
Si prefieres además la comprobación defensiva, dímelo.

Verificado en el flujo real, con una corrida "real" ya pagada en disco:

```
[jev-backtest] 50 respuestas guardadas en .../jev-backtest-respuestas-seco.json
respuestas reales intactas tras el ensayo: SI   (md5 idéntico)
```

y después `--reusar-respuestas` recupera la corrida real, dos veces seguidas,
con las 50 respuestas crudas intactas.

## 23. MEDIA-8 — la validación del etiquetado, enchufada y con red

Sin cambio de producción: el cableado ya era correcto. Lo que faltaba era poder
afirmarlo, y para eso `faseEvaluar` recibe los ficheros por `deps.fs` (con la
implementación real por defecto) en vez de tocar el disco directamente.
`sample-responses.json` se queda fuera de esa superficie: es una fixture que
viaja con el script, no un artefacto que el script produzca.

Tres casos sobre `faseEvaluar` con ficheros en memoria: un bloque de menos y
una posición repetida paran antes de medir y **no escriben nada**; el
etiquetado completo sigue adelante y deja el informe, para que un mutante que
siempre aborte tampoco pase.

| Mutante | Resultado |
|---|---|
| se quita la llamada a `validarEtiquetado` | **2 tests rojos** |

Verificado también en el flujo real duplicando una posición del etiquetado:
exit 1, `posiciones repetidas: 30` y `faltan las posiciones: 31`.

## 24. BAJA-10 — el `n/d` de Spearman ya dice por qué

Cuando hay pares comparables pero una de las dos series es constante, el
informe explica que la correlación no existe, como ya hacía con el `n/d` de
las tres cifras sin pares. Un segundo test evita que la explicación aparezca
cuando la cifra sí tiene valor.

## 25. Commits de la quinta vuelta, en orden

```
f44822a test:  un cuerpo ilegible no puede llevarse el lote (ALTA-5)
04b2ddf fix:   un cuerpo ilegible es sin_respuesta, no el fin del lote (ALTA-5)
d253d22 test:  un ensayo en seco no puede machacar la corrida real (ALTA-6)
4f9ac0d fix:   el ensayo escribe en su propio fichero (ALTA-6)
e767825 test:  comprueba que validarEtiquetado sigue enchufada (MEDIA-8)
108f961 test:  el n/d de Spearman tambien tiene que explicarse (BAJA-10)
366acb2 fix:   explica el n/d de Spearman con serie constante (BAJA-10)
42481b9 style: formato prettier en el test de cuerpo ilegible
```

Modificados: `jev-client.ts`, `run-backtest.ts` y sus dos `.spec.ts`. Nada
fuera de `backend/scripts/`.

Tests: **103 → 114**.

## 26. Salida literal de los cuatro comandos (quinta vuelta)

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        4.243 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 6 passed, 6 total
Tests:       114 passed, 114 total
Snapshots:   0 total
Time:        1.176 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix

exit=0
```

`pnpm test` sigue en 15 suites / 78 tests: D9 intacto. Los ficheros de prueba
del flujo se borraron y `progress/explore_jev-backtest.md` se restauró a su
versión commiteada.
