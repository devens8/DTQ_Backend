import { RoomsService } from './rooms.service';
declare class CreateRoomDto {
    name?: string;
    venueId?: string;
    settings?: any;
}
declare class SetModeDto {
    mode: string;
}
export declare class RoomsController {
    private readonly rooms;
    constructor(rooms: RoomsService);
    create(dto: CreateRoomDto, req: any): Promise<import("../entities/room.entity").Room>;
    getState(code: string, req: any): Promise<any>;
    setMode(id: string, dto: SetModeDto, req: any): Promise<import("../entities/room.entity").Room>;
    close(id: string, req: any): Promise<void>;
}
export {};
