import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SellerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) profile: string | null;
  @ApiProperty({ nullable: true }) userId: string | null;
  @ApiProperty() active: boolean;
  @ApiProperty() createdAt: Date;
}

export class CreateSellerDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() profile?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() userId?: string;
}
