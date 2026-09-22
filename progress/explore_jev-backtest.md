# Backtest de Jev — registro y resultados

> Feature `77-jev-quality-backtest` (#77). Spec: `specs/77-jev-quality-backtest/`.
> Este fichero cumple dos funciones: registrar la aprobación humana que exige
> R4, y alojar el informe de R11–R13 cuando el lote se ejecute.

## 1. Aprobación humana (R4)

**Estado: concedida.**

- **Fecha**: 2026-09-22
- **Dónde consta**: página de la base "Specs" en Notion,
  `77-jev-quality-backtest — Backtest offline: calidad por sustancia (Jev)`
  (id `3e36115a-9b27-816e-89f1-e37828dfc734`), `Estado del gate: Aprobado`,
  con las cuatro casillas de la sección "Lo que hace falta decidir para
  aprobar" marcadas.
- **Qué se aprobó**: que el texto de actividades comerciales reales salga de
  la infraestructura de la empresa hacia TypeSafe, limitado a los cuatro
  campos de texto (`summary`, `discovery`, `agreement`, `next_step`), sin
  identificadores de cliente, vendedor ni oportunidad, conforme a R5.
- **Riesgo residual aceptado**: el texto libre puede contener nombres de
  personas o empresas escritos por el vendedor dentro de la frase. No se
  filtra con expresión regular porque no es fiable (design §D6). El aprobador
  lo aceptó de forma explícita al marcar la casilla correspondiente.
- **Afirmación del proveedor, no verificada por nosotros**: TypeSafe declara
  que las peticiones de clientes no se usan para entrenar, y ofrece retención
  cero solo en plan enterprise.

## 2. Umbrales del veredicto (R13)

Confirmados sin cambios respecto a la spec aprobada:

| Condición | Umbral |
|---|---|
| Falsos 100 que Jev debe situar en nivel 1 o 2 | ≥ 70% |
| Actividades de nivel 3 o 4 que Jev puede degradar a 1 o 2 | ≤ 15% |

Se pasan al script como banderas (design §D10) y se reimprimen en el informe.

## 3. Prerrequisitos de ejecución

| Prerrequisito | Estado |
|---|---|
| Aprobación de salida de datos (R4) | concedida, §1 |
| Umbrales confirmados (R13) | confirmados, §2 |
| Hora del director para el etiquetado a ciegas (R6) | comprometida |
| Credencial de solo lectura sobre `activities` (R1, design §D7) | **pendiente de recibir** |
| `JEV_API_KEY` en el entorno del operador | pendiente de confirmar |
| Script T0–T5 terminado y en verde | en curso (Implementer) |

## 3b. Si la corrida se interrumpe

> **Corrección registrada (2026-09-22).** La primera versión de esta sección
> afirmaba que repetir `--fase evaluar` no repetía las llamadas ya hechas.
> Entonces era **falso**: `runBatch` recorría el lote entero. Lo escribió el
> Líder y lo destapó la revisión independiente (ALTA-7). Se deja constancia
> en vez de reescribir en silencio, porque durante unas horas esa instrucción
> estuvo publicada y alguien pudo seguirla. Lo que sigue describe el
> comportamiento tras el cierre de ALTA-7, verificado ejecutando.

Las respuestas se persisten **según llegan**, una línea JSON por actividad, en
`progress/jev-backtest-respuestas.jsonl` (`-seco.jsonl` para los ensayos). Una
corrida interrumpida pierde como mucho la llamada que estaba en vuelo.

Si el proceso muere, se cuelga la red o se corta la sesión:

- **No hay que reextraer el lote** ni volver a pedir el etiquetado al director.
- **Repite `--fase evaluar`.** Consulta solo lo que falta. Una respuesta buena
  no se vuelve a pedir nunca.
- **Si lo que falló fue nuestra lectura** de una respuesta que el servidor sí
  dio, usa `--fase evaluar --reusar-respuestas`: rehace el informe con lo que
  hay en disco, sin red y sin `JEV_API_KEY`.

Qué se reconsulta y qué no, que es lo que decide cuánto texto vuelve a salir:

| Estado previo | ¿Se consulta otra vez? | Por qué |
|---|---|---|
| no hay línea | **sí** | nunca se preguntó |
| respuesta buena | **no** | una respuesta buena no se toca |
| sin respuesta, pero con cuerpo crudo guardado | **no** | el servidor contestó; el fallo es de lectura, y lo arregla `--reusar-respuestas` |
| `HTTP 4xx` que no sea 429 | **no** | rechazo definitivo: repetirlo exporta otra vez para obtener el mismo no |
| 429 agotado, timeout, fallo de red, 5xx, cuerpo ilegible | **sí** | intercambio fallido sin resultado; preguntar otra vez es la única vía a un dato |

Una línea truncada por una escritura a medias se salta con aviso; las demás se
recuperan. Si al final falta alguna respuesta, el informe se declara **parcial**
en cabecera y publica, por actividad, el motivo por el que falta — que no es lo
mismo «nunca se consultó» que «la API la rechazó».

El coste de repetir una llamada no son los centavos de la API. Es que el texto
de esa actividad vuelve a cruzar la frontera de confianza. Por eso la tabla de
arriba es conservadora: ante la duda, no se vuelve a preguntar.

## 4. Parámetros de la corrida

Se rellenan al ejecutar.

- Semilla de aleatorización: _pendiente_
- Fecha y hora de la corrida: _pendiente_
- Modelo: `jev-latest` (registrar la versión exacta que devuelva la API)
- Desviaciones de la estratificación de R2: _pendiente_

## 5. Informe (R11, R12, R13)

El script inserta el informe generado bajo una marca al final de este fichero,
después de §6, conservando intactas las secciones escritas a mano. Contendrá
las dos matrices de confusión 4x4, las
tres cifras de acuerdo, la tasa de falsos 100 y el veredicto.

## 6. Veredicto

Pendiente. Firma del director requerida.
