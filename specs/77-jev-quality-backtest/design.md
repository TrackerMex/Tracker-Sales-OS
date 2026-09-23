---
feature: "77-jev-quality-backtest"
status: approved     # draft | approved
tags: [harness, spec]
---

# Diseño — [[77-jev-quality-backtest]]

> Ver [[requirements]] y [[../../docs/architecture|architecture]].
>
> Esta spec está escrita para ser **autosuficiente**: quien la implemente no
> tiene acceso a la conversación que la originó. Toda ruta, símbolo y umbral
> que aparece aquí es literal.

## Decisión de fondo: medir antes de construir

El plan completo (`progress/plan_jev-quality-substance.md`) tiene cuatro
fases. Esta es la primera y existe para poder abandonar las otras tres barato.

La alternativa —escribir el puerto, el adaptador y la columna, y ver qué sale—
cuesta una migración, un módulo nuevo y una llamada en el camino de
`POST /api/activities`, todo antes de saber si el modelo acierta en español
mexicano. Si no acierta, ese trabajo se tira entero. Un script de lectura
cuesta menos de un centavo y responde la misma pregunta.

## D1 — Script suelto, no módulo de Nest

Va en `backend/scripts/`, fuera de `backend/src/`, por tres razones:

1. No es código de producto: corre una vez, produce un informe y se archiva.
   Meterlo en `modules/` obligaría a darle estructura hexagonal
   (domain/application/infrastructure) para algo que no tiene ciclo de vida.
2. `CLAUDE.md` reserva `backend/src/modules/` al Implementer bajo revisión.
   Un script de lectura que no entra en el build no necesita ese circuito.
3. Mantiene R1 verificable de un vistazo: si el fichero no está bajo
   `src/`, no puede acabar en el bundle ni en el contenedor de producción.

## D2 — Estratificación 25/15/10, no 15/15/20

El plan original proponía un lote más repartido. Se cambia a **25 actividades
con `quality = 100`** porque la hipótesis de esta feature vive exactamente
ahí: la afirmación no es "la fórmula de longitud es imprecisa", sino "la
fórmula de longitud da 100 a registros vacíos".

Con 15 filas en esa franja, si el director identifica 6 falsos 100, el umbral
del 70% de R13 se decide sobre 6 observaciones y un solo desacuerdo mueve el
resultado 17 puntos. Con 25 filas el subconjunto sigue siendo pequeño, pero el
veredicto deja de depender de una o dos actividades.

**Limitación que se acepta explícitamente**: 50 actividades no dan potencia
estadística para un intervalo de confianza estrecho. Esta prueba no busca
publicar un número, busca decidir si merece la pena escribir la fase 2. Si el
resultado cae cerca de los umbrales de R13 en lugar de claramente a un lado,
la respuesta correcta es ampliar el lote, no forzar el veredicto.

## D3 — Los cuatro niveles y su mapeo futuro

La escala de R7 tiene cuatro niveles ordenados porque `score` de Jev devuelve
un nivel de una lista cerrada, y porque cuatro es el mayor número de niveles
que un humano distingue de forma estable sin una rúbrica larga.

El mapeo a la escala actual (25 / 50 / 75 / 100) **no se implementa en esta
feature**. Se documenta aquí para que F78 no lo reinvente, y para que la
normalización de R11 del `quality` actual use la misma correspondencia:

| Nivel | Valor en escala 0-100 | `quality` actual equivalente |
|---|---|---|
| 1 | 25 | 0-20 |
| 2 | 50 | 40 |
| 3 | 75 | 60-80 |
| 4 | 100 | 100 |

## D4 — Etiquetado a ciegas: qué significa "a ciegas" aquí

El director ya tiene una opinión formada sobre sus vendedores, y el `quality`
actual ya le ha enseñado un número por actividad. Si etiqueta viendo
cualquiera de las dos cosas, la comparación mide su memoria, no su juicio.

Por eso R6 oculta el `quality`, la salida de Jev, el vendedor y la
estratificación, y aleatoriza el orden. La semilla se registra en el informe
para que el lote sea reproducible.

El etiquetado es de una sola pasada, sin volver atrás a revisar: se busca el
juicio inmediato, que es también lo que `score` de Jev emite.

## D5 — Tres cifras de acuerdo, y por qué el veredicto solo usa una

El informe de R11 publica tres:

1. **Acuerdo exacto**: fracción de actividades donde el nivel humano y el de
   Jev coinciden.
2. **Acuerdo adyacente**: fracción donde difieren como mucho en un nivel.
   Sobre una escala ordinal, confundir 3 con 4 no es el mismo error que
   confundir 1 con 4.
3. **Correlación de Spearman** entre las dos series, que es la que importa si
   lo que se va a usar es un promedio por vendedor y no el valor individual.

El veredicto de R13, en cambio, **no** se decide con ninguna de las tres. Se
decide con la tasa de falsos 100 de R12 y con su contrapartida de falsos
negativos. Un modelo puede tener un acuerdo exacto mediocre y aun así servir
perfectamente para esto, si los casos donde se equivoca son los del medio de
la escala y acierta en los extremos. Y al revés: un acuerdo alto que no
detecte los falsos 100 no resuelve el problema que originó el plan.

Los umbrales de R13 —70% de falsos 100 detectados, máximo 15% de buenos
degradados— se fijan **antes** de correr el lote, y el gate humano los
confirma o los cambia en ese momento. Fijarlos después de ver los resultados
convierte la prueba en una justificación.

## D6 — Qué sale de la organización y qué no

El texto de una actividad es material comercial sobre clientes reales de una
PME mexicana. R4 y R5 acotan la exposición:

- Solo viajan los cuatro campos de texto. Ningún identificador, ningún nombre
  propio de la estructura de datos, ningún importe.
- El texto libre puede contener, pese a todo, nombres de personas o empresas
  escritos por el vendedor dentro de la frase. Esto **no se puede filtrar de
  forma fiable con una expresión regular** y no se intenta: se declara como
  riesgo residual y es parte de lo que el humano aprueba en R4.
- La documentación de TypeSafe afirma que las peticiones de clientes no se
  usan para entrenar, y ofrece retención cero solo en plan enterprise. Esa
  afirmación es del proveedor y no está verificada por nosotros.

Si el director no acepta ese riesgo residual, la alternativa es correr el
backtest sobre actividades redactadas a mano que imiten el estilo real. El
resultado sería más débil y hay que decirlo en el informe, pero es una salida
válida y no bloquea la feature.

## D7 — Solo lectura, comprobable

R1 exige conexión de solo lectura. La forma de comprobarlo no es leer el
código buscando `UPDATE`: es que el usuario de base de datos que use el script
tenga concedido únicamente `SELECT` sobre `activities`. Si el script intentara
escribir, fallaría en el motor, no en una revisión.

Esa credencial se documenta en el informe. No se añade a `.env.example`, para
no sugerir que forma parte de la configuración normal de la aplicación.

## D8 — Qué hace falta para correr esto

- `JEV_API_KEY` en el entorno del operador, nunca en fichero versionado.
- `JEV_BACKTEST_APPROVED` como interruptor explícito de R4.
- Acceso de solo lectura a la base de producción, o a una copia reciente.
- Una hora del director comercial para el etiquetado de R6.

Costo estimado de la ejecución completa: 50 actividades × ~500 tokens ≈ 25 000
tokens de entrada, a $0.042 por millón, con salida sin cargo. Menos de un
centavo. El costo real de esta feature es la hora del director.

## D9 — Cómo corren los tests, dado que `rootDir` de jest es `src`

La configuración de jest en `backend/package.json` fija `"rootDir": "src"` y
`"testRegex": ".*\\.spec\\.ts$"`. Un test colocado en `backend/scripts/` **no
lo recoge `pnpm test`**. Esto entra en conflicto directo con D1, que exige que
el script viva fuera de `src/` para que no pueda acabar en el bundle.

Se resuelve con una configuración de jest propia y aislada:

- `backend/scripts/jest.config.js` con `rootDir: __dirname` y el mismo
  transform `ts-jest` que usa la configuración principal.
- Una entrada nueva en `backend/package.json`: `"test:scripts": "jest --config
  ./scripts/jest.config.js"`.

Se descartaron las dos alternativas:

1. **Cambiar `rootDir` a `.` en la configuración principal.** Tocaría cómo
   corren los 70 tests existentes para beneficio de un script de un solo uso.
   Riesgo desproporcionado.
2. **Mover la lógica pura a `src/`.** Entraría en el build y en la imagen de
   producción, que es exactamente lo que D1 evita.

`pnpm test` sigue devolviendo lo mismo que hoy. El Reviewer verifica ambos por
separado.

## D10 — Los umbrales del veredicto son parámetros, no constantes

R13 fija 70% y 15%. El gate humano aprobó la spec con esos números, así que
son los valores por defecto.

Pero se implementan como banderas de línea de comandos
(`--min-falsos-100-detectados`, `--max-buenos-degradados`) y no como constantes
en el código, porque R13 exige que se confirmen antes de cada corrida. Si el
director los cambia, cambiarlos no debe costar un commit.

El informe de R11 SHALL imprimir los dos valores efectivamente usados, para
que el veredicto quede interpretable sin consultar el historial de comandos.

## D11 — Cómo cuenta una actividad sin respuesta en el veredicto de R13

R9 permite que una actividad quede como `sin_respuesta` tras agotar los
reintentos. R13 no decía qué hacer con ella al calcular las dos condiciones.
Se ratifica la lectura literal, que es además la conservadora:

- Un **falso 100 sin respuesta** cuenta como **no detectado**. Resta en la
  condición del 70%.
- Un **bueno sin respuesta** **no** cuenta como degradado. No suma en la
  condición del 15%.

La asimetría es deliberada: las dos condiciones se leen en la dirección que
perjudica al modelo, de modo que un fallo de infraestructura nunca pueda
producir un veredicto positivo que no se ha ganado.

El informe de R11 publica `falsos100SinRespuesta` como cifra propia, para que
un veredicto negativo por cobertura se distinga de uno negativo por juicio. Si
esa cifra es alta, la respuesta correcta es repetir la corrida, no dar el gate
por cerrado.

Corolario que se acepta: un lote donde el director no identifique **ningún**
falso 100 no puede dar veredicto positivo, porque la condición del 70% se
calcula sobre un conjunto vacío. Ese resultado no significa que Jev falle:
significa que el lote no contenía el fenómeno que se quería medir, y que hay
que reestratificar.

## D12 — Dentro de cada franja se elige al azar con la semilla, no por fecha

R2 fija el reparto entre franjas (25/15/10) y no dice nada de cómo elegir
dentro de cada una. Hueco de la spec, detectado en la primera extracción real
del 2026-09-23.

`stratify` hacía `pools[from].splice(0, n)` sobre filas que llegan en
`ORDER BY executed_at DESC`, así que se quedaba con las n **más recientes** de
cada franja. Efecto medido sobre el lote real:

| | Población | Lote extraído |
|---|---:|---:|
| Fracción de los `quality = 100` del vendedor más prolífico | 46.9% | **80%** |

Veinte de las 25 actividades de la franja alta eran de una sola persona, y los
falsos 100 —la hipótesis entera de esta feature— se miden exclusivamente sobre
esa franja. El veredicto habría descrito el estilo de escritura de un vendedor,
no el del equipo.

**Decisión**: barajar cada franja con la semilla antes de recortar. La semilla
ya existe y ya se registra, así que el lote sigue siendo reproducible.

**Se descarta poner un tope por vendedor.** Sería sobrecorregir: si una persona
produce de verdad el 47% de los registros que puntúan 100, un lote donde
aporte el 47% es el fiel, y forzarlo al 25% crearía el sesgo contrario. Lo que
se quiere es una muestra representativa de la población, y eso lo da el azar,
no una cuota.

El informe sigue publicando la concentración por vendedor (MEDIA-7). Esa parte
funcionó: reportar la concentración es lo que permitió ver el problema antes de
gastar la hora del director. Lo que faltaba no era el aviso, era que el
muestreo no lo provocara.

## D13 — La cifra de concentración se empareja por el vendedor de las candidatas

Cerrando MEDIA-15. La primera version restaba dos **maximos sobre vendedores**
sin saber si eran la misma persona, y el maximo de una muestra esta sesgado al
alza por construccion: sobre 400 semillas con seis vendedores parejos al 16.7%,
un muestreo demostrablemente justo daba media **+10.3 puntos** y **cero**
diferencias negativas. Un numero que siempre acusa deja de leerse.

El Lider indico emparejar por quien mas aporta **al lote**. Medido, esa
variante no arregla nada (+10.3, 0 de 400 negativas): elegir a quien encabeza
la muestra ya selecciona la fluctuacion al alza, que es justo lo que hace
`max`. La referencia tiene que venir del lado que no es muestra.

**Decision, contra la indicacion original y con la medicion delante**: se
empareja por quien mas aporta a las **candidatas** con `quality = 100`, y se
compara su fraccion alli con la fraccion de **esa misma persona** en la franja
alta del lote. Resultado sobre las mismas 400 semillas: media **+0.3 puntos**,
223 de 400 negativas. La cifra pasa a estar centrada en cero, que es lo que
debe hacer una diferencia entre una muestra justa y su poblacion.

Lo que esta variante no ve: un vendedor pequeno en la poblacion que se hinche
en el lote sin llegar a la mitad. Eso queda en la fila absoluta de la tabla, y
de la mitad en adelante lo recoge el aviso de D14.

Por eso el informe dice de quien habla: el vendedor de referencia puede no ser
el que encabeza el lote, y sin esa frase la cifra parece contradecir la tabla.

## D14 — El aviso cuando la franja alta es de una sola persona

Cerrando MEDIA-16. La diferencia de D13 responde «anadio concentracion el
muestreo?». El humano que decide necesita responder otra cosa: «puede este lote
sostener un veredicto sobre el equipo?».

Son preguntas distintas y solo publicabamos la primera. Con una poblacion donde
una persona concentra el 80% de los `quality = 100`, la franja alta sale 20 de
25 de esa persona y la diferencia dice **0.0**: correcto, porque el lote es
fiel, y coherente con D12, que descarta la cuota. Pero el lote no sostiene un
veredicto sobre el equipo.

Cuando mas de la mitad de la franja alta es de una sola persona, el informe lo
avisa y dice que ahi **reextraer no arregla nada**, porque el problema esta en
la poblacion y no en el muestreo. El corte es en lenguaje llano —«mas de la
mitad»— y no un criterio estadistico disfrazado: la decision sigue siendo
humana.

## D15 — Por que no se tipan los ambitos del reparto por vendedor

`sellerSpread` acepta cualquier `{seller_id}[]`, asi que candidatas, elegibles,
lote y franja alta son intercambiables para el compilador. Es la quinta vez en
esta feature que aparece la misma clase: la logica correcta y el cableado sin
candado. El cierre estructural seria tipos distintos por ambito, el mismo
movimiento que `TextoRecortado` hizo con R5 en BAJA-7.

**No se hace, a diferencia de BAJA-7, y la diferencia importa**: alli la
frontera era que texto de clientes reales saliera de la empresa, y un error
costaba una exportacion irreversible. Aqui el coste de confundir un ambito es
un numero mal impreso en un informe que lee una persona, y regenerar lo
corrige.

**Enmienda (revision del 2026-09-23)**: la primera version de esta decision se
apoyaba tambien en que «la fixture discriminante ya mata los mutantes
conocidos». Esa pata no aguanta, y el revisor la tiro con un mutante
desconocido a la primera. El principio de la fixture es «cualquier confusion
cambia algun **numero impreso**», por eso discrimina las cuatro filas y la
cifra titular. Pero la salida de D14 no es un numero: es un bloque de prosa que
esta o no esta. El principio no alcanza a los predicados, y ahi vivia MEDIA-18.

La conclusion no cambia —los tipos por ambito siguen sin amortizarse en un
script de un solo uso— pero el remedio correcto es mas barato que tiparlo todo:
**extender el principio de la fixture a las salidas de presencia y ausencia**,
no solo a las celdas de la tabla. Eso cierra MEDIA-18 y cualquier aviso que se
anada despues.

Ademas este script corre una vez y se archiva: no tiene la vida por delante que
justifica pagar una refactorizacion de varios ficheros. Si algun dia el
muestreo se reutiliza fuera del backtest, esta es la primera deuda a cobrar.
