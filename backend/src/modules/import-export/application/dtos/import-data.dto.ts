import { IsArray, IsOptional } from 'class-validator';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import {
  ClientSource,
  ClientType,
  PersonType,
  PipelineStage,
} from '../../../clients/domain/entities/client.entity';
import { StageHistoryEntry } from '../../../pipeline/domain/entities/deal.entity';
import { TaskStatus } from '../../../tasks/domain/entities/task.entity';
import {
  ActivityResult,
  ActivityType,
} from '../../../activities/domain/entities/activity.entity';
import {
  PaymentMethod,
  SaleSource,
  SaleType,
} from '../../../sales/domain/entities/sale.entity';

class SellerDto {
  id?: string;
  name: string;
  profile?: string | null;
  userId?: string | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class UserDto {
  id?: string;
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  sellerId?: string | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class ClientDto {
  id?: string;
  name: string;
  domain?: string | null;
  type: ClientType;
  person: PersonType;
  sellerId: string;
  source: ClientSource;
  stage?: PipelineStage;
  expectedAmount?: number;
  units?: number;
  pain?: string | null;
  provider?: string | null;
  nextStep?: string | null;
  nextDate?: string | null;
  nextTime?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class ContactDto {
  id?: string;
  clientId: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  isDecisionMaker?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class DealDto {
  id?: string;
  clientId: string;
  sellerId: string;
  stage: PipelineStage;
  amount?: number;
  probability?: number;
  stageHistory?: StageHistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

class TaskDto {
  id?: string;
  sellerId: string;
  clientId?: string | null;
  title: string;
  description?: string | null;
  scheduledAt: Date;
  completedAt?: Date | null;
  status?: TaskStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

class ActivityDto {
  id?: string;
  sellerId: string;
  clientId: string;
  contactId?: string | null;
  type: ActivityType;
  result: ActivityResult;
  summary: string;
  discovery?: string | null;
  agreement?: string | null;
  nextStep?: string | null;
  nextDate?: string | null;
  nextTime?: string | null;
  points?: number;
  quality?: number;
  executedAt: Date;
  programmedAt?: Date | null;
  capturedAt: Date;
  delayMinutes?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class SaleDto {
  id?: string;
  sellerId: string;
  clientId: string;
  clientName: string;
  clientType: 'Nuevo' | 'Existente';
  product: string;
  units: number;
  amount: number;
  pay: PaymentMethod;
  source: SaleSource;
  type: SaleType;
  date: Date;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class SettingDto {
  id?: string;
  key: string;
  value: object;
  updatedAt?: Date;
}

export class ImportDataDto {
  @IsOptional() @IsArray() sellers?: SellerDto[];
  @IsOptional() @IsArray() users?: UserDto[];
  @IsOptional() @IsArray() clients?: ClientDto[];
  @IsOptional() @IsArray() contacts?: ContactDto[];
  @IsOptional() @IsArray() deals?: DealDto[];
  @IsOptional() @IsArray() tasks?: TaskDto[];
  @IsOptional() @IsArray() activities?: ActivityDto[];
  @IsOptional() @IsArray() sales?: SaleDto[];
  @IsOptional() @IsArray() settings?: SettingDto[];
}
