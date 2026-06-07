import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export class ChangeStageDtoBody {
  @ApiProperty({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  @IsNotEmpty()
  newStage: PipelineStage;

  @ApiProperty() @IsString() @IsNotEmpty() changedBy: string;
}
