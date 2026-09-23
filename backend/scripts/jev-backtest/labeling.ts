// R6, R7 — aleatorizacion con semilla y fichero de etiquetado a ciegas.
// Logica pura: construye y lee cadenas, no toca el disco.

import { BatchActivity, LEVELS, Level, TextFields } from './types';

/**
 * Semilla por defecto. Se registra en el lote y en el informe para poder
 * reproducir.
 *
 * Vive en este modulo por historia, no por diseño: `stratify` usa la misma
 * semilla para decidir **que** se muestrea dentro de cada franja (D12), no
 * solo en que orden lo ve el director. Quien la cambie pensando unicamente en
 * el orden del etiquetado cambiara tambien el lote. Si algun dia
 * `shuffleWithSeed` se muda a un modulo neutro, DEFAULT_SEED se va con ella.
 */
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

/**
 * R6 + MEDIA-5 — comprueba que lo que devuelve el director es el mismo lote
 * que se le dio. El fichero se trocea por `## `, y el texto libre lo escriben
 * vendedores: una linea que empiece asi crea un bloque fantasma y, si su
 * numero choca con una posicion real, la etiqueta buena se pierde sin ruido.
 *
 * Devuelve la lista de problemas, vacia si todo cuadra. Quien llama aborta:
 * una hora de etiquetado mal leida en silencio es peor que una corrida que
 * se para.
 */
export function validarEtiquetado(
  etiquetas: LabelRow[],
  totalLote: number,
): string[] {
  const problemas: string[] = [];

  if (etiquetas.length !== totalLote) {
    problemas.push(
      `el fichero trae ${etiquetas.length} bloques y el lote tiene ${totalLote} actividades`,
    );
  }

  const vistas = new Map<number, number>();
  for (const e of etiquetas) {
    vistas.set(e.orden, (vistas.get(e.orden) ?? 0) + 1);
  }

  const repetidas = [...vistas.entries()]
    .filter(([, n]) => n > 1)
    .map(([orden]) => orden);
  if (repetidas.length) {
    problemas.push(`posiciones repetidas: ${repetidas.join(', ')}`);
  }

  const faltan: number[] = [];
  for (let i = 1; i <= totalLote; i++) {
    if (!vistas.has(i)) faltan.push(i);
  }
  if (faltan.length) {
    problemas.push(`faltan las posiciones: ${faltan.join(', ')}`);
  }

  const sobran = [...vistas.keys()].filter(
    (orden) => !Number.isInteger(orden) || orden < 1 || orden > totalLote,
  );
  if (sobran.length) {
    problemas.push(
      `posiciones que el lote no tiene: ${sobran
        .map((o) => (Number.isNaN(o) ? 'un bloque sin numero' : String(o)))
        .join(', ')}`,
    );
  }

  return problemas;
}

/** Une el orden aleatorizado del lote con los niveles que marco el director. */
export function joinLabels(
  ordenado: BatchActivity[],
  etiquetas: LabelRow[],
): Map<string, Level | null> {
  const porOrden = new Map(etiquetas.map((e) => [e.orden, e.nivel]));
  return new Map(ordenado.map((a, i) => [a.id, porOrden.get(i + 1) ?? null]));
}
