import { IsOptional, IsEnum, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, ActivityResult } from '../../domain/entities/activity.entity';

export class GetActivitiesQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() limit?: number;
  @ApiPropertyOptional({ enum: ActivityType }) @IsOptional() @IsEnum(ActivityType) type?: ActivityType;
  @ApiPropertyOptional({ enum: ActivityResult }) @IsOptional() @IsEnum(ActivityResult) result?: ActivityResult;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() date?: string;
}
