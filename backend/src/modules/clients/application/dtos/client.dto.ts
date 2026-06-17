import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ClientSource,
  ClientType,
  PersonType,
  PipelineStage,
} from '../../domain/entities/client.entity';

export class ContactDto {
  @ApiProperty() id: string;
  @ApiProperty() clientId: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
  @ApiProperty() phone: string;
  @ApiProperty() email: string;
  @ApiProperty() isDecisionMaker: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ nullable: true }) deletedAt: Date | null;
}

export class ClientDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) domain: string | null;
  @ApiProperty({ enum: ClientType }) type: ClientType;
  @ApiProperty({ enum: PersonType }) person: PersonType;
  @ApiProperty() sellerId: string;
  @ApiProperty({ enum: ClientSource }) source: ClientSource;
  @ApiProperty({ enum: PipelineStage }) stage: PipelineStage;
  @ApiProperty() expectedAmount: number;
  @ApiProperty() units: number;
  @ApiProperty({ nullable: true }) pain: string | null;
  @ApiProperty({ nullable: true }) provider: string | null;
  @ApiProperty({ nullable: true }) nextStep: string | null;
  @ApiProperty({ nullable: true }) nextDate: string | null;
  @ApiProperty({ nullable: true }) nextTime: string | null;
  @ApiProperty({ type: [ContactDto] }) contacts: ContactDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ nullable: true }) deletedAt: Date | null;
  @ApiProperty({ nullable: true }) lastActivityAt: string | null;
  @ApiProperty() isCold: boolean;
  @ApiProperty() dataQuality: number;
}

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isDecisionMaker?: boolean = false;
}

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsEnum(ClientType)
  type: ClientType;

  @IsEnum(PersonType)
  person: PersonType;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsEnum(ClientSource)
  source: ClientSource;

  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage = PipelineStage.Prospecto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedAmount?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  units?: number = 0;

  @IsOptional()
  @IsString()
  pain?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  nextStep?: string;

  @IsOptional()
  @IsString()
  nextDate?: string;

  @IsOptional()
  @IsString()
  nextTime?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];
}

export class GetClientsQueryDto {
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsUUID()
  seller?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  cold?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  incomplete?: boolean;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsEnum(PersonType)
  person?: PersonType;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  units?: number;

  @IsOptional()
  @IsString()
  pain?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  nextStep?: string;

  @IsOptional()
  @IsString()
  nextDate?: string;

  @IsOptional()
  @IsString()
  nextTime?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];
}

export class RequestUserDto {
  id: string;
  role: string;
  sellerId: string | null;
}
