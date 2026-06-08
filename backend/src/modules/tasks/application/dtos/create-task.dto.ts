import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty() @IsUUID() sellerId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  @ApiProperty() @IsDateString() scheduledAt: string;
}
