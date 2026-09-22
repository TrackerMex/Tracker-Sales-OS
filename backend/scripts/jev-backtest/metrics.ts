// R11, R12, R13 — metricas del informe y veredicto del gate. Logica pura: aqui
// es donde un error silencioso falsearia la decision, asi que todo lo que
// decide esta en funciones sin red, sin disco y sin base de datos.

import { EvaluatedActivity, Level } from './types';

/** [nivel del director, nivel con el que se compara]. */
export type LevelPair = [Level, Level];

/** Los niveles que significan "registro pobre" en las dos condiciones de R13. */
const POBRES: Level[] = [1, 2];
const esPobre = (n: Level | null): boolean => n !== null && POBRES.includes(n);

/**
 * D3 — correspondencia entre el `quality` actual y los cuatro niveles.
 * 0-20 → 1, 40 → 2, 60-80 → 3, 100 → 4.
 */
export function normalizeQuality(quality: number): Level {
  if (quality >= 100) return 4;
  if (quality >= 60) return 3;
  if (quality >= 40) return 2;
  return 1;
}

/**
 * Pares comparables. Una fila sin etiqueta del director no se puede comparar
 * con nada, y una `sin_respuesta` de Jev no se puede comparar con Jev; el
 * `quality` actual, en cambio, siempre existe.
 */
export function pairsWith(
  filas: EvaluatedActivity[],
  contra: 'jev' | 'quality',
): LevelPair[] {
  const pares: LevelPair[] = [];
  for (const f of filas) {
    if (f.humano === null) continue;
    if (contra === 'quality') {
      pares.push([f.humano, normalizeQuality(f.quality)]);
    } else if (f.jev !== null) {
      pares.push([f.humano, f.jev]);
    }
  }
  return pares;
}

/** R11 — matriz 4x4: filas el nivel del director, columnas el comparado. */
export function confusionMatrix(pares: LevelPair[]): number[][] {
  const m = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  for (const [humano, otro] of pares) m[humano - 1][otro - 1] += 1;
  return m;
}

const fraccion = (n: number, total: number): number =>
  total === 0 ? 0 : n / total;

/** R11, cifra 1 — fraccion de pares donde los dos niveles coinciden. */
export function exactAgreement(pares: LevelPair[]): number {
  return fraccion(pares.filter(([a, b]) => a === b).length, pares.length);
}

/** R11, cifra 2 — fraccion de pares que difieren como mucho en un nivel. */
export function adjacentAgreement(pares: LevelPair[]): number {
  return fraccion(
    pares.filter(([a, b]) => Math.abs(a - b) <= 1).length,
    pares.length,
  );
}

/** Rangos con promedio en los empates, que es lo que exige Spearman. */
function ranks(values: number[]): number[] {
  const orden = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const salida = new Array<number>(values.length).fill(0);
  let i = 0;
  while (i < orden.length) {
    let j = i;
    while (j + 1 < orden.length && orden[j + 1].v === orden[i].v) j += 1;
    const rango = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) salida[orden[k].i] = rango;
    i = j + 1;
  }
  return salida;
}

/**
 * R11, cifra 3 — Spearman sobre los rangos. Es la cifra que importa si lo que
 * se va a usar es un promedio por vendedor y no el valor individual (D5).
 * Devuelve 0 si una de las dos series es constante: no hay correlacion que
 * medir, no es que sea nula.
 */
export function spearman(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const media = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = media(rx);
  const my = media(ry);

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < rx.length; i++) {
    const dx = rx[i] - mx;
    const dy = ry[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

export interface FalseHundredStats {
  /** Actividades con quality = 100 que el director llego a etiquetar. */
  conQuality100: number;
  /** De esas, las que el director tumba a nivel 1 o 2: los falsos 100. */
  falsos100: number;
  /** R12 — fraccion de falsos 100 sobre el total de quality = 100. */
  tasaFalsos100: number | null;
  /** Falsos 100 que Jev tambien situa en nivel 1 o 2. */
  detectadosPorJev: number;
  /** Falsos 100 para los que Jev no contesto; cuentan como no detectados. */
  falsos100SinRespuesta: number;
  /** R12 — detectadosPorJev sobre falsos100. */
  fraccionDetectada: number | null;
}

/**
 * R12 — la cifra que origino el plan: cuantos registros que hoy puntuan 100
 * son en realidad pobres, y cuantos de esos ve Jev.
 *
 * Un falso 100 sin respuesta de Jev cuenta como no detectado: Jev no lo situo
 * en nivel 1 o 2, que es lo que mide la condicion. Se publica aparte para que
 * el lector pueda rehacer la cuenta si los fallos de red son muchos.
 */
export function falseHundreds(filas: EvaluatedActivity[]): FalseHundredStats {
  const cien = filas.filter((f) => f.quality === 100 && f.humano !== null);
  const falsos = cien.filter((f) => esPobre(f.humano));
  const detectados = falsos.filter((f) => esPobre(f.jev));
  const sinRespuesta = falsos.filter((f) => f.jev === null);

  return {
    conQuality100: cien.length,
    falsos100: falsos.length,
    tasaFalsos100: cien.length ? falsos.length / cien.length : null,
    detectadosPorJev: detectados.length,
    falsos100SinRespuesta: sinRespuesta.length,
    fraccionDetectada: falsos.length ? detectados.length / falsos.length : null,
  };
}

export interface Thresholds {
  minFalsos100Detectados: number;
  maxBuenosDegradados: number;
}

export interface Verdict extends Thresholds {
  positivo: boolean;
  /** Falsos 100 que Jev tumba, sobre el total de falsos 100. */
  fraccionDetectada: number | null;
  /** Actividades que el director etiqueta en 3 o 4. */
  buenos: number;
  /** De esas, las que Jev tumba a 1 o 2. */
  degradados: number;
  fraccionDegradados: number;
  /** Vacio si el veredicto es positivo. */
  motivos: string[];
}

const pct = (v: number): string => `${(v * 100).toFixed(1)}%`;

/**
 * R13 — el veredicto del gate. No lo deciden las tres cifras de acuerdo de
 * R11 (D5): lo deciden la deteccion de falsos 100 y su contrapartida de
 * falsos negativos. Los dos umbrales entran por parametro porque R13 exige
 * confirmarlos antes de cada corrida (D10).
 */
export function verdict(
  filas: EvaluatedActivity[],
  umbrales: Thresholds,
): Verdict {
  const falsos = falseHundreds(filas);
  const buenos = filas.filter((f) => f.humano !== null && !esPobre(f.humano));
  const degradados = buenos.filter((f) => esPobre(f.jev));
  const fraccionDegradados = fraccion(degradados.length, buenos.length);
  const motivos: string[] = [];

  if (falsos.fraccionDetectada === null) {
    motivos.push(
      'el lote no contiene falsos 100 que detectar: sin ellos la prueba no puede sostener un veredicto positivo',
    );
  } else if (falsos.fraccionDetectada < umbrales.minFalsos100Detectados) {
    motivos.push(
      `Jev situa en nivel 1 o 2 el ${pct(falsos.fraccionDetectada)} de los falsos 100, por debajo del ${pct(umbrales.minFalsos100Detectados)} exigido`,
    );
  }

  if (fraccionDegradados > umbrales.maxBuenosDegradados) {
    motivos.push(
      `Jev degrada a nivel 1 o 2 el ${pct(fraccionDegradados)} de las actividades que el director etiqueta en 3 o 4, por encima del ${pct(umbrales.maxBuenosDegradados)} admitido`,
    );
  }

  return {
    ...umbrales,
    positivo: motivos.length === 0,
    fraccionDetectada: falsos.fraccionDetectada,
    buenos: buenos.length,
    degradados: degradados.length,
    fraccionDegradados,
    motivos,
  };
}

export interface Metrics {
  total: number;
  /** Actividades que Jev no llego a contestar (R9). */
  sinRespuesta: number;
  /** Actividades que el director dejo sin etiquetar. */
  sinEtiqueta: number;
  paresJev: number;
  matrizJev: number[][];
  matrizQuality: number[][];
  acuerdoExacto: number;
  acuerdoAdyacente: number;
  spearman: number;
  falsos100: FalseHundredStats;
  veredicto: Verdict;
}

/** R11 — todo lo que imprime el informe, en una sola pasada. */
export function computeMetrics(
  filas: EvaluatedActivity[],
  umbrales: Thresholds,
): Metrics {
  const paresJev = pairsWith(filas, 'jev');
  const paresQuality = pairsWith(filas, 'quality');

  return {
    total: filas.length,
    sinRespuesta: filas.filter((f) => f.jev === null).length,
    sinEtiqueta: filas.filter((f) => f.humano === null).length,
    paresJev: paresJev.length,
    matrizJev: confusionMatrix(paresJev),
    matrizQuality: confusionMatrix(paresQuality),
    acuerdoExacto: exactAgreement(paresJev),
    acuerdoAdyacente: adjacentAgreement(paresJev),
    spearman: spearman(
      paresJev.map(([h]) => h),
      paresJev.map(([, j]) => j),
    ),
    falsos100: falseHundreds(filas),
    veredicto: verdict(filas, umbrales),
  };
}
