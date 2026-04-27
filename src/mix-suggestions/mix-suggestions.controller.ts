import { Controller, Post, Get, Param, Body, Request, UseGuards } from '@nestjs/common';
import { MixSuggestionsService } from './mix-suggestions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString } from 'class-validator';

class SuggestDto {
  @IsString() fromTrackId: string;
  @IsString() fromTitle: string;
  @IsString() toTrackId: string;
  @IsString() toTitle: string;
}

@Controller()
export class MixSuggestionsController {
  constructor(private readonly mixes: MixSuggestionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('rooms/:roomId/mix-suggestions')
  suggest(@Param('roomId') roomId: string, @Body() dto: SuggestDto, @Request() req) {
    return this.mixes.suggest(roomId, req.user.id, dto.fromTrackId, dto.fromTitle, dto.toTrackId, dto.toTitle);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms/:roomId/mix-suggestions/:id/vote')
  vote(@Param('id') id: string, @Request() req) {
    return this.mixes.vote(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dj/rooms/:roomId/mix-suggestions')
  getForDJ(@Param('roomId') roomId: string) {
    return this.mixes.getForRoom(roomId);
  }
}
