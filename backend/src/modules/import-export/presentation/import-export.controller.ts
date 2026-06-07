import { Controller, Get, Post, Body, UseGuards, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { ExportDataUseCase } from '../application/use-cases/export-data.use-case';
import { ImportDataUseCase } from '../application/use-cases/import-data.use-case';
import { ImportDataDto } from '../application/dtos/import-data.dto';

@ApiTags('import-export')
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportExportController {
  constructor(
    private readonly exportData: ExportDataUseCase,
    private readonly importData: ImportDataUseCase,
  ) {}

  @Get('export')
  @Roles(UserRole.Admin)
  async exportAll(@Res() res: Response) {
    const data = await this.exportData.execute();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=tracker-export.json');
    return res.json(data);
  }

  @Post('import')
  @Roles(UserRole.Admin)
  async importAll(@Body() dto: ImportDataDto) {
    return this.importData.execute(dto);
  }
}
