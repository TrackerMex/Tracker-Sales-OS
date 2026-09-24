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
lote de 50.

**Reparto de `quality`**, medido el 2026-09-23 sobre la base de produccion:

| `quality` | Actividades | % |
|---:|---:|---:|
| 0 | 11 | 0.5% |
| 20 | 624 | 30.3% |
| 40 | 338 | 16.4% |
| 60 | 397 | 19.3% |
| 80 | 303 | 14.7% |
| 100 | 389 | 18.9% |

Las tres franjas de R2 tienen holgura, asi que **el lote sale completo y el
relleno desde la franja superior no se dispara**:

| Franja | Definicion | Necesita | Disponibles |
|---|---|---:|---:|
| alta | `quality = 100` | 25 | 389 |
| media | `quality` entre 40 y 80 | 15 | 1038 |
| baja | `quality` <= 20 | 10 | 635 |

Dos lecturas de estos numeros que conviene tener antes del etiquetado, porque
acotan lo que el backtest puede llegar a demostrar:

1. **El 18.9% de las actividades puntua 100 hoy.** Esa es la poblacion sobre la
   que actua la hipotesis. Si el director juzga vacia una fraccion apreciable
   de las 25 que le toquen, el efecto sobre el semaforo no es marginal: son 389
   registros que hoy entran al score como perfectos.
2. **El 30.3% puntua exactamente 20**, es decir satisface uno solo de los cinco
   checks de longitud. Es un dato para el director por si mismo, independiente
   de lo que diga Jev, y probablemente merezca mirarse aparte de esta feature.

## 3c. Desde donde se ejecuta, y con que cadena de conexion

**Decision del humano, 2026-09-23: desde un contenedor desechable unido a la
red de Docker.** No desde `tracker-sales-api` y no desde el host.

Por que no desde el contenedor del backend, que era la primera idea: su imagen
de produccion (`backend/Dockerfile`, etapa `production`) hace
`pnpm install --prod` y `COPY --from=build /app/dist ./dist`. No tiene
`backend/scripts/` ni `ts-node`, porque `ts-node` es devDependency. No es un
descuido de la imagen: es correcta para lo que hace.

Por que no desde el host: los contenedores de Postgres no publican el 5432, asi
que desde el host no hay ruta sin tocar la infraestructura.

El contenedor desechable resuelve las dos cosas sin cambiar nada desplegado:
entra en la red, monta el repositorio que ya tiene `node_modules` con las
devDependencies, corre, y desaparece.

**Red y nombre**: la base es un servicio Swarm en `dokploy-network`, y su DNS
resuelve por el nombre del servicio (verificado 2026-09-23):

```
tracker-sales-os-trackersales-hibdzn -> 10.0.1.4
```

Se usa el nombre, no la IP: la IP cambia si el servicio se reprograma.

**Fichero de entorno** (`~/.jev-backtest.env`, permisos 600, fuera del repo):

```
JEV_BACKTEST_APPROVED=si
JEV_BACKTEST_DATABASE_URL=postgres://jev_backtest_ro:<CLAVE>@tracker-sales-os-trackersales-hibdzn:5432/<POSTGRES_DB>
JEV_API_KEY=<clave de TypeSafe>
```

**Montaje**: la raiz del repositorio, no solo `backend/`. El script resuelve
sus salidas con `RAIZ = resolve(__dirname, '..', '..', '..')`, que es la raiz
del repositorio, y escribe en `<repo>/progress/`. Montando solo `backend/` no
podria escribir el lote ni el informe.

**Fase 1 — extraer el lote y generar el fichero de etiquetado:**

```bash
docker run --rm \
  --network dokploy-network \
  --user "$(id -u):$(id -g)" \
  -v /home/claude/sites/Tracker-Sales-OS:/app -w /app/backend \
  --env-file ~/.jev-backtest.env \
  node:22-alpine \
  npx ts-node scripts/jev-backtest/run-backtest.ts --fase extraer
```

El `--user` evita que los ficheros de `progress/` queden como root en el host.

**Fase 2 — tras el etiquetado del director:**

```bash
docker run --rm \
  --network dokploy-network \
  --user "$(id -u):$(id -g)" \
  -v /home/claude/sites/Tracker-Sales-OS:/app -w /app/backend \
  --env-file ~/.jev-backtest.env \
  node:22-alpine \
  npx ts-node scripts/jev-backtest/run-backtest.ts --fase evaluar \
    --min-falsos-100-detectados 0.70 --max-buenos-degradados 0.15
```

**Ensayo sin red ni datos reales**, que no necesita ni la base ni la API:

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -v /home/claude/sites/Tracker-Sales-OS:/app -w /app/backend \
  node:22-alpine \
  npx ts-node scripts/jev-backtest/run-backtest.ts --fase evaluar --dry-run
```

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

- **Semilla de aleatorización**: 77
- **Extracción del lote**: 2026-09-24T15:19:03Z
- **Candidatas**: 2000 · **excluidas por R3**: 0 · **desviaciones de R2**: ninguna
- **Franjas**: alta 25, media 15, baja 10 — completas, sin relleno
- **Modelo**: `jev-latest` (registrar la versión exacta que devuelva la API)
- **Fecha de la evaluación**: _pendiente_

### Concentración del lote, y la decisión humana que la acompaña

| | Franja alta del lote | Candidatas con `quality = 100` |
|---|---:|---:|
| Vendedores distintos | 4 | 5 |
| Fracción del que más aporta | **60.0%** (15 de 25) | 48.1% |

Cifra titular emparejada (D13): **+11.9 puntos**. El que encabeza el lote es el
mismo que encabeza las candidatas, así que no aplica el punto ciego de
MEDIA-19.

**El aviso de D14 se dispara**: más de la mitad de la franja alta es de una
sola persona.

**Los +11.9 puntos no son una anomalía.** Con p = 0.481 y n = 25 la desviación
típica es de 10.0 puntos, así que esta extracción está a 1.2 desviaciones: una
tirada ordinaria. El origen de la concentración no es el muestreo, es la
población — un solo vendedor produce el 48.1% de todos los registros que
puntúan 100 en la base. Cualquier lote fiel saldrá cerca de ese 48%.

**Decisión del humano, 2026-09-24: se firma el lote sabiendo a quién
describe.** Se descartaron las dos alternativas:

- *Ampliar la franja alta* de 25 a 40-50 para que entren más vendedores en
  términos absolutos. Habría hecho que el veredicto hablara del equipo, al
  precio de una vuelta de código y de más tiempo del director.
- *Reextraer con otra semilla* buscando acercarse al 48%. Se descarta por
  principio: elegir la tirada que más gusta es la cuota que D12 rechaza, por la
  puerta de atrás. Y aun en el mejor caso casi la mitad de la franja seguiría
  siendo la misma persona.

**Consecuencia que queda escrita para quien lea el veredicto**: el resultado de
este backtest habla sobre todo de un vendedor. Si Jev acierta o falla sobre
este lote, lo que se ha medido es su comportamiento frente al estilo de
escritura de esa persona. Para afirmar algo sobre el equipo haría falta ampliar
la franja alta. No es una limitación del backtest: es que el fenómeno que se
quiere medir —registros que puntúan 100 sin tener sustancia— está concentrado
en quien produce casi la mitad de los registros que puntúan 100.

### Deuda registrada el 2026-09-24

**La concentración solo se ve en el informe, que se genera en la fase de
evaluar.** Es decir, después de que el director haya etiquetado y después de
gastar las 50 llamadas. La decisión que esas cifras informan se toma antes, así
que hubo que leer `jev-backtest-lote.json` a mano para tomarla. El control
existe y es correcto; lo que falta es que `--fase extraer` lo imprima al
terminar, que es el momento en que se decide.

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

- **MEDIA-20**: el aviso de D14 no esta discriminado contra el tercer ambito.
  La fixture cruza franja alta contra lote entero, pero calcularlo sobre las
  candidatas deja los 174 tests en verde. Codigo correcto, cableado sin
  afirmar. Se cierra con un caso donde candidatas y franja alta caigan a
  distinto lado del corte.
- **BAJA-20**: el anexo dice que el tipo `LiderDelLote` no admite la resta;
  en realidad lo que vigila el test son las claves del objeto devuelto, no la
  interfaz. El candado es el correcto, la afirmacion era mas fuerte que el.

Si la corrida real destapa alguno, se registran como feature aparte.

## Como leer la seccion de concentracion del informe

Verificado por la revision sobre tres poblaciones renderizadas. El informe
responde tres preguntas, y ninguna necesita que el lector recuerde una regla:

1. **Anadio concentracion el muestreo?** La cifra titular, emparejada por el
   vendedor de las candidatas (D13). Esta centrada en cero: en un muestreo
   justo sale negativa tantas veces como positiva.
2. **Quien protagoniza el lote?** Sus dos fracciones, en la franja alta y en
   las candidatas, publicadas como dos hechos y nunca como una resta.
3. **Sostiene este lote un veredicto sobre el equipo?** El aviso de D14, que
   aparece cuando mas de la mitad de la franja alta es de una sola persona y
   advierte de que ahi reextraer no arregla nada.

**Aviso para quien firme, cerca del corte.** Con una poblacion como la medida
el 2026-09-23, la franja alta puede salir al 48% de una sola persona y **no
haber aviso**, porque el corte es «mas de la mitad». El numero esta dos veces
en negrita y se ve, pero cerca del corte lo que informa son las dos cifras y no
la ausencia del aviso. Es la consecuencia aceptada de usar un corte en lenguaje
llano en vez de un umbral estadistico, y se prefiere asi: la decision es
humana.

**Si la cifra titular acusa concentracion anadida**, la salida no es retocar el
lote a mano —eso es la cuota que D12 descarta— sino volver a extraer con otra
semilla y dejar constancia de las dos. Si el problema es la poblacion y no el
muestreo, reextraer no cambia nada: o se amplia el lote, o el veredicto se
firma sabiendo a quien describe.

---

## Como leer el veredicto (anadido 2026-09-24)

El informe distingue **tres** desenlaces, no dos. La tercera es la que faltaba
y, por la aritmetica de esta feature, la mas probable.

| Desenlace | Que significa | Que hacer |
|---|---|---|
| **Jev acierta** | La condicion A se cumple sobre las 25 actividades, y la B se decide sobre un denominador que la sostenga | Seguir con F78 |
| **Jev falla** | La B se incumple con suficientes actividades detras como para que sea un juicio | Archivar el plan |
| **No se pudo medir** | La B no tiene denominador, o lo tiene tan pequeno que una sola actividad decide | Ampliar el lote, **no** repetir con otra semilla |

**Por que la tercera es la mas probable.** Si la hipotesis de la feature acierta
—si esos registros que puntuan 100 estan efectivamente vacios— el director
tumbara la mayoria de las 25 a nivel 1 o 2, y quedaran pocos «buenos». Con 5,
basta que Jev degrade uno para marcar el 20% y pasarse del 15% admitido.

Es el reverso de D16. Aquel argumento decia que las etiquetas de nivel 3 o 4
salen sobre todo de la franja alta, y por eso recortar el lote no perdia nada
del gate. Cierto, pero al quedarnos solo con ella el denominador de la
condicion B pasa a depender por completo de cuantas de las 25 sobrevivan al
juicio del director.

El corte del aviso no es una constante inventada: sale del propio umbral de
R13, `1 / buenos > maxBuenosDegradados`, es decir «basta una sola actividad
para superarlo». Si se cambia el umbral, el aviso cambia con el.

**Si sale «no se pudo medir», la salida es ampliar el lote**, no repetirlo con
otra semilla: el problema no es que la muestra salga rara, es que la condicion
B se mide sobre las actividades que el director considera buenas, y son pocas
por construccion. Repetir con otra semilla da otras 25 actividades de
`quality = 100` y el mismo problema.

El titular del informe lleva el matiz con su direccion, para que nadie copie
«POSITIVO» o «NEGATIVO» a un correo sin el.

---

## Reextraccion declarada de antemano (2026-09-24)

**Compromiso registrado antes de conocer el resultado.**

La primera extraccion con `--solo-alta` y semilla 77 dio una franja alta con el
**68.0%** en una sola persona, frente al 47.9% de las candidatas: **+20.1
puntos, 2.0 desviaciones tipicas** (sigma = 10.0 con p = 0.479 y n = 25). Es
una tirada en el percentil 97 de su propia poblacion.

**Se reextrae una sola vez, con semilla 1234, y se acepta el resultado sea cual
sea.** Firmado por el humano antes de correr el comando.

Por que esto no contradice la decision del lote anterior, donde se descarto
reextraer: alli la tirada estaba a 1.2 sigma, que es ordinaria, y volver a
tirar habria sido quedarse con el numero que mas gusta. A 2.0 sigma la muestra
es genuinamente poco representativa de su propia poblacion, y una reextraccion
**declarada antes de mirar** no es elegir: es no quedarse con un mal sorteo. La
diferencia entre las dos cosas es exactamente si la regla se fija antes o
despues de ver el numero.

Si el lote de la semilla 1234 sale peor, se acepta igual. Esa es la parte que
hace honesto el procedimiento.

### Hallazgo de paso: la semilla no reproduce el lote a lo largo del tiempo

El lote completo del 2026-09-24T15:19 y el de `--solo-alta` del mismo dia
usaron los dos la semilla 77 y dieron franjas altas distintas (60.0% y 68.0%).
No es un fallo de D12 ni de R6: el pool de candidatas se mueve, porque
`BATCH_QUERY` pide las 2000 mas recientes y los vendedores siguen registrando
actividad.

**La reproducibilidad que da la semilla vale a poblacion fija**, no a lo largo
de los dias. Quien quiera reproducir un lote exacto necesita la semilla **y**
el fichero del lote guardado, que es lo que ya se versiona en
`jev-backtest-lote.json`. Merece una nota en la spec si esta feature se repite.


## Lote definitivo (2026-09-24T16:23Z)

Resultado de la reextraccion declarada. **Se acepta.**

- **Semilla**: 1234 · **modo**: `--solo-alta` (R14) · **actividades**: 25, todas
  de `quality = 100`
- **Candidatas**: 2000 · **excluidas por R3**: 0 · **desviaciones de R2**:
  ninguna
- **Vendedores en el lote**: 5 · **reparto**: 13 / 9 / 1 / 1 / 1

| | Franja alta del lote | Candidatas con `quality = 100` |
|---|---:|---:|
| Fraccion del que mas aporta | **52.0%** (13 de 25) | 47.9% |

**Cifra titular emparejada (D13): +4.1 puntos**, es decir 0.41 desviaciones
tipicas. Una tirada representativa: el lote refleja su poblacion. Quien
encabeza el lote es el mismo que encabeza las candidatas, asi que tampoco
aplica el punto ciego de MEDIA-19.

**El aviso de D14 se dispara igualmente**, porque 52.0% pasa de la mitad. No es
una contradiccion con lo anterior: la poblacion esta al 47.9%, justo por debajo
del corte, asi que cualquier lote fiel se queda rondando la linea. Es el caso
del borde que esta descrito arriba — cerca del corte informan las dos cifras,
no la presencia o ausencia del aviso.

**Lo que hay que saber al firmar el veredicto**: algo mas de la mitad de estas
25 actividades las escribio la misma persona, y eso refleja la realidad de la
base, donde esa persona produce el 47.9% de todos los registros que puntuan
100. El veredicto hablara en buena medida de su forma de escribir. Para que
hablase del equipo habria que ampliar la franja alta, al precio de mas tiempo
del director.

Fichero para el director: `progress/jev-backtest-etiquetado.md`, **25 bloques**.
