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
var EventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const redis_service_1 = require("../redis/redis.service");
let EventsGateway = EventsGateway_1 = class EventsGateway {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(EventsGateway_1.name);
    }
    afterInit(server) {
        try {
            const pubClient = this.redis.getClient();
            const subClient = this.redis.getSubscriber();
            if (pubClient && subClient && this.redis.isAvailable()) {
                const { createAdapter } = require('@socket.io/redis-adapter');
                server.adapter(createAdapter(pubClient, subClient));
                this.logger.log('WebSocket gateway initialized with Redis adapter');
            }
            else {
                this.logger.log('WebSocket gateway initialized (in-memory adapter)');
            }
        }
        catch (e) {
            this.logger.warn('WebSocket Redis adapter unavailable — using in-memory');
        }
    }
    handleConnection(client) {
        this.logger.debug(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }
    async handleJoinRoom(data, client) {
        const { roomId, userId } = data;
        await client.join(`room:${roomId}`);
        if (userId)
            await client.join(`user:${userId}`);
        client.emit('room_joined', { roomId, socketId: client.id });
    }
    async handleDJJoin(data, client) {
        await client.join(`room:${data.roomId}`);
        await client.join(`room:${data.roomId}:dj`);
        client.emit('dj_joined', { roomId: data.roomId });
    }
    async handleLeaveRoom(data, client) {
        await client.leave(`room:${data.roomId}`);
    }
    handleHeartbeat(data, client) {
        if (data.userId) {
            this.redis.set(`presence:${data.roomId}:${data.userId}`, '1', 90);
        }
        client.emit('heartbeat_ack', { ts: Date.now() });
    }
    broadcastQueueUpdate(roomId, queue) {
        if (!this.server)
            return;
        this.server.to(`room:${roomId}`).emit('queue_update', { queue, version: Date.now() });
    }
    broadcastNowPlaying(roomId, track) {
        if (!this.server)
            return;
        this.server.to(`room:${roomId}`).emit('now_playing', track);
    }
    broadcastToRoom(roomId, event, data) {
        if (!this.server)
            return;
        this.server.to(`room:${roomId}`).emit(event, data);
    }
    broadcastToDJ(roomId, event, data) {
        if (!this.server)
            return;
        this.server.to(`room:${roomId}:dj`).emit(event, data);
    }
    notifyUser(userId, event, data) {
        if (!this.server)
            return;
        this.server.to(`user:${userId}`).emit(event, data);
    }
    broadcastRoomClosed(roomId) {
        if (!this.server)
            return;
        this.server.to(`room:${roomId}`).emit('room_closed', { roomId });
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dj_join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleDJJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleHeartbeat", null);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:3000',
                'https://downtheque.vercel.app',
                'http://localhost:3000',
            ],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map