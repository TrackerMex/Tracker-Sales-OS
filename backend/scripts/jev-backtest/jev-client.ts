// R4, R5, R8 — frontera de confianza y construccion de la peticion.
// Logica pura: decide que sale de la organizacion, pero no lo envia.

import { LEVELS, Level, TextFields } from './types';

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

// ---------------------------------------------------------------------------
// R8, R9, R10 — consulta, reintentos y modo seco.
// La red entra por `fetchImpl` y la espera por `sleep`: asi el reintento se
// prueba sin abrir conexiones ni esperar de verdad.
// ---------------------------------------------------------------------------

export interface JevParsed {
  nivel: Level;
  /** Distribucion de probabilidades sobre los cuatro niveles, si la manda. */
  distribucion: number[] | null;
  confianza: number | null;
}

export interface JevResult {
  id: string;
  estado: 'ok' | 'sin_respuesta';
  nivel: Level | null;
  distribucion: number[] | null;
  confianza: number | null;
  /** Por que no hubo respuesta. Solo presente cuando estado es sin_respuesta. */
  motivo?: string;
}

export interface AskOptions {
  fetchImpl: typeof fetch;
  apiKey: string;
  sleep?: (ms: number) => Promise<void>;
  /** R9: tres reintentos sobre el primer intento. */
  maxReintentos?: number;
  baseEsperaMs?: number;
}

export type BatchOptions = Omit<AskOptions, 'apiKey'> & {
  apiKey?: string;
  /** R10: resuelve contra respuestas de ejemplo, sin tocar la red. */
  dryRun?: boolean;
  respuestasEjemplo?: unknown[];
};

/** Codigos que R9 manda reintentar. Cualquier otro error no se reintenta. */
const REINTENTABLES = new Set([429, 529]);

const esperaReal = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

const sinRespuesta = (id: string, motivo: string): JevResult => ({
  id,
  estado: 'sin_respuesta',
  nivel: null,
  distribucion: null,
  confianza: null,
  motivo,
});

function aNivel(valor: unknown): Level | null {
  if (typeof valor === 'number' && valor >= 1 && valor <= 4) {
    return valor as Level;
  }
  if (typeof valor === 'string') {
    const porTexto = LEVELS.findIndex((l) => l === valor.trim());
    if (porTexto >= 0) return (porTexto + 1) as Level;
    const n = Number(valor);
    if (n >= 1 && n <= 4) return n as Level;
  }
  return null;
}

/**
 * Lee la respuesta de la API. La forma exacta no esta verificada contra la API
 * real (nadie la ha llamado todavia): si no encaja devuelve null y la actividad
 * queda como `sin_respuesta`, que es ruidoso y revisable, en vez de inventarse
 * un nivel que falsearia el veredicto.
 */
export function parseJevResponse(
  json: unknown,
  clave: string = QUESTION_KEY,
): JevParsed | null {
  const raiz = (json ?? {}) as Record<string, unknown>;
  const contenedor = (raiz.questions ?? raiz) as Record<string, unknown>;
  const pregunta = contenedor[clave] as Record<string, unknown> | undefined;
  if (!pregunta) return null;

  const nivel = aNivel(pregunta.answer);
  if (!nivel) return null;

  const distribucion: unknown =
    pregunta.probabilities ?? pregunta.distribution ?? null;

  return {
    nivel,
    distribucion: Array.isArray(distribucion)
      ? (distribucion as number[])
      : null,
    confianza:
      typeof pregunta.confidence === 'number' ? pregunta.confidence : null,
  };
}

/** R8 + R9 — una actividad, con reintento exponencial sobre 429 y 529. */
export async function askJev(
  actividad: TextFields & { id: string },
  opciones: AskOptions,
): Promise<JevResult> {
  const maxReintentos = opciones.maxReintentos ?? 3;
  const base = opciones.baseEsperaMs ?? 1000;
  const sleep = opciones.sleep ?? esperaReal;
  const cuerpo = JSON.stringify(buildRequestBody(actividad));

  for (let intento = 0; intento <= maxReintentos; intento++) {
    if (intento > 0) await sleep(base * 2 ** (intento - 1));

    let respuesta: Response;
    try {
      respuesta = await opciones.fetchImpl(JEV_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opciones.apiKey}`,
        },
        body: cuerpo,
      });
    } catch (e) {
      return sinRespuesta(
        actividad.id,
        `fallo de red: ${(e as Error).message}`,
      );
    }

    if (REINTENTABLES.has(respuesta.status)) continue;
    if (!respuesta.ok) {
      return sinRespuesta(actividad.id, `HTTP ${respuesta.status}`);
    }

    const parsed = parseJevResponse(await respuesta.json());
    return parsed
      ? { id: actividad.id, estado: 'ok', ...parsed }
      : sinRespuesta(actividad.id, 'respuesta sin la forma esperada');
  }

  return sinRespuesta(
    actividad.id,
    `agotados ${maxReintentos} reintentos con codigo reintentable`,
  );
}

/**
 * R9 + R10 — recorre el lote en serie. Una actividad que falla no aborta el
 * resto: queda como `sin_respuesta` y el lote sigue.
 */
export async function runBatch(
  lote: (TextFields & { id: string })[],
  opciones: BatchOptions,
): Promise<JevResult[]> {
  const resultados: JevResult[] = [];

  for (const [i, actividad] of lote.entries()) {
    if (opciones.dryRun) {
      const ejemplos = opciones.respuestasEjemplo ?? [];
      const ejemplo = ejemplos.length ? ejemplos[i % ejemplos.length] : null;
      const parsed = ejemplo ? parseJevResponse(ejemplo) : null;
      resultados.push(
        parsed
          ? { id: actividad.id, estado: 'ok', ...parsed }
          : sinRespuesta(actividad.id, 'sin respuesta de ejemplo utilizable'),
      );
      continue;
    }

    if (!opciones.apiKey) {
      throw new Error('JEV_API_KEY no esta en el entorno');
    }
    resultados.push(
      await askJev(actividad, { ...opciones, apiKey: opciones.apiKey }),
    );
  }

  return resultados;
}
