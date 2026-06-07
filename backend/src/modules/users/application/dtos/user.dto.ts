import { ApiProperty, ApiQuery } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../auth/domain/entities/user.entity';

export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() username: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty({ nullable: true }) sellerId: string | null;
  @ApiProperty() active: boolean;
  @ApiProperty() createdAt: Date;
}

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateUserDto {
  @IsString() @IsNotEmpty() @MinLength(3) username: string;
  @IsString() @IsNotEmpty() @MinLength(6) password: string;
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(UserRole) role: UserRole;
  @IsOptional() @IsUUID() sellerId?: string;
}
