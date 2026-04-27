import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class AuthService {
    private userRepo;
    private jwtService;
    constructor(userRepo: Repository<User>, jwtService: JwtService);
    createAnonymousSession(fingerprint: string, displayName?: string): Promise<{
        token: string;
        user: User;
    }>;
    createDJSession(email: string, displayName: string): Promise<{
        token: string;
        user: User;
    }>;
    validateToken(token: string): Promise<User | null>;
}
