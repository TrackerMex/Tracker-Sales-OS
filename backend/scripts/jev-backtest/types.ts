// Tipos compartidos del backtest de calidad de Jev (feature 77).
// Script de un solo uso: vive fuera de backend/src/ a proposito (D1), no entra
// en el build de Nest ni en la imagen de produccion.

/** Las tres franjas de `quality` sobre las que se estratifica el lote (R2). */
export type Franja = 'alta' | 'media' | 'baja';

/**
 * Los cuatro campos de texto de una actividad. Son los unicos datos que salen
 * de la organizacion hacia la API de TypeSafe (R5).
 */
export interface TextFields {
  summary: string | null;
  discovery: string | null;
  agreement: string | null;
  next_step: string | null;
}

/** Fila tal y como la devuelve la consulta de solo lectura de R1. */
export interface SourceActivity extends TextFields {
  id: string;
  quality: number;
  /**
   * Solo para el diagnostico de concentracion del lote (MEDIA-7). Se queda en
   * local como el `id`: no viaja a la API (R5), no aparece en el fichero del
   * director (R6) y en el informe solo sale como recuento anonimo.
   */
  seller_id: string;
}

/** Actividad ya seleccionada para el lote, con la franja que ocupa. */
export interface BatchActivity extends SourceActivity {
  franja: Franja;
}

/**
 * R7 — los cuatro niveles de la escala, literales y en orden. Son los mismos
 * textos que lee el director en el fichero de etiquetado (R6) y los mismos
 * `criteria` que recibe el modelo (R8). Un solo sitio, a proposito: si se
 * reformulan por un lado, la comparacion deja de medir lo mismo.
 */
export const LEVELS = [
  'vacío, relleno o genérico sin información del cliente',
  'describe lo ocurrido pero sin compromiso del cliente',
  'hay compromiso del cliente pero sin fecha ni responsable',
  'compromiso concreto con fecha y responsable identificados',
] as const;

/** Nivel de la escala de R7: 1 a 4. */
export type Level = 1 | 2 | 3 | 4;

/**
 * Fila lista para medir: el `quality` que tiene hoy, el nivel que le puso el
 * director a ciegas (R6) y el que devolvio Jev (R8). Cualquiera de los dos
 * puede faltar: sin etiquetar o `sin_respuesta`.
 */
export interface EvaluatedActivity {
  id: string;
  quality: number;
  humano: Level | null;
  jev: Level | null;
}
