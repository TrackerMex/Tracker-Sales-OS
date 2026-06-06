import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto, LoginResponseDto } from '../application/dtos/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // TODO: inject LoginUseCase (feature 02-auth)
  @Post('login')
  login(@Body() _dto: LoginDto): LoginResponseDto {
    throw new Error('Not implemented — pending feature 02-auth');
  }
}
