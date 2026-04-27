import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';

class CreateRoomDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() venueId?: string;
  @IsOptional() settings?: any;
}

class SetModeDto {
  @IsString() mode: string;
}

@Controller()
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('rooms')
  create(@Body() dto: CreateRoomDto, @Request() req) {
    return this.rooms.createRoom(req.user.id, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('rooms/:code')
  getState(@Param('code') code: string, @Request() req) {
    return this.rooms.getRoomState(code, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('rooms/:id/mode')
  setMode(@Param('id') id: string, @Body() dto: SetModeDto, @Request() req) {
    return this.rooms.setMode(id, dto.mode, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('rooms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  close(@Param('id') id: string, @Request() req) {
    return this.rooms.closeRoom(id, req.user.id);
  }
}
