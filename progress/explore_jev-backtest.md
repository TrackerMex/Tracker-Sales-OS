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
| Credencial de solo lectura sobre `activities` (R1, design §D7) | **verificada 2026-09-23** — ver §3a |
| `JEV_API_KEY` en el entorno del operador | pendiente de confirmar |
| Hallazgos abiertos que toquen datos o veredicto | **ninguno** |
| Script terminado y revisado | **sí** — revisión independiente PASSED, 138 + 78 tests |

## 3a. La credencial de solo lectura, verificada

Usuario `jev_backtest_ro` creado en el Postgres de produccion
(contenedor `tracker-sales-os-trackersales-hibdzn`, `postgres:18`), con
`CONNECT` a la base, `USAGE` sobre `public` y **`SELECT` unicamente sobre
`activities`**. Ningun otro privilegio.

Verificado el 2026-09-23 por el humano, desde la VPS, en los dos sentidos:

| Comprobacion | Resultado |
|---|---|
| `UPDATE activities SET quality = quality WHERE false` | `ERROR: permission denied for table activities` |
| `select count(*) from activities where deleted_at is null` | `2061` |

Esto es lo que D7 pedia: la garantia de solo lectura la da el motor, no una
revision del codigo. Si el script intentara escribir, fallaria en Postgres.

La contrasena vive en un fichero de entorno con permisos 600 fuera del
repositorio. No esta en `.env.example` ni en ningun fichero versionado, a
proposito: no forma parte de la configuracion de la aplicacion.

**Tamano del universo**: 2061 actividades no borradas. El script pide las 2000
mas recientes como candidatas (`CANDIDATE_LIMIT`), de las que estratifica el
lote de 50. Queda por confirmar que las tres franjas de R2 tienen suficientes
filas; si alguna no, R2 completa desde la franja superior y lo registra.

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
de esa actividad vuelve a cruzar la frontera de confianza.

La garantía que el código sostiene de verdad, y conviene no confundirla con
una más amplia: **ninguna actividad cuyo servidor llegó a contestar se vuelve
a exportar**. Eso lo asegura la comprobación del cuerpo crudo, que va por
encima de la clasificación por motivo.

Lo que **no** es cierto es que ante la duda no se vuelva a preguntar: el caso
por defecto de `necesitaLlamada` reconsulta cuando el motivo no encaja en
ningún rechazo definitivo conocido. Con los motivos que hoy produce el script
la clasificación es correcta, pero un motivo nuevo caería del lado de volver a
llamar. Quien añada motivos debe mirar esa función.

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

---

## Anexo — hallazgos que se dejan abiertos a propósito

Decisión del Líder, 2026-09-22, tras el PASSED de la revisión independiente.
Ninguno provoca una reexportación de datos de cliente ni altera el veredicto.

- **BAJA-17**: `408 Request Timeout` y `425 Too Early` se clasifican como
  rechazo definitivo por ser 4xx, aunque por convención son transitorios, así
  que esas actividades no se reconsultan y se quedan sin dato. Se deja porque
  el sesgo va hacia no volver a exponer, que es la dirección correcta, y
  porque el informe lo dice con su motivo en vez de callarlo. Si aparecen en
  la corrida real, el operador puede decidir entonces.
- **BAJA-18**: el aviso de informe parcial sugiere completar con
  `--fase evaluar`, que no mueve las filas atascadas en un 4xx definitivo.
  Se agota solo y la columna de motivo lo explica.
- **BAJA-19**: el valor de `MOTIVO_NUNCA_LLAMADA` participa en la
  clasificación por expresión regular y ningún test lo fija. Hoy no tiene
  consecuencia porque ese marcador no se persiste. Queda como acoplamiento
  latente si algún día se persistiera.
- **MEDIA-2 y MEDIA-3**: los dos únicos puntos de decisión del veredicto sin
  test dedicado. Se dejan porque el cálculo completo sí está cubierto y
  verificado tres veces contra una implementación de referencia independiente.

Si la corrida real destapa alguno, se registran como feature aparte.
