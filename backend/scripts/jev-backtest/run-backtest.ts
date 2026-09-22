// Entrada del backtest de calidad de Jev (feature 77). Aqui vive TODA la
// entrada/salida del script — base de datos, red y ficheros — para que la
// logica que decide el veredicto se pueda probar sin infraestructura.
//
// Fase 1, tras la aprobacion escrita de R4:
//   JEV_BACKTEST_APPROVED=si JEV_BACKTEST_DATABASE_URL=postgres://solo_lectura@... \
//     npx ts-node backend/scripts/jev-backtest/run-backtest.ts --fase extraer
//
// Fase 2, tras el etiquetado del director:
//   JEV_BACKTEST_APPROVED=si JEV_API_KEY=... \
//     npx ts-node backend/scripts/jev-backtest/run-backtest.ts --fase evaluar \
//       --min-falsos-100-detectados 0.70 --max-buenos-degradados 0.15
//
// Ensayo sin gastar llamadas ni exponer datos (R10):
//   npx ts-node backend/scripts/jev-backtest/run-backtest.ts --fase evaluar --dry-run
//
// La credencial de JEV_BACKTEST_DATABASE_URL tiene que ser un usuario con
// SELECT y nada mas sobre `activities` (D7): asi el motor, y no una revision
// de codigo, es quien garantiza que el script no escribe. No se anade a
// .env.example a proposito, no forma parte de la configuracion de la app.

import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import {
  DEFAULT_SEED,
  buildLabelingFile,
  joinLabels,
  parseLabelingFile,
  shuffleWithSeed,
  validarEtiquetado,
} from './labeling';
import {
  JevResult,
  MOTIVO_NUNCA_LLAMADA,
  RespuestaGuardada,
  necesitaLlamada,
  nuncaLlamada,
  reparse,
  requireApproval,
  runBatch,
} from './jev-client';
import { Metrics, Thresholds, computeMetrics } from './metrics';
import {
  BATCH_QUERY,
  CANDIDATE_LIMIT,
  sellerSpread,
  stratify,
} from './stratify';
import {
  BatchActivity,
  EvaluatedActivity,
  Level,
  SourceActivity,
} from './types';

const RAIZ = resolve(__dirname, '..', '..', '..');
export const RUTA_ETIQUETADO = resolve(
  RAIZ,
  'progress',
  'jev-backtest-etiquetado.md',
);
export const RUTA_LOTE = resolve(RAIZ, 'progress', 'jev-backtest-lote.json');
/**
 * Respuestas crudas de la API. Se escribe en cuanto vuelven, antes de calcular
 * nada, porque a esas alturas las llamadas ya estan pagadas y los textos ya han
 * salido de la empresa: ningun fallo posterior puede costar una segunda
 * exportacion (ALTA-1). Cubierto por el glob `progress/jev-backtest-*` de
 * .gitignore, asi que no nace versionado.
 */
export const RUTA_RESPUESTAS = resolve(
  RAIZ,
  'progress',
  'jev-backtest-respuestas.jsonl',
);

/**
 * El ensayo escribe en su propio fichero (ALTA-6). Un `--dry-run` es el modo
 * con el que se ejercita el flujo, y antes bastaba uno para dejar el fichero
 * real lleno de respuestas de ejemplo: las llamadas ya pagadas se perdian y
 * --reusar-respuestas no recuperaba nada. Separar la ruta por modo lo hace
 * imposible por construccion, sin pedirle a nadie que se acuerde.
 */
export const RUTA_RESPUESTAS_SECO = resolve(
  RAIZ,
  'progress',
  'jev-backtest-respuestas-seco.jsonl',
);

export const rutaRespuestas = (dryRun: boolean): string =>
  dryRun ? RUTA_RESPUESTAS_SECO : RUTA_RESPUESTAS;
/**
 * El informe de R11, donde firma el director. Esta versionado, al contrario
 * que el resto de artefactos del backtest.
 */
export const RUTA_INFORME = resolve(
  RAIZ,
  'progress',
  'explore_jev-backtest.md',
);

/**
 * El informe del ensayo va aparte (MEDIA-9). Por la misma razon que las
 * respuestas: un `--dry-run` no puede sustituir el documento que el director
 * firma, y ademas este no se versiona, porque cae bajo el glob
 * `progress/jev-backtest-*` del .gitignore.
 */
export const RUTA_INFORME_SECO = resolve(
  RAIZ,
  'progress',
  'jev-backtest-informe-seco.md',
);

export const rutaInforme = (dryRun: boolean): string =>
  dryRun ? RUTA_INFORME_SECO : RUTA_INFORME;
const RUTA_EJEMPLOS = resolve(__dirname, 'sample-responses.json');

/**
 * Todo lo que haya en el informe por encima de esta marca lo escribio una
 * persona — entre otras cosas la aprobacion de R4 — y el script no lo toca.
 */
const MARCA_INFORME =
  '<!-- a partir de aqui escribe run-backtest.ts; lo de arriba es humano -->';

export interface Options extends Thresholds {
  fase: string;
  dryRun: boolean;
  /** Rehace el informe desde las respuestas ya guardadas, sin llamar a la API. */
  reusarRespuestas: boolean;
  semilla: number;
  limite: number;
}

/**
 * Los ficheros entran por aqui para que las pruebas puedan afirmar que se
 * escribe y donde sin tocar el disco. `sample-responses.json` no pasa por
 * esta superficie: es una fixture que viaja con el script, no un artefacto
 * que el script produzca.
 */
export interface FicheroIO {
  existe: (ruta: string) => boolean;
  leer: (ruta: string) => string;
  escribir: (ruta: string, contenido: string) => void;
  anadir: (ruta: string, contenido: string) => void;
}

const FICHERO_REAL: FicheroIO = {
  existe: (ruta) => existsSync(ruta),
  leer: (ruta) => readFileSync(ruta, 'utf8'),
  escribir: (ruta, contenido) => writeFileSync(ruta, contenido, 'utf8'),
  anadir: (ruta, contenido) => appendFileSync(ruta, contenido, 'utf8'),
};

export interface RunDeps {
  fetchImpl: typeof fetch;
  fs: FicheroIO;
}

export interface LoteGuardado {
  semilla: number;
  generado: string;
  candidatas: number;
  excluidas: number;
  desviaciones: string[];
  orden: BatchActivity[];
}

export function parseArgs(argv: string[]): Options {
  const valor = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const numero = (flag: string, def: number): number => {
    const v = valor(flag);
    if (v === undefined) return def;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`${flag} no es un numero valido: ${v}`);
    }
    return n;
  };
  // Acepta tanto 0.70 como 70: el director habla en porcentaje.
  const fraccion = (flag: string, def: number): number => {
    const n = numero(flag, def);
    return n > 1 ? n / 100 : n;
  };

  return {
    fase: valor('--fase') ?? 'extraer',
    dryRun: argv.includes('--dry-run'),
    reusarRespuestas: argv.includes('--reusar-respuestas'),
    semilla: numero('--semilla', DEFAULT_SEED),
    limite: numero('--limite', CANDIDATE_LIMIT),
    // R13 fija 70% y 15%; son los valores por defecto, no constantes (D10).
    minFalsos100Detectados: fraccion('--min-falsos-100-detectados', 0.7),
    maxBuenosDegradados: fraccion('--max-buenos-degradados', 0.15),
  };
}

/**
 * `pg` no trae tipos y el proyecto no instala @types/pg, asi que se declara
 * aqui lo poco que el script usa. Solo lee: no hay metodo de escritura en esta
 * interfaz a proposito.
 */
interface ReadOnlyClient {
  connect(): Promise<void>;
  query(sql: string, params: unknown[]): Promise<{ rows: SourceActivity[] }>;
  end(): Promise<void>;
}
const PgClient = Client as unknown as new (cfg: {
  connectionString: string;
}) => ReadOnlyClient;

/** R1 + D7 — unica lectura de la base, con la credencial de solo lectura. */
async function leerCandidatos(
  env: NodeJS.ProcessEnv,
  limite: number,
): Promise<SourceActivity[]> {
  const connectionString = env.JEV_BACKTEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'JEV_BACKTEST_DATABASE_URL no esta en el entorno: hace falta la cadena de conexion ' +
        'del usuario de solo lectura (D7).',
    );
  }
  const client = new PgClient({ connectionString });
  await client.connect();
  try {
    const res = await client.query(BATCH_QUERY, [limite]);
    return res.rows;
  } finally {
    await client.end();
  }
}

async function faseExtraer(
  opciones: Options,
  env: NodeJS.ProcessEnv,
  deps: Partial<RunDeps>,
): Promise<number> {
  const fs = deps.fs ?? FICHERO_REAL;
  const candidatas = await leerCandidatos(env, opciones.limite);
  const { batch, deviations, excluded } = stratify(candidatas);
  const ordenado = shuffleWithSeed(batch, opciones.semilla);

  fs.escribir(RUTA_ETIQUETADO, buildLabelingFile(ordenado, opciones.semilla));
  // El lote queda en local (R5): es la clave para volver a unir las respuestas
  // con la fila, y nunca se le ensena al director.
  const guardado: LoteGuardado = {
    semilla: opciones.semilla,
    generado: new Date().toISOString(),
    candidatas: candidatas.length,
    excluidas: excluded,
    desviaciones: deviations,
    orden: ordenado,
  };
  fs.escribir(RUTA_LOTE, JSON.stringify(guardado, null, 2));

  console.log(`[jev-backtest] lote de ${batch.length} actividades`);
  console.log(`[jev-backtest] etiquetado en ${RUTA_ETIQUETADO}`);
  for (const d of deviations) console.log(`[jev-backtest] desviacion: ${d}`);
  return 0;
}

export async function faseEvaluar(
  opciones: Options,
  env: NodeJS.ProcessEnv,
  deps: Partial<RunDeps>,
): Promise<number> {
  const fs = deps.fs ?? FICHERO_REAL;
  if (!fs.existe(RUTA_LOTE)) {
    throw new Error(`falta ${RUTA_LOTE}: corre antes --fase extraer`);
  }
  if (!fs.existe(RUTA_ETIQUETADO)) {
    throw new Error(
      `falta ${RUTA_ETIQUETADO}: hace falta el etiquetado del director (R6)`,
    );
  }

  const lote = JSON.parse(fs.leer(RUTA_LOTE)) as LoteGuardado;
  const marcadas = parseLabelingFile(fs.leer(RUTA_ETIQUETADO));

  // MEDIA-5: antes de medir nada, que el fichero devuelto sea el lote que se
  // entrego. Si no cuadra se para: el veredicto saldria de un etiquetado leido
  // a medias y nadie lo notaria.
  const problemas = validarEtiquetado(marcadas, lote.orden.length);
  if (problemas.length) {
    throw new Error(
      [
        `${RUTA_ETIQUETADO} no cuadra con el lote:`,
        ...problemas.map((p) => `  - ${p}`),
        '  Revisalo con el director antes de seguir; no se toca a mano.',
      ].join('\n'),
    );
  }

  const etiquetas = joinLabels(lote.orden, marcadas);

  const metricas = await evaluarLote(lote.orden, etiquetas, opciones, {
    consultar: () => obtenerRespuestas(lote.orden, opciones, env, deps, fs),
    guardarInforme: (m, filas, respuestas) => {
      const ruta = rutaInforme(opciones.dryRun);
      const informe = renderReport(m, filas, respuestas, lote, opciones);
      const previo = fs.existe(ruta) ? fs.leer(ruta) : '';
      fs.escribir(ruta, mergeReport(previo, informe));
    },
  });

  console.log(
    `[jev-backtest] respuestas en ${rutaRespuestas(opciones.dryRun)}`,
  );
  console.log(`[jev-backtest] informe en ${rutaInforme(opciones.dryRun)}`);
  console.log(
    `[jev-backtest] veredicto: ${metricas.veredicto.positivo ? 'POSITIVO' : 'NEGATIVO'}`,
  );
  for (const m of metricas.veredicto.motivos) {
    console.log(`[jev-backtest] motivo: ${m}`);
  }
  return 0;
}

export interface EvaluarIO {
  consultar: () => Promise<JevResult[]>;
  guardarInforme: (
    metricas: Metrics,
    filas: EvaluatedActivity[],
    respuestas: JevResult[],
  ) => void;
}

/**
 * Consultar primero, calcular despues. La durabilidad ya no depende de este
 * orden: cada respuesta llega al disco segun vuelve, dentro de `consultar`
 * (MEDIA-10). Si el informe revienta —o si el proceso muere a mitad del lote—
 * se pierde el informe, que es gratis de rehacer, y no las llamadas ya pagadas
 * ni la exportacion de los textos, que no lo son.
 */
export async function evaluarLote(
  lote: BatchActivity[],
  etiquetas: Map<string, Level | null>,
  umbrales: Thresholds,
  io: EvaluarIO,
): Promise<Metrics> {
  const respuestas = await io.consultar();

  const porId = new Map(respuestas.map((r) => [r.id, r]));
  const filas: EvaluatedActivity[] = lote.map((a) => ({
    id: a.id,
    quality: a.quality,
    humano: etiquetas.get(a.id) ?? null,
    jev: porId.get(a.id)?.nivel ?? null,
  }));

  const metricas = computeMetrics(filas, umbrales);
  io.guardarInforme(metricas, filas, respuestas);
  return metricas;
}

/**
 * R10 + MEDIA-10 — lo ya guardado, indexado por actividad. El fichero es una
 * linea por respuesta, en orden de llegada, y se lee asi:
 *
 * - una linea ilegible se salta y se avisa, en vez de tumbar la lectura
 *   entera: eso es justo lo que deja un proceso muerto a mitad de escritura;
 * - de cada actividad se conserva la ultima linea, **salvo que degrade una
 *   respuesta buena**: un fallo posterior no borra un dato que ya teniamos
 *   (MEDIA-11). El fichero guarda las dos lineas; lo que no puede es perder
 *   la buena al leerlas.
 */
function leerRespuestasGuardadas(
  fs: FicheroIO,
  dryRun: boolean,
): Map<string, JevResult> {
  const ruta = rutaRespuestas(dryRun);
  const porId = new Map<string, JevResult>();
  if (!fs.existe(ruta)) return porId;

  let ilegibles = 0;
  for (const linea of fs.leer(ruta).split('\n')) {
    if (!linea.trim()) continue;
    let guardada: RespuestaGuardada;
    try {
      guardada = JSON.parse(linea) as RespuestaGuardada;
    } catch {
      ilegibles += 1;
      continue;
    }
    const [rehecha] = reparse([guardada]);
    const previa = porId.get(rehecha.id);
    if (previa?.estado === 'ok' && rehecha.estado !== 'ok') continue;
    porId.set(rehecha.id, rehecha);
  }
  if (ilegibles) {
    console.log(
      `[jev-backtest] ${ilegibles} linea(s) ilegibles en ${ruta}, saltadas`,
    );
  }

  return porId;
}

/**
 * ALTA-7 — reanudar sin reexportar. Cada llamada saca de la empresa el texto
 * de un cliente, asi que solo se consulta lo que falta: lo que ya tiene
 * respuesta se toma del fichero y no se vuelve a pedir nunca.
 */
async function obtenerRespuestas(
  lote: BatchActivity[],
  opciones: Options,
  env: NodeJS.ProcessEnv,
  deps: Partial<RunDeps>,
  fs: FicheroIO,
): Promise<JevResult[]> {
  const ruta = rutaRespuestas(opciones.dryRun);
  const previas = leerRespuestasGuardadas(fs, opciones.dryRun);

  if (opciones.reusarRespuestas) {
    if (!previas.size) {
      throw new Error(
        `falta ${ruta}: no hay respuestas guardadas que reutilizar`,
      );
    }
    console.log(
      `[jev-backtest] ${previas.size} respuestas cargadas de ${ruta}`,
    );
    return lote.map((a) => previas.get(a.id) ?? nuncaLlamada(a.id));
  }

  const pendientes = lote.filter((a) => necesitaLlamada(previas.get(a.id)));
  const reutilizadas = lote.length - pendientes.length;
  if (reutilizadas) {
    console.log(
      `[jev-backtest] ${reutilizadas} actividades ya respondidas en ${ruta}: no se vuelven a consultar`,
    );
  }

  const nuevas = new Map(
    (
      await runBatch(pendientes, {
        fetchImpl: deps.fetchImpl ?? fetch,
        apiKey: env.JEV_API_KEY,
        dryRun: opciones.dryRun,
        respuestasEjemplo: opciones.dryRun ? leerEjemplos() : undefined,
        // MEDIA-10: una linea por actividad, en cuanto vuelve. El lote deja
        // de ser durable solo cuando esta completo.
        onRespuesta: (r) => fs.anadir(ruta, `${JSON.stringify(r)}\n`),
      })
    ).map((r) => [r.id, r]),
  );

  return lote.map(
    (a) => nuevas.get(a.id) ?? previas.get(a.id) ?? nuncaLlamada(a.id),
  );
}

function leerEjemplos(): unknown[] {
  const fichero = JSON.parse(readFileSync(RUTA_EJEMPLOS, 'utf8')) as {
    respuestas: unknown[];
  };
  return fichero.respuestas;
}

/** Conserva la parte escrita a mano del informe y reemplaza solo la generada. */
export function mergeReport(previo: string, informe: string): string {
  const corte = previo.indexOf(MARCA_INFORME);
  const humano =
    corte >= 0 ? previo.slice(0, corte) : previo ? `${previo}\n\n` : '';
  return `${humano}${MARCA_INFORME}\n\n${informe}`;
}

const pct = (v: number | null): string =>
  v === null ? 'n/d' : `${(v * 100).toFixed(1)}%`;

const num = (v: number | null): string => (v === null ? 'n/d' : v.toFixed(3));

/**
 * MEDIA-7 — concentracion del lote, anonimizada. El informe se versiona en
 * progress/, asi que aqui no entra ningun `seller_id`: solo recuentos y un
 * indice arbitrario que se asigna al imprimir.
 */
function seccionVendedores(lote: LoteGuardado): string[] {
  const spread = sellerSpread(lote.orden);
  return [
    '## Reparto por vendedor en el lote (R11, anonimizado)',
    '',
    `- Vendedores distintos: ${spread.vendedores}`,
    `- Fraccion del que mas aporta: ${pct(spread.fraccionMayor)} (${spread.mayor} de ${lote.orden.length})`,
    `- Reparto, de mayor a menor: ${
      spread.reparto.length
        ? spread.reparto.map((n, i) => `vendedor ${i + 1}: ${n}`).join(', ')
        : 'lote vacio'
    }`,
    '',
    'El indice es arbitrario y se asigna al imprimir: desde aqui no se vuelve',
    'al vendedor real. Sirve para leer si el veredicto generaliza o solo',
    'describe a una o dos personas: cuanto mas concentrado el lote, menos',
    'dice la tasa de falsos 100 sobre la formula.',
    '',
  ];
}

const tablaMatriz = (m: number[][], titulo: string): string =>
  [
    `| ${titulo} | 1 | 2 | 3 | 4 |`,
    '| --- | ---: | ---: | ---: | ---: |',
    ...m.map((fila, i) => `| director ${i + 1} | ${fila.join(' | ')} |`),
  ].join('\n');

/** R11 — el informe. R8 exige el detalle por actividad, que va al final. */
export function renderReport(
  m: Metrics,
  filas: EvaluatedActivity[],
  respuestas: JevResult[],
  lote: LoteGuardado,
  opciones: Options,
): string {
  const porId = new Map(respuestas.map((r) => [r.id, r]));
  const v = m.veredicto;

  return [
    '# Informe — backtest de calidad de Jev (F77)',
    '',
    `- Generado: ${new Date().toISOString()}`,
    `- Modo: ${opciones.dryRun ? 'SECO (respuestas de ejemplo, R10)' : 'real contra la API'}`,
    `- Semilla de aleatorizacion: ${lote.semilla}`,
    `- Candidatas leidas: ${lote.candidatas}`,
    `- Excluidas por R3 (cuatro campos vacios): ${lote.excluidas}`,
    `- Actividades del lote: ${m.total}`,
    `- Sin etiqueta del director: ${m.sinEtiqueta}`,
    `- Sin respuesta de Jev (R9): ${m.sinRespuesta}`,
    '',
    ...(lote.desviaciones.length
      ? [
          '## Desviaciones de la estratificacion de R2',
          '',
          ...lote.desviaciones.map((d) => `- ${d}`),
          '',
        ]
      : ['## Desviaciones de la estratificacion de R2', '', 'Ninguna.', '']),
    '## Veredicto (R13)',
    '',
    `**${v.positivo ? 'POSITIVO' : 'NEGATIVO'}**`,
    '',
    `- Umbral usado, minimo de falsos 100 detectados: ${pct(v.minFalsos100Detectados)}`,
    `- Umbral usado, maximo de buenos degradados: ${pct(v.maxBuenosDegradados)}`,
    `- Falsos 100 que Jev situa en nivel 1 o 2: ${pct(v.fraccionDetectada)}`,
    `- Buenos (director 3 o 4) que Jev tumba a 1 o 2: ${pct(v.fraccionDegradados)} (${v.degradados} de ${v.buenos})`,
    '',
    ...(v.motivos.length
      ? [
          'Motivos del veredicto negativo:',
          '',
          ...v.motivos.map((x) => `- ${x}`),
          '',
        ]
      : []),
    '## Tasa de falsos 100 (R12)',
    '',
    `- Actividades con quality = 100 etiquetadas: ${m.falsos100.conQuality100}`,
    `- De esas, el director tumba a nivel 1 o 2: ${m.falsos100.falsos100} (${pct(m.falsos100.tasaFalsos100)})`,
    `- De esos falsos 100, Jev tambien los situa en 1 o 2: ${m.falsos100.detectadosPorJev} (${pct(m.falsos100.fraccionDetectada)})`,
    `- Falsos 100 sin respuesta de Jev, contados como no detectados: ${m.falsos100.falsos100SinRespuesta}`,
    '',
    ...seccionVendedores(lote),
    '## Matriz de confusion: director contra Jev (R11)',
    '',
    tablaMatriz(m.matrizJev, 'jev →'),
    '',
    `Pares comparables: ${m.paresJev}`,
    '',
    '## Matriz de confusion: director contra el quality actual (R11)',
    '',
    'El quality actual se normaliza a los cuatro niveles con la tabla de D3.',
    '',
    tablaMatriz(m.matrizQuality, 'quality →'),
    '',
    '## Las tres cifras de acuerdo (D5)',
    '',
    `- Acuerdo exacto: ${pct(m.acuerdoExacto)}`,
    `- Acuerdo adyacente (hasta un nivel de diferencia): ${pct(m.acuerdoAdyacente)}`,
    `- Correlacion de Spearman: ${num(m.spearman)}`,
    '',
    'Ninguna de las tres decide el veredicto: lo decide la tasa de falsos 100.',
    ...(m.paresJev === 0
      ? [
          '',
          '**n/d**: no hay ni un solo par comparable, porque ninguna actividad',
          'etiquetada por el director tiene respuesta de Jev. Las tres cifras no',
          'se han podido medir; no son un cero.',
        ]
      : []),
    ...(m.paresJev > 0 && m.spearman === null
      ? [
          '',
          '**n/d en Spearman**: hay pares comparables, pero una de las dos',
          'series es constante — todas las actividades comparadas llevan el',
          'mismo nivel por un lado. Sobre una serie constante la correlacion no',
          'existe; no es que sea nula.',
        ]
      : []),
    '',
    '## Detalle por actividad (R8)',
    '',
    '| # | quality | director | jev | confianza | distribucion | estado | motivo |',
    '| ---: | ---: | ---: | ---: | ---: | --- | --- | --- |',
    ...filas.map((f, i) => {
      const r = porId.get(f.id);
      const dist = r?.distribucion
        ? r.distribucion.map((p) => p.toFixed(2)).join(' / ')
        : '—';
      // BAJA-14: el motivo separa "nunca se consulto" de "se consulto y
      // fallo". La primera es un lote incompleto; la segunda, un dato.
      const motivo = r?.motivo ?? (r ? '—' : MOTIVO_NUNCA_LLAMADA);
      return `| ${i + 1} | ${f.quality} | ${f.humano ?? '—'} | ${f.jev ?? '—'} | ${r?.confianza ?? '—'} | ${dist} | ${r?.estado ?? 'sin_respuesta'} | ${motivo} |`;
    }),
    '',
    '## Limitaciones declaradas',
    '',
    '- 50 actividades no dan potencia estadistica para un intervalo estrecho (D2).',
    '  Si el resultado cae cerca de los umbrales en vez de claramente a un lado,',
    '  lo correcto es ampliar el lote, no forzar el veredicto.',
    '- El texto libre puede contener nombres propios escritos por el vendedor',
    '  dentro de la frase. No se filtra: es el riesgo residual que aprueba R4 (D6).',
    '',
  ].join('\n');
}

/**
 * R4 — la aprobacion protege todo lo que saca texto comercial de la base, no
 * solo la llamada a la API: `extraer` ya deja 50 textos de clientes en disco.
 * La unica exencion es `evaluar --dry-run`, que no lee produccion ni llama a
 * la API porque trabaja contra el fichero de respuestas de ejemplo (R10).
 * Cualquier fase que no se reconozca la exige tambien: falla cerrado.
 */
export function necesitaAprobacion(opciones: Options): boolean {
  return !(opciones.fase === 'evaluar' && opciones.dryRun);
}

export async function main(
  argv: string[],
  env: NodeJS.ProcessEnv,
  deps: Partial<RunDeps> = {},
): Promise<number> {
  try {
    const opciones = parseArgs(argv);
    if (necesitaAprobacion(opciones)) {
      requireApproval(env);
    }

    switch (opciones.fase) {
      case 'extraer':
        return await faseExtraer(opciones, env, deps);
      case 'evaluar':
        return await faseEvaluar(opciones, env, deps);
      default:
        throw new Error(`fase desconocida: ${opciones.fase}`);
    }
  } catch (e) {
    console.error(`[jev-backtest] ${(e as Error).message}`);
    return 1;
  }
}

if (require.main === module) {
  void main(process.argv.slice(2), process.env).then((codigo) =>
    process.exit(codigo),
  );
}
