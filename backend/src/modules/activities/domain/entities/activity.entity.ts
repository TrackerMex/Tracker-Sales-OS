import { BaseEntity } from '../../../../core/domain/base.entity';

export enum ActivityType {
  Chat = 'Chat',
  WhatsApp = 'WhatsApp',
  Correo = 'Correo',
  Llamada = 'Llamada',
  Videoconferencia = 'Videoconferencia',
  ReunionVirtual = 'Reunión virtual',
  VisitaFisica = 'Visita física',
  ReunionPresencial = 'Reunión presencial',
  Propuesta = 'Propuesta',
  Seguimiento = 'Seguimiento',
  Cierre = 'Cierre',
}

export enum ActivityResult {
  Interesado = 'Interesado',
  NoContesto = 'No contestó',
  SolicitudPropuesta = 'Solicita propuesta',
  SolicitudReunion = 'Solicita reunión',
  Negociacion = 'Negociación',
  CierreGanado = 'Cierre ganado',
  CierrePerdido = 'Cierre perdido',
  InformacionEnviada = 'Información enviada',
}

export const TASK_POINTS: Record<ActivityType, number> = {
  [ActivityType.Chat]: 1,
  [ActivityType.WhatsApp]: 1,
  [ActivityType.Correo]: 1,
  [ActivityType.Llamada]: 3,
  [ActivityType.Videoconferencia]: 6,
  [ActivityType.ReunionVirtual]: 6,
  [ActivityType.VisitaFisica]: 10,
  [ActivityType.ReunionPresencial]: 10,
  [ActivityType.Propuesta]: 8,
  [ActivityType.Seguimiento]: 3,
  [ActivityType.Cierre]: 25,
};

export const REQUIRES_NEXT_STEP = new Set([
  ActivityType.Llamada,
  ActivityType.Videoconferencia,
  ActivityType.ReunionVirtual,
  ActivityType.VisitaFisica,
  ActivityType.ReunionPresencial,
  ActivityType.Propuesta,
]);

export class ActivityEntity extends BaseEntity {
  sellerId: string;
  clientId: string;
  contactId: string | null;
  type: ActivityType;
  result: ActivityResult;
  summary: string;
  discovery: string | null;
  agreement: string | null;
  nextStep: string | null;
  nextObjective: string | null;
  nextDate: string | null;
  nextTime: string | null;
  points: number;
  quality: number;
  executedAt: Date;
  programmedAt: Date | null;
  capturedAt: Date;
  delayMinutes: number;
}
