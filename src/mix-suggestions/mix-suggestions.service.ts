import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MixSuggestion } from '../entities/mix-suggestion.entity';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class MixSuggestionsService {
  constructor(
    @InjectRepository(MixSuggestion) private repo: Repository<MixSuggestion>,
    private gateway: EventsGateway,
  ) {}

  async suggest(
    roomId: string,
    userId: string,
    fromTrackId: string,
    fromTitle: string,
    toTrackId: string,
    toTitle: string,
  ): Promise<MixSuggestion> {
    const suggestion = this.repo.create({
      room: { id: roomId } as any,
      suggester: { id: userId } as any,
      fromTrackId,
      fromTitle,
      toTrackId,
      toTitle,
      voteCount: 1,
      status: 'pending',
    });

    const saved = await this.repo.save(suggestion);
    this.gateway.broadcastToDJ(roomId, 'new_mix_suggestion', saved);
    return saved;
  }

  async vote(suggestionId: string, userId: string): Promise<void> {
    const suggestion = await this.repo.findOne({ where: { id: suggestionId } });
    if (!suggestion) throw new NotFoundException('Suggestion not found');
    suggestion.voteCount += 1;
    await this.repo.save(suggestion);
  }

  async getForRoom(roomId: string, limit = 10): Promise<MixSuggestion[]> {
    return this.repo.find({
      where: { room: { id: roomId }, status: 'pending' },
      order: { voteCount: 'DESC', suggestedAt: 'DESC' },
      take: limit,
      relations: ['suggester'],
    });
  }
}
