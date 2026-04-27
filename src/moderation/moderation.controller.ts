import { Controller, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString } from 'class-validator';

class BanUserDto {
  @IsString() reason: string;
}

@Controller()
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('dj/rooms/:roomId/users/:userId/ban')
  ban(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
    @Body() dto: BanUserDto,
    @Request() req,
  ) {
    return this.moderation.banUserFromRoom(roomId, userId, req.user.id, dto.reason);
  }
}
