import { Module } from '@nestjs/common';
import { PipelineController, DealsController } from './presentation/pipeline.controller';

@Module({
  controllers: [PipelineController, DealsController],
  providers: [],
  exports: [],
})
export class PipelineModule {}
