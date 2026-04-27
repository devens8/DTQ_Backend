import { AuthService } from './auth.service';
declare class AnonymousDto {
    fingerprint: string;
    displayName?: string;
}
declare class DJLoginDto {
    email: string;
    displayName?: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    anonymous(dto: AnonymousDto): Promise<{
        token: string;
        user: import("../entities/user.entity").User;
    }>;
    djLogin(dto: DJLoginDto): Promise<{
        token: string;
        user: import("../entities/user.entity").User;
    }>;
    me(req: any): any;
}
export {};
