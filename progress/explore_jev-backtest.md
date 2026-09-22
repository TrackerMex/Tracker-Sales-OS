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

> **AVISO (2026-09-22).** La versión anterior de esta sección decía que
> repetir `--fase evaluar` no repite las llamadas ya hechas. **Es falso.**
> `runBatch` recorre el lote entero y vuelve a llamar por las 50, así que
> repetir reexporta hasta 50 textos de clientes que ya habían salido. Lo
> escribí yo y lo destapó la revisión independiente (ALTA-7). El reanudar
> selectivo está en curso; hasta que esté, **no repitas `--fase evaluar`
> sobre una corrida interrumpida** sin leer lo de abajo.

Las respuestas se persisten **según llegan**, una línea JSON por actividad, en
`progress/jev-backtest-respuestas.jsonl` (`-seco.jsonl` para los ensayos). Una
corrida interrumpida no pierde lo ya pagado: se pierde como mucho la llamada
que estaba en vuelo.

Qué hacer hoy, si el proceso muere o se corta la red:

- **No hay que reextraer el lote** ni volver a pedir el etiquetado al director.
  Eso sigue siendo cierto.
- **Si solo falta el informe**, usa `--fase evaluar --reusar-respuestas`: rehace
  el informe con lo que ya hay en disco, sin red y sin `JEV_API_KEY`. Esta es
  la vía segura.
- **Si faltan respuestas**, hoy la única forma de obtenerlas es repetir
  `--fase evaluar`, que vuelve a llamar por **todas** y reexpone las que ya
  habían salido. Decisión del humano: asumir esa reexposición, o aceptar un
  informe parcial. El informe cuenta las que faltan como «sin respuesta» y el
  recuento cuadra, así que un informe parcial es honesto, no engañoso.
- Una línea truncada por una escritura a medias se salta con aviso; las demás
  se recuperan.

Cuando el reanudar selectivo esté cerrado, la tercera viñeta desaparece: se
llamará solo por las que falten y esta sección se reescribirá.

El coste de repetir una llamada no son los centavos de la API. Es que el texto
de esa actividad vuelve a cruzar la frontera de confianza.

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
