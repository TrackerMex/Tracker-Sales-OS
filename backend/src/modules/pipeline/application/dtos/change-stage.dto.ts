import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { LossReason } from '../../domain/entities/deal.entity';

export class ChangeStageDtoBody {
  @ApiProperty({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  @IsNotEmpty()
  newStage: PipelineStage;

  @ApiProperty() @IsString() @IsNotEmpty() changedBy: string;

  @ApiPropertyOptional({ enum: ['precio', 'competencia', 'sin_respuesta', 'timing', 'otro'] })
  @IsOptional()
  @IsIn(['precio', 'competencia', 'sin_respuesta', 'timing', 'otro'])
  lossReason?: LossReason;
}
