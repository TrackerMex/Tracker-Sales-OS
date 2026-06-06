import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../domain/entities/user.entity';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  sellerId?: string;
}
