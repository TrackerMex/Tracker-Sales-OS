import { IsUUID, IsNumber, IsOptional, IsEnum, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export class CreateDealDto {
  @ApiProperty() @IsUUID() clientId: string;

  @ApiProperty() @IsUUID() sellerId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: PipelineStage })
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  opportunityName?: string;
}
