// R4, R5, R8 — frontera de confianza y construccion de la peticion.
// Logica pura: decide que sale de la organizacion, pero no lo envia.

import { LEVELS, TextFields } from './types';

export const JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
export const JEV_MODEL = 'jev-latest';

/** Clave de la unica pregunta que se manda (R8). */
export const QUESTION_KEY = 'nivel';

export interface JevQuestion {
  type: 'score';
  criteria: string[];
}

export interface JevRequestBody {
  /** Los cuatro campos de texto de R5. Nada mas. */
  state: Record<'summary' | 'discovery' | 'agreement' | 'next_step', string>;
  model: string;
  questions: Record<string, JevQuestion>;
}

/**
 * R4 — el lote lleva texto comercial sobre clientes reales y sale de la
 * infraestructura de la empresa hacia un tercero. Sin la aprobacion humana
 * registrada por escrito en progress/explore_jev-backtest.md, el script no
 * construye ninguna peticion.
 */
export function requireApproval(env: NodeJS.ProcessEnv): void {
  if (!env.JEV_BACKTEST_APPROVED) {
    throw new Error(
      'JEV_BACKTEST_APPROVED no esta en el entorno: falta la aprobacion humana de R4. ' +
        'Registrala por escrito en progress/explore_jev-backtest.md antes de correr el lote.',
    );
  }
}

/**
 * R5 — recorta la fila a los cuatro campos de texto. El `id` y todo lo demas
 * (vendedor, cliente, importes, fechas) se quedan en local; la union con la
 * respuesta se hace por la posicion del lote.
 *
 * Riesgo residual declarado en D6: el texto libre puede contener nombres
 * escritos por el vendedor dentro de la frase. No se intenta filtrar con una
 * expresion regular porque no se puede hacer de forma fiable.
 */
export function buildRequestBody(actividad: TextFields): JevRequestBody {
  return {
    state: {
      summary: actividad.summary ?? '',
      discovery: actividad.discovery ?? '',
      agreement: actividad.agreement ?? '',
      next_step: actividad.next_step ?? '',
    },
    model: JEV_MODEL,
    questions: {
      [QUESTION_KEY]: { type: 'score', criteria: [...LEVELS] },
    },
  };
}
