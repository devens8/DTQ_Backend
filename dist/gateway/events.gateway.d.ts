import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
export declare class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly redis;
    server: Server;
    private readonly logger;
    constructor(redis: RedisService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(data: {
        roomId: string;
        token?: string;
        userId?: string;
    }, client: Socket): Promise<void>;
    handleDJJoin(data: {
        roomId: string;
    }, client: Socket): Promise<void>;
    handleLeaveRoom(data: {
        roomId: string;
    }, client: Socket): Promise<void>;
    handleHeartbeat(data: {
        roomId: string;
        userId?: string;
    }, client: Socket): void;
    broadcastQueueUpdate(roomId: string, queue: any[]): void;
    broadcastNowPlaying(roomId: string, track: any): void;
    broadcastToRoom(roomId: string, event: string, data: any): void;
    broadcastToDJ(roomId: string, event: string, data: any): void;
    notifyUser(userId: string, event: string, data: any): void;
    broadcastRoomClosed(roomId: string): void;
}
