// R6, R7 — aleatorizacion con semilla y fichero de etiquetado a ciegas.
// Logica pura: construye y lee cadenas, no toca el disco.

import { BatchActivity, LEVELS, Level, TextFields } from './types';

/** Semilla por defecto. Se registra en el informe para poder reproducir. */
export const DEFAULT_SEED = 77;

/** PRNG determinista (mulberry32): misma semilla, misma secuencia. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates con semilla. Devuelve una copia; no altera la entrada. */
export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const random = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const campo = (valor: string | null): string =>
  valor && valor.trim() ? valor : '(sin texto)';

const CHECKBOXES = '[ ] 1  [ ] 2  [ ] 3  [ ] 4';

/**
 * R6 — fichero que recibe el director. Solo los cuatro campos de texto y una
 * casilla por nivel. Sin el `quality` actual, sin la salida del modelo, sin el
 * vendedor y sin la franja de la que sale cada actividad: si viera cualquiera
 * de esas cosas la comparacion mediria su memoria, no su juicio (D4).
 *
 * La posicion en el fichero es la unica clave: el orden ya viene aleatorizado
 * con `shuffleWithSeed` y se persiste aparte para volver a unir las filas.
 */
export function buildLabelingFile(
  batch: TextFields[],
  seed: number = DEFAULT_SEED,
): string {
  const cabecera = [
    '# Etiquetado a ciegas — lote del backtest de Jev (F77)',
    '',
    `Semilla: ${seed}`,
    '',
    'Una sola pasada, sin volver atrás a revisar: se busca el primer juicio,',
    'el de lectura. Marca con [x] un nivel por actividad.',
    '',
    'Escala:',
    '',
    ...LEVELS.map((texto, i) => `${i + 1}. ${texto}`),
    '',
  ];

  const bloques = batch.map((a, i) =>
    [
      '---',
      '',
      `## ${i + 1}`,
      '',
      `- Resumen: ${campo(a.summary)}`,
      `- Descubrimiento: ${campo(a.discovery)}`,
      `- Acuerdo: ${campo(a.agreement)}`,
      `- Siguiente paso: ${campo(a.next_step)}`,
      '',
      `Nivel: ${CHECKBOXES}`,
      '',
    ].join('\n'),
  );

  return [cabecera.join('\n'), ...bloques].join('\n');
}

export interface LabelRow {
  /** Posicion en el fichero de etiquetado, empezando en 1. */
  orden: number;
  /** Nivel marcado, o null si el director dejo la actividad sin marcar. */
  nivel: Level | null;
}

/** Lee el fichero ya marcado por el director y devuelve un nivel por posicion. */
export function parseLabelingFile(contenido: string): LabelRow[] {
  const bloques = contenido.split(/^## /m).slice(1);
  return bloques.map((bloque) => {
    const orden = Number.parseInt(bloque, 10);
    const marcas = bloque.match(/\[[xX]\]\s*([1-4])/g) ?? [];
    const nivel =
      marcas.length === 1
        ? (Number.parseInt(marcas[0].replace(/\D/g, ''), 10) as Level)
        : null;
    return { orden, nivel };
  });
}

/** Une el orden aleatorizado del lote con los niveles que marco el director. */
export function joinLabels(
  ordenado: BatchActivity[],
  etiquetas: LabelRow[],
): Map<string, Level | null> {
  const porOrden = new Map(etiquetas.map((e) => [e.orden, e.nivel]));
  return new Map(ordenado.map((a, i) => [a.id, porOrden.get(i + 1) ?? null]));
}
