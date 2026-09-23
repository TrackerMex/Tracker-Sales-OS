# REVIEW: 77-jev-quality-backtest — Backtest offline de calidad (Jev)

Rama `77-jev-quality-backtest`, rango `68725d9..HEAD` (`d39ac93`).
Revisado: `backend/scripts/jev-backtest/*`, `backend/scripts/jest.config.js`,
`backend/package.json`, `.gitignore`. Confirmado que el diff **no toca**
`backend/src/` ni `frontend/`.

## Veredicto

**FAILED**

Ninguna violación del contrato R1–R13: la frontera de confianza aguanta, el
script es de solo lectura y las métricas son correctas (recalculadas a mano
contra una implementación de referencia independiente, coinciden dígito a
dígito). Se rechaza por **4 hallazgos ALTA**: un camino de pérdida de datos
que se dispara precisamente si el supuesto 6 del Implementer (forma de la
respuesta de la API, declarada NO verificada) es falso, una corrupción
silenciosa de la matriz de R11 por la misma vía, y dos huecos de cobertura
sobre los dos requisitos de la frontera de confianza (R4, R5) que la
trazabilidad da por cubiertos y no lo están.

Los cuatro son baratos de cerrar y ninguno obliga a rediseñar nada. Pero T6 es
el único entregable de esta feature, cuesta 50 exportaciones de texto
comercial real a un tercero, y ALTA-1 hace que una corrida fallida haya que
repetirla entera — es decir, exportar los datos dos veces. Se cierra antes de
correr T6.

## Recuento de comprobaciones

| Bloque | Comprobaciones | Resultado |
|---|---|---|
| Requisitos R1–R13 | 13 | 13 cumplidos |
| Decisiones D1–D11 | 11 | 11 cumplidas |
| Comandos de verificación | 4 | 4 en verde |
| Commits inspeccionados (`git show`) | 14 | 13 limpios, 1 mixto (BAJA-2) |
| Commits rojos reejecutados en worktree aislado | 5 | 5 fallan de verdad |
| Mutantes inyectados sobre HEAD | 25 | 15 muertos, **10 supervivientes** |
| Corridas `--dry-run` de extremo a extremo | 8 | todas conformes |
| Sondas del gate R4 por fase | 5 | todas abortan con exit 1 |
| Supuestos declarados | 13 | 9 razonables, 4 con efecto sobre el resultado |
| **Hallazgos** | **20** | 0 BLOQUEANTE / 4 ALTA / 7 MEDIA / 9 BAJA |

---

## Hallazgos

### BLOQUEANTE

Ninguno.

### ALTA

- **ALTA-1** — `backend/scripts/jev-backtest/jev-client.ts:148-155` (+ crash en
  `backend/scripts/jev-backtest/run-backtest.ts:334-336`). `parseJevResponse`
  acepta `probabilities` con `Array.isArray` y **no valida el tipo de los
  elementos**. Si la API devuelve las probabilidades como cadenas
  (`["0.7","0.1",...]`), el array pasa el filtro y revienta al renderizar el
  informe: `r.distribucion.map((p) => p.toFixed(2))` lanza
  `p.toFixed is not a function`. El `try/catch` de `main`
  (`run-backtest.ts:373-376`) lo traga, devuelve 1 y **`writeFileSync` de la
  línea 216 no llega a ejecutarse**. Las respuestas viven solo en memoria
  (`faseEvaluar`, `run-backtest.ts:196-209`), así que se pierde el lote entero
  después de haber gastado las 50 llamadas y de haber sacado 50 textos de
  clientes reales fuera de la empresa. Reproducido: informe no escrito,
  fichero previo intacto. Contradice el contrato que el propio módulo declara
  en `jev-client.ts:130-134` («si no encaja devuelve null y la actividad queda
  como sin_respuesta»), y el espíritu de R9 (un fallo no aborta el lote).

- **ALTA-2** — `backend/scripts/jev-backtest/jev-client.ts:117-128` (`aNivel`).
  La comprobación es `valor >= 1 && valor <= 4` sin `Number.isInteger`, así
  que `answer: 2.5` y `answer: "2.5"` devuelven `nivel: 2.5`, un `Level`
  inválido. `metrics.ts:49` hace entonces `m[humano-1][2.5-1] += 1`, que
  escribe en el índice fraccionario `1.5` del array: la celda no existe, la
  cuenta **desaparece de la matriz 4x4 impresa** y nadie lo nota, porque
  `paresJev` sí la cuenta. Verificado: con dos pares y un nivel 2.5, el
  informe publica `Pares comparables: 2` y una matriz cuyas celdas suman 1.
  Corrupción silenciosa de R11 exactamente por la vía del supuesto 6.
  Además `esPobre(2.5)` es `false`, de modo que un 2.5 sobre un «bueno» cuenta
  como **no degradado**: la dirección permisiva de la condición B de R13.

- **ALTA-3** — `backend/scripts/jev-backtest/request-gate.spec.ts:23-36`.
  El único test de extremo a extremo del gate de R4 invoca
  `main(['--fase','evaluar'], {})`. **No hay ningún test de `--fase extraer`
  sin `JEV_BACKTEST_APPROVED`**, que es justamente la fase que saca texto
  comercial real de la base de producción a disco, y que el supuesto 4 del
  Implementer declara protegida. Dos mutantes que abren el gate pasan los 52
  tests en verde:
  - exención para `--fase extraer`
    (`run-backtest.ts:361` → `if (!opciones.dryRun && opciones.fase === 'evaluar')`)
  - exención para cualquier fase con `--dry-run`
    (`run-backtest.ts:361` → `if (!opciones.dryRun)`)

  El comportamiento de HEAD **es correcto** (verificado a mano: `extraer`,
  `extraer --dry-run`, `evaluar` y una fase desconocida abortan todas con
  exit 1 y el mensaje de R4). Lo que no existe es la red que impida la
  regresión, y `traceability.md` da R4 por cubierto.

- **ALTA-4** — `backend/scripts/jev-backtest/jev-client.spec.ts:50-63` y
  `request-gate.spec.ts:47-80`. R5 se comprueba **solo sobre el valor de
  retorno de `buildRequestBody`**, nunca sobre el `init` que `askJev` entrega
  de verdad a `fetch` (`jev-client.ts:176-183`). El test de R8 lee
  `init.headers.Authorization` pero no afirma nada sobre el resto de
  cabeceras. Añadir `'X-Activity-Id': actividad.id` en `jev-client.ts:179`
  pasa los 52 tests en verde. R5 prohíbe enviar identificadores internos, y
  una cabecera es enviarlos igual que el cuerpo. El código de HEAD solo manda
  `Content-Type` y `Authorization` — verificado por lectura y por mutación —
  pero la cabecera es un vector sin test.

### MEDIA

- **MEDIA-1** — `backend/scripts/jev-backtest/metrics.ts:53-54, 57-67, 90-110`
  y `run-backtest.ts:322-324`. Las tres cifras de D5 usan como denominador
  solo `paresJev`, es decir las filas donde Jev contestó. Una corrida con
  cobertura mala **infla las tres**: sobre el mismo lote de 12 filas medí
  acuerdo exacto 58.3% con 0 `sin_respuesta` y 66.7% con 3. Peor: con 0 pares
  comparables el informe imprime `Acuerdo exacto: 0.0%`,
  `Adyacente: 0.0%` y `Spearman: 0.000`, que se lee como «el modelo no acierta
  nada» cuando lo cierto es «no hay dato». `tasaFalsos100` y
  `fraccionDetectada` sí imprimen `n/d` en ese caso (`metrics.ts:144,147`), así
  que el informe es incoherente consigo mismo. D11 se preocupa exactamente de
  que un fallo de infraestructura no se confunda con un juicio del modelo.

- **MEDIA-2** — `backend/scripts/jev-backtest/metrics.ts:183` y
  `metrics.spec.ts:155-204`. La **segunda mitad de D11** («un bueno sin
  respuesta NO cuenta como degradado») no tiene test. El mutante
  `buenos.filter((f) => esPobre(f.jev) || f.jev === null)` pasa los 52 tests.
  La implementación es correcta y lo confirmé en la corrida real (2 de 9
  degradados, no 4 de 9, con dos buenos `sin_respuesta`), pero la garantía
  está desprotegida. La primera mitad sí está cubierta
  (`metrics.spec.ts:132-144`).

- **MEDIA-3** — `backend/scripts/jev-backtest/metrics.ts:191, 197`. **Ninguna
  de las dos fronteras de R13 está fijada por un test.** Sobreviven los dos
  mutantes: `<` → `<=` en el 70% y `>` → `>=` en el 15%. La implementación
  coincide con la letra de R13 («al menos el 70%» pasa con 70,0 exacto; «no
  más del 15%» pasa con 15,0 exacto), pero un lote que caiga justo en el
  umbral —el escenario que D2 declara probable— se decide con código sin red.

- **MEDIA-4** — `backend/scripts/jev-backtest/metrics.ts:53-54`. El caso de
  división por conjunto vacío (`fraccion(n, 0) === 0`) no tiene test; el
  mutante que devuelve 1 pasa los 52. Es el valor que decide la condición B
  cuando el director no etiqueta a nadie en 3 o 4: hoy devuelve 0 y la
  condición pasa de forma vacua, lo cual es defendible, pero no está fijado.

- **MEDIA-5** — `backend/scripts/jev-backtest/labeling.ts:91` y
  `labeling.ts:108-109`. `parseLabelingFile` trocea el fichero con
  `split(/^## /m)` sobre texto libre escrito por vendedores, y `joinLabels`
  construye `new Map(etiquetas.map((e) => [e.orden, e.nivel]))`. Una línea que
  empiece por `## ` dentro del texto de una actividad genera un bloque
  fantasma; si su número inicial coincide con una posición real, **la última
  entrada gana y la etiqueta verdadera del director se pierde en silencio**
  (la actividad pasa a `sinEtiqueta`). No se valida que el número de bloques
  leídos coincida con el tamaño del lote, ni que los `orden` sean únicos y
  completos. Una sola comprobación de longitud en `faseEvaluar` lo cierra.

- **MEDIA-6** — `backend/scripts/jev-backtest/labeling.ts:63-77`.
  `buildLabelingFile` interpola los cuatro campos en una sola línea de
  markdown (`- Resumen: ${campo(a.summary)}`) sin escapar ni normalizar saltos
  de línea. Texto multilínea de un vendedor rompe la estructura de bloques de
  la que depende `parseLabelingFile`. Misma raíz que MEDIA-5.

- **MEDIA-7** — `backend/scripts/jev-backtest/stratify.ts:11-17`
  (`BATCH_QUERY`) y `run-backtest.ts:264-283` (informe). El candidato son las
  2000 actividades más recientes ordenadas por `executed_at DESC`, **sin
  ningún control de diversidad por vendedor**, y el informe no publica el
  reparto por vendedor. Un lote de 50 concentrado en uno o dos vendedores es
  indistinguible de uno representativo, y la tasa de falsos 100 pasaría a ser
  una propiedad de esos vendedores en vez de de la fórmula. `seller_id` se
  queda en local, así que publicar el histograma no viola R5. D2 acepta
  explícitamente la falta de potencia estadística, pero no dice nada del
  agrupamiento. Es el supuesto 1 llevado a su consecuencia.

### BAJA

- **BAJA-1** — `backend/scripts/jev-backtest/labeling.spec.ts:75`.
  `expect(fichero).not.toMatch(/\b(100|80|60|40|20)\b/)` dice que prueba que
  el `quality` no se filtra, pero solo pasa porque el fixture tiene 13 filas.
  Generé el fichero con un lote realista de 50 y la expresión encuentra
  `'20','20','20','20','20','40','40','40','40','40'` — las **cabeceras de
  posición** `## 20`, `## 40`, no valores de `quality`. La aserción no prueba
  lo que dice y sería una falsa alarma a tamaño real. (El fichero, por lo
  demás, está limpio: verificado sobre 50 filas que no contiene `quality`,
  `seller`, `franja`, `alta/media/baja` ni ningún `id` del lote, y que el orden
  mezcla las tres franjas: `mabaabmmmmmbbmaab...`)

- **BAJA-2** — commit `45974c7` (verde de R1/R2/R3). Es el **único commit que
  mezcla test e implementación**: además de crear `stratify.ts` y `types.ts`
  modifica `stratify.spec.ts:31-39`. El cambio **endurece** la aserción
  (`not.toContain` → `not.toMatch(/\bDELETE\b/)`, porque `deleted_at` contiene
  la subcadena `DELETE`), no la debilita, y el mensaje del commit lo declara.
  Nota de proceso, no de corrección. El resto de los 13 commits del rango
  separa limpiamente rojo de verde; `7893b20` toca specs e implementación pero
  es prettier puro, verificado línea a línea, sin una sola aserción tocada.

- **BAJA-3** — Cuatro de los cinco commits rojos fallan por
  `Cannot find module` (`83daf8a` → `./stratify`, `6e65405` → `./labeling`,
  `5158331` → `./jev-client`, `adb615f` → `./metrics`), no por aserciones.
  Reejecutados uno a uno en un worktree aislado: los cinco fallan de verdad,
  pero solo `ba52a1c` es un rojo a nivel de aserción (10 tests fallando sobre
  35). Un rojo por módulo ausente demuestra que el test no pasa, no que
  discrimine. La batería de 25 mutantes cubre ese hueco para lo que importa.

- **BAJA-4** — `backend/scripts/jev-backtest/jev-client.ts:31`.
  `requireApproval` acepta cualquier cadena no vacía, incluido
  `JEV_BACKTEST_APPROVED=no` o `=0`. R4 solo exige que la variable «esté
  presente», así que cumple la letra, pero `=no` leyéndose como aprobación es
  un pie de banco.

- **BAJA-5** — `backend/scripts/jev-backtest/run-backtest.ts:79-82, 99`.
  `valor()` devuelve `argv[i+1]`, así que `--fase` como último argumento
  devuelve `undefined` y cae al defecto `'extraer'`: una errata de tecleo corre
  la fase de extracción en vez de fallar. Protegido por el gate de R4 y por
  `JEV_BACKTEST_DATABASE_URL`, así que el daño está acotado.

- **BAJA-6** — `backend/scripts/jev-backtest/run-backtest.ts:93-96`.
  `n > 1 ? n / 100 : n` hace que `--min-falsos-100-detectados 1` signifique
  100%, no 1%. Ambigüedad inherente al supuesto 9 y sin documentar en D10. El
  informe reimprime el umbral efectivo (verificado: `70.0%` tanto con `0.70`
  como con `70`), así que es recuperable de un vistazo.

- **BAJA-7** — `backend/scripts/jev-backtest/run-backtest.ts:196`.
  `runBatch` recibe `lote.orden`, es decir `BatchActivity[]` completo con `id`,
  `quality` y `franja`. Hoy es inocuo porque `buildRequestBody`
  (`jev-client.ts:48-61`) elige los cuatro campos de forma explícita, pero la
  frontera de R5 descansa en una convención dentro de una función en vez de en
  el tipo que cruza la llamada. Proyectar a `TextFields` en el sitio de llamada
  haría R5 estructural en lugar de convencional.

- **BAJA-8** — `backend/scripts/jev-backtest/labeling.ts:91-101`.
  `parseLabelingFile` con dos casillas marcadas devuelve `null` (la actividad
  cuenta como sin etiquetar), lo cual es la lectura conservadora correcta, pero
  no hay test: el mutante `marcas.length >= 1`, que se queda con la primera
  marca, pasa los 52 tests. El caso de cero marcas sí está cubierto
  (`labeling.spec.ts:113-118`).

- **BAJA-9** — `backend/scripts/jev-backtest/metrics.ts:91, 109`. `spearman`
  devuelve `0` cuando una serie es constante o hay menos de dos pares. Está
  documentado en el propio código, pero publica un `0.000` indistinguible de
  una correlación nula real. Mismo problema que MEDIA-1: debería ser `n/d`.

### Observaciones sin severidad

- `progress/impl_77-jev-quality-backtest.md` §5.3 y §5.5 están **obsoletas**:
  el commit `d39ac93` del Líder ya añadió `progress/jev-backtest-etiquetado.md`
  y `progress/jev-backtest-lote.json` al `.gitignore` y amplió el glob de lint
  a `scripts/`. Verificado: `.gitignore:41-44` y
  `backend/package.json:16`. Los dos puntos están cerrados.
- `npx tsc --noEmit` **sí** typechequea el código nuevo: `backend/tsconfig.json`
  no tiene `include`, así que recoge todo lo que cuelga de `backend/`.
  Confirmado con `--listFiles`: 11 ficheros de `backend/scripts` compilados. El
  comando no es vacío para esta feature.
- **D11 se añadió a `design.md` en `d39ac93`, después de la implementación**, y
  ratifica el supuesto 7 del Implementer en vez de restringirlo. La lectura que
  consagra es la conservadora y la respalda la letra de R13, así que no es un
  problema — pero D11 no es evidencia independiente del código, y conviene que
  quien firme el gate lo sepa.
- `progress/explore_jev-backtest.md` §3 sigue marcando la credencial de solo
  lectura como **«pendiente de recibir»**. Hasta que llegue, la garantía de R1
  descansa solo en que `BATCH_QUERY` sea la única sentencia del script (lo es,
  verificado por grep sobre todo `backend/scripts/`: `SELECT`, sin `INSERT`,
  `UPDATE`, `DELETE`, `ALTER`, `CREATE`, `DROP`, `TRUNCATE` ni `GRANT`). D7 dice
  con razón que la garantía real es el `GRANT` del motor. **T6 no debe correrse
  antes de tener esa credencial.**
- El informe generado (`renderReport`, `run-backtest.ts:254-349`) **no contiene
  ningún campo de texto de actividad**: solo recuentos, niveles y
  probabilidades. Se puede versionar en `progress/explore_jev-backtest.md` sin
  exponer nada.

---

## Verificación de la frontera de confianza (R4, R5) — detalle

**Cuerpo de la petición.** `buildRequestBody` (`jev-client.ts:48-61`) construye
`state` por asignación explícita de las cuatro claves, sin spread ni
serialización del objeto entero. Dos mutantes que intentan la fuga mueren:
spread de la fila completa dentro de `state` (3 tests rojos) y una clave
`activity_id` al lado de `model` (2 tests rojos). No hay fuga por campos
anidados: `questions` solo lleva `type` y los `criteria` de R7, `model` es la
constante `'jev-latest'`. La URL es la constante `JEV_ENDPOINT` sin query
string. **Cabeceras: solo `Content-Type` y `Authorization` — correcto, pero sin
test (ALTA-4).** Mensajes de log y de error: `askJev` solo registra
`(e as Error).message` de `fetch` y `HTTP <status>` (`jev-client.ts:185-199`);
`faseExtraer` solo imprime recuentos y rutas (`run-backtest.ts:170-172`).
Ningún camino lleva texto de actividad a un log.

**El gate aborta antes de construir nada.** `requireApproval` se llama en
`main` (`run-backtest.ts:361-363`) antes del `switch` de fases, y
`buildRequestBody` solo es alcanzable desde `askJev` ← `runBatch` ← `faseEvaluar`.
No hay camino que construya una petición antes del gate. Sondeado a mano:

| Invocación | Resultado |
|---|---|
| `--fase extraer` sin la variable | exit 1, mensaje de R4 |
| `--fase extraer --dry-run` sin la variable | exit 1, mensaje de R4 |
| `--fase evaluar` sin la variable | exit 1, mensaje de R4 |
| `--fase informe` (desconocida) sin la variable | exit 1, mensaje de R4 |
| `--fase extraer` con la variable, sin `JEV_BACKTEST_DATABASE_URL` | exit 1; **no cae a `DATABASE_URL`** aunque esté en el entorno |
| `--fase evaluar` con la variable, sin `JEV_API_KEY` | exit 1 antes de cualquier `fetch` |
| `--fase evaluar --dry-run` | única exención; `runBatch` corta en `jev-client.ts:219` antes de tocar la red |

La exención de `evaluar --dry-run` es correcta: R4 condiciona «la primera
llamada a la API» y R10 pide poder validar el script «sin gastar llamadas ni
exponer datos». El modo seco no abre conexión ni siquiera si el fichero de
ejemplos está vacío o corrupto (`jev-client.ts:219-229`).

**Fichero de etiquetado.** Generado sobre un lote estratificado real de 50
filas: no contiene `quality`, `seller`, `franja`, `alta`/`media`/`baja` ni
ningún `id`; la clave es la posición `## 1`…`## 50` y el orden mezcla las tres
franjas. El mutante que añade `- Calidad: N` al bloque muere (1 test rojo). El
mutante que devuelve el orden sin mezclar muere (2 tests rojos). La semilla se
imprime en el fichero que ve el director (`labeling.ts:51`), lo cual es
inofensivo por sí solo —sin el lote original no reconstruye nada— pero es
información que no necesita ver.

## Correctitud de las métricas (R11, R12, R13, D11) — detalle

Construí un lote de 12 filas (8 con `quality=100`, 4 con 60) y etiquetas
humanas elegidas para que el veredicto fuera negativo **por las dos
condiciones a la vez**, y comparé la salida del script con una implementación
de referencia escrita aparte en Python. Coincidencia exacta:

| Cifra | Referencia | Informe |
|---|---|---|
| Matriz director × Jev | `[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]` | idéntica |
| Matriz director × quality normalizado | `[[0,0,0,2],[0,0,0,1],[0,0,2,2],[0,0,2,3]]` | idéntica |
| Acuerdo exacto | 7/12 = 58,3% | 58.3% |
| Acuerdo adyacente | 7/12 = 58,3% | 58.3% |
| Spearman (Pearson sobre rangos promediados) | 0,480 | 0.480 |
| Tasa de falsos 100 (R12) | 3/8 = 37,5% | 37.5% |
| Fracción detectada | 2/3 = 66,7% | 66.7% |
| Buenos degradados | 4/9 = 44,4% | 44.4% |
| Veredicto | NEGATIVO, dos motivos | NEGATIVO, dos motivos |

**Empates en Spearman.** `ranks` (`metrics.ts:70-82`) asigna el rango promedio
`(i+j)/2+1` a cada grupo de empates, que es lo correcto. Verificado a mano
sobre `[1,2,2,4]` → `[1, 2.5, 2.5, 4]` y sobre el caso del test
`spearman([1,2,3,4],[1,3,3,2]) = 0,3162`. El mutante que usa rango ordinal en
vez de promedio muere.

**D11, las dos direcciones, en el flujo real.** Corrida con 3 de 12
actividades en `sin_respuesta`, colocadas a propósito sobre un falso 100 y
sobre dos buenos:
- falso 100 sin respuesta → **resta** en la condición del 70%: 1 de 3 = 33,3%
  (y `falsos100SinRespuesta: 1` publicado aparte, como pide D11).
- buenos sin respuesta → **no suman** en la condición del 15%: 2 de 9 = 22,2%,
  no 4 de 9.

**Corolario de D11.** Lote de 8 filas con `quality=100` todas etiquetadas 3 o
4: veredicto NEGATIVO con el motivo «el lote no contiene falsos 100 que
detectar», y `fraccionDetectada` impresa como `n/d`. Se cumple.

**División por conjunto vacío.** `fraccion` devuelve 0 con denominador 0
(`metrics.ts:53-54`) y `falseHundreds` devuelve `null` en las dos tasas
(`metrics.ts:144,147`). Corrida con las 12 actividades en `sin_respuesta`:
`Pares comparables: 0`, pero los acuerdos imprimen `0.0%` y Spearman `0.000`
en vez de `n/d` — ver MEDIA-1.

---

## Salida literal de los cuatro comandos

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        4.059 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 5 passed, 5 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        0.824 s, estimated 1 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix

exit=0
```

Los cuatro coinciden con lo que reporta el Implementer. `pnpm test` sigue en
78 tests, así que D9 se cumple: la configuración principal con `rootDir: src`
no ve `backend/scripts/`. `pnpm lint --fix` no dejó el árbol sucio
(`git status` vacío después). El glob de lint ya incluye `scripts` —el
Implementer lo reportaba como pendiente, lo cerró `d39ac93`.

---

## Mutantes supervivientes

Los 10 que pasan los 52 tests en verde. Ninguno es un fallo del código de HEAD
—todos son huecos de la red de tests— salvo donde se indica.

| # | Mutación | Fichero | Hallazgo |
|---|---|---|---|
| M5 | un bueno sin respuesta cuenta como degradado | `metrics.ts:183` | MEDIA-2 |
| M14 | se elimina la rama de «sin falsos 100» | `metrics.ts:187` | ver nota |
| M16 | `fraccion(n, 0)` devuelve 1 | `metrics.ts:53-54` | MEDIA-4 |
| M17 | `>` → `>=` en el umbral del 15% | `metrics.ts:197` | MEDIA-3 |
| M18 | `<` → `<=` en el umbral del 70% | `metrics.ts:191` | MEDIA-3 |
| M19 | gate de R4 exento para `--fase extraer` | `run-backtest.ts:361` | ALTA-3 |
| M20 | gate de R4 exento con cualquier `--dry-run` | `run-backtest.ts:361` | ALTA-3 |
| M22 | el `id` viaja en una cabecera HTTP | `jev-client.ts:178-181` | ALTA-4 |
| M24 | dos casillas marcadas → se coge la primera | `labeling.ts:96` | BAJA-8 |
| — | `answer: 2.5` aceptado como nivel | `jev-client.ts:117-128` | ALTA-2 |

Nota sobre M14: sobrevive por un accidente de JavaScript, no por un hueco real.
Al borrar la rama `=== null`, la siguiente evalúa `null < 0.7`, que JS coacciona
a `0 < 0.7` y sigue dando veredicto negativo; la aserción
`expect(v.motivos[0]).toContain('falsos 100')` (`metrics.spec.ts:192`) casa con
los dos mensajes. El corolario de D11 **se cumple** en HEAD (verificado en el
flujo real), pero el test no distingue «no hay falsos 100» de «detección por
debajo del umbral».

Mutantes muertos (15): spread de la fila en el cuerpo, `activity_id` en el
cuerpo, `requireApproval` vacío, veredicto siempre positivo, falso 100 sin
respuesta contado como detectado, Spearman constante, rango ordinal en vez de
promediado, matriz transpuesta, adyacente igual a exacto, `normalizeQuality`
siempre 4, sin reintentos, `dryRun` ignorado, shuffle desactivado, `quality` en
el fichero del director, cascada de dos saltos en la estratificación, `classify`
con la frontera 20/40 corrida.

---

## Juicio sobre los 13 supuestos declarados

| # | Supuesto | Juicio | ¿Cambia el resultado del backtest si es falso? |
|---|---|---|---|
| 1 | Candidato = 2000 más recientes, estratificación en memoria | **Razonable con reserva.** Coherente con D2 (se mide el comportamiento actual). Pero no hay control de diversidad por vendedor ni se publica el reparto | **Sí.** Un lote concentrado en uno o dos vendedores convierte la tasa de falsos 100 en una propiedad de esos vendedores. Ver MEDIA-7 |
| 2 | Relleno de un solo salto, sin cascada | **Razonable.** Es la lectura literal de R2 («franja inmediatamente superior») y la desviación queda registrada | **Marginalmente.** Rellenar media desde alta mete más filas de `quality=100` en el lote, lo que infla el denominador de R12 sin inflar el numerador. Queda visible en el informe |
| 3 | La clave del fichero de etiquetado es la posición, no el UUID | **Razonable, más estricto que R6.** | No. Pero es frágil ante texto libre — MEDIA-5 y MEDIA-6 |
| 4 | El gate de R4 cubre todas las fases salvo `evaluar --dry-run` | **Razonable y conservador.** Verificado a mano en las cinco fases | No. Pero sin test — ALTA-3 |
| 5 | «Hasta 3 veces» = 3 reintentos sobre el primero (4 peticiones), esperas 1/2/4 s, solo 429 y 529 | **Razonable.** Lectura natural de R9, bien cubierta por tests | No |
| 6 | Forma de la respuesta de la API, **NO verificada** | **Es el supuesto de mayor riesgo, y está mal amortiguado.** La degradación prometida a `sin_respuesta` solo cubre `answer`; `probabilities` revienta el informe (ALTA-1) y un `answer` no entero corrompe la matriz en silencio (ALTA-2) | **Sí, y caro.** O 50 `sin_respuesta` (visible y aceptable), o una corrida perdida que obliga a exportar 50 textos de clientes por segunda vez |
| 7 | Asimetría de D11 en los `sin_respuesta` | **Correcto.** Es la lectura literal de R13 y la conservadora; verificado en las dos direcciones en el flujo real | Define el veredicto. Ojo: D11 se escribió **después** del código (`d39ac93`) y ratifica este supuesto en vez de restringirlo |
| 8 | Lote sin falsos 100 → veredicto no positivo | **Correcto.** Es el corolario explícito de D11 y está verificado | Define el veredicto. Si el lote sale sin falsos 100 hay que reestratificar, no interpretar |
| 9 | Umbrales aceptan `0.70` y `70` | **Razonable.** El informe reimprime el valor efectivo, así que el error es visible | No, salvo con valores ambiguos (`1`) — BAJA-6 |
| 10 | Informe por debajo de una marca, conservando lo escrito a mano | **Razonable.** Verificado: preserva §1–§6 y sustituye solo la parte generada al reejecutar | No |
| 11 | Spearman con rangos promediados; 0 si una serie es constante | **Correcto.** Recalculado contra referencia independiente en dos lotes | No. El `0` para serie constante debería ser `n/d` — BAJA-9 |
| 12 | Identificadores en inglés, valores en español | **Razonable.** Es el patrón del backend | No |
| 13 | `pg` sin tipos, interfaz `ReadOnlyClient` local sin método de escritura | **Razonable, pero no es una garantía.** Es una ficción de tipos sobre un `Client` casteado (`run-backtest.ts:119-121`) que puede ejecutar cualquier SQL | No. La garantía real es el `GRANT` de D7, **todavía pendiente de recibir** |

Resumen: 9 razonables sin más, 4 con efecto sobre el resultado (**1, 6, 7, 8**).
De esos, el 6 es el único que además está mal amortiguado y el que genera dos
de los cuatro ALTA.

---

## Qué hace falta para PASSED

1. `jev-client.ts:148-155` — validar que los elementos de `distribucion` son
   números, o defender el render en `run-backtest.ts:334-336`. Y persistir las
   respuestas en disco antes de renderizar el informe, para que un fallo al
   final no obligue a repetir 50 llamadas y una segunda exportación de datos.
2. `jev-client.ts:117-128` — exigir `Number.isInteger` en `aNivel`.
3. `request-gate.spec.ts` — un test de `--fase extraer` sin
   `JEV_BACKTEST_APPROVED`.
4. `jev-client.spec.ts` — una aserción sobre las cabeceras reales de la
   petición: que no aparezcan ni el `id` ni ninguna clave más allá de
   `Content-Type` y `Authorization`.

Recomendado antes de T6, sin bloquear: MEDIA-1 (`n/d` en lugar de `0.0%`
cuando no hay pares), MEDIA-5 (validar que el fichero etiquetado trae
exactamente tantos bloques como filas el lote) y MEDIA-7 (publicar el reparto
por vendedor en el informe).

---

*Revisión sin modificar una sola línea de código. Los mutantes y las corridas
`--dry-run` se ejecutaron en un worktree git aislado, ya eliminado; el árbol de
trabajo quedó limpio. No se llamó a `api.typesafe.ai` ni se abrió ninguna
conexión a base de datos. T6 no se ejecutó.*

---
---

# SEGUNDA REVISIÓN — rango `d39ac93..HEAD` (`5973eba`)

26 commits nuevos, tres vueltas de trabajo (los 4 ALTA, luego MEDIA-1/5/7,
luego BAJA-7). Tests de scripts 52 → 103. Revisado sin fiarme del anexo:
todo lo que sigue está comprobado ejecutando, mutando o recalculando.

## Veredicto

**FAILED**

Los cuatro ALTA están cerrados de verdad, y bien. Las tres MEDIA encargadas y
BAJA-7 también. No hay ninguna regresión: recalculé las métricas con la misma
implementación de referencia independiente de la primera vuelta y dan
exactamente los mismos números, y la migración de ceros a `null` **no cambia
el sentido del veredicto** ni en la lectura del código ni en las cuatro
corridas con que la probé. El paso de R5 a una frontera de tipo es una mejora
real: dos mutantes que antes solo mataban tests ahora mueren en compilación.

Se rechaza por **dos hallazgos ALTA nuevos**, los dos de la misma clase que
ALTA-1 y los dos comprobados ejecutando. `run-backtest.ts:61-67` y `:298-304`
afirman por escrito que «ningún fallo posterior puede costar una segunda
exportación». Todavía no es cierto:

1. una respuesta HTTP 200 cuyo cuerpo no sea JSON válido tumba el lote entero
   **antes** de que la costura `evaluarLote` llegue a guardar nada;
2. un solo `--fase evaluar --dry-run` después de la corrida real **machaca**
   el fichero de respuestas con las de ejemplo, sin aviso y sin vuelta atrás.

Las dos se arreglan con unas tres líneas cada una. Mientras estén abiertas,
T6 puede costar dos exportaciones de 50 textos de clientes a un tercero, que
es exactamente lo que ALTA-1 existía para impedir.

## Recuento de comprobaciones

| Bloque | Comprobaciones | Resultado |
|---|---|---|
| Hallazgos originales reauditados | 20 | 8 cerrados, 12 abiertos por decisión del Líder |
| Comandos de verificación | 4 | 4 en verde |
| Mutantes inyectados sobre HEAD | 21 | 17 muertos (3 de ellos en `tsc`), **4 supervivientes** |
| Corridas de extremo a extremo (`--dry-run`) | 14 | 12 conformes, **2 destapan hallazgo nuevo** |
| Ataques a `validarEtiquetado` | 8 | 6 detectados y abortados, 2 correctos por diseño |
| Sondas de código de salida | 4 | 4 correctas |
| Recálculo de métricas contra referencia independiente | 3 lotes | idénticos a la 1ª revisión |
| **Hallazgos nuevos** | **6** | 0 BLOQUEANTE / **2 ALTA** / 1 MEDIA / 3 BAJA |

---

## Estado de los 20 hallazgos originales

### Cerrados y verificados (8)

- **ALTA-1 — CERRADO PARCIALMENTE.** El escenario original está resuelto:
  reproduje `probabilities` como cadenas sobre el flujo completo y el informe
  se escribe, exit 0, veredicto correcto, sin `p.toFixed is not a function`.
  `aDistribucion` (`jev-client.ts:214-219`) exige que todos los elementos sean
  números finitos y descarta la distribución sin perder el nivel. La costura
  `evaluarLote` (`run-backtest.ts:305-325`) fija `consultar → guardar →
  informar` y hay test de que guarda aunque el render lance. `--reusar-respuestas`
  rehace el informe desde disco **sin `JEV_API_KEY`**, verificado. El modo seco
  conserva el crudo. Cinco mutantes sobre este bloque, los cinco muertos.
  **Pero quedan dos rutas de pérdida, ver ALTA-5 y ALTA-6.**
- **ALTA-2 — CERRADO.** `esNivel` (`jev-client.ts:163`) pasa por
  `Number.isInteger`, para número y para cadena. `answer: 2.5` y `'2.5'` dan
  `sin_respuesta` con motivo, no un índice fraccionario. Mutante que quita
  `Number.isInteger`: 2 tests rojos.
- **ALTA-3 — CERRADO.** El alcance del gate es ahora `necesitaAprobacion`
  (`run-backtest.ts:507-509`), con tests de las cinco invocaciones más uno que
  comprueba que aborta por R4 **antes** de abrir la base aunque tenga la cadena
  de conexión. Mis dos mutantes de la primera vuelta mueren: exención para
  `--fase extraer` → 8 tests rojos; exención con cualquier `--dry-run` → 2.
  Sondas a mano: `extraer`, `extraer --dry-run`, `evaluar`,
  `evaluar --reusar-respuestas` y fase desconocida salen todas con **exit 1**;
  solo `evaluar --dry-run` está exento.
- **ALTA-4 — CERRADO.** `jev-client.spec.ts:379-451` captura la llamada a
  `fetchImpl` y afirma sobre el `init` real: cabeceras exactamente
  `Authorization` y `Content-Type`, `init` con exactamente `body`, `headers` y
  `method`, URL sin `?`, y la petición serializada entera libre de `id`,
  `seller_id`, `client_id`, `quality` y fechas. Mis dos mutantes mueren:
  `X-Activity-Id` en cabecera → 2 tests; el `id` en la query string → 3 tests.
- **MEDIA-1 — CERRADO.** `fraccion` (`metrics.ts:58-59`) devuelve `null` con
  denominador cero; `spearman` (`metrics.ts:95-115`) devuelve `null` con menos
  de dos pares o con una serie constante. El informe imprime `n/d` y, cuando
  `paresJev === 0`, añade por qué. Dos mutantes que reponen los ceros mueren
  (3 y 1 tests).
  **El sentido del veredicto no cambia**, y lo comprobé de las dos formas:
  por lectura, la condición A nunca usó `fraccion` y la condición B pasó de
  apoyarse en `0 > 0.15 === false` a un `fraccionDegradados !== null &&`
  explícito, que es la misma decisión dicha en voz alta
  (`metrics.ts:203-210`); y por ejecución, sobre un lote sin nadie etiquetado
  en 3 o 4 y sobre un lote con las 12 actividades en `sin_respuesta`, donde
  sigue saliendo **NEGATIVO** (condición A: 0 de 3 falsos 100 detectados). Un
  apagón total de la API sigue sin poder producir un positivo, que es el punto
  de D11.
- **MEDIA-4 — CERRADO de hecho**, como dice el anexo: `fraccion(n, 0)` ya no
  devuelve 0 y hay test.
- **MEDIA-5 — CERRADO.** `validarEtiquetado` (`labeling.ts:103-158`) se llama
  en `faseEvaluar` antes de unir nada. Lo ataqué con ocho ficheros:

  | Ataque | Resultado |
  |---|---|
  | fichero truncado (11 de 12 bloques) | aborta: «trae 11 bloques… faltan: 12» |
  | posición duplicada (`## 5` dos veces) | aborta: «posiciones repetidas: 5», «faltan: 6» |
  | posición fuera de rango (`## 99`) | aborta: «posiciones que el lote no tiene: 99» |
  | bloque fantasma con número (`## 7 unidades` dentro del texto) | aborta: «13 bloques», «repetidas: 7» |
  | bloque fantasma sin número (`## nota interna`) | aborta: «un bloque sin numero» |
  | bloque de más (`## 13`) | aborta: «posiciones que el lote no tiene: 13» |
  | bloque sin ninguna casilla marcada | **no aborta**, correcto: es una actividad sin etiqueta |
  | último bloque cortado a media línea (pierde el `Nivel:`) | **no aborta**, correcto por lo mismo; se publica en «Sin etiqueta del director» |

  Los seis primeros salen con **exit 1** y el mensaje dice exactamente qué
  falta. Dos mutantes internos mueren (1 test cada uno). **Pero la llamada no
  está cubierta, ver MEDIA-8.**
- **MEDIA-7 — CERRADO.** `seller_id` entra en `BATCH_QUERY`
  (`stratify.ts:12`) sobre la misma tabla y el mismo `GRANT`. No se escapa por
  ninguna de las tres vías:
  - **petición (R5)**: bloqueado por el tipo. Meter `seller_id` en el `state`
    da `TS2353` en `tsc` **y** 2 tests rojos; meterlo en `recortarCampos` da
    `TS2353` **y** 3 tests rojos.
  - **fichero del director (R6)**: generé uno real de 50 filas con tres
    `seller_id` distintos. No contiene `SELLER`, `seller_id`, ningún `id` de
    actividad, `quality`, `franja` ni `alta/media/baja`. Mutante que imprime el
    vendedor: 1 test rojo.
  - **informe versionado**: `sellerSpread` (`stratify.ts:132-147`) devuelve
    solo recuentos y el índice se asigna al imprimir
    (`run-backtest.ts:365-384`). Sobre una corrida real: `grep` de los tres
    `seller_id` y de la cadena `seller_id` en
    `progress/explore_jev-backtest.md` → **0 coincidencias**. Mutante que
    publica los `seller_id`: 1 test rojo.

  El reparto sale bien: lote 30/14/6 → «Vendedores distintos: 3 · Fracción del
  que más aporta: 60.0% · vendedor 1: 30, vendedor 2: 14, vendedor 3: 6».
- **BAJA-7 — CERRADO, y es la mejor pieza de esta vuelta.** `recortarCampos`
  (`jev-client.ts:56-63`) es el único recorte y `SoloTexto<T>`
  (`jev-client.ts:71-73`) hace que la fila entera no compile.
  - Único sitio de producción que construye la petición:
    `jev-client.ts:229`. Comprobado por grep: el resto de llamadas a
    `buildRequestBody` están en los tests.
  - No hay `as any` ni `as unknown as` en el camino de la petición. Los tres
    `as unknown as` del script son dos `fetchImpl` de test y el cast del
    `Client` de `pg`; ninguno toca el cuerpo.
  - Confirmado que la red la tiende **`tsc`, no jest**: el mutante que se salta
    `recortarCampos` en `askJev` deja los **103 tests en verde** y falla en
    `tsc` con `TS2345`. Sin `npx tsc --noEmit` en el circuito, esta capa no
    existe; conviene que quien la mantenga lo sepa.
- **BAJA-9 — CERRADO** con MEDIA-1.

### Siguen abiertos por decisión del Líder (12)

Reconfirmados con mutantes sobre HEAD; los cuatro primeros siguen vivos:

| Hallazgo | Mutante | Resultado |
|---|---|---|
| MEDIA-2 (D11, mitad del 15% sin test) | bueno sin respuesta cuenta como degradado | **103 en verde** |
| MEDIA-3 (frontera del 70%) | `<` → `<=` | **103 en verde** |
| MEDIA-3 (frontera del 15%) | `>` → `>=` | **103 en verde** |
| BAJA-8 (dos casillas marcadas) | `marcas.length === 1` → `>= 1` | **103 en verde** |

MEDIA-6 (texto multilínea sin escapar en `buildLabelingFile`) sigue abierta en
su causa, pero **su consecuencia ya no es silenciosa**: el arreglo de MEDIA-5
convierte un bloque roto por texto libre en un abort con mensaje, en vez de una
etiqueta perdida sin ruido. Es el cambio que importaba.

BAJA-1 sigue igual y lo reverifiqué: sobre un fichero real de 50 filas, la
aserción `not.toMatch(/\b(100|80|60|40|20)\b/)` de `labeling.spec.ts:75`
encuentra **10 coincidencias** (las cabeceras de posición `## 20`, `## 40`,
`## 100`). Solo pasa porque el fixture tiene 13 filas; no prueba lo que dice.

BAJA-2 a BAJA-6 sin cambios.

---

## Hallazgos nuevos

### ALTA

- **ALTA-5 — `backend/scripts/jev-backtest/jev-client.ts:256`.**
  `const crudo: unknown = await respuesta.json();` está **fuera** del
  `try/catch` que termina en la línea 249. Una respuesta **HTTP 200 cuyo cuerpo
  no sea JSON válido** —la página HTML de un proxy o un WAF, un cuerpo
  truncado, un cuerpo vacío— lanza ahí. `askJev` **no** la convierte en
  `sin_respuesta`, así que:
  - se incumple R9 («registrar esa actividad como `sin_respuesta` y continuar
    con el resto, **sin abortar el lote**»);
  - la excepción sube por `runBatch`, que pierde el array `resultados` con todo
    lo ya obtenido;
  - `evaluarLote` no llega nunca a `io.guardarRespuestas`, así que la costura
    de ALTA-1 no protege nada.

  Reproducido: con el fallo en la 3ª de 5 actividades, `runBatch` lanza
  `Unexpected token < in JSON at position 0`, las 2 respuestas ya pagadas se
  pierden, y `guardarRespuestas llamado: false`. Es la misma pérdida de ALTA-1
  una línea más arriba de donde empieza la costura que la arregló. Ya estaba en
  la primera vuelta (entonces `parseJevResponse(await respuesta.json())`) y no
  lo vi; ahora además desmiente lo que el código afirma en
  `run-backtest.ts:298-304`. Arreglo: meter la línea 256 dentro del `try`, o su
  propio `try` que devuelva `sinRespuesta(id, 'cuerpo no es JSON')`.

- **ALTA-6 — `backend/scripts/jev-backtest/run-backtest.ts:251-268` junto con
  `:241-250`.** `guardarRespuestas` escribe `RUTA_RESPUESTAS`
  **incondicionalmente**, y en modo seco `consultar` devuelve las cuatro
  respuestas de ejemplo cicladas. Un solo `--fase evaluar --dry-run` después
  de la corrida real **machaca el fichero de respuestas reales**. Reproducido:

  ```
  fichero marcado como corrida REAL pagada
  tras --dry-run -> modo: seco | marcas PAGADA restantes: 0
  --reusar-respuestas recupera algo? marcas PAGADA: 0 -> NO, irrecuperable
  ```

  Sin aviso, sin copia, sin vuelta atrás: se pierden las 50 llamadas y hay que
  volver a exportar 50 textos de clientes al tercero. El fichero incluso
  **escribe** `modo: 'seco' | 'real'` (línea 258) y **nadie lo lee nunca**.
  No es un caso exótico: `--dry-run` es el modo que la spec (R10), el propio
  Implementer en sus tres vueltas de verificación y esta revisión usan para
  ejercitar el flujo, y va contra el mismo fichero. Arreglo: negarse a
  sobrescribir un fichero con `modo: 'real'` desde una corrida seca, o escribir
  las respuestas de ensayo en otra ruta.

### MEDIA

- **MEDIA-8 — `backend/scripts/jev-backtest/run-backtest.ts:228-237`.**
  Sustituir la llamada a `validarEtiquetado` por `const problemas: string[] =
  []` deja los **103 tests en verde**. Los internos de la función están bien
  cubiertos (los dos mutantes internos mueren), pero nada comprueba que
  `faseEvaluar` la llame. Es el mismo patrón exacto que ALTA-3 en la primera
  vuelta: una guarda correcta cuyo cableado no tiene red. Un test contra
  `main` con un etiquetado descuadrado lo cierra, como ya se hizo para R4.

### BAJA

- **BAJA-10 — `backend/scripts/jev-backtest/run-backtest.ts:468-475`.** La nota
  que explica el `n/d` solo se imprime cuando `paresJev === 0`. Con la serie
  del director constante —el director etiqueta todo en 3, cosa nada rara en un
  lote de 50— `spearman` devuelve `null` y el informe publica
  `Acuerdo exacto: 25.0% · Adyacente: 75.0% · Spearman: n/d` sin decir por qué.
  Verificado. Mismo caso con un solo par comparable.
- **BAJA-11 — `backend/scripts/jev-backtest/run-backtest.ts:258`.** `modo` se
  escribe desde `opciones.dryRun`, así que
  `--fase evaluar --dry-run --reusar-respuestas` guarda el fichero como
  `"seco"` aunque su contenido venga de las respuestas guardadas. Verificado.
  Etiqueta mal la procedencia del único artefacto que dice si un lote está
  pagado.
- **BAJA-12 — `backend/scripts/jev-backtest/run-backtest.ts:251-268`.** Si el
  `writeFileSync` de `guardarRespuestas` lanza (disco lleno, permisos), las
  respuestas se pierden sin ninguna red: no hay volcado a stdout ni ruta
  alternativa. Es estrecho, pero es el único punto sobre el que descansa toda
  la garantía de ALTA-1.

---

## Regresiones

**Ninguna.** Verificado punto por punto:

| Comprobación | 1ª revisión | Ahora |
|---|---|---|
| Matriz director × Jev (lote de 12) | `[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]` | idéntica |
| Acuerdo exacto / adyacente | 58.3% / 58.3% | 58.3% / 58.3% |
| Spearman | 0.480 | 0.480 |
| Falsos 100 detectados | 66.7% | 66.7% |
| Buenos degradados | 44.4% (4 de 9) | 44.4% (4 de 9) |
| D11 con 3 `sin_respuesta` | 33.3% y 22.2% (2 de 9) | 33.3% y 22.2% (2 de 9) |
| `falsos100SinRespuesta` | 1 | 1 |
| Corolario de D11 (lote sin falsos 100) | NEGATIVO, `n/d` | NEGATIVO, `n/d` |
| Fichero del director, fuga sobre 50 filas | 0 | 0 (ahora también sin `seller_id`) |
| `pnpm test` | 15 suites / 78 tests | 15 suites / 78 tests (D9 intacto) |

Los números de la tabla salen de mi implementación de referencia en Python,
escrita aparte en la primera revisión y reutilizada sin tocarla.

---

## Salida literal de los cuatro comandos (segunda revisión)

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        3.953 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 6 passed, 6 total
Tests:       103 passed, 103 total
Snapshots:   0 total
Time:        0.868 s, estimated 1 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix

exit=0
```

`pnpm test` sigue en 15 suites / 78 tests: D9 intacto. `pnpm lint --fix` no
dejó el árbol sucio. Recuerdo que `npx tsc --noEmit` **no es opcional** en
este proyecto desde BAJA-7: es el único comando que verifica las dos
directivas `@ts-expect-error` de `request-gate.spec.ts:155-166` y, con ellas,
la frontera de R5 a nivel de tipo.

---

## Qué hace falta para PASSED

1. `jev-client.ts:256` — meter `await respuesta.json()` dentro del `try`, o
   envolverlo en uno propio que devuelva `sinRespuesta`. Con eso R9 se cumple
   otra vez y la costura de ALTA-1 protege lo que dice proteger.
2. `run-backtest.ts:251-268` — que una corrida seca no pueda sobrescribir un
   fichero de respuestas con `modo: 'real'`. El campo ya se escribe; basta con
   leerlo.

Recomendado, sin bloquear: MEDIA-8 (un test contra `main` con el etiquetado
descuadrado, igual que se hizo para R4) y BAJA-10 (explicar el `n/d` también
cuando la serie es constante).

Sigue pendiente, y no es del Implementer: la credencial de solo lectura de D7
y confirmar la forma real de la respuesta con la primera llamada de T6.

---

*Segunda revisión sin modificar una sola línea de código. Mutantes, ataques al
etiquetado y las catorce corridas `--dry-run` se ejecutaron en un worktree git
aislado, ya eliminado; el árbol de trabajo quedó limpio. No se llamó a
`api.typesafe.ai` ni se abrió ninguna conexión a base de datos. T6 no se
ejecutó.*

---
---

# TERCERA REVISIÓN — rango `5f76aaa..HEAD` (`335f419`)

10 commits, quinta vuelta de trabajo. Tests de scripts 103 → 114. Igual que las
dos anteriores: nada de lo que sigue sale del anexo, todo está comprobado
ejecutando, mutando o recalculando.

## Veredicto

**PASSED**

ALTA-5, ALTA-6, MEDIA-8 y BAJA-10 están cerrados, y los cuatro con red en las
dos direcciones: los mutantes que revierten el arreglo mueren, y los que se
pasan de frenada —una validación que aborte siempre, una explicación que salga
siempre— también. **No hay ninguna regresión**: las métricas vuelven a salir
idénticas a mi implementación de referencia, y los catorce mutantes de todo lo
cerrado en las vueltas anteriores siguen muriendo.

Quedan tres hallazgos nuevos, ninguno BLOQUEANTE ni ALTA: dos MEDIA y un BAJA.
No bloquean porque ninguno puede falsear el veredicto ni destruir datos en
silencio con una entrada ordinaria, que es la vara con la que fallé las dos
veces anteriores. Los dos MEDIA sí conviene mirarlos antes de T6, porque T6 es
un disparo único.

Aplico la misma vara que en las dos vueltas anteriores, no una más blanda por
ser la tercera: lo que me hizo fallar antes era (a) defectos que sobre entradas
ordinarias destruían datos pagados o corrompían la matriz sin ruido, y (b)
guardas de la frontera de confianza sin test. Ninguna de las dos cosas queda.

## Recuento de comprobaciones

| Bloque | Comprobaciones | Resultado |
|---|---|---|
| Hallazgos reauditados (20 de la 1ª + 6 de la 2ª + 3 nuevos) | 29 | 15 cerrados, 11 abiertos por decisión, 3 nuevos |
| Comandos de verificación | 4 | 4 en verde |
| Mutantes inyectados sobre HEAD | 24 | 20 muertos (3 en `tsc`), 4 supervivientes **esperados** |
| Sondas de rutas de pérdida entre llamada y guardado | 6 | 5 absorbidas, 1 no alcanzable en producción |
| Ataques a la separación de ficheros de ALTA-6 | 5 | 0 cruces de modo |
| Sondas del gate R4 por fase | 6 | 6 correctas |
| Recálculo contra referencia independiente | 4 escenarios | idénticos a la 1ª y 2ª revisión |
| **Hallazgos nuevos** | **3** | 0 BLOQUEANTE / 0 ALTA / **2 MEDIA** / 1 BAJA |

---

## Estado de los cuatro encargos

### ALTA-5 — CERRADO

Reproduje mi escenario a través de `evaluarLote` entero, no solo de `runBatch`:
con el fallo en la 3.ª de 5, **las cinco respuestas llegan a disco**, la rota
queda `sin_respuesta` con motivo `cuerpo ilegible: Unexpected token <`, y el
lote continúa. El `try` propio de `jev-client.ts:257-268` envuelve también
`desdeCrudo`, así que absorbe tres variantes más que probé sin que se las
hubieran pedido:

| Sonda | Resultado |
|---|---|
| `json()` rechaza (el escenario reportado) | 5 guardadas, `ok,ok,sin_respuesta,ok,ok` |
| `json()` lanza **sincrónicamente** | 5 guardadas, igual |
| la respuesta no tiene `.status` ni `.ok` | 5 guardadas, igual |
| el `crudo` es un objeto cuyos getters lanzan al leerlo | 5 guardadas, igual |

Mutante que devuelve el `catch` a propagar: **2 tests rojos**.

### ALTA-6 — CERRADO

`rutaRespuestas(dryRun)` (`run-backtest.ts:85-86`) separa los ficheros al
escribir (`:286-288`) y al retomar (`:360-362`). Lo ataqué con una corrida
«real» ya pagada en disco, marcada actividad por actividad:

| Ataque | Fichero real |
|---|---|
| `--fase evaluar --dry-run` | md5 **idéntico**, 12/12 marcas PAGADA, `modo: real` |
| `--fase evaluar --dry-run --reusar-respuestas` | md5 **idéntico** |
| lo mismo con banderas de más | md5 **idéntico** |
| `--fase evaluar --reusar-respuestas` (real) | fichero del ensayo **intacto**; el real vuelve con las 12 marcas |

**Cero cruces en las dos direcciones.** Y no es que no los haya encontrado: no
los puede haber. `opciones.dryRun` es un único valor que sale de `parseArgs` y
alimenta a la vez el `dryRun` de `runBatch` y `rutaRespuestas`, así que no hay
argv que los haga divergir. Retomar tampoco cruza: `leerRespuestasGuardadas`
recibe el mismo `opciones.dryRun`, de modo que un `--reusar-respuestas` real
que sólo tenga el fichero del ensayo falla con «no hay respuestas guardadas»
en vez de leer el otro. Mutante que devuelve el ensayo al fichero real:
**4 tests rojos**. La ruta nueva cae bajo `progress/jev-backtest-*`,
confirmado.

**Mi juicio sobre el enfoque, que es lo que me pediste.** Ratificarlo fue
correcto, y la elección del Implementer es mejor que lo que yo sugerí.

Leer `modo` antes de sobrescribir es una comprobación: algo que tiene que
ejecutarse, que se puede olvidar, saltar o escribir con la condición al revés.
Es exactamente la forma del gate de R4, que costó dos vueltas y ocho tests
dejar clavado — y que era correcto desde el principio; lo que faltaba era la
red. Las rutas separadas, en cambio, hacen la colisión **irrepresentable**: no
existe invocación que haga que un ensayo apunte al fichero real. Es el mismo
movimiento que BAJA-7 —un tipo en vez de una convención— un piso más abajo, y
la propiedad se lee en una línea en vez de deducirse de una condición.

Además compone: `--reusar-respuestas` hereda la separación gratis, mientras que
una comprobación de `modo` habría habido que volver a pensarla para el camino
de retomar. Y lo único que una comprobación de `modo` habría añadido —avisar de
que una corrida real va a pisar otra corrida real— no era el problema
reportado; sería otra funcionalidad, y con rutas separadas no se dispararía
nunca desde el ensayo. Dos mecanismos para un problema habría sido peor: el que
no se ejercita es el que se pudre.

Efecto colateral: mi **BAJA-11** de la segunda vuelta (el `modo` mal etiquetado
al retomar) queda cerrado gratis. `--dry-run --reusar-respuestas` lee y escribe
el fichero del ensayo, así que `modo: seco` es ahora la etiqueta correcta.

### MEDIA-8 — CERRADO, con las dos direcciones

| Mutante | Resultado |
|---|---|
| se quita la llamada a `validarEtiquetado` | **2 tests rojos** |
| validación que **aborta siempre** | **4 tests rojos** |

El segundo es el que pediste: lo mata el test «con el etiquetado completo sigue
adelante y deja el informe» (`run-backtest.spec.ts:410-415`), que afirma
`resolves.toBe(0)` y que `RUTA_INFORME` está entre lo escrito. Los dos casos
que paran comprueban además que **no se escribe nada**
(`expect(Object.keys(escrituras)).toEqual([])`), que es la afirmación que
importa: parar antes de medir.

`deps.fs` sólo lo inyectan los tests; producción usa `FICHERO_REAL`
(`run-backtest.ts:124-128`). Una observación sin severidad: `leerEjemplos`
(`run-backtest.ts:373-378`) sigue leyendo `sample-responses.json` con
`readFileSync` directo, fuera de `deps.fs`, así que las pruebas «en memoria»
tocan disco para ese fichero. Es una fixture versionada y determinista, así que
está bien; lo anoto sólo para que nadie se sorprenda al leerlo.

### BAJA-10 — CERRADO

| Mutante | Resultado |
|---|---|
| se quita la explicación del `n/d` de Spearman | **1 test rojo** |
| la explicación sale siempre | **1 test rojo** |

Verificado en el flujo: con la serie del director constante el informe imprime
`Correlacion de Spearman: n/d` **y** la explicación de que sobre una serie
constante la correlación no existe.

---

## ¿Queda una cuarta vía de pérdida? Sí, pero no es un `throw`

Es la pregunta que hiciste, así que la contesto en dos niveles.

**Al nivel de la sentencia**, entre la llamada y el guardado queda exactamente
una que puede lanzar sin red debajo: `respuesta.status` y `respuesta.ok`
(`jev-client.ts:251-253`) si `fetchImpl` resuelve `null` o `undefined`. El
`fetch` real nunca hace eso, así que sólo es alcanzable desde una
implementación inyectada rota, es decir desde un error en un arnés de pruebas.
Lo dejo como **BAJA-13** por completitud, no porque importe.

**Al nivel del diseño**, la respuesta es otra y creo que es la que buscabas:
`consultar()` es todo o nada. `run-backtest.ts:343-344` hace
`const respuestas = await io.consultar(); io.guardarRespuestas(respuestas);` —
nada llega a disco hasta que **las 50 llamadas han vuelto**. ALTA-1, ALTA-5 y
ALTA-6 no eran tres bichos: eran tres síntomas de que el lote sólo es durable
cuando está completo. Cada arreglo tapó una vía; la forma tapa la clase entera.
Ver MEDIA-10.

---

## Hallazgos nuevos

### MEDIA

- **MEDIA-9 — `backend/scripts/jev-backtest/run-backtest.ts:73-77` y
  `:301-305`.** Las respuestas ya no se comparten entre modos, pero **el
  informe sí**: `RUTA_INFORME` es el mismo para el ensayo y para la corrida
  real. Verificado: con el informe real en disco, un `--fase evaluar --dry-run`
  lo sustituye por el del ensayo (`- Modo: real contra la API` →
  `- Modo: SECO (respuestas de ejemplo, R10)`, md5 distinto). Es el mismo
  descuido que ALTA-6 un fichero más allá, y el argumento del propio anexo
  —«`--dry-run` es el modo con el que se ejercita el flujo»— vale palabra por
  palabra. Se queda en MEDIA y no sube a ALTA porque, a diferencia de ALTA-6:
  la cabecera dice `Modo: SECO` bien visible; `mergeReport` conserva intacta la
  parte humana, incluida la aprobación de R4 (verificado: §1 sigue ahí); el
  fichero está versionado, así que `git diff` lo enseña; y `--reusar-respuestas`
  lo regenera desde las respuestas reales (verificado: vuelve a
  `- Modo: real contra la API`). Pero es el fichero donde el director firma el
  veredicto, y la solución ya está escrita al lado: `rutaInforme(dryRun)`.

- **MEDIA-10 — `backend/scripts/jev-backtest/run-backtest.ts:343-344` y
  `jev-client.ts:236-243`.** Nada se guarda hasta que el lote entero termina, y
  **no hay ningún timeout**: `grep` de `AbortSignal`, `AbortController`,
  `timeout` y `signal` sobre todo `backend/scripts/` no devuelve nada, y el
  `fetch` de Node no trae uno por defecto. Demostrado: con 2 respuestas ya
  pagadas, una 3.ª llamada que cuelga deja `guardarRespuestas` sin llamar y el
  proceso colgado indefinidamente; el operador sólo puede matarlo, y con él se
  van las 2 pagadas. Lo mismo vale para un OOM, un portátil que se suspende o
  una terminal que se cierra a mitad de las 50 llamadas. No es ALTA porque el
  fallo es **ruidoso** —el proceso se queda visiblemente parado, nadie cree que
  ha terminado bien— y porque hace falta una acción del operador o un servidor
  patológico, no una entrada ordinaria. Pero es la clase de ALTA-1 sin cerrar
  del todo, y el arreglo que la cierra entera no es el timeout: es **persistir
  incremental**, escribir cada respuesta en cuanto llega en vez de las 50 al
  final. Un timeout sólo estrecha una de las rutas.

### BAJA

- **BAJA-13 — `backend/scripts/jev-backtest/jev-client.ts:251-253`.**
  `respuesta.status` / `respuesta.ok` lanzan si `fetchImpl` resuelve `null` o
  `undefined`, y ese `TypeError` sí se lleva el lote. No alcanzable con el
  `fetch` real; sólo desde una implementación inyectada rota.

---

## Cambios de severidad entre los que dejaste abiertos

Esto es lo que pediste saber. Tres cosas se han movido:

- **MEDIA-6 baja a BAJA.** Era «texto multilínea sin escapar en
  `buildLabelingFile` rompe la estructura de bloques». La causa sigue ahí, pero
  la consecuencia ya no es silenciosa: verificado en el flujo real, una línea
  de texto libre que empieza por `## ` dentro de una actividad hace que el
  script **pare con exit 1** y diga «el fichero trae 13 bloques y el lote tiene
  12 actividades / posiciones repetidas: 5», en vez de perder una etiqueta sin
  ruido. Y desde MEDIA-8 el cableado que lo hace ruidoso tiene red propia. Lo
  que quedaba de peligroso en MEDIA-6 era el silencio, y el silencio está
  cerrado.
- **Mi reserva sobre BAJA-7 queda resuelta.** En la segunda revisión avisé de
  que la frontera de tipo de R5 la sostiene `tsc` y no jest, y que sin
  `npx tsc --noEmit` en el circuito esa capa no existía. Tu `5f76aaa` mete
  `pnpm exec tsc --noEmit` en CI, así que ahora existe de verdad. Reverificado:
  el mutante que se salta `recortarCampos` deja los **114 tests en verde** y
  pone `tsc` en rojo — es decir, CI lo caza y jest no.
- **BAJA-11 cerrado**, ver ALTA-6.

Sin cambio, pero vale la pena decirlo: **MEDIA-2 y MEDIA-3 son ya los dos
únicos puntos de decisión del veredicto sin red.** Reverificados sobre HEAD,
los tres mutantes siguen vivos (bueno sin respuesta contado como degradado;
`<` → `<=` en el 70%; `>` → `>=` en el 15%): **114 en verde** los tres. En un
fichero donde todo lo demás está clavado, son los que quedan. BAJA-8 también
sigue vivo en jest; su mutante pone `tsc` en rojo, pero con
`TS2532: Object is possibly 'undefined'`, un artefacto de tipado incidental y
no una caza semántica. BAJA-1 a BAJA-6 y BAJA-12 sin cambios; BAJA-12 es en
realidad un caso particular de MEDIA-10.

---

## Regresiones

**Ninguna.** Las cinco vueltas han tocado `jev-client.ts` y `run-backtest.ts`
repetidamente, así que volví a pasar la implementación de referencia en Python
—la misma de la primera revisión, sin tocarla— sobre los cuatro escenarios:

| Comprobación | 1ª rev. | 2ª rev. | Ahora |
|---|---|---|---|
| Matriz director × Jev | `[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]` | idéntica | **idéntica** |
| Acuerdo exacto / adyacente | 58.3% / 58.3% | 58.3% / 58.3% | **58.3% / 58.3%** |
| Spearman | 0.480 | 0.480 | **0.480** |
| Falsos 100 detectados | 66.7% | 66.7% | **66.7%** |
| Buenos degradados | 44.4% (4 de 9) | 44.4% (4 de 9) | **44.4% (4 de 9)** |
| D11 con 3 `sin_respuesta` | 33.3% y 22.2% (2 de 9) | ídem | **ídem** |
| `falsos100SinRespuesta` | 1 | 1 | **1** |
| Lote entero sin respuesta | NEGATIVO, `n/d` | NEGATIVO, `n/d` | **NEGATIVO, `n/d` + explicación** |
| Reparto por vendedor | — | 3 vendedores, 6/4/2 | **3 vendedores, 6/4/2** |
| Gate R4 por fase | 5 de 5 exit 1 | 5 de 5 exit 1 | **5 de 5 exit 1; sólo `evaluar --dry-run` exit 0** |
| `pnpm test` | 78 | 78 | **78 (D9 intacto)** |

Y los catorce mutantes de todo lo cerrado en las vueltas anteriores siguen
muriendo sobre HEAD: ALTA-1 (orden de guardado, `aDistribucion`), ALTA-2,
ALTA-3 (×2), ALTA-4, MEDIA-1, MEDIA-5 (×2), MEDIA-7 (×2, uno de ellos en
`tsc`), BAJA-7 (×2, los dos en `tsc`) y BAJA-9.

---

## Salida literal de los cuatro comandos (tercera revisión)

```
=== $ cd backend && pnpm test ===

> backend@0.0.1 test /home/claude/sites/Tracker-Sales-OS/backend
> jest


Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        3.843 s
Ran all test suites.
exit=0

=== $ cd backend && pnpm test:scripts ===

> backend@0.0.1 test:scripts /home/claude/sites/Tracker-Sales-OS/backend
> jest --config ./scripts/jest.config.js


Test Suites: 6 passed, 6 total
Tests:       114 passed, 114 total
Snapshots:   0 total
Time:        1.065 s
Ran all test suites.
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===

> backend@0.0.1 lint /home/claude/sites/Tracker-Sales-OS/backend
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix

exit=0
```

`.github/workflows/ci.yml` corre ahora los cuatro equivalentes: `tsc --noEmit`,
eslint sobre `scripts`, `pnpm test` y `pnpm test:scripts`. Con eso los 114
tests y la frontera de tipo de R5 están en CI, que era el hueco que quedaba.

---

## Recomendado antes de T6 (no bloquea)

1. **MEDIA-10** — es el único que me preocuparía de verdad en una corrida
   única: persistir cada respuesta según llega, o como mínimo un `AbortSignal`
   con timeout. Cierra la clase de ALTA-1 en vez de taparle rutas.
2. **MEDIA-9** — `rutaInforme(dryRun)`, cuatro líneas, simétrico con lo que ya
   se hizo para las respuestas.

Y lo que no es del Implementer y sigue pendiente desde la primera revisión: la
credencial de solo lectura de D7 (`progress/explore_jev-backtest.md` §3 la sigue
marcando como «pendiente de recibir») y confirmar la forma real de la respuesta
con la primera llamada de T6.

---

*Tercera revisión sin modificar una sola línea de código. Los 24 mutantes, las
sondas de pérdida y las corridas `--dry-run` se ejecutaron en worktrees git
aislados, ya eliminados; el árbol de trabajo quedó limpio. No se llamó a
`api.typesafe.ai` ni se abrió ninguna conexión a base de datos. T6 no se
ejecutó.*

---
---

# COMPROBACIÓN ACOTADA — rango `335f419..HEAD` (`93a614b`)

Encargo limitado a cuatro puntos: MEDIA-10, la lectura del `.jsonl`, la
retirada de `guardarRespuestas` y MEDIA-9. No he ido a buscar nada fuera.

## Veredicto

**Retiro el PASSED de la tercera revisión: FAILED.**

Toda la mecánica de los cuatro puntos es correcta y la comprobé una por una: la
entrega según llega hace lo que dice, el timeout está, la lectura del `.jsonl`
es robusta, quitar `guardarRespuestas` no reabre ALTA-1, y el ensayo ya no
puede tocar el informe versionado. Ocho de nueve mutantes mueren.

Lo que falla no es el código: es **`progress/explore_jev-backtest.md` §3b**, el
procedimiento que acabas de escribir para el operador de T6. Dice, con estas
palabras, «**No hay que repetir las llamadas ya hechas.** Repetir `--fase
evaluar` añade líneas y, de cada actividad, gana la última», y cierra con «cada
repetición de una llamada vuelve a sacar el texto de esa actividad fuera de la
empresa. El coste de repetir no son los centavos de la API, es la exposición».

Repetir `--fase evaluar` **vuelve a llamar por las 50**. No hay ninguna lógica
que salte las ya contestadas. El párrafo nombra la exposición como el coste a
evitar y prescribe el comando que la duplica. Es ALTA-7, y se cierra
corrigiendo dos frases o añadiendo el salto en `runBatch`.

Mantengo la vara de las tres revisiones anteriores: un ALTA es un FAILED. Que
el mecanismo sea prosa y no código no cambia lo que le pasa al cliente cuyo
texto sale dos veces.

## Punto 1 — MEDIA-10: durabilidad según llega

La mecánica está bien y es exactamente lo que pedí:

| Sonda | Resultado |
|---|---|
| ¿entrega antes de pedir la siguiente? | sí: entregadas `[0,1,2,…,9]` antes de las llamadas 1…10 — n-1 antes de la n-ésima |
| escribir falla en la 6.ª de 10 | `runBatch` para en la 6.ª (no gasta las 4 restantes), 5 líneas en disco, **exactamente 1 llamada pagada sin guardar** |
| `AbortSignal` por petición | presente, no abortado de inicio |
| línea truncada a media escritura | `1 linea(s) ilegibles …, saltadas`; el resto se recupera |
| artefactos nuevos versionados | no: `.gitignore:43` cubre `-respuestas.jsonl`, `-respuestas-seco.jsonl` e `-informe-seco.md` |

La llamada perdida cuando falla la escritura es una sola y es el mínimo posible
sin dos fases; y que `entregar` escriba **antes** de meter en el array hace que
no se sigan gastando llamadas que no se pueden guardar. Correcto.

### ALTA-7 — el procedimiento de reanudación dice lo contrario de lo que hace

**`progress/explore_jev-backtest.md` §3b** (y **§31** del anexo, que repite la
misma frase). `runBatch` (`jev-client.ts:310-330`) recorre `lote.entries()`
entero, sin filtrar por lo ya contestado. Reproducido con un lote de 10
interrumpido tras la 4.ª:

```
1a corrida: 10 llamadas hechas, 10 lineas en disco, de esas con nivel: 4
ahora el operador repite --fase evaluar, como dice el runbook:
2a corrida: 10 llamadas -> ¿solo las que faltaban (6)? NO, las 10
textos de cliente reexportados innecesariamente: 4
```

Sobre el lote real son hasta 50 textos comerciales que vuelven a cruzar la
frontera de confianza creyendo que no. Es el mismo coste que hizo ALTA a
ALTA-1, ALTA-5 y ALTA-6, y dispara justo cuando se consulta el documento: en
una corrida interrumpida, que es el único caso para el que §3b existe.

Dos arreglos posibles, cualquiera vale:
- **documental**: decir que repetir `--fase evaluar` repite el lote entero, y
  que lo barato es `--reusar-respuestas` cuando solo falta el informe;
- **de código**: que `faseEvaluar` lea el `.jsonl` previo y pase a `runBatch`
  solo las actividades sin respuesta útil. Es lo que los dos documentos ya
  prometen, así que probablemente sea lo que se quería.

## Punto 2 — la lectura del `.jsonl`

**No puede producir un informe con menos actividades sin que se note.** `filas`
se construye recorriendo `lote.orden` entero (`run-backtest.ts:350-357`), así
que una actividad ausente del fichero no desaparece: entra con `jev: null`.
Verificado con un fichero cortado a 5 de 12:

- cabecera: `Actividades del lote: 12` y **`Sin respuesta de Jev (R9): 7`**;
- las 7 salen fila a fila en el detalle por actividad con `estado:
  sin_respuesta`;
- el recuento cuadra: 12 − 5 = 7.

El veredicto se mantiene NEGATIVO. Una línea ilegible se salta con aviso por
consola y la actividad cuenta como sin respuesta, salvo que otra línea
posterior la cubra — comprobado: con el fichero escrito dos veces y una línea
de la primera tanda truncada, el informe publica `Sin respuesta: 0`, porque la
línea de la segunda tanda gana. Mutantes: «una línea ilegible tumba la lectura»
y «gana la primera» mueren con 1 test cada uno.

### MEDIA-11 — «gana la última» puede degradar una respuesta buena

`run-backtest.ts:392-401`. La regla está bien tipada y probada, pero el anexo
dice que «una segunda pasada corrige a la primera **sin borrar nada**», y eso
solo es cierto del fichero, no de lo que el script lee de vuelta. Reproducido:

```
1a pasada: nivel 4
2a pasada (429): estado sin_respuesta, nivel null
-> "gana la ultima" deja la actividad en sin_respuesta (la buena de la 1a se descarta)
```

Como repetir `--fase evaluar` repite el lote entero (ALTA-7), cualquier fallo
transitorio de la segunda pasada **rebaja** una actividad que ya estaba
contestada. La línea buena sigue en el fichero, así que se recupera a mano,
pero el script nunca la elegirá. Preferir la respuesta con nivel sobre la
`sin_respuesta` —y la última solo entre iguales— lo cierra sin perder el caso
de uso que motivó la regla. No puede volver positivo un veredicto: una
actividad degradada a `sin_respuesta` resta en la condición A.

### BAJA-14 — el informe no distingue «nunca llamada» de «llamada y falló»

`run-backtest.ts:478-487`. Las dos se imprimen igual: `estado: sin_respuesta`
con `—` en confianza y distribución. El campo `motivo`, que diría `HTTP 500` o
`cuerpo ilegible: …` frente a nada, existe en `JevResult` y **no se imprime
nunca**. Añadido a eso, `--reusar-respuestas` no dice por consola cuántas
respuestas ha cargado —ese `console.log` se fue con `guardarRespuestas`—, así
que el único sitio donde consta es el informe. La acción que manda D11 es la
misma en los dos casos (repetir la corrida), así que se queda en BAJA; una
columna `motivo` o un `leidas: 5 de 12` lo cierra.

### BAJA-15 — la cifra de la condición B se ve mejor de lo que es en un informe parcial

Con el lote completo el informe publica `Buenos degradados: 44.4% (4 de 9)`;
con 5 de 12 respuestas publica `11.1% (1 de 9)` — de fallar el umbral del 15%
a cumplirlo. Es la asimetría de D11 funcionando como está escrita (un bueno sin
respuesta no suma como degradado, pero sigue en el denominador), y **no puede
dar un positivo**, porque la condición A se hunde con los mismos datos que
faltan. Pero el `(1 de 9)` se lee como «1 de 9 buenos degradados» cuando es «1
de el único bueno del que tenemos respuesta». Un `(1 de 9, 8 sin respuesta)`
lo diría.

## Punto 3 — quitar `guardarRespuestas` no reabre ALTA-1

Confirmado, y la garantía queda más fuerte, no más débil: antes era «a disco al
terminar el lote», ahora es «a disco por respuesta». La costura que verifiqué
en la segunda vuelta sigue en pie por otra vía.

```
evaluarLote LANZO: p.toFixed is not a function
respuestas en disco pese al fallo del informe: 10 de 10  -> ALTA-1 SIGUE CERRADO
```

De acuerdo con su razonamiento: mantener el paso habría afirmado la garantía
donde ya no vive. Lo único que se fue con él es el `console.log` del recuento,
que es lo que recojo en BAJA-14.

## Punto 4 — MEDIA-9: el ensayo no toca el informe firmado

Cerrado. Tras `--fase evaluar --dry-run` sobre un árbol limpio:
`git status progress/explore_jev-backtest.md` → **0 cambios**; lo escrito es
`progress/jev-backtest-informe-seco.md`, que además está ignorado. Mutante que
devuelve el ensayo al informe versionado: **2 tests rojos**. `rutaInforme` es
simétrico con `rutaRespuestas` y se alimenta del mismo `opciones.dryRun`, así
que no hay argv que los haga divergir, igual que comprobé para las respuestas
en la tercera revisión.

## Mutantes

9 inyectados, **8 muertos**:

| Mutante | Resultado |
|---|---|
| entregar al final en vez de según llegan | 6 rojos |
| se quita el `AbortSignal` | 4 rojos |
| `faseEvaluar` no engancha `onRespuesta` | 2 rojos |
| el ensayo vuelve al informe versionado | 2 rojos |
| el ensayo vuelve al fichero real de respuestas | 4 rojos |
| una línea ilegible tumba la lectura entera | 1 rojo |
| gana la primera en vez de la última | 1 rojo |
| el `catch` del cuerpo ilegible vuelve a propagar (ALTA-5) | 2 rojos |
| **invertir `push` y `onRespuesta`** | **124 en verde** |

El superviviente no es un defecto: `jev-client.ts:305-307` comenta que entregar
antes del `push` evita seguir gastando llamadas, pero invertir las dos líneas
no cambia nada observable —la excepción sube igual y el array en memoria se
descarta igual—, así que ningún test puede fijarlo. El orden es el correcto; lo
que sobra es la parte del comentario que lo presenta como la garantía. Si algún
día alguien captura esa excepción y devuelve el array parcial, el orden pasará
a importar y no habrá red. Observación, no hallazgo.

## Los cuatro comandos

```
=== $ cd backend && pnpm test ===
Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
exit=0

=== $ cd backend && pnpm test:scripts ===
Test Suites: 6 passed, 6 total
Tests:       124 passed, 124 total
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix
exit=0
```

## Para volver a PASSED

Solo **ALTA-7**: que §3b de `progress/explore_jev-backtest.md` y §31 del anexo
digan lo que el comando hace, o que `runBatch` salte las actividades ya
contestadas. Recomendados sin bloquear: MEDIA-11 (preferir la respuesta con
nivel sobre la `sin_respuesta`) y BAJA-14 (`motivo` en el detalle, o el
recuento de líneas leídas por consola).

---

*Comprobación acotada a los cuatro puntos, sin modificar código ni hacer
commits. Mutantes y corridas `--dry-run` en un worktree aislado, ya eliminado;
árbol de trabajo limpio. No se llamó a `api.typesafe.ai` ni se abrió conexión a
ninguna base de datos. T6 no se ejecutó.*

---
---

# COMPROBACIÓN ACOTADA FINAL — rango `f1b33ed..HEAD` (`64417d4`)

Cuatro puntos: ALTA-7, MEDIA-11, BAJA-14/15 y regresión. Más la relectura de
§3b que se me pidió expresamente. Nada más.

## Veredicto

**PASSED**

Los cuatro hallazgos están cerrados y lo comprobé cada uno por separado, no por
el anexo. **No hay regresión**: las métricas vuelven a salir idénticas a mi
implementación de referencia, la misma desde la primera revisión. 10 de 11
mutantes mueren.

Quedan cuatro hallazgos nuevos, **todos BAJA**, y ninguno provoca hoy una
reexportación ni toca el veredicto. Tres son de prosa y uno es un acoplamiento
latente. Los recojo porque el fichero que firma el director es el que más vale
la pena mirar dos veces, no porque bloqueen.

## Punto 1 — ALTA-7: reanudar consulta solo lo que falta

Pasé `necesitaLlamada` por una tabla de verdad de 22 estados, incluidos los
seis motivos que `askJev` puede producir de verdad, las fronteras del rango
4xx y los casos de duda. **Coincide con §3b en los 22.**

Respuesta a tus dos preguntas:

**¿Algún estado cae en «sí» y no debería, provocando una reexportación
evitable?** No, entre los producibles. Todos los «sí» son estados en los que el
intercambio no dejó **nada**: ni nivel ni cuerpo. Volver a preguntar es la
única vía a un dato. El caso `HTTP 429` de la tabla es «sí» pero `askJev` nunca
emite ese motivo —429 está en `REINTENTABLES` y hace `continue`—, así que solo
se alcanza desde un fichero heredado o editado, donde «sí» es lo correcto de
todas formas.

**¿Alguno cae en «no» y deja una actividad sin dato para siempre sin que el
informe lo diga?** Hay dos que se quedan sin dato, y **los dos se dicen**:
- `HTTP 4xx` que no sea 429: cuenta en `sinRespuesta`, dispara el aviso de
  parcial y sale en el detalle con `motivo: HTTP 403`.
- `sin_respuesta` con `crudo`: sale con `motivo: respuesta sin la forma
  esperada`, y es recuperable con `--reusar-respuestas` tras arreglar el
  lector, que es justo el camino de ALTA-1.

Verificado además de extremo a extremo:

| Escenario | Resultado |
|---|---|
| repetir con las 12 respondidas | `12 actividades ya resueltas … no se vuelven a consultar`, **0 líneas nuevas** |
| fichero mixto: 2 reintentables, 2 × `HTTP 403`, 1 con crudo, 7 buenas | se reconsultan **exactamente las 2**; `ids con 2 lineas: ACT-0, ACT-1` |
| fichero con 3 de 12 y `--reusar-respuestas` | no escribe nada; la corrida siguiente consulta las 9 que faltaban |

Y un detalle que importa y está bien resuelto: el marcador `nuncaLlamada` que
`obtenerRespuestas` inventa para las actividades sin línea **no se persiste**
(3 líneas antes, 3 después). Así no contamina el fichero ni puede confundir a
la reanudación siguiente.

## Punto 2 — MEDIA-11, los dos lados

**Lado 1**, no se vuelve a llamar a una ya respondida: verificado, 15 líneas
antes y 15 después.

**Lado 2**, el que pediste con más interés —fichero heredado o editado a mano
que ya trae las dos líneas—: construí uno con los tres órdenes posibles y el
lector hace lo correcto en los tres.

| Fichero | Lo que publica el informe |
|---|---|
| `ACT-0`: buena(4) **y luego** mala | nivel **4** — la buena sobrevive a la mala posterior |
| `ACT-1`: mala **y luego** buena(3) | nivel **3** — la buena posterior corrige a la mala |
| `ACT-2`: buena(1) **y luego** buena(2) | nivel **2** — entre iguales sigue ganando la última |

Es exactamente la regla que hacía falta: «gana la última, salvo que degrade una
buena». Mutante que la quita: 1 test rojo.

## Punto 3 — BAJA-14 y BAJA-15

Sobre un fichero con los tres modos de falta a la vez, el informe los separa:

```
| 9  | 60 | 3 | — | … | sin_respuesta | HTTP 403                                |
| 10 | 60 | 4 | — | … | sin_respuesta | respuesta sin la forma esperada          |
| 11 | 60 | 3 | — | … | sin_respuesta | sin llamada: la actividad no se consulto |
```

Y la cabecera:

```
> **INFORME PARCIAL.** Solo hay respuesta de Jev para
> **8 de 12** actividades del lote, y 2 nunca se llegaron a consultar.
```

- **No se puede omitir cuando falta algo**: el mutante que no lo imprime mata
  2 tests.
- **No aparece cuando no falta nada**: verificado con el lote completo
  (`Sin respuesta de Jev (R9): 0`, cero apariciones de `INFORME PARCIAL`), y el
  mutante que lo saca siempre mata 1 test.
- El recuento se actualiza solo: tras completar el lote pasó a
  `10 de 12` y dejó de mencionar las «nunca consultadas», porque ya no hay.

## Punto 4 — Regresión

**Ninguna.** Séptima vuelta y la implementación de referencia en Python —la
misma de la primera revisión, sin tocar— sigue dando lo mismo:

| Comprobación | Referencia | Informe |
|---|---|---|
| Matriz director × Jev | `[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]` | idéntica |
| Acuerdo exacto / adyacente | 58.3% / 58.3% | 58.3% / 58.3% |
| Spearman | 0.480 | 0.480 |
| Falsos 100 detectados | 66.7% | 66.7% |
| Buenos degradados | 44.4% (4 de 9) | 44.4% (4 de 9) |
| D11 con 3 `sin_respuesta` | 33.3% y 22.2% (2 de 9), `falsos100SinRespuesta: 1` | ídem |

## §3b: ¿la prosa coincide ahora con el código?

**La tabla sí, fila por fila, en los 22 estados que probé.** La nota de
corrección registrada me parece la forma correcta de arreglarlo.

Lo que no coincide es **la última frase**: «Por eso la tabla de arriba es
conservadora: ante la duda, no se vuelve a preguntar». El caso por defecto de
`necesitaLlamada` (`jev-client.ts:269`) es
`return !esRechazoDefinitivo(previa.motivo)`, así que un motivo que no encaje en
`^HTTP 4xx$` **sí se vuelve a preguntar**. Comprobado: motivo desconocido,
motivo vacío y motivo ausente devuelven los tres «sí».

Matiz que salva el fondo del argumento, y por eso es BAJA y no más: la
comprobación de `crudo !== undefined` va **por encima** del caso por defecto,
de modo que **ningún estado en el que el servidor llegó a contestar se
reexporta nunca**, diga lo que diga su motivo. Lo que puede volver a salir son
solo intercambios que no produjeron nada. Con los motivos de hoy la
clasificación es correcta al 100%; la frase describe una garantía sobre el caso
desconocido que el código no tiene.

## Hallazgos nuevos — los cuatro BAJA

- **BAJA-16 — `progress/explore_jev-backtest.md` §3b, última frase, y
  `jev-client.ts:269`.** «Ante la duda, no se vuelve a preguntar» es al revés
  de lo que hace el caso por defecto. Ningún estado producible hoy lo alcanza,
  así que no hay reexportación real; pero es la misma forma de error que
  ALTA-7, en miniatura, y por eso lo digo. Se cierra invirtiendo el defecto
  (una lista explícita de motivos que sí se reconsultan) o quitando la frase.
- **BAJA-17 — `jev-client.ts:244-250` (`esRechazoDefinitivo`).** La regla es
  «4xx salvo 429», así que **`408 Request Timeout` y `425 Too Early`** —que por
  convención sí son transitorios— quedan como rechazos definitivos y no se
  reconsultan nunca. El sesgo va hacia no exponer, que es el que tú quieres,
  pero cuesta el dato de esa actividad para siempre. No es silencioso: sale en
  el detalle con su motivo y dispara el aviso de parcial.
- **BAJA-18 — `run-backtest.ts:481-505` (`avisoParcial`).** El aviso dice
  «completa el lote con `--fase evaluar`, que solo consulta lo que falta», pero
  para las filas atascadas en un 4xx definitivo o en un cuerpo guardado que no
  sabemos leer, ese comando no cambia nada. Verificado: el recuento subió de
  `8 de 12` a `10 de 12` y ahí se quedó. El bucle se agota solo y la columna
  `motivo` explica cada caso una tabla más abajo, así que es leve; una frase
  más («las que siguen tras repetir están en la columna motivo») lo cerraría.
- **BAJA-19 — `jev-client.ts:165` (`MOTIVO_NUNCA_LLAMADA`).** El **valor** de
  la constante es carga útil para la clasificación por regex de
  `necesitaLlamada`, y ningún test lo fija: ponerlo a `'HTTP 403'` deja los
  **138 en verde** y convertiría a toda actividad nunca consultada en un
  rechazo definitivo. Hoy no tiene consecuencia porque el marcador **no se
  persiste** (verificado), así que nunca vuelve a pasar por `necesitaLlamada`.
  Queda como acoplamiento latente: si algún día se persistiera —que es una cosa
  razonable de querer—, la colisión de valores dejaría esas actividades sin
  consultar para siempre.

## Mutantes

11 inyectados, **10 muertos**:

| Mutante | Resultado |
|---|---|
| consultar el lote entero, no solo lo pendiente | 3 rojos |
| `necesitaLlamada` siempre `true` | 6 rojos |
| `necesitaLlamada` siempre `false` | 6 rojos |
| una respuesta `ok` se vuelve a consultar | 1 rojo |
| un 4xx definitivo se vuelve a consultar | 1 rojo |
| el `crudo` guardado deja de proteger | 1 rojo |
| gana la última aunque degrade una buena (MEDIA-11) | 1 rojo |
| el aviso de parcial no se imprime | 2 rojos |
| el aviso de parcial sale siempre | 1 rojo |
| la columna `motivo` se queda en guion | 1 rojo |
| **`MOTIVO_NUNCA_LLAMADA` cambia de valor** | **138 en verde** → BAJA-19 |

## Los cuatro comandos

```
=== $ cd backend && pnpm test ===
Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
exit=0

=== $ cd backend && pnpm test:scripts ===
Test Suites: 6 passed, 6 total
Tests:       138 passed, 138 total
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix
exit=0
```

---

*Comprobación acotada a los cuatro puntos más la relectura de §3b, sin
modificar código ni hacer commits. Tabla de verdad, mutantes y corridas
`--dry-run` en un worktree aislado, ya eliminado; árbol de trabajo limpio. No se
llamó a `api.typesafe.ai` ni se abrió conexión a ninguna base de datos. T6 no se
ejecutó.*

---
---

# COMPROBACIÓN ACOTADA — D12, muestreo dentro de la franja (`ff38c1f..HEAD`, `37c9e94`)

Vuelta nueva, disparada por un defecto que destapó la primera extracción real,
no una revisión. Cuatro puntos y nada más.

**Restricción respetada**: no he leído, escrito ni ejecutado nada contra
`progress/jev-backtest-lote.json` ni `progress/jev-backtest-etiquetado.md`.
Guardé su md5 antes de empezar y lo verifiqué al terminar: los dos `OK`, con el
mtime de las 18:56:26 intacto. Todo lo que ejercité fue en memoria o en un
worktree aislado con su propio `progress/`.

## Veredicto

**PASSED**

El arreglo es correcto y, lo que importa más, es **estadísticamente correcto**:
sobre 400 semillas la fracción del vendedor mayoritario en la franja alta da
una media de 46.6% contra una población del 47.0%, con una desviación típica de
9.7 puntos frente a los 10.0 teóricos de `sqrt(p(1−p)/25)`. Eso es un muestreo
aleatorio simple de manual, ni sesgado ni sobrecorregido. **No hay regresión.**

Tres hallazgos nuevos, todos **MEDIA** y todos de cobertura o de informe:
ninguno es un defecto del código de hoy y ninguno puede falsear el veredicto.
El que recomiendo atender antes de regenerar el lote es MEDIA-12, porque es el
control que hace comprobable justo lo que esta vuelta acaba de arreglar.

## Punto 1 — El arreglo

**Ninguna ruta recorta sin barajar.** Hay un solo `splice` en todo el módulo
(`stratify.ts:105`), dentro de `take`, y los dos únicos sitios que cortan —la
cuota de la franja y el relleno desde la superior— pasan por él. El bucle que
baraja las tres pools corre antes del bucle que recorta. Verificado también por
comportamiento: ni la franja alta del lote son las 25 primeras del pool, ni el
relleno son las primeras del pool restante.

**«Misma semilla, mismo lote» se sostiene:**

| Comprobación | Resultado |
|---|---|
| semilla 77 dos veces | lotes idénticos |
| semilla 77 vs 1234 | distintos |
| semilla 77 vs 78 | distintos |
| sin semilla vs `DEFAULT_SEED` | idénticos |

Mutantes, todos muertos: no barajar (5 rojos), barajar con una semilla fija en
vez de la de la corrida (2), barajar **después** de recortar (5), barajar solo
la franja alta (1), barajar solo media y baja (2).

## Punto 2 — Que no sobrecorrige, y el residuo

**No hay cuota por ningún lado.** `grep` limpio, y la prueba de comportamiento
que importa: sobre una población donde un vendedor es el **90%** de los
`quality = 100`, el lote le da el **92%**. Refleja la concentración en vez de
recortarla, que es exactamente lo que D12 decidió por escrito.

**Insesgadez, medida sobre 400 semillas** (población: el vendedor A es 94 de
200 `quality = 100`, el 47.0%, y son además las más recientes — el patrón que
provocó el fallo):

| Cifra | Valor |
|---|---|
| media de la fracción de A en la franja alta | **46.6%** (población 47.0%) |
| desviación típica | 9.7 puntos |
| teórico `sqrt(p(1−p)/25)` | 10.0 puntos |
| p5 / p95 | 32% / 64% |
| mín / máx | 20% / 80% |
| comportamiento de ayer, sin barajar | **100%** |

La media cae a 0.4 puntos de la población y la dispersión coincide con la
teórica: el estimador es insesgado y el muestreo es honesto.

**El residuo que sí queda no es sesgo, es varianza.** Con n=25 una sola
extracción se mueve entre el 32% y el 64% con un 90% de probabilidad, y **1 de
las 400 semillas reprodujo el 80% de ayer por puro azar**. El arreglo convierte
un sesgo sistemático (100%, siempre) en ruido centrado (47% ± 10). Eso es lo
correcto y no hay nada mejor que hacer con n=25 sin meter una cuota, que D12
descarta con razón. Pero significa que **una extracción concreta puede seguir
saliendo poco representativa**, y que el control tiene que ser mirar el número,
no confiar en el método. De ahí MEDIA-12.

### MEDIA-12 — el informe publica la concentración del lote, pero no la de la población

`run-backtest.ts:365-384` (`seccionVendedores`) llama a `sellerSpread(lote.orden)`
y publica «Fracción del que más aporta: 64.0%». El lector no tiene con qué
compararlo: **la concentración de la población nunca se calcula**. `LoteGuardado`
guarda `candidatas` como un número suelto, sin reparto por vendedor.

D12 detectó el problema con la comparación «Población 46.9% vs Lote 80%», y esa
comparación **no se puede hacer desde el informe**. Un 64% —que está dentro del
p95 de un muestreo perfecto sobre una población del 47%— se lee igual que un
64% sobre una población del 20%, que sería un lote inservible. Tampoco hay
umbral ni instrucción en ningún sitio: ni el informe ni §3b dicen qué
concentración es demasiada ni que la respuesta sea volver a extraer con otra
semilla.

Es barato: las candidatas están en memoria en `faseExtraer` y `sellerSpread` ya
existe; publicar el mismo par de cifras sobre la población es anónimo
(recuentos) y cabe en `LoteGuardado`. Es el control del que depende todo lo que
esta vuelta acaba de arreglar, y hoy está a medias.

## Punto 3 — El mutante del cableado

**Muere de verdad** (1 test rojo) y el test corre **sin base de datos y sin
disco**: entra por `deps.leerCandidatos` y `deps.fs` en memoria, así que respeta
también la restricción nueva de no tocar `progress/`. Comprueba lo correcto:
que el lote guardado es el de `stratify(poblacion, 1234)` **y no** el de
`DEFAULT_SEED`.

### MEDIA-13 — el gemelo del mutante recién cerrado sigue vivo

`run-backtest.ts:259`. Cambiar `shuffleWithSeed(batch, opciones.semilla)` por
`shuffleWithSeed(batch, 77)` deja los **145 tests en verde**. Lo ejercité de
extremo a extremo:

```
semilla registrada en el lote : 1234
el orden guardado reproduce shuffleWithSeed(..., 1234): false
mismo conjunto de actividades (solo cambia el orden)  : true
```

Es decir: el lote diría «semilla 1234» y el fichero del director saldría
ordenado con 77. R6 exige que el orden esté aleatorizado «con semilla fija y
**registrada**», y la registrada dejaría de reproducirlo.

El hueco es fino y entiendo por qué se coló: el test nuevo hace `.sort()` sobre
los ids antes de comparar —correcto, porque ahí lo que se prueba es la
**pertenencia** al lote— y por eso no puede ver el orden. No hay ningún test en
la suite que compare el `orden` guardado contra la semilla de la corrida. Las
dos líneas consecutivas de `faseExtraer` consumen la misma semilla; una acaba
de recibir su red y la otra sigue sin ella.

### MEDIA-14 — la decisión de «sin cuota» no tiene test

Inyecté una cuota de máximo 8 actividades por vendedor dentro de `take`:
**145 en verde**. D12 descarta el tope por vendedor de forma explícita y
razonada, y es la decisión más fácil de que alguien revierta «ayudando» — sobre
todo ahora que el informe le pone la concentración delante. Se fija en una
línea: una población donde un vendedor es el 90% tiene que producir un lote
donde lo siga siendo. Es la misma prueba que yo usé para confirmar que hoy no
hay cuota.

## Punto 4 — La dirección de la dependencia: mi juicio

**Coincido contigo: déjalo como está.** No he encontrado nada que lo haga más
que estético, y sí he encontrado lo único que podría haberlo hecho, así que lo
digo con la medición delante en vez de por impresión.

Lo comprobado:

- **No hay ciclo.** El grafo de los seis módulos es un DAG limpio:
  `types` ← `labeling` ← `stratify`, y `run-backtest` por encima de todos.
- **`labeling.ts` no tiene efectos a nivel de módulo**, solo declaraciones, así
  que el import no puede cambiar el orden de carga ni arrastrar nada.
- **Lo que sí podía ser sustantivo, y no lo es**: ahora la misma semilla baraja
  las pools (selección) y el lote (orden que ve el director). Si eso dejara
  rastro de la franja en la posición del fichero, R6 se rompería. Medido sobre
  300 semillas, la correlación entre posición y franja da una media de
  **0.0137** y ninguna semilla pasa de |r| = 0.5. No filtra nada.
- La alternativa que descartaste —dos generadores con la misma semilla y
  distinto comportamiento— habría sido bastante peor, y estoy de acuerdo en que
  cinco ficheros movidos por estética no se pagan solos.

Un matiz que vale una línea, no una tarea: `stratify(activities)` toma ahora su
semilla por defecto de `DEFAULT_SEED`, **importado del módulo del etiquetado**.
Quien lea la firma de `stratify` tiene que irse a `labeling.ts` para saber que
el muestreo por defecto es 77, y quien algún día cambie `DEFAULT_SEED` pensando
en el orden del etiquetado cambiará también qué actividades se muestrean. Es
rastreable —la semilla se registra en el lote y en el informe—, así que es coste
de lectura y no de corrección. Si algún día se mueve la utilidad a un módulo
neutro, la ganancia gratis es llevarse `DEFAULT_SEED` con ella.

## Regresión

**Ninguna.** Novena vuelta sobre estos ficheros y la implementación de
referencia en Python —la misma desde la primera revisión, sin tocarla— sigue
dando lo mismo:

| Comprobación | Referencia | Informe |
|---|---|---|
| Matriz director × Jev | `[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]` | idéntica |
| Acuerdo exacto / adyacente | 58.3% / 58.3% | 58.3% / 58.3% |
| Spearman | 0.480 | 0.480 |
| Falsos 100 detectados | 66.7% | 66.7% |
| Buenos degradados | 44.4% (4 de 9) | 44.4% (4 de 9) |

Y los mutantes de lo ya cerrado siguen muriendo tras tocar `stratify`: R3 sin
excluir vacías (1 rojo), `classify` con la frontera corrida (3), relleno en
cascada (2), `seller_id` fuera de `BATCH_QUERY` (1), ALTA-7 consultando el lote
entero (3).

## Mutantes

8 inyectados sobre D12, **6 muertos**:

| Mutante | Resultado |
|---|---|
| no barajar (el comportamiento de ayer) | 5 rojos |
| barajar después de recortar | 5 rojos |
| barajar con una semilla fija | 2 rojos |
| barajar solo media y baja | 2 rojos |
| barajar solo la franja alta | 1 rojo |
| `faseExtraer` no pasa la semilla a `stratify` | 1 rojo |
| **se cuela una cuota por vendedor** | **145 en verde** → MEDIA-14 |
| **`faseExtraer` usa otra semilla para el etiquetado** | **145 en verde** → MEDIA-13 |

## Los cuatro comandos

```
=== $ cd backend && pnpm test ===
Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
exit=0

=== $ cd backend && pnpm test:scripts ===
Test Suites: 6 passed, 6 total
Tests:       145 passed, 145 total
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix
exit=0
```

## Recomendado antes de regenerar el lote

1. **MEDIA-12** — publicar también la concentración de la población, para que
   la comparación que detectó D12 se pueda hacer desde el informe. Es el único
   que pediría antes de darle el lote al director.
2. MEDIA-13 y MEDIA-14 cuando toque: dos tests, ningún cambio de producción.

---

*Comprobación acotada a los cuatro puntos, sin modificar código ni hacer
commits. Mutantes, Monte Carlo sobre 400 semillas y pruebas de flujo en un
worktree aislado, ya eliminado. **Los dos artefactos de la extracción real no se
leyeron ni se tocaron**: md5 verificado antes y después, mtime 18:56:26
intacto. No se llamó a `api.typesafe.ai` ni se abrió conexión a ninguna base de
datos. T6 no se ejecutó.*

---
---

# COMPROBACIÓN ACOTADA — MEDIA-12, 13 y 14 (`37c9e94..HEAD`, `11747c2`)

Última antes de regenerar el lote real. El peso está en MEDIA-12: es el
instrumento con el que un humano decide si el lote sirve, y no hay red detrás.

**Restricción respetada**: md5 de `progress/jev-backtest-lote.json` y
`progress/jev-backtest-etiquetado.md` tomado antes y verificado después, los dos
`OK`, mtime 18:56:26 intacto. No los leí ni los usé. El caso de compatibilidad
lo reconstruí con un lote equivalente en memoria.

## Veredicto

**PASSED**

Los tres cierres son correctos y las cuatro filas comparan lo que dicen
comparar: lo verifiqué con fixtures adversarias, no por lectura. **No hay
regresión.** Sin fuga: cero identificadores en el informe versionado.

Tres hallazgos nuevos, todos **MEDIA**, todos sobre el mismo objeto: la cifra
titular. Ninguno toca el veredicto del backtest ni expone datos. Pero como el
encargo dice que este número va a decidir si se gasta la hora del director,
los detallo con las mediciones delante.

**Respuesta corta a «¿sirve de verdad como control?»**: para el fallo que lo
motivó, sí, y de forma contundente. Como instrumento general, a medias — las
filas absolutas dicen la verdad en los tres escenarios que probé; la
**diferencia**, que es lo que el texto señala como «la fila que decide», es la
parte que engaña.

## Punto 1 — Las cuatro filas comparan lo que dicen

Las dos propiedades que pediste comprobar **se cumplen**, y las medí con una
población construida para romperlas.

**«Candidatas elegibles» excluye de verdad lo de R3.** Metí 60 filas con los
cuatro campos vacíos, todas del mismo vendedor ficticio:

| | Resultado |
|---|---|
| candidatas crudas / elegibles | 420 / 360 (60 descartadas por R3) |
| línea base de la franja alta **si usara las crudas** | 36.2% — sería el vendedor de las vacías, falsa |
| línea base con **elegibles** (lo que hace el código) | **47.0%** — el vendedor real, correcta |

**La base de la franja alta son los `quality = 100`, no todas las candidatas.**
Sobre la misma población: todas las elegibles dan 26.1% y las de `quality = 100`
dan 47.0%. Con una franja alta al 36%, comparar contra «todas» daría **+9.9
puntos** donde la verdad es **−11.0**: no solo cambia la magnitud, **invierte el
signo**. El código compara contra `base.alta`. ✓

**El escenario de ayer, exacto** (candidatas al 46.9%, franja alta del lote al
80%) — reconstruido y renderizado:

```
| Candidatas con quality = 100 | 8 | 46.9% (300 de 640) |
| **Franja alta del lote**     | 6 |   80.0% (20 de 25) |

- Diferencia en la franja alta, lote menos candidatas: **33.1 puntos**
```

Salta a la vista. Para el fallo que motivó todo esto, el instrumento funciona.

## Punto 2 — ¿Puede mentir la cifra? Sí, en dos direcciones

**Sin umbral ni semáforo.** Confirmado: en `seccionVendedores` no hay una sola
comparación, ni formato condicional, ni etiqueta de criterio. La única
aparición de la palabra «umbral» es la frase que dice que **no** lo hay. ✓

### MEDIA-15 — un lote sano parece concentrado, de forma sistemática

La diferencia resta dos **máximos sobre vendedores**, y `sellerSpread` no
guarda identidad: el «que más aporta» de las candidatas y el del lote **pueden
ser personas distintas**. Además el máximo de una muestra es un estimador
sesgado al alza, porque basta que a un vendedor le toque la suerte para que se
convierta en el máximo. Medido sobre 400 semillas:

| Población | Diferencia media | p5 | p95 | Diferencias negativas |
|---|---:|---:|---:|---:|
| un dominante claro (47%, resto ~5%) | −0.4 pts | −15 | +17 | ~mitad |
| **6 vendedores parejos al 17.0%** | **+10.0 pts** | **+3** | **+19** | **0 de 400** |

Con vendedores parejos —el caso normal de una PME— un muestreo
**demostrablemente justo** nunca produce una diferencia negativa y de media
publica +10 puntos de concentración que no existe. Dos corridas reales:

- 6 vendedores al 16.7% → `Diferencia: **19.0 puntos**`
- 4 vendedores a exactamente 25% → `Diferencia: **7.0 puntos**`

La dirección del error es la segura —falsa alarma, no falsa tranquilidad— y una
falsa alarma solo cuesta volver a extraer, que es gratis. Pero quema la
confianza en el único número que al lector se le dice que mire. Se arregla sin
inventar umbral: seguir internamente **al mismo vendedor** entre los dos ámbitos
(la identidad no hace falta imprimirla) y publicar su diferencia, en vez de
restar dos máximos que pueden ser de personas distintas.

**Y no hay forma de situar el número.** El texto dice que «con 25 actividades la
banda es ancha», que es honesto pero no es una cantidad: el lector no puede
saber si su +19 es normal o no. La cifra que lo resolvería —`sqrt(p(1−p)/n)`
sobre la línea base, una línea— **describe** la dispersión, no decide nada, así
que no es el umbral que pediste evitar. Hoy el informe deja dos porcentajes y
una resta, e invita a leer cualquier diferencia como un problema.

### MEDIA-16 — una población concentrada de verdad marca 0.0 puntos

Si la concentración está en la población y el muestreo es fiel, la diferencia es
cero. Renderizado con una población donde una persona es el 80% de los
`quality = 100`:

```
| Candidatas con quality = 100 | 10 | 80.0% (80 de 100) |
| **Franja alta del lote**     |  5 |  80.0% (20 de 25) |

- Diferencia en la franja alta, lote menos candidatas: **0.0 puntos**
```

Aritméticamente correcto, y coherente con D12: el lote es fiel y no hay que
poner cuota. Pero la franja alta es **20 de 25 de una persona** —la foto exacta
de ayer— y la cifra titular dice `0.0`. La pregunta que responde la diferencia
es «¿añadió concentración el muestreo?»; la que tiene que responder el humano
antes de gastar la hora del director es «¿puede este lote sostener un veredicto
sobre el equipo?». No son la misma, y el texto señala la diferencia como «la
fila que decide».

La información está: la fila absoluta dice 80.0% (20 de 25). Lo que falta es una
línea que diga que una franja alta concentrada en una persona invalida el lote
**aunque la diferencia sea cero**, porque entonces el problema no es el muestreo
sino que la población no permite la pregunta. Sigue sin ser un umbral.

## Punto 3 — Fuga

**Cero.** Corrida completa con `seller_id` y `id` reconocibles:

| Fichero | `SELLER-UUID-*` | `seller_id` | `ACT-UUID-*` |
|---|---|---|---|
| informe versionado | no | no | no |
| fichero del director (R6) | no | — | no |

`repartoCandidatas`, que sí viaja en el lote (no versionado), son solo
recuentos: `{"todas":{"vendedores":4,"reparto":[100,100,100,100],…}}`, sin un
solo identificador. `sellerSpread` sigue devolviendo únicamente recuentos y
`seller_id` no aparece en ningún camino hacia el informe.

## Punto 4 — MEDIA-13 y MEDIA-14

**MEDIA-13 comprueba el orden, no la pertenencia.** Leído: el test hace
`.orden.map(a => a.id).join(',')` **sin `.sort()`** y lo compara contra
`shuffleWithSeed(stratify(poblacion, s).batch, s)`, más un segundo caso que
comprueba que el fichero del director sale en ese mismo orden. Es exactamente lo
que faltaba. Mutante `shuffleWithSeed(batch, 77)`: **1 rojo** (antes: ninguno).

**MEDIA-14**: cuota de 8 por vendedor → **1 rojo** (antes: ninguno). El anexo
dice 3; mi cuota está escrita de otra forma, así que el recuento difiere sin que
eso signifique nada.

## Punto 5 — Compatibilidad con un lote antiguo

No revienta y el aviso es claro. Con un lote sin `repartoCandidatas`:

```
| Candidatas                   | n/d | n/d |
| Candidatas con quality = 100 | n/d | n/d |
| Lote completo                |   6 | 40.0% (20 de 50) |
| **Franja alta del lote**     |   6 | 80.0% (20 de 25) |

- Diferencia en la franja alta, lote menos candidatas: **n/d**

Las dos primeras filas salen `n/d` porque este lote se extrajo antes
de que se guardara el reparto de las candidatas: regeneralo con
`--fase extraer` si necesitas la comparacion.
```

Exit 0, las dos filas del lote siguen calculándose, y el aviso dice qué hacer.
✓ Es el caso del lote que hay en `progress/`, reconstruido sin tocarlo.

## Hallazgo nuevo sobre la cobertura

### MEDIA-17 — tres de las cuatro propiedades de MEDIA-12 no tienen test

Las comprobé y **se cumplen en el código de hoy**; lo que no existe es la red.
Los tres mutantes pasan los **151 tests en verde**:

| Mutante | Efecto medido | Tests |
|---|---|---|
| la línea base usa las candidatas **crudas**, ignorando R3 | base de 47.0% → 36.2% | **151 verde** |
| la diferencia se calcula contra `base.todas` en vez de `base.alta` | −11.0 pts → +9.9 pts, **cambia de signo** | **151 verde** |
| la fila «Franja alta del lote» usa `lote.orden` entero | publica el total diluido bajo la etiqueta de la franja | **151 verde** |

Las tres son exactamente las propiedades que me pediste verificar, y las tres
son las que el anexo defiende como el fondo del diseño. Sí muere el mutante que
cambia lo que se **guarda** (`alta: sellerSpread(elegibles)` → 1 rojo) y el que
deja de guardar `repartoCandidatas` (1 rojo): la persistencia tiene red, el
cálculo y la presentación no. Es el mismo patrón que ALTA-3, MEDIA-8, la semilla
de D12 y MEDIA-13 — código correcto, cableado sin afirmar —, y esta vez sobre el
instrumento del que depende la decisión humana.

## Regresión

**Ninguna.** Décima vuelta y la referencia en Python, la misma desde la primera
revisión, sigue dando lo mismo: matriz
`[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]`, acuerdos 58.3% / 58.3%, Spearman
0.480, falsos 100 66.7%, degradados 44.4% (4 de 9), 12 pares comparables.

## Los cuatro comandos

```
=== $ cd backend && pnpm test ===
Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
exit=0

=== $ cd backend && pnpm test:scripts ===
Test Suites: 6 passed, 6 total
Tests:       151 passed, 151 total
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix
exit=0
```

## Antes de regenerar el lote

El instrumento vale para lo que se construyó y el lote se puede regenerar hoy:
las filas absolutas son correctas y la de la franja alta es la que hay que
mirar. Lo que recomendaría, en este orden:

1. **MEDIA-15** — comparar el mismo vendedor entre ámbitos. Es el cambio que
   hace que la cifra titular signifique lo que dice. Sin él, léase la **fila
   absoluta de la franja alta** contra la de candidatas y no la resta.
2. **MEDIA-16** — una línea diciendo que una franja alta concentrada en una
   persona invalida el lote aunque la diferencia sea cero.
3. **MEDIA-17** — tres tests, ningún cambio de producción.

---

*Comprobación acotada a los cinco puntos, sin modificar código ni hacer commits.
Mutantes, Monte Carlo sobre 400 semillas y renderizados de informe en un
worktree aislado, ya eliminado. **Los dos artefactos de la extracción real no se
leyeron ni se tocaron**: md5 verificado antes y después, mtime 18:56:26 intacto.
No se llamó a `api.typesafe.ai` ni se abrió conexión a ninguna base de datos. T6
no se ejecutó.*

---
---

# COMPROBACIÓN ACOTADA FINAL — MEDIA-15, 16 y 17 (`11747c2..HEAD`, `9708f79`)

**Restricción respetada**: md5 de los dos artefactos de las 18:56 tomado antes y
verificado después, los dos `OK`. No los leí ni los usé; los casos que los
necesitaban se reconstruyeron en memoria.

## Veredicto

**PASSED**

Los tres cierres son correctos, sin regresión y sin fuga. Reproduje las tres
variantes de MEDIA-15 con mi propia herramienta y **el Implementer tiene razón**:
la variante que se le pidió no arregla nada y la que implementó sí. De ocho
confusiones de ámbito que inyecté —cuatro que él no había previsto— **mueren
siete**.

Dos hallazgos nuevos, los dos MEDIA, los dos sobre el mismo punto ciego: el
ámbito de D14 y el vendedor del que la cifra titular no habla.

## Punto 1 — Las tres variantes, medidas por mí

Implementé las tres por separado, sin llamar a la suya salvo para contrastar.
Población: 6 vendedores parejos al 16.7% de los `quality = 100`, muestreo justo
por construcción, 400 semillas.

| Variante | Media | Negativas | p5 | p95 |
|---|---:|---:|---:|---:|
| A — `max − max` (lo que había) | **+10.5** | **0/400** | +3 | +19 |
| B — pareja por el top del **lote** (lo que pediste) | **+10.5** | **0/400** | +3 | +19 |
| C — pareja por el top de las **candidatas** (lo implementado) | **−0.7** | **252/400** | −13 | +11 |
| C′ — su `compararConcentracion`, para contrastar | −0.7 | 252/400 | −13 | +11 |

Mi C y su C′ coinciden en las 400 semillas hasta 1e-9.

**B es idéntica a A hasta el decimal**, no parecida. Eso confirma su
razonamiento mejor que su tabla: elegir a quien encabeza la muestra **es** la
operación `max`, así que emparejar por el lote reproduce el sesgo entero. La
referencia tiene que venir del lado que no es muestra, y la variante implementada
**sí queda centrada en cero** (media −0.7, más negativas que positivas, banda
simétrica). Se desvió de la instrucción con la medición delante y acertó.

### MEDIA-19 — el caso ciego, cuantificado: 1 corrida de cada 10

Él lo declara en prosa; lo he medido, y no es una esquina. Sobre 2000 semillas
de esa misma población sana:

- la peor concentración vista en la franja alta es del **44%**, por alguien que
  **no** es el vendedor de referencia, y la cifra titular de esa corrida marca
  **−8.7 puntos** — es decir, activamente tranquilizadora;
- en **207 de 2000 corridas (10.3%)** alguien tiene entre el 30% y el 50% de la
  franja alta mientras la cifra titular se queda dentro de ±5 puntos.

Ahí no avisa nadie: la cifra titular habla de otra persona y D14 no llega porque
no se pasa de la mitad. La fila absoluta sí lo dice (`44.0% (11 de 25)`), y el
informe ya advierte que la referencia «puede no ser el que encabeza el lote» —
pero no publica **su** número, que es el que haría visible el 44%. El arreglo es
de encuadre, no de estadística: publicar también el par del que encabeza el lote
como dos hechos («tiene el 44% de la franja alta y el 16.7% de las candidatas»),
sin llamarlo concentración añadida, que es donde el sesgo de B haría daño.

## Punto 2 — MEDIA-16 / D14

Se dispara donde debe y no donde no debe:

| Lote | Franja alta | ¿Avisa? |
|---|---|---|
| el de ayer: 20 de 25 de una persona | 80.0% | **sí** |
| sano: 6 vendedores parejos | 20.0% | no |

Y el texto dice lo que pediste, con todas las letras: «si el muestreo añadió
cero puntos, significa que el lote es fiel a una población que ya está
concentrada, no que el lote sirva… volver a extraer con otra semilla no lo
arregla: o se amplía el lote, o el veredicto se firma sabiendo a quién
describe». Cierra exactamente el bucle del humano con prisa reextrayendo tres
veces. ✓

Sobre el lote de ayer el informe da ahora **tres** señales coherentes: la fila
absoluta al 80.0%, la cifra titular en **+33.1 puntos** y el aviso de D14.

## Punto 3 — MEDIA-17, y una cuarta confusión

La fixture discriminante es buena. Ocho confusiones de ámbito, **siete
muertas**:

| Confusión | Tests rojos |
|---|---|
| base sobre candidatas crudas, ignorando R3 | 2 |
| fila «Franja alta» sobre el lote entero | 1 |
| `repartoCandidatas.alta` = todas las elegibles | 2 |
| *(nueva)* la referencia de la cifra son todas las elegibles | 2 |
| *(nueva)* la cifra se mide sobre el lote entero | 2 |
| *(nueva)* D14 corta en «al menos la mitad» | 1 |
| *(nueva)* `compararConcentracion` elige al que **menos** aporta | 2 |
| **(nueva) D14 se calcula sobre el lote entero, no la franja alta** | **0 — sobrevive** |

### MEDIA-18 — el ámbito de D14 no está discriminado

`run-backtest.ts`, la llamada `avisoConcentracion(spreadAlta)`. Cambiarla a
`avisoConcentracion(spread)` deja los **164 tests en verde**, y le cuesta al
informe exactamente lo que D14 existe para evitar. Renderizado:

```
AYER: 20 de 25 en la franja alta (80%), 40% del lote entero
  con el codigo de hoy      -> [AVISO D14 presente: true]
  con avisoConcentracion(spread) -> [AVISO D14 presente: false]
```

El lote de ayer es 80% de una persona en la franja alta y 40% en el total: por
encima del corte en el ámbito que importa y por debajo en el que no. La
confusión de un solo token **borra el aviso** en el caso exacto que lo motivó,
que es la misma dilución que el anexo usa para justificar por qué hacían falta
cuatro filas y no dos.

Se cierra con una línea de la fixture: un lote cuya franja alta pase de la mitad
mientras el total no —que además es la forma realista, 25 filas concentradas y
25 repartidas.

## Punto 4 — Regresión

**Ninguna.** Séptima revisión y la referencia en Python, la misma desde la
primera, sigue dando lo mismo: matriz
`[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]`, acuerdos 58.3% / 58.3%, Spearman
0.480, falsos 100 66.7%, degradados 44.4% (4 de 9), 12 pares. Fuga: cero
coincidencias de `seller_id` en el informe versionado.

## Punto 5 — Mi opinión sobre D15

**La decisión es la correcta. La justificación tiene una pata que no aguanta, y
te traigo el caso concreto que pediste.**

De acuerdo con los dos argumentos de fondo, y creo que son los que mandan:

- **La asimetría de coste es real.** En BAJA-7 un error mandaba texto de
  clientes a un tercero y no había vuelta atrás; aquí un ámbito confundido
  imprime un número torcido en un fichero que lee una persona y se corrige
  regenerando. Pagar una refactorización de varios ficheros por eso sería
  aplicar la misma medicina a dos enfermedades distintas.
- **El script corre una vez y se archiva.** Los tipos por ámbito se amortizan
  con el tiempo de vida, y aquí no lo hay. Tu apunte de cobrarlo si el muestreo
  se reutiliza fuera del backtest es el momento correcto.

Donde te corrijo es en la tercera pata: «**la fixture ya mata los mutantes
conocidos**». Los conocidos sí; **encontré uno desconocido entre los ocho
primeros que probé**, y no es casualidad dónde cayó. El principio de la fixture
es «cualquier confusión de ámbito cambia algún **número impreso**», y por eso
discrimina las cuatro filas y la cifra titular. Pero la salida de D14 **no es un
número**: es un bloque de prosa que está o no está. El principio de la fixture
no alcanza a los predicados, y ahí es exactamente donde vive MEDIA-18.

Así que la conclusión no es «tipa los ámbitos», es más barata: **extiende el
principio de la fixture a las salidas que son presencia/ausencia, no solo a las
celdas**. Una línea de fixture cierra MEDIA-18 y, de paso, cualquier aviso que
se añada después. Si en algún momento este muestreo sale del backtest, entonces
sí, los tipos; hoy no.

## Los cuatro comandos

```
=== $ cd backend && pnpm test ===
Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
exit=0

=== $ cd backend && pnpm test:scripts ===
Test Suites: 6 passed, 6 total
Tests:       164 passed, 164 total
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix
exit=0
```

## ¿Sirve ya el informe para decidir si el lote va al director?

**Sí.** Es la primera vuelta en la que lo digo sin reservas sobre el caso que
importa: para el lote de ayer el informe da tres señales que apuntan en la misma
dirección —80.0% en la fila, +33.1 puntos en la cifra titular y el aviso de D14
diciendo que reextraer no arregla nada— y para un lote sano no da ninguna falsa
alarma, que era el defecto de la vuelta anterior.

Lo que queda es un punto ciego acotado y medido: alguien que se hinche hasta
por debajo de la mitad sin ser el vendedor de referencia, en torno a 1 corrida
de cada 10 (MEDIA-19). La defensa práctica mientras tanto cabe en una frase:
**mirar la fila absoluta de la franja alta además de la cifra titular.** Con eso
el lote se puede regenerar y llevar al director.

Recomendado, por orden: **MEDIA-18** (una línea de fixture, cierra el agujero
del aviso), luego **MEDIA-19** (publicar también el par del que encabeza el
lote).

---

*Comprobación acotada a los cinco puntos, sin modificar código de producción.
Mutantes, Monte Carlo sobre 400 y 2000 semillas y renderizados de informe en un
worktree aislado, ya eliminado. **Los dos artefactos de la extracción real no se
leyeron ni se tocaron**: md5 verificado antes y después. No se llamó a
`api.typesafe.ai` ni se abrió conexión a ninguna base de datos. T6 no se
ejecutó.*

---
---

# CIERRE — MEDIA-18 y MEDIA-19 (`8ff68f1..HEAD`, `8579afd`)

Última comprobación. Regla de parada acordada: solo un BLOQUEANTE o un ALTA
detiene la regeneración del lote; lo que quede por debajo se registra como deuda
abierta y no abre otra vuelta.

**Restricción respetada**: md5 de los dos artefactos de las 18:56 tomado antes y
verificado después, los dos `OK`.

## Veredicto

**PASSED. Ningún BLOQUEANTE, ningún ALTA. El lote se puede regenerar.**

Dos hallazgos nuevos, los dos por debajo de la barra y los dos de cobertura
—código correcto, cableado sin afirmar—, que quedan como deuda: **MEDIA-20** y
**BAJA-20**. Sin regresión, octava vez.

## Punto 1 — MEDIA-19: dos hechos y ninguna resta

El tipo tiene exactamente dos campos y el test `expect(Object.keys(l).sort())
.toEqual(['enCandidatas','enLote'])` vigila el objeto devuelto. Mutantes:

| Mutante | Resultado |
|---|---|
| `liderDelLote` **devuelve** una resta | **1 rojo** |
| `liderAlta` se calcula sobre el lote entero | **1 rojo** |
| no se imprime la línea del líder | **1 rojo** |
| `lineaLider` intercambia `enLote` por `enCandidatas` | **1 rojo** |
| *el **tipo** gana un campo opcional de resta* | **174 verde** → BAJA-20 |

**Y el escenario que reporté, reconstruido**: semilla 17 sobre la población
sana, el 44% en manos de quien no es la referencia y la cifra titular en −8.7.
Lo que sale hoy:

```
| **Franja alta del lote** | 6 | 44.0% (11 de 25) |

- Del vendedor que mas aporta a las candidatas con quality = 100 —que puede
  no ser el que encabeza el lote—: tiene el 16.7% de ellas y
  el 8.0% de la franja alta del lote, asi que el muestreo le dio -8.7 puntos.
- Quien mas aporta a la franja alta del lote tiene el **44.0%** de
  ella y el **16.7%** de las candidatas con quality = 100.
```

**El lector lo ve.** El 44% pasa de estar escondido en una celda de la tabla a
ser una viñeta con su contraste al lado, y la frase explica por qué no se
restan. MEDIA-19 cerrado: era el 10.3% de corridas que medí y ya no es ciego.

## Punto 2 — MEDIA-18: el ámbito, atacado por el lado que no probó

Él clavó franja-vs-lote por los dos lados (75/30 avisa, 50/80 no avisa). Probé
cuatro ataques más:

| Ataque | Resultado |
|---|---|
| el aviso sobre el lote entero | **2 rojos** |
| el corte en «al menos la mitad» (frontera exacta) | **2 rojos** |
| el corte subido a 0.8 | **2 rojos** |
| el corte bajado a 0.2 | **2 rojos** |
| **el aviso sobre las CANDIDATAS, no sobre el lote** | **174 verde** → MEDIA-20 |

### MEDIA-20 — el tercer ámbito del aviso no está discriminado

`run-backtest.ts`, `avisoConcentracion(spreadAlta)`. La fixture cruza *franja
alta vs lote entero*, pero no *franja alta vs candidatas*: sustituir el
argumento por `base.alta` deja los **174 tests en verde**. Con la población de
ayer (candidatas al 46.9%, franja alta del lote al 80%) el aviso **no
aparecería**, porque 46.9% no pasa de la mitad. Es la misma clase de MEDIA-18,
un ámbito más allá.

El código de hoy es correcto. Se cierra añadiendo a la fixture un caso donde la
concentración de las candidatas y la de la franja alta caigan a distinto lado
del corte. Queda como deuda.

### BAJA-20 — lo que protege el test es el retorno, no el tipo

El anexo dice que «el tipo no lleva la resta». Añadir
`diferenciaPuntos?: number` a `LiderDelLote` compila y pasa los 174: la
comprobación es sobre las claves del objeto devuelto, no sobre la interfaz. En
cuanto alguien **devuelve** el campo, el test salta (mutante 2 → 1 rojo), que es
la garantía que importa. La afirmación es más fuerte que el candado; el candado
es el correcto.

## Punto 3 — El principio extendido de la fixture

Está escrito donde tiene que estar (`run-backtest.spec.ts:1033-1036`): «el
principio incluye las salidas de presencia y ausencia, no solo las celdas de la
tabla (D15, enmienda)… ahí vivía MEDIA-18 y ahí vivirá el próximo aviso que
alguien añada».

**¿Nacería cubierto un aviso nuevo inventado por mí?** Los datos sí lo
permiten: los dos lotes de la fixture cruzan el corte del 50% en sentidos
opuestos (75/30 y 50/80), así que cualquier predicado nuevo sobre el par
franja-vs-lote quedaría discriminado en cuanto se le añada su aserción. Pero
**nada obliga** a quien añada el aviso a escribirla: el principio es una
convención documentada, no un mecanismo. Es exactamente lo que D15 cambió por no
tipar los ámbitos, está asumido, y MEDIA-20 es la primera factura — el tercer
ámbito no lo cubren los datos de la fixture.

## Punto 4 — Regresión

**Ninguna, octava vez.** La referencia en Python, la misma desde la primera
revisión: matriz `[[1,0,1,0],[0,1,0,0],[2,0,2,0],[0,2,0,3]]`, acuerdos
58.3% / 58.3%, Spearman 0.480, falsos 100 66.7%, degradados 44.4% (4 de 9), 12
pares. Fuga: 0 coincidencias de `seller_id` en el informe versionado.

## Punto 5 — Lo que ve quien firma

Rendericé la sección con tres poblaciones. Las tres preguntas se responden **sin
regla de lectura**:

| | 1) sana, semilla 17 | 2) sana, semilla 77 | 3) como la de ayer |
|---|---|---|---|
| **¿Añadió concentración el muestreo?** | −8.7 pts | +3.3 pts | +1.0 pts |
| **¿Quién protagoniza el lote?** | **44.0%** vs 16.7% | 24.0% vs 16.7% | 48.0% vs 47.0% |
| **¿Sostiene un veredicto del equipo?** | sin aviso | sin aviso | sin aviso |
| Fila absoluta de la franja alta | 44.0% | 24.0% | 48.0% |

Las dos primeras preguntas tienen respuesta explícita y coherente en los tres
casos. La tercera es binaria por diseño: el aviso salta pasada la mitad, y lo
verifiqué disparando con 80% y callando con 24%.

Una observación para el gate, no un hallazgo: en el caso 3 la franja alta es
**48% de una sola persona** y no hay aviso, porque el corte es «más de la
mitad». El número está dos veces en negrita —en la tabla y en la línea del
protagonista— así que se ve; pero cerca del corte, lo que informa son esas dos
cifras y no la ausencia del aviso. Es la consecuencia aceptada de un corte en
lenguaje llano, y me parece la elección correcta frente a un umbral estadístico.

## Inventario final de hallazgos

47 hallazgos a lo largo de las ocho revisiones y las cinco comprobaciones
acotadas. (El recuento de 29 corresponde a las tres revisiones completas; las
comprobaciones acotadas añadieron 18 más.)

### Cerrados y verificados — 30

**ALTA (7 de 7)**: ALTA-1 pérdida del lote al renderizar · ALTA-2 nivel
fraccionario corrompía la matriz · ALTA-3 gate de R4 sin test en `extraer` ·
ALTA-4 R5 sin aserción sobre la petición real · ALTA-5 cuerpo ilegible se
llevaba el lote · ALTA-6 el ensayo machacaba la corrida real · ALTA-7 el
procedimiento de reanudación decía lo contrario del código.

**MEDIA (16)**: MEDIA-1 cifras sin datos publicadas como cero · MEDIA-4 división
por conjunto vacío · MEDIA-5 etiquetado que no cuadra con el lote · MEDIA-7
concentración por vendedor · MEDIA-8 `validarEtiquetado` sin cableado probado ·
MEDIA-9 informe compartido entre modos · MEDIA-10 el lote solo era durable al
final · MEDIA-11 «gana la última» degradaba una buena · MEDIA-12 informe sin
línea base · MEDIA-13 semilla del etiquetado sin test · MEDIA-14 «sin cuota» sin
test · MEDIA-15 la resta de máximos inflaba siempre · MEDIA-16 población
concentrada marcaba 0.0 · MEDIA-17 los ámbitos del reparto sin discriminar ·
MEDIA-18 el ámbito del aviso · MEDIA-19 el protagonista invisible.

**BAJA (7)**: BAJA-7 la frontera de R5 pasa a ser del compilador · BAJA-9
Spearman `null` con serie constante · BAJA-10 el `n/d` explicado · BAJA-11 `modo`
mal etiquetado · BAJA-14 «nunca llamada» frente a «llamada y falló» · BAJA-15 el
informe parcial se declara · y **D12**, que no fue hallazgo mío sino de la
primera extracción real.

### Abiertos por decisión del Líder — 9

MEDIA-2 (la mitad del 15% de D11 sin test) · MEDIA-3 (las dos fronteras de R13
sin test) · **MEDIA-6 → BAJA** (texto multilínea sin escapar; su consecuencia
dejó de ser silenciosa al cerrarse MEDIA-5) · BAJA-1 (aserción frágil en
`labeling.spec.ts:75`) · BAJA-2 (un commit verde toca un test) · BAJA-3 (cuatro
rojos por módulo ausente) · BAJA-4 (`JEV_BACKTEST_APPROVED=no` vale como sí) ·
BAJA-5 (`--fase` sin valor cae en `extraer`) · BAJA-6 (`--min… 1` significa
100%) · BAJA-8 (dos casillas marcadas).

### Abiertos sin decidir — 8

- **MEDIA-20** (nuevo) — el aviso de D14 no está discriminado contra el ámbito
  de las candidatas.
- **BAJA-12** — si `guardarRespuestas` falla no hay red; caso particular de la
  clase que cerró MEDIA-10.
- **BAJA-13** — `fetchImpl` que resuelve `null` se lleva el lote; no alcanzable
  con el `fetch` real.
- **BAJA-16** — §3b dice «ante la duda, no se vuelve a preguntar» y el caso por
  defecto de `necesitaLlamada` vuelve a preguntar.
- **BAJA-17** — `408` y `425` tratados como rechazo definitivo.
- **BAJA-18** — el aviso parcial recomienda `--fase evaluar` también para filas
  que ese comando no arregla.
- **BAJA-19** — el valor de `MOTIVO_NUNCA_LLAMADA` es carga útil para la
  clasificación por regex, sin test.
- **BAJA-20** (nuevo) — el tipo `LiderDelLote` admite un campo opcional de resta;
  lo protegido es el retorno.

### Pendiente y ajeno al script

La credencial de solo lectura de D7 (`explore_jev-backtest.md` §3 la sigue
marcando «pendiente de recibir») y confirmar la forma real de la respuesta de la
API con la primera llamada de T6.

## Los cuatro comandos

```
=== $ cd backend && pnpm test ===
Test Suites: 15 passed, 15 total
Tests:       78 passed, 78 total
exit=0

=== $ cd backend && pnpm test:scripts ===
Test Suites: 6 passed, 6 total
Tests:       174 passed, 174 total
exit=0

=== $ cd backend && npx tsc --noEmit ===
exit=0

=== $ cd backend && pnpm lint ===
> eslint "{src,apps,libs,test,scripts}/**/*.ts" --fix
exit=0
```

## Juicio final

**El lote regenerado puede ir al director.** Las tres preguntas que decide el
humano están respondidas en el informe sin que haya que recordar ninguna regla,
que era la condición que puse la vuelta pasada y la única que faltaba.

---

*Comprobación acotada a los cinco puntos, sin modificar código de producción.
Mutantes y renderizados en un worktree aislado, ya eliminado. **Los dos
artefactos de la extracción real no se leyeron ni se tocaron**: md5 verificado
antes y después. No se llamó a `api.typesafe.ai` ni se abrió conexión a ninguna
base de datos. T6 no se ejecutó.*
