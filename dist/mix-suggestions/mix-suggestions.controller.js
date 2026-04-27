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
exports.MixSuggestionsController = void 0;
const common_1 = require("@nestjs/common");
const mix_suggestions_service_1 = require("./mix-suggestions.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const class_validator_1 = require("class-validator");
class SuggestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestDto.prototype, "fromTrackId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestDto.prototype, "fromTitle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestDto.prototype, "toTrackId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestDto.prototype, "toTitle", void 0);
let MixSuggestionsController = class MixSuggestionsController {
    constructor(mixes) {
        this.mixes = mixes;
    }
    suggest(roomId, dto, req) {
        return this.mixes.suggest(roomId, req.user.id, dto.fromTrackId, dto.fromTitle, dto.toTrackId, dto.toTitle);
    }
    vote(id, req) {
        return this.mixes.vote(id, req.user.id);
    }
    getForDJ(roomId) {
        return this.mixes.getForRoom(roomId);
    }
};
exports.MixSuggestionsController = MixSuggestionsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('rooms/:roomId/mix-suggestions'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SuggestDto, Object]),
    __metadata("design:returntype", void 0)
], MixSuggestionsController.prototype, "suggest", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('rooms/:roomId/mix-suggestions/:id/vote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MixSuggestionsController.prototype, "vote", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('dj/rooms/:roomId/mix-suggestions'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MixSuggestionsController.prototype, "getForDJ", null);
exports.MixSuggestionsController = MixSuggestionsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [mix_suggestions_service_1.MixSuggestionsService])
], MixSuggestionsController);
//# sourceMappingURL=mix-suggestions.controller.js.map