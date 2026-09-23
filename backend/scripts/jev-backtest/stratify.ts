// R1, R2, R3 — extraccion y estratificacion del lote. Logica pura: recibe las
// filas ya leidas y no habla ni con la base de datos ni con la red.

import { DEFAULT_SEED, shuffleWithSeed } from './labeling';
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

/**
 * D12 — el reparto entre franjas lo fija R2; dentro de cada una se elige al
 * azar con la semilla, no por fecha.
 *
 * Las filas llegan en `ORDER BY executed_at DESC`, asi que recortar sin
 * barajar se queda con las mas recientes y entrega la franja a quien mas ha
 * escrito ultimamente. Medido en la primera extraccion real: el vendedor mas
 * prolifico era el 46.9% de los `quality = 100` de la poblacion y el 80% del
 * lote. Como los falsos 100 se miden solo sobre esa franja, el veredicto
 * habria descrito a una persona y no al equipo.
 *
 * Se baraja con `shuffleWithSeed`, el mismo generador que ordena el fichero de
 * etiquetado (R6), a proposito: una sola barajadura con semilla en el script.
 * La semilla ya se registra en el lote, asi que el resultado sigue siendo
 * reproducible — misma semilla, mismo lote.
 */
export function stratify(
  activities: SourceActivity[],
  semilla: number = DEFAULT_SEED,
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
  // Antes de recortar: asi tanto el corte como el relleno desde la franja
  // superior toman al azar y no las primeras.
  for (const franja of ['alta', 'media', 'baja'] as Franja[]) {
    pools[franja] = shuffleWithSeed(pools[franja], semilla);
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

export interface ComparacionConcentracion {
  /** Fraccion, en las candidatas, del vendedor que mas aporta a las candidatas. */
  enCandidatas: number | null;
  /** Fraccion de ESE MISMO vendedor dentro del lote. */
  enLote: number | null;
  /** Puntos que el muestreo le anadio (positivo) o le quito (negativo). */
  diferenciaPuntos: number | null;
}

/**
 * MEDIA-15 — cuanta concentracion anadio el muestreo, siguiendo a **una sola
 * persona** entre los dos ambitos.
 *
 * Restar dos maximos sobre vendedores compara a gente distinta y ademas
 * infla siempre, porque el maximo de una muestra esta sesgado al alza: medido
 * sobre 400 semillas con 6 vendedores parejos al 16.7%, un muestreo
 * demostrablemente justo daba +10.3 puntos de media y ni una sola lectura
 * negativa. Emparejar por quien encabeza el LOTE no lo arregla —da lo mismo,
 * porque elegir al primero de la muestra ya selecciona la fluctuacion al alza—
 * asi que la referencia se toma del lado que no es muestra: quien mas aporta a
 * las candidatas. Con esa referencia la media cae a +0.3 y 223 de 400 lecturas
 * salen negativas, que es lo que tiene que hacer un numero honesto.
 *
 * No emite identidades: el informe esta versionado. El empate se resuelve por
 * el id menor, solo para que el resultado sea reproducible.
 */
export function compararConcentracion(
  candidatas: { seller_id: string }[],
  lote: { seller_id: string }[],
): ComparacionConcentracion {
  const vacia = { enCandidatas: null, enLote: null, diferenciaPuntos: null };
  if (!candidatas.length || !lote.length) return vacia;

  const cuentas = new Map<string, number>();
  for (const a of candidatas) {
    cuentas.set(a.seller_id, (cuentas.get(a.seller_id) ?? 0) + 1);
  }
  const referencia = [...cuentas.entries()].sort(
    (x, y) => y[1] - x[1] || x[0].localeCompare(y[0]),
  )[0][0];

  const enCandidatas = (cuentas.get(referencia) ?? 0) / candidatas.length;
  const enLote =
    lote.filter((a) => a.seller_id === referencia).length / lote.length;

  return {
    enCandidatas,
    enLote,
    diferenciaPuntos: (enLote - enCandidatas) * 100,
  };
}
