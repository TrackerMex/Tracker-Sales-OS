import { IsEnum, IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, ActivityResult } from '../../domain/entities/activity.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export class CreateActivityDto {
  @ApiProperty() @IsUUID() sellerId: string;
  @ApiProperty() @IsUUID() clientId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() contactId?: string;
  @ApiProperty({ enum: ActivityType }) @IsEnum(ActivityType) type: ActivityType;
  @ApiProperty({ enum: ActivityResult }) @IsEnum(ActivityResult) result: ActivityResult;
  @ApiProperty() @IsString() @IsNotEmpty() summary: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discovery?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agreement?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nextStep?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nextObjective?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nextDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nextTime?: string;
  @ApiProperty() @IsDateString() executedAt: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() programmedAt?: string;
  @ApiPropertyOptional({ enum: PipelineStage }) @IsOptional() @IsEnum(PipelineStage) stage?: PipelineStage;
}
