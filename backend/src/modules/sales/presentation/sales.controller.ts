import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { CreateSaleUseCase } from '../application/use-cases/create-sale.use-case';
import { GetSalesUseCase } from '../application/use-cases/get-sales.use-case';
import { UpdateSaleUseCase } from '../application/use-cases/update-sale.use-case';
import { DeleteSaleUseCase } from '../application/use-cases/delete-sale.use-case';
import { CreateSaleDto } from '../application/dtos/create-sale.dto';
import { UpdateSaleDto } from '../application/dtos/update-sale.dto';
import { SaleFiltersDto } from '../application/dtos/sale-filters.dto';
import { SaleResponseDto } from '../application/dtos/sale-response.dto';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(
    private readonly createSale: CreateSaleUseCase,
    private readonly getSales: GetSalesUseCase,
    private readonly updateSaleUseCase: UpdateSaleUseCase,
    private readonly deleteSaleUseCase: DeleteSaleUseCase,
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

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Director)
  async updateSale(
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
  ): Promise<SaleResponseDto> {
    return this.updateSaleUseCase.execute({ saleId: id, data: dto });
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Director)
  @HttpCode(204)
  async deleteSale(@Param('id') id: string): Promise<void> {
    return this.deleteSaleUseCase.execute(id);
  }
}
