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
exports.RequestsController = void 0;
const common_1 = require("@nestjs/common");
const requests_service_1 = require("./requests.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const class_validator_1 = require("class-validator");
class SubmitRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitRequestDto.prototype, "trackId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitRequestDto.prototype, "source", void 0);
class RejectDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectDto.prototype, "reason", void 0);
let RequestsController = class RequestsController {
    constructor(requests) {
        this.requests = requests;
    }
    submit(roomId, dto, req) {
        return this.requests.submitRequest(roomId, req.user.id, dto.trackId, dto.source);
    }
    getQueue(roomId, req) {
        return this.requests.getQueue(roomId, req.user?.id);
    }
    withdraw(roomId, reqId, req) {
        return this.requests.withdrawRequest(reqId, req.user.id);
    }
    accept(roomId, reqId, req) {
        return this.requests.acceptRequest(reqId, req.user.id);
    }
    reject(roomId, reqId, dto, req) {
        return this.requests.rejectRequest(reqId, req.user.id, dto.reason);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('rooms/:roomId/requests'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SubmitRequestDto, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "submit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)('rooms/:roomId/requests'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getQueue", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('rooms/:roomId/requests/:reqId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Param)('reqId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "withdraw", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('dj/rooms/:roomId/requests/:reqId/accept'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Param)('reqId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "accept", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('dj/rooms/:roomId/requests/:reqId/reject'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Param)('reqId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, RejectDto, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "reject", null);
exports.RequestsController = RequestsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map