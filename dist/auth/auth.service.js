"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const uuid_1 = require("uuid");
const ADJECTIVES = ['Funky', 'Cosmic', 'Electric', 'Neon', 'Groovy', 'Stellar', 'Velvet', 'Bass', 'Wild', 'Midnight'];
const NOUNS = ['Panda', 'Phoenix', 'Vibe', 'Groove', 'Wave', 'Spark', 'Beat', 'Pulse', 'Echo', 'Storm'];
function generateDisplayName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 99) + 1;
    return `${adj}${noun}${num}`;
}
let AuthService = class AuthService {
    constructor(userRepo, jwtService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
    }
    async createAnonymousSession(fingerprint, displayName) {
        let user = await this.userRepo.findOne({ where: { fingerprint } });
        if (!user) {
            user = this.userRepo.create({
                fingerprint,
                type: 'attendee',
                displayName: displayName || generateDisplayName(),
                avatarSeed: (0, uuid_1.v4)().slice(0, 8),
                badges: [],
            });
            user = await this.userRepo.save(user);
        }
        else if (displayName && displayName !== user.displayName) {
            user.displayName = displayName;
            user = await this.userRepo.save(user);
        }
        const token = this.jwtService.sign({ sub: user.id, type: user.type, fingerprint });
        return { token, user };
    }
    async createDJSession(email, displayName) {
        let user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            user = this.userRepo.create({
                email,
                type: 'dj',
                displayName: displayName || `DJ ${(0, uuid_1.v4)().slice(0, 6).toUpperCase()}`,
                avatarSeed: (0, uuid_1.v4)().slice(0, 8),
                badges: [],
            });
            user = await this.userRepo.save(user);
        }
        const token = this.jwtService.sign({ sub: user.id, type: user.type });
        return { token, user };
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            return this.userRepo.findOne({ where: { id: payload.sub } });
        }
        catch {
            return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map