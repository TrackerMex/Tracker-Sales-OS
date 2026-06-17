import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { PaymentMethod, SaleSource } from '../../domain/entities/sale.entity';

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsIn(['Nuevo', 'Existente'])
  clientType?: 'Nuevo' | 'Existente';

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  units?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  pay?: PaymentMethod;

  @IsOptional()
  @IsEnum(SaleSource)
  source?: SaleSource;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
