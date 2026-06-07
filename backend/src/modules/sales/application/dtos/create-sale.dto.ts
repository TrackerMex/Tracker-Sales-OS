import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsIn,
  IsInt,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, SaleSource, SaleType } from '../../domain/entities/sale.entity';

export class CreateSaleDto {
  @ApiProperty() @IsUUID() sellerId: string;

  @ApiProperty() @IsUUID() clientId: string;

  @ApiProperty() @IsString() @IsNotEmpty() clientName: string;

  @ApiProperty({ enum: ['Nuevo', 'Existente'] })
  @IsIn(['Nuevo', 'Existente'])
  clientType: 'Nuevo' | 'Existente';

  @ApiProperty() @IsString() @IsNotEmpty() product: string;

  @ApiProperty() @IsInt() @Min(1) units: number;

  @ApiProperty() @IsNumber() @Min(0) amount: number;

  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) pay: PaymentMethod;

  @ApiProperty({ enum: SaleSource }) @IsEnum(SaleSource) source: SaleSource;

  @ApiProperty() @IsDateString() date: string;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

  @ApiProperty({ enum: SaleType }) @IsEnum(SaleType) type: SaleType;
}
