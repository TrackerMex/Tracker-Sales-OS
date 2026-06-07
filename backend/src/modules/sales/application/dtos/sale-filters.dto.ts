import { IsOptional, IsString, Matches, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleType } from '../../domain/entities/sale.entity';
import { Type } from 'class-transformer';

export class SaleFiltersDto {
  @ApiPropertyOptional({ description: 'Format: YYYY-MM' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in format YYYY-MM' })
  month?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ enum: SaleType })
  @IsOptional()
  @IsEnum(SaleType)
  type?: SaleType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
