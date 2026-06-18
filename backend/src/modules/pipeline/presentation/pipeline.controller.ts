import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { CreateDealUseCase } from '../application/use-cases/create-deal.use-case';
import { GetPipelineBySellerUseCase } from '../application/use-cases/get-pipeline-by-seller.use-case';
import { GetPipelineTeamUseCase } from '../application/use-cases/get-pipeline-team.use-case';
import { ChangeDealStageUseCase } from '../application/use-cases/change-deal-stage.use-case';
import { GetClientDealsUseCase } from '../application/use-cases/get-client-deals.use-case';
import { CreateDealDto } from '../application/dtos/create-deal.dto';
import { ChangeStageDtoBody } from '../application/dtos/change-stage.dto';
import { AuditInterceptor } from '../infrastructure/interceptors/audit.interceptor';

@ApiTags('pipeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipeline')
export class PipelineController {
  constructor(
    private readonly createDeal: CreateDealUseCase,
    private readonly getPipelineBySeller: GetPipelineBySellerUseCase,
    private readonly getPipelineTeam: GetPipelineTeamUseCase,
    private readonly getClientDealsUC: GetClientDealsUseCase,
  ) {}

  @Get('team')
  @Roles(UserRole.Admin, UserRole.Director)
  @ApiOperation({ summary: 'Get pipeline for all sellers (Admin/Director only)' })
  getTeam() {
    return this.getPipelineTeam.execute();
  }

  @Get('seller/:id')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get pipeline grouped by stage for a seller' })
  findBySeller(@Param('id') sellerId: string) {
    return this.getPipelineBySeller.execute({ sellerId });
  }

  @Post('deals')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Create a new deal' })
  create(@Body() dto: CreateDealDto) {
    return this.createDeal.execute(dto);
  }

  @Get('client/:clientId/seller/:sellerId/deals')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get all deals for a client-seller pair' })
  getClientDeals(@Param('clientId') clientId: string, @Param('sellerId') sellerId: string) {
    return this.getClientDealsUC.execute({ clientId, sellerId });
  }
}

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly changeDealStage: ChangeDealStageUseCase) {}

  @Patch(':id/stage')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Change the stage of a deal' })
  changeStage(@Param('id') id: string, @Body() dto: ChangeStageDtoBody) {
    return this.changeDealStage.execute({ id, ...dto });
  }
}
