---
feature: "77-jev-quality-backtest"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[77-jev-quality-backtest]]

> Disciplina TDD (`docs/verification.md`). Cada tarea corresponde a uno o
> varios requisitos de [[requirements]].
>
> **Excepción declarada al circuito normal**: esta feature no produce código
> de producto. El script de `backend/scripts/` no entra en el build ni se
> despliega. Por eso las tareas de abajo no pasan por el Implementer bajo
> `backend/src/modules/`, y el Reviewer valida el informe, no una superficie
> de API.
>
> Los tests que sí se escriben cubren la lógica pura del script —
> estratificación, normalización, métricas — porque ahí es donde un error
> silencioso falsearía el veredicto del gate. Las llamadas a red y a base de
> datos no se testean: se ejercitan con `--dry-run` (R10).

## T0 — Arnés de test aislado (D9)

1. `backend/scripts/jest.config.js` con `rootDir: __dirname` y transform
   `ts-jest`.
2. Entrada `"test:scripts"` en `backend/package.json`.
3. Verificar que `pnpm test` sigue dando el mismo resultado que antes del
   cambio, y que `pnpm test:scripts` recoge los tests de T1 en adelante.

## T1 — Estratificación del lote (R1, R2, R3)

1. Test rojo: dado un conjunto de actividades con `quality` repartido, la
   función de estratificación devuelve 25/15/10 en las tres franjas, excluye
   las de cuatro campos vacíos, y ante franja insuficiente completa desde la
   superior dejando constancia de la desviación.
2. Implementación mínima.
3. Verde.

## T2 — Aleatorización con semilla y fichero de etiquetado (R6, R7)

1. Test rojo: con semilla fija, el orden de salida es determinista y
   reproducible; el fichero generado no contiene `quality`, `seller_id`,
   `client_id` ni la franja de origen.
2. Implementación mínima.
3. Verde.

## T3 — Gate de aprobación y recorte de campos (R4, R5)

1. Test rojo: sin `JEV_BACKTEST_APPROVED` en el entorno, el script sale con
   código distinto de cero y no construye ninguna petición. Con la variable
   presente, el cuerpo de la petición contiene exactamente los cuatro campos
   de texto y ninguna otra clave.
2. Implementación mínima.
3. Verde.

## T4 — Cliente de la API con reintentos y modo seco (R8, R9, R10)

1. Test rojo: ante 429 y 529 reintenta con espera exponencial hasta tres
   veces; al agotarlos marca la actividad como `sin_respuesta` y el lote
   continúa. Con `--dry-run` no se abre ninguna conexión de red.
2. Implementación mínima.
3. Verde.

## T5 — Métricas e informe (R11, R12, R13)

1. Test rojo: sobre un conjunto de pares (etiqueta humana, nivel Jev) conocido
   a mano, la matriz de confusión, el acuerdo exacto, el adyacente, la
   correlación de Spearman, la tasa de falsos 100 y el veredicto de R13 dan
   los valores calculados manualmente. Incluir un caso construido para que el
   veredicto sea negativo por cada una de las dos condiciones por separado.
2. Implementación mínima.
3. Verde.

## T6 — Ejecución y gate humano

No tiene test. Es la ejecución real, y su resultado es el entregable:

1. El director confirma o cambia los dos umbrales de R13 **antes** de correr.
2. Aprobación escrita de R4 en `progress/explore_jev-backtest.md`.
3. Extracción del lote y generación del fichero de etiquetado.
4. Etiquetado del director, a ciegas, de una pasada.
5. Ejecución contra la API.
6. Informe completo en `progress/explore_jev-backtest.md` con el veredicto.
7. El director firma el veredicto. Si es negativo, F78, F79 y F80 se cierran
   como descartadas y esta feature igualmente pasa a `done`: respondió su
   pregunta.
