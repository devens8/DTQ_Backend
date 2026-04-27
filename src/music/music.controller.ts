import { Controller, Get, Query, Param } from '@nestjs/common';
import { MusicService } from './music.service';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

class SearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  limit?: number;
}

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('search')
  search(@Query() query: SearchQueryDto) {
    return this.musicService.searchTracks(query.q, query.limit || 10);
  }

  @Get('track/:id')
  getTrack(@Param('id') id: string) {
    return this.musicService.getTrack(id);
  }
}
