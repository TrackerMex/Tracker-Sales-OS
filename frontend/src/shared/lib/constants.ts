export const TASK_POINTS = {
  Chat: 1,
  WhatsApp: 1,
  Correo: 1,
  Llamada: 3,
  Videoconferencia: 6,
  'Reunión virtual': 6,
  'Visita física': 10,
  'Reunión presencial': 10,
  Propuesta: 8,
  Seguimiento: 3,
  Cierre: 25,
} as const;

export type ActivityType = keyof typeof TASK_POINTS;

export const ACTIVITY_TYPES = Object.keys(TASK_POINTS) as ActivityType[];

export const REQUIRES_NEXT_STEP: ActivityType[] = [
  'Llamada',
  'Videoconferencia',
  'Reunión virtual',
  'Visita física',
  'Reunión presencial',
  'Propuesta',
];

export const PIPELINE_STAGES = [
  'Prospecto',
  'Contactado',
  'Interesado',
  'Propuesta',
  'Negociación',
  'Cierre',
  'Perdido',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  Prospecto: 5,
  Contactado: 15,
  Interesado: 30,
  Propuesta: 50,
  Negociación: 70,
  Cierre: 90,
  Perdido: 0,
};

export const DAILY_MIN_POINTS = 30;
export const DAILY_CALLS_GOAL = 10;
export const DAILY_TASKS_GOAL = 5;
export const DAILY_PROSPECTS_GOAL = 2;
