"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const votes_service_1 = require("./votes.service");
const votes_controller_1 = require("./votes.controller");
const vote_entity_1 = require("../entities/vote.entity");
const song_request_entity_1 = require("../entities/song-request.entity");
const room_entity_1 = require("../entities/room.entity");
const redis_module_1 = require("../redis/redis.module");
const gateway_module_1 = require("../gateway/gateway.module");
let VotesModule = class VotesModule {
};
exports.VotesModule = VotesModule;
exports.VotesModule = VotesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([vote_entity_1.Vote, song_request_entity_1.SongRequest, room_entity_1.Room]), redis_module_1.RedisModule, gateway_module_1.GatewayModule],
        providers: [votes_service_1.VotesService],
        controllers: [votes_controller_1.VotesController],
        exports: [votes_service_1.VotesService],
    })
], VotesModule);
//# sourceMappingURL=votes.module.js.map