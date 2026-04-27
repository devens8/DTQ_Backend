import {
  Controller, Get, Post, Delete, Param, Body,
  Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class SubmitRequestDto {
  @IsString() trackId: string;
  @IsOptional() @IsString() source?: string;
}

class RejectDto {
  @IsOptional() @IsString() reason?: string;
}

@Controller()
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('rooms/:roomId/requests')
  submit(@Param('roomId') roomId: string, @Body() dto: SubmitRequestDto, @Request() req) {
    return this.requests.submitRequest(roomId, req.user.id, dto.trackId, dto.source);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('rooms/:roomId/requests')
  getQueue(@Param('roomId') roomId: string, @Request() req) {
    return this.requests.getQueue(roomId, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('rooms/:roomId/requests/:reqId')
  @HttpCode(HttpStatus.NO_CONTENT)
  withdraw(@Param('roomId') roomId: string, @Param('reqId') reqId: string, @Request() req) {
    return this.requests.withdrawRequest(reqId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('dj/rooms/:roomId/requests/:reqId/accept')
  accept(@Param('roomId') roomId: string, @Param('reqId') reqId: string, @Request() req) {
    return this.requests.acceptRequest(reqId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('dj/rooms/:roomId/requests/:reqId/reject')
  reject(@Param('roomId') roomId: string, @Param('reqId') reqId: string, @Body() dto: RejectDto, @Request() req) {
    return this.requests.rejectRequest(reqId, req.user.id, dto.reason);
  }
}
