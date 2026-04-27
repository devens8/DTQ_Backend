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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayHistory = void 0;
const typeorm_1 = require("typeorm");
const room_entity_1 = require("./room.entity");
const song_request_entity_1 = require("./song-request.entity");
let PlayHistory = class PlayHistory {
};
exports.PlayHistory = PlayHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PlayHistory.prototype, "trackId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PlayHistory.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PlayHistory.prototype, "artist", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'dj' }),
    __metadata("design:type", String)
], PlayHistory.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], PlayHistory.prototype, "totalVotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlayHistory.prototype, "playedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_entity_1.Room, { eager: false }),
    __metadata("design:type", room_entity_1.Room)
], PlayHistory.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => song_request_entity_1.SongRequest, { nullable: true, eager: false }),
    __metadata("design:type", song_request_entity_1.SongRequest)
], PlayHistory.prototype, "songRequest", void 0);
exports.PlayHistory = PlayHistory = __decorate([
    (0, typeorm_1.Entity)('play_history')
], PlayHistory);
//# sourceMappingURL=play-history.entity.js.map