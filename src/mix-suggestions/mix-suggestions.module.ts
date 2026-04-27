import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MixSuggestionsService } from './mix-suggestions.service';
import { MixSuggestionsController } from './mix-suggestions.controller';
import { MixSuggestion } from '../entities/mix-suggestion.entity';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([MixSuggestion]), GatewayModule],
  providers: [MixSuggestionsService],
  controllers: [MixSuggestionsController],
})
export class MixSuggestionsModule {}
