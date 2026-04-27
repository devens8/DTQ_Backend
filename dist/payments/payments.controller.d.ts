import { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
declare class CreateBoostDto {
    roomId: string;
    requestId: string;
    boostType: string;
}
export declare class PaymentsController {
    private readonly payments;
    constructor(payments: PaymentsService);
    createBoost(dto: CreateBoostDto, req: any): Promise<{
        clientSecret: string;
        paymentIntentId: string;
        amountCents: number;
    }>;
    webhook(req: RawBodyRequest<Request>, sig: string): Promise<void>;
}
export {};
