// Entrada del backtest de calidad de Jev (feature 77). Aqui vive TODA la
// entrada/salida del script — base de datos, red y ficheros — para que la
// logica que decide el veredicto se pueda probar sin infraestructura.
//
// Uso:
//   JEV_BACKTEST_APPROVED=si JEV_BACKTEST_DATABASE_URL=postgres://solo_lectura@... \
//     npx ts-node backend/scripts/jev-backtest/run-backtest.ts --fase extraer
//
// La credencial de JEV_BACKTEST_DATABASE_URL tiene que ser un usuario con
// SELECT y nada mas sobre `activities` (D7): asi el motor, y no una revision
// de codigo, es quien garantiza que el script no escribe. No se anade a
// .env.example a proposito, no forma parte de la configuracion de la app.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { DEFAULT_SEED, buildLabelingFile, shuffleWithSeed } from './labeling';
import { requireApproval } from './jev-client';
import { BATCH_QUERY, CANDIDATE_LIMIT, stratify } from './stratify';
import { SourceActivity } from './types';

const RAIZ = resolve(__dirname, '..', '..', '..');
export const RUTA_ETIQUETADO = resolve(
  RAIZ,
  'progress',
  'jev-backtest-etiquetado.md',
);
export const RUTA_LOTE = resolve(RAIZ, 'progress', 'jev-backtest-lote.json');

export interface Options {
  fase: string;
  dryRun: boolean;
  semilla: number;
  limite: number;
  /** R13, por defecto 0.70. Bandera y no constante por exigencia de D10. */
  minFalsos100Detectados: number;
  /** R13, por defecto 0.15. */
  maxBuenosDegradados: number;
}

export interface RunDeps {
  fetchImpl: typeof fetch;
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
    semilla: numero('--semilla', DEFAULT_SEED),
    limite: numero('--limite', CANDIDATE_LIMIT),
    minFalsos100Detectados: fraccion('--min-falsos-100-detectados', 0.7),
    maxBuenosDegradados: fraccion('--max-buenos-degradados', 0.15),
  };
}

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
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(BATCH_QUERY, [limite]);
    return res.rows as SourceActivity[];
  } finally {
    await client.end();
  }
}

async function faseExtraer(
  opciones: Options,
  env: NodeJS.ProcessEnv,
): Promise<number> {
  const candidatas = await leerCandidatos(env, opciones.limite);
  const { batch, deviations, excluded } = stratify(candidatas);
  const ordenado = shuffleWithSeed(batch, opciones.semilla);

  writeFileSync(
    RUTA_ETIQUETADO,
    buildLabelingFile(ordenado, opciones.semilla),
    'utf8',
  );
  // El lote queda en local (R5): es la clave para volver a unir las respuestas
  // con la fila, y nunca se le ensena al director.
  writeFileSync(
    RUTA_LOTE,
    JSON.stringify(
      {
        semilla: opciones.semilla,
        generado: new Date().toISOString(),
        candidatas: candidatas.length,
        excluidas: excluded,
        desviaciones: deviations,
        orden: ordenado,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`[jev-backtest] lote de ${batch.length} actividades`);
  console.log(`[jev-backtest] etiquetado en ${RUTA_ETIQUETADO}`);
  for (const d of deviations) console.log(`[jev-backtest] desviacion: ${d}`);
  return 0;
}

export async function main(
  argv: string[],
  env: NodeJS.ProcessEnv,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps: Partial<RunDeps> = {},
): Promise<number> {
  try {
    const opciones = parseArgs(argv);
    // R4: la aprobacion protege todo lo que saca texto comercial de la base.
    // Solo se exime `evaluar --dry-run`, que no lee produccion ni llama a la
    // API porque trabaja contra el fichero de respuestas de ejemplo (R10).
    if (!(opciones.fase === 'evaluar' && opciones.dryRun)) {
      requireApproval(env);
    }

    switch (opciones.fase) {
      case 'extraer':
        return await faseExtraer(opciones, env);
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
