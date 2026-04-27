"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rooms_service_1 = require("./rooms.service");
const rooms_controller_1 = require("./rooms.controller");
const room_entity_1 = require("../entities/room.entity");
const venue_entity_1 = require("../entities/venue.entity");
const user_entity_1 = require("../entities/user.entity");
const song_request_entity_1 = require("../entities/song-request.entity");
const redis_module_1 = require("../redis/redis.module");
const gateway_module_1 = require("../gateway/gateway.module");
let RoomsModule = class RoomsModule {
};
exports.RoomsModule = RoomsModule;
exports.RoomsModule = RoomsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([room_entity_1.Room, venue_entity_1.Venue, user_entity_1.User, song_request_entity_1.SongRequest]), redis_module_1.RedisModule, gateway_module_1.GatewayModule],
        providers: [rooms_service_1.RoomsService],
        controllers: [rooms_controller_1.RoomsController],
        exports: [rooms_service_1.RoomsService],
    })
], RoomsModule);
//# sourceMappingURL=rooms.module.js.map