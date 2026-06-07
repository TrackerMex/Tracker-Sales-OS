import { IsString, MinLength } from 'class-validator';
import { UserRole } from '../../domain/entities/user.entity';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginUserDto {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  sellerId: string | null;
}

export class LoginResponseDto {
  accessToken: string;
  user: LoginUserDto;
}
