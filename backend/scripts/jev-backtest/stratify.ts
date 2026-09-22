// R1, R2, R3 — extraccion y estratificacion del lote. Logica pura: recibe las
// filas ya leidas y no habla ni con la base de datos ni con la red.

import { BatchActivity, Franja, SourceActivity, TextFields } from './types';

/**
 * Consulta de solo lectura de R1. Se queda con las actividades mas recientes:
 * el backtest mide el comportamiento actual de la formula de `quality`, no su
 * historia. La estratificacion de R2 se hace en memoria sobre este candidato.
 */
export const BATCH_QUERY = `
SELECT id, quality, seller_id, summary, discovery, agreement, next_step
FROM activities
WHERE deleted_at IS NULL
ORDER BY executed_at DESC
LIMIT $1
`;

/** Tamano del candidato que pide BATCH_QUERY. */
export const CANDIDATE_LIMIT = 2000;

/** Reparto del lote fijado por R2 (y justificado en D2). */
export const BATCH_TARGETS: Record<Franja, number> = {
  alta: 25,
  media: 15,
  baja: 10,
};

/** Franja inmediatamente superior desde la que se completa un faltante (R2). */
const SUPERIOR: Record<Franja, Franja | null> = {
  alta: null,
  media: 'alta',
  baja: 'media',
};

export interface StratifyResult {
  batch: BatchActivity[];
  /** Desviaciones respecto al reparto de R2, para el informe de R8/R11. */
  deviations: string[];
  /** Actividades descartadas por R3. */
  excluded: number;
}

const blank = (v: string | null | undefined): boolean => !v || !v.trim();

/** R3: los cuatro campos de texto vacios o a NULL simultaneamente. */
export function isEmptyActivity(a: TextFields): boolean {
  return (
    blank(a.summary) &&
    blank(a.discovery) &&
    blank(a.agreement) &&
    blank(a.next_step)
  );
}

/** R2: franja a la que pertenece un `quality`, o null si no cae en ninguna. */
export function classify(quality: number): Franja | null {
  if (quality === 100) return 'alta';
  if (quality >= 40 && quality <= 80) return 'media';
  if (quality <= 20) return 'baja';
  return null;
}

export function stratify(
  activities: SourceActivity[],
  targets: Record<Franja, number> = BATCH_TARGETS,
): StratifyResult {
  const usable = activities.filter((a) => !isEmptyActivity(a));
  const pools: Record<Franja, SourceActivity[]> = {
    alta: [],
    media: [],
    baja: [],
  };
  for (const a of usable) {
    const franja = classify(a.quality);
    if (franja) pools[franja].push(a);
  }

  const batch: BatchActivity[] = [];
  const deviations: string[] = [];
  const take = (from: Franja, n: number, slot: Franja): number => {
    const rows = pools[from].splice(0, n);
    for (const row of rows) batch.push({ ...row, franja: slot });
    return rows.length;
  };

  // De arriba abajo: la franja alta se sirve primero y lo que sobra queda
  // disponible para completar la media, y la media para la baja.
  for (const franja of ['alta', 'media', 'baja'] as Franja[]) {
    const objetivo = targets[franja];
    const faltan = objetivo - take(franja, objetivo, franja);
    if (faltan <= 0) continue;

    const superior = SUPERIOR[franja];
    if (!superior) {
      deviations.push(
        `franja ${franja}: faltaban ${faltan} actividades, sin franja superior de donde completar`,
      );
      continue;
    }
    const completadas = take(superior, faltan, franja);
    deviations.push(
      `franja ${franja}: faltaban ${faltan} actividades, completadas ${completadas} desde la franja ${superior}`,
    );
  }

  return { batch, deviations, excluded: activities.length - usable.length };
}

export interface SellerSpread {
  /** Vendedores distintos representados en el lote. */
  vendedores: number;
  /** Recuento por vendedor, de mayor a menor. Sin identificadores. */
  reparto: number[];
  /** Actividades del vendedor que mas aporta. */
  mayor: number;
  /** mayor sobre el total del lote; null si el lote esta vacio. */
  fraccionMayor: number | null;
}

/**
 * MEDIA-7 — concentracion del lote por vendedor. El candidato son las
 * actividades mas recientes, sin control de diversidad, asi que un lote puede
 * salir concentrado en una o dos personas; con el, la tasa de falsos 100
 * describiria a esas personas y no a la formula, y el veredicto no
 * generalizaria.
 *
 * Devuelve solo recuentos: el indice del reparto es la posicion en el orden
 * descendente y no hay camino de vuelta al vendedor. El informe esta
 * versionado, asi que ningun `seller_id` puede acabar en el.
 */
export function sellerSpread(batch: { seller_id: string }[]): SellerSpread {
  const porVendedor = new Map<string, number>();
  for (const a of batch) {
    porVendedor.set(a.seller_id, (porVendedor.get(a.seller_id) ?? 0) + 1);
  }

  const reparto = [...porVendedor.values()].sort((x, y) => y - x);
  const mayor = reparto[0] ?? 0;

  return {
    vendedores: porVendedor.size,
    reparto,
    mayor,
    fraccionMayor: batch.length ? mayor / batch.length : null,
  };
}
