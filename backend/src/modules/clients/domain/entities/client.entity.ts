import { BaseEntity } from '../../../../core/domain/base.entity';

export enum ClientType {
  Nuevo = 'Nuevo',
  Existente = 'Existente',
  Prospecto = 'Prospecto',
}

export enum PersonType {
  Moral = 'Moral',
  Fisica = 'Física',
}

export enum PipelineStage {
  Prospecto = 'Prospecto',
  Contactado = 'Contactado',
  Interesado = 'Interesado',
  Propuesta = 'Propuesta',
  Negociacion = 'Negociación',
  Cierre = 'Cierre',
  Perdido = 'Perdido',
}

export enum ClientSource {
  ProspeccionPropia = 'Prospección propia',
  ClienteExistente = 'Cliente existente',
  Referido = 'Referido',
  Expo = 'Expo',
  Marketing = 'Marketing',
  LinkedIn = 'LinkedIn',
  Web = 'Web',
  DireccionComercial = 'Dirección Comercial',
}

export class ContactEntity extends BaseEntity {
  clientId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isDecisionMaker: boolean;
}

export class ClientEntity extends BaseEntity {
  name: string;
  domain: string | null;
  type: ClientType;
  person: PersonType;
  sellerId: string;
  source: ClientSource;
  stage: PipelineStage;
  expectedAmount: number;
  units: number;
  pain: string | null;
  provider: string | null;
  nextStep: string | null;
  nextDate: string | null;
  nextTime: string | null;
  contacts: ContactEntity[];
}
