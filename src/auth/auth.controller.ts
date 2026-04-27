import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IsOptional, IsString, MaxLength } from 'class-validator';

class AnonymousDto {
  @IsString()
  fingerprint: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  displayName?: string;
}

class DJLoginDto {
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('anonymous')
  async anonymous(@Body() dto: AnonymousDto) {
    return this.authService.createAnonymousSession(dto.fingerprint, dto.displayName);
  }

  @Post('dj')
  async djLogin(@Body() dto: DJLoginDto) {
    return this.authService.createDJSession(dto.email, dto.displayName);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return req.user;
  }
}
