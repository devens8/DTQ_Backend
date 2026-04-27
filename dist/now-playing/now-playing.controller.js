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
exports.NowPlayingController = void 0;
const common_1 = require("@nestjs/common");
const now_playing_service_1 = require("./now-playing.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const class_validator_1 = require("class-validator");
class SetNowPlayingDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetNowPlayingDto.prototype, "trackId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetNowPlayingDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetNowPlayingDto.prototype, "artist", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetNowPlayingDto.prototype, "albumArtUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SetNowPlayingDto.prototype, "durationMs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetNowPlayingDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetNowPlayingDto.prototype, "requesterId", void 0);
let NowPlayingController = class NowPlayingController {
    constructor(nowPlaying) {
        this.nowPlaying = nowPlaying;
    }
    set(roomId, dto, req) {
        return this.nowPlaying.setNowPlaying(roomId, dto, req.user.id);
    }
    get(roomId) {
        return this.nowPlaying.getNowPlaying(roomId);
    }
};
exports.NowPlayingController = NowPlayingController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('dj/rooms/:roomId/now-playing'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetNowPlayingDto, Object]),
    __metadata("design:returntype", void 0)
], NowPlayingController.prototype, "set", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId/now-playing'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NowPlayingController.prototype, "get", null);
exports.NowPlayingController = NowPlayingController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [now_playing_service_1.NowPlayingService])
], NowPlayingController);
//# sourceMappingURL=now-playing.controller.js.map