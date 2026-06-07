import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  role: string;
  sellerId?: string | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class ClientDto {
  id?: string;
  name: string;
  domain?: string | null;
  type: string;
  person: string;
  sellerId: string;
  source: string;
  stage?: string;
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
  stage: string;
  amount?: number;
  probability?: number;
  stageHistory?: any[];
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
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class ActivityDto {
  id?: string;
  sellerId: string;
  clientId: string;
  contactId?: string | null;
  type: string;
  result: string;
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
  clientType: string;
  product: string;
  units: number;
  amount: number;
  pay: string;
  source: string;
  type: string;
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
