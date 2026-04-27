import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://downtheque.vercel.app',
      'http://localhost:3000',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly redis: RedisService) {}

  afterInit(server: Server) {
    try {
      const pubClient = this.redis.getClient();
      const subClient = this.redis.getSubscriber();
      if (pubClient && subClient && this.redis.isAvailable()) {
        const { createAdapter } = require('@socket.io/redis-adapter');
        server.adapter(createAdapter(pubClient, subClient));
        this.logger.log('WebSocket gateway initialized with Redis adapter');
      } else {
        this.logger.log('WebSocket gateway initialized (in-memory adapter)');
      }
    } catch (e) {
      this.logger.warn('WebSocket Redis adapter unavailable — using in-memory');
    }
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; token?: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = data;
    await client.join(`room:${roomId}`);
    if (userId) await client.join(`user:${userId}`);
    client.emit('room_joined', { roomId, socketId: client.id });
  }

  @SubscribeMessage('dj_join')
  async handleDJJoin(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`room:${data.roomId}`);
    await client.join(`room:${data.roomId}:dj`);
    client.emit('dj_joined', { roomId: data.roomId });
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`room:${data.roomId}`);
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @MessageBody() data: { roomId: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.userId) {
      this.redis.set(`presence:${data.roomId}:${data.userId}`, '1', 90);
    }
    client.emit('heartbeat_ack', { ts: Date.now() });
  }

  // ── Broadcast helpers — all guard against uninitialized server ──

  broadcastQueueUpdate(roomId: string, queue: any[]) {
    if (!this.server) return;
    this.server.to(`room:${roomId}`).emit('queue_update', { queue, version: Date.now() });
  }

  broadcastNowPlaying(roomId: string, track: any) {
    if (!this.server) return;
    this.server.to(`room:${roomId}`).emit('now_playing', track);
  }

  broadcastToRoom(roomId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`room:${roomId}`).emit(event, data);
  }

  broadcastToDJ(roomId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`room:${roomId}:dj`).emit(event, data);
  }

  notifyUser(userId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastRoomClosed(roomId: string) {
    if (!this.server) return;
    this.server.to(`room:${roomId}`).emit('room_closed', { roomId });
  }
}
