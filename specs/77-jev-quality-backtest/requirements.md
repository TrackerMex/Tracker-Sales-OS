---
feature: "77-jev-quality-backtest"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[77-jev-quality-backtest]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]], [[tasks]] y el plan que la origina:
> `progress/plan_jev-quality-substance.md`.
>
> Fuente: `feature_list.json` #77. Esta feature es la **fase 1 de cuatro** y
> funciona como gate: si su veredicto es negativo, las features 78, 79 y 80 no
> se escriben.
>
> No depende de ninguna feature previa. No la bloquea ninguna.

## Contexto que fija el alcance

`calculateQuality`
(`backend/src/modules/activities/application/use-cases/create-activity.use-case.ts`)
asigna 20 puntos por cada una de cinco comprobaciones de longitud de cadena:
`summary > 20`, `discovery > 15`, `agreement > 15`, `nextStep > 8`, y
`nextDate && nextTime` presentes. Relleno de 25 caracteres por campo puntúa
100.

Ese entero alimenta dos consumidores en producción:
`dashboard/application/use-cases/get-sellers-score.use-case.ts` (35% del
score del semáforo) y
`dashboard/application/use-cases/get-dashboard-summary.use-case.ts`
(`AVG(a.quality)`).

Esta feature **no corrige** esa fórmula. Solo mide si existe un sustituto
viable.

## Requisitos funcionales

### Extracción del lote

- **R1**: EL SISTEMA SHALL disponer de un script en `backend/scripts/`
  (fuera de `backend/src/`, por tanto fuera del build de Nest) que extraiga un
  lote de exactamente 50 actividades de la tabla `activities` de producción.
  El script SHALL abrir la conexión en modo solo lectura y SHALL NOT ejecutar
  ninguna sentencia `INSERT`, `UPDATE`, `DELETE`, `ALTER` ni `CREATE`.

- **R2**: EL SISTEMA SHALL estratificar el lote de R1 así: **25 actividades
  con `quality = 100`**, **15 con `quality` entre 40 y 80 inclusive**, y **10
  con `quality` menor o igual a 20**. IF alguna franja no tiene suficientes
  filas THEN EL SISTEMA SHALL completar el faltante desde la franja
  inmediatamente superior y SHALL registrar la desviación en el informe de
  R8. La franja de `quality = 100` es la mayor a propósito: es donde vive la
  hipótesis de esta feature (ver [[design]] §D2).

- **R3**: EL SISTEMA SHALL excluir del lote toda actividad cuyos cuatro
  campos de texto (`summary`, `discovery`, `agreement`, `next_step`) estén
  vacíos o a `NULL` simultáneamente, porque no admiten juicio de ninguna de
  las dos partes comparadas.

### Frontera de confianza: datos que salen de la organización

- **R4**: ANTES de la primera llamada a la API de TypeSafe, EL SISTEMA SHALL
  exigir una aprobación humana registrada por escrito en
  `progress/explore_jev-backtest.md`, porque el lote contiene texto comercial
  redactado sobre clientes reales y sale de la infraestructura de la empresa
  hacia un tercero. El script SHALL abortar con código de salida distinto de
  cero si la variable `JEV_BACKTEST_APPROVED` no está presente en el entorno.

- **R5**: EL SISTEMA SHALL enviar a la API únicamente los cuatro campos de
  texto de la actividad. SHALL NOT enviar `client_id`, `seller_id`, nombres de
  cliente, nombres de vendedor, identificadores internos, importes ni fechas.
  El `id` de la actividad SHALL quedarse en local, como clave para volver a
  unir la respuesta con la fila.

### Etiquetado humano a ciegas

- **R6**: EL SISTEMA SHALL producir un fichero de etiquetado para el director
  comercial que muestre, por cada actividad del lote, únicamente sus cuatro
  campos de texto y una casilla para el nivel del 1 al 4. SHALL NOT mostrar el
  `quality` actual, la respuesta de Jev, el nombre del vendedor ni la posición
  de la actividad en la estratificación de R2. El orden de las filas SHALL
  estar aleatorizado con semilla fija y registrada.

- **R7**: Los cuatro niveles de la escala SHALL ser, literalmente, los mismos
  textos que reciben el director en R6 y el modelo en R9, sin reformular:
  1. vacío, relleno o genérico sin información del cliente
  2. describe lo ocurrido pero sin compromiso del cliente
  3. hay compromiso del cliente pero sin fecha ni responsable
  4. compromiso concreto con fecha y responsable identificados

### Consulta al modelo

- **R8**: EL SISTEMA SHALL consultar `POST https://api.typesafe.ai/v1/systemone`
  una vez por actividad, con `model: "jev-latest"` y una única pregunta de
  tipo `score` cuyos `criteria` sean los cuatro niveles de R7 en ese orden.
  EL SISTEMA SHALL persistir en el informe, por actividad, el nivel devuelto,
  la distribución de probabilidades y la confianza.

- **R9**: IF la API responde 429 o 529 THEN EL SISTEMA SHALL reintentar con
  espera exponencial hasta 3 veces. IF tras los reintentos sigue fallando
  THEN EL SISTEMA SHALL registrar esa actividad como `sin_respuesta` y
  continuar con el resto, sin abortar el lote.

- **R10**: EL SISTEMA SHALL soportar un modo seco activado por
  `--dry-run`, que ejecute todo el flujo contra un fichero de respuestas de
  ejemplo en lugar de la API, para poder validar el script sin gastar llamadas
  ni exponer datos.

### Informe y veredicto

- **R11**: EL SISTEMA SHALL emitir `progress/explore_jev-backtest.md` con una
  matriz de confusión de 4x4 entre la etiqueta humana y el nivel de Jev, la
  misma matriz entre la etiqueta humana y el `quality` actual normalizado a
  los cuatro niveles, y las tres cifras de acuerdo definidas en [[design]] §D5.

- **R12**: EL SISTEMA SHALL calcular y destacar la **tasa de falsos 100**:
  de las actividades con `quality = 100`, la fracción que el director etiqueta
  en nivel 1 o 2. Y, sobre ese subconjunto, la fracción que Jev también sitúa
  en nivel 1 o 2.

- **R13**: EL VEREDICTO del gate SHALL ser positivo si y solo si se cumplen
  las dos condiciones: Jev sitúa en nivel 1 o 2 **al menos el 70%** de los
  falsos 100 identificados por el director, y Jev **no** sitúa en nivel 1 o 2
  más del 15% de las actividades que el director etiqueta en nivel 3 o 4. Los
  dos umbrales son la decisión que el gate humano confirma o cambia antes de
  correr el lote, no después (ver [[design]] §D5).

## Fuera de alcance

- Cualquier cambio en `calculateQuality` o en los dos consumidores de
  `dashboard`. Eso es F80, y está bloqueada.
- Escribir el juicio en la base de datos. Eso es F78.
- Procesar el histórico completo. Eso es F79.
- Cualquier cambio de interfaz de usuario.
- Evaluar las primitivas `choice` y `noul` para objeción de cliente o deal
  estancado. Eso son F81 y F82, sin especificar.
