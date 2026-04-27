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
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const room_entity_1 = require("../entities/room.entity");
const DEMO_DJS = [
    { id: 'dj-0000-0001-0000-000000000001', email: 'vikram@dtq.demo', displayName: 'DJ Vikram' },
    { id: 'dj-0000-0002-0000-000000000002', email: 'priya@dtq.demo', displayName: 'DJ Priya' },
    { id: 'dj-0000-0003-0000-000000000003', email: 'arjun@dtq.demo', displayName: 'DJ Arjun' },
];
const DEMO_ROOMS = [
    { id: 'rm-00000000-0000-0000-0000-000000000001', code: 'FIRE01', name: 'Main Stage', djIdx: 0 },
    { id: 'rm-00000000-0000-0000-0000-000000000002', code: 'VIBE42', name: 'Rooftop Lounge', djIdx: 1 },
    { id: 'rm-00000000-0000-0000-0000-000000000003', code: 'DESI24', name: 'Dance Floor', djIdx: 2 },
    { id: 'rm-00000000-0000-0000-0000-000000000004', code: 'BANG22', name: 'VIP Room', djIdx: 0 },
    { id: 'rm-00000000-0000-0000-0000-000000000005', code: 'BASS77', name: 'After Party', djIdx: 1 },
];
let SeedService = SeedService_1 = class SeedService {
    constructor(userRepo, roomRepo) {
        this.userRepo = userRepo;
        this.roomRepo = roomRepo;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async onApplicationBootstrap() {
        await this.seedDJs();
        await this.seedRooms();
    }
    async seedDJs() {
        for (const dj of DEMO_DJS) {
            const exists = await this.userRepo.findOne({ where: { id: dj.id } });
            if (!exists) {
                await this.userRepo.save(this.userRepo.create({
                    id: dj.id,
                    type: 'dj',
                    email: dj.email,
                    displayName: dj.displayName,
                    avatarSeed: dj.id.slice(0, 8),
                    badges: [],
                }));
                this.logger.log(`Seeded DJ: ${dj.displayName}`);
            }
        }
    }
    async seedRooms() {
        for (const room of DEMO_ROOMS) {
            const exists = await this.roomRepo.findOne({ where: { code: room.code } });
            if (!exists) {
                const dj = { id: DEMO_DJS[room.djIdx].id };
                await this.roomRepo.save(this.roomRepo.create({
                    id: room.id,
                    code: room.code,
                    qrToken: `qr-${room.code.toLowerCase()}`,
                    name: room.name,
                    status: 'active',
                    mode: 'normal',
                    settings: {},
                    dj,
                }));
                this.logger.log(`Seeded room: ${room.code} — ${room.name}`);
            }
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map