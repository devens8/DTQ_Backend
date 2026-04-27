import { Controller, Post, Body, Request, UseGuards, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString } from 'class-validator';

class CreateBoostDto {
  @IsString() roomId: string;
  @IsString() requestId: string;
  @IsString() boostType: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('boost')
  createBoost(@Body() dto: CreateBoostDto, @Request() req) {
    return this.payments.createBoostPaymentIntent(req.user.id, dto.roomId, dto.requestId, dto.boostType);
  }

  @Post('webhook')
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    return this.payments.handleWebhook(req.rawBody, sig);
  }
}
