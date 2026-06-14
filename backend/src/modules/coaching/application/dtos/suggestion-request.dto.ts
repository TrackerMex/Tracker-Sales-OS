import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestionRequestDto {
  @ApiProperty({ example: 'Llamada' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 'Agendar demo del producto' })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ example: 'Transportes del Norte SA' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional({ example: 'Negociación' })
  @IsOptional()
  @IsIn([
    'Prospecto',
    'Contactado',
    'Interesado',
    'Propuesta',
    'Negociación',
    'Cierre',
    'Perdido',
  ])
  dealStage?: string;

  @ApiPropertyOptional({ example: 'Ing. Martínez' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: 'b3f1c2d4-...' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  sellerId?: string;
}
