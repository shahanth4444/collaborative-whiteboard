import { Server, Socket } from 'socket.io';

interface RoomUser {
    id: string;
    name: string;
    socketId: string;
}

// In-memory room state
const rooms: Map<string, RoomUser[]> = new Map();

function getRoomUsers(boardId: string): RoomUser[] {
    return rooms.get(boardId) || [];
}

function addUserToRoom(boardId: string, user: RoomUser): void {
    const users = getRoomUsers(boardId);
    const existing = users.findIndex(u => u.id === user.id);
    if (existing >= 0) {
        users[existing] = user;
    } else {
        users.push(user);
    }
    rooms.set(boardId, users);
}

function removeUserFromRoom(socketId: string): { boardId: string; userId: string } | null {
    for (const [boardId, users] of rooms.entries()) {
        const idx = users.findIndex(u => u.socketId === socketId);
        if (idx >= 0) {
            const userId = users[idx].id;
            users.splice(idx, 1);
            if (users.length === 0) {
                rooms.delete(boardId);
            } else {
                rooms.set(boardId, users);
            }
            return { boardId, userId };
        }
    }
    return null;
}

export function setupSocketHandlers(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Get user info from session (may be undefined for unauthenticated)
        const session = (socket.request as { session?: { passport?: { user?: string } } }).session;
        let userId = session?.passport?.user || `guest_${socket.id}`;
        let userName = 'Guest';

        // joinRoom event
        socket.on('joinRoom', async (data: { boardId: string; userName?: string }) => {
            const { boardId, userName: uName } = data;
            if (!boardId) return;

            if (uName) userName = uName;

            socket.join(boardId);

            const user: RoomUser = {
                id: userId,
                name: userName,
                socketId: socket.id,
            };

            addUserToRoom(boardId, user);

            const roomUsers = getRoomUsers(boardId).map(u => ({ id: u.id, name: u.name }));
            io.to(boardId).emit('roomUsers', { users: roomUsers });

            console.log(`User ${userName} (${userId}) joined room ${boardId}`);
        });

        // Helper to get boardId
        const resolveBoardId = (provided?: string) => {
            if (provided) return provided;
            return Array.from(socket.rooms).find(r => r !== socket.id);
        };

        // cursorMove event
        socket.on('cursorMove', (data: { boardId?: string; x: number; y: number }) => {
            const boardId = resolveBoardId(data.boardId);
            if (!boardId) return;

            socket.to(boardId).emit('cursorUpdate', {
                userId,
                x: data.x,
                y: data.y,
                name: userName,
            });
        });

        // draw event
        socket.on('draw', (data: {
            boardId?: string;
            points: number[];
            color: string;
            brushSize: number;
            tool: string;
        }) => {
            const boardId = resolveBoardId(data.boardId);
            if (!boardId) return;

            socket.to(boardId).emit('drawUpdate', {
                userId,
                points: data.points,
                color: data.color,
                brushSize: data.brushSize,
                tool: data.tool,
            });
        });

        // addObject event
        socket.on('addObject', (data: {
            boardId?: string;
            type: string;
            x: number;
            y: number;
            width?: number;
            height?: number;
            fill?: string;
            stroke?: string;
            points?: number[];
            id: string;
        }) => {
            const boardId = resolveBoardId(data.boardId);
            if (!boardId) return;

            // Re-emit properties ensuring matching signature
            const { boardId: _, ...rest } = data;

            socket.to(boardId).emit('objectAdded', {
                userId,
                ...rest,
            });
        });

        // deleteObject event (for undo/redo sync)
        socket.on('deleteObject', (data: { boardId?: string; id: string }) => {
            const boardId = resolveBoardId(data.boardId);
            if (!boardId) return;

            socket.to(boardId).emit('objectDeleted', { userId, id: data.id });
        });

        // updateObject event
        socket.on('updateObject', (data: { boardId?: string; id: string;[key: string]: unknown }) => {
            const boardId = resolveBoardId(data.boardId);
            if (!boardId) return;

            const { boardId: _, ...rest } = data;
            socket.to(boardId).emit('objectUpdated', { userId, ...rest });
        });

        // disconnect
        socket.on('disconnect', () => {
            const result = removeUserFromRoom(socket.id);
            if (result) {
                const { boardId } = result;
                const roomUsers = getRoomUsers(boardId).map(u => ({ id: u.id, name: u.name }));
                io.to(boardId).emit('roomUsers', { users: roomUsers });
                io.to(boardId).emit('userLeft', { userId });
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}
