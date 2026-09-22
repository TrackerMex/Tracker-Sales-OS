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
}

/** Actividad ya seleccionada para el lote, con la franja que ocupa. */
export interface BatchActivity extends SourceActivity {
  franja: Franja;
}
