import { Controller, Post, Get, Param, Body, Request, UseGuards } from '@nestjs/common';
import { NowPlayingService } from './now-playing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional, IsNumber } from 'class-validator';

class SetNowPlayingDto {
  @IsString() trackId: string;
  @IsString() title: string;
  @IsString() artist: string;
  @IsOptional() @IsString() albumArtUrl?: string;
  @IsOptional() @IsNumber() durationMs?: number;
  @IsOptional() @IsString() requestId?: string;
  @IsOptional() @IsString() requesterId?: string;
}

@Controller()
export class NowPlayingController {
  constructor(private readonly nowPlaying: NowPlayingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('dj/rooms/:roomId/now-playing')
  set(@Param('roomId') roomId: string, @Body() dto: SetNowPlayingDto, @Request() req) {
    return this.nowPlaying.setNowPlaying(roomId, dto, req.user.id);
  }

  @Get('rooms/:roomId/now-playing')
  get(@Param('roomId') roomId: string) {
    return this.nowPlaying.getNowPlaying(roomId);
  }
}
