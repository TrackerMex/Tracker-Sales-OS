import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
}
