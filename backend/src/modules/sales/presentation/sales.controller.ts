import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { CreateSaleUseCase } from '../application/use-cases/create-sale.use-case';
import { GetSalesUseCase } from '../application/use-cases/get-sales.use-case';
import { CreateSaleDto } from '../application/dtos/create-sale.dto';
import { SaleFiltersDto } from '../application/dtos/sale-filters.dto';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(
    private readonly createSale: CreateSaleUseCase,
    private readonly getSales: GetSalesUseCase,
  ) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  create(@Body() dto: CreateSaleDto) {
    return this.createSale.execute(dto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  findAll(@Query() query: SaleFiltersDto) {
    return this.getSales.execute({
      filters: query,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
