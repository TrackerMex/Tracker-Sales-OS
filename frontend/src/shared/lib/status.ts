// Single status → token map (DESIGN.md "Estados"). Every status color in the
// app resolves here; modules must not keep their own color maps.
// Text uses text-status-* (AA in light; equals the chart token in dark);
// tints, borders and fills keep the chart token.
//   success  chart-2      positive / won / up to date
//   progress chart-1      in progress / attention
//   pending  chart-4      pending / medium (text-foreground for contrast)
//   danger   destructive  negative / overdue / lost
//   neutral  primary      neutral / informative
export type StatusTone =
  | "success"
  | "progress"
  | "pending"
  | "danger"
  | "neutral"

/** Pill and delta badges. */
export const STATUS_BADGE_CLASS: Record<StatusTone, string> = {
  success: "bg-chart-2/10 text-status-success",
  progress: "bg-chart-1/10 text-status-progress",
  pending: "bg-chart-4/15 text-foreground",
  danger: "bg-destructive/10 text-status-danger",
  neutral: "bg-primary/10 text-primary",
}

/** Status tiles (alert rows, icon boxes): soft tint + matching border. */
export const STATUS_TILE_CLASS: Record<StatusTone, string> = {
  success: "border-chart-2/20 bg-chart-2/12 text-status-success",
  progress: "border-chart-1/20 bg-chart-1/12 text-status-progress",
  pending: "border-chart-4/30 bg-chart-4/15 text-foreground",
  danger: "border-destructive/20 bg-destructive/12 text-status-danger",
  neutral: "border-primary/20 bg-primary/12 text-primary",
}

/** Solid fills (progress bars). */
export const STATUS_FILL_CLASS: Record<StatusTone, string> = {
  success: "bg-chart-2",
  progress: "bg-chart-1",
  pending: "bg-chart-4",
  danger: "bg-destructive",
  neutral: "bg-primary",
}

const STATUS_TONE: Record<string, StatusTone> = {
  // Pipeline stages (deals and clients)
  Prospecto: "neutral",
  Contactado: "neutral",
  Interesado: "progress",
  Propuesta: "progress",
  Negociación: "progress",
  Cierre: "success",
  Perdido: "danger",
  // Tasks and activities
  Pendiente: "pending",
  "En curso": "progress",
  Completado: "success",
  Completada: "success",
  Cancelada: "danger",
  Vencida: "danger",
  // Sales (payment method; "Pendiente" is shared with tasks above)
  Pagado: "success",
  "50% anticipo": "progress",
  Crédito: "pending",
  // Sales (client type)
  Nuevo: "success",
  Existente: "neutral",
  // Seller semaphore (Mi día, dashboard)
  verde: "success",
  ambar: "pending",
  rojo: "danger",
  morado: "progress",
}

export function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? "neutral"
}
