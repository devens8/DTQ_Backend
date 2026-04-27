import { Controller, Post, Delete, Param, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { VotesService } from './votes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rooms/:roomId/requests/:reqId/vote')
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  cast(@Param('roomId') roomId: string, @Param('reqId') reqId: string, @Request() req) {
    return this.votes.castVote(reqId, req.user.id, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('roomId') roomId: string, @Param('reqId') reqId: string, @Request() req) {
    return this.votes.removeVote(reqId, req.user.id, roomId);
  }
}
