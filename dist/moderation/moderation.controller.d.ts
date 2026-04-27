import { ModerationService } from './moderation.service';
declare class BanUserDto {
    reason: string;
}
export declare class ModerationController {
    private readonly moderation;
    constructor(moderation: ModerationService);
    ban(roomId: string, userId: string, dto: BanUserDto, req: any): Promise<void>;
}
export {};
