import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { GetSellersUseCase } from '../application/use-cases/get-sellers.use-case';
import { CreateSellerUseCase } from '../application/use-cases/create-seller.use-case';
import { DeactivateSellerUseCase } from '../application/use-cases/deactivate-seller.use-case';
import { CreateSellerDto } from '../application/dtos/seller.dto';

@ApiTags('sellers')
@ApiBearerAuth()
@Controller('sellers')
export class SellersController {
  constructor(
    private readonly getSellersUseCase: GetSellersUseCase,
    private readonly createSellerUseCase: CreateSellerUseCase,
    private readonly deactivateSellerUseCase: DeactivateSellerUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  findAll() {
    return this.getSellersUseCase.execute();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  create(@Body() dto: CreateSellerDto) {
    return this.createSellerUseCase.execute(dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  deactivate(@Param('id') id: string) {
    return this.deactivateSellerUseCase.execute(id);
  }
}
