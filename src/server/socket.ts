import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { adminAuth } from '../lib/firebase-admin.ts';

let io: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (typeof socket.handshake.headers?.authorization === 'string'
        ? socket.handshake.headers.authorization.replace('Bearer ', '')
        : undefined);

    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        socket.data.userId = decoded.uid;
        socket.data.user = decoded;
      } catch (err) {
        console.warn('[Socket Auth] Invalid token on socket connection');
        socket.data.userId = `guest_${socket.id}`;
      }
    } else {
      socket.data.userId = `guest_${socket.id}`;
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.data.userId) {
      socket.join(`user_${socket.data.userId}`);
    }

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function broadcastCommunityEvent(event: string, payload: any) {
  if (io) {
    io.emit(event, payload);
  }
}

export function broadcastUserEvent(userId: string, event: string, payload: any) {
  if (io) {
    io.to(`user_${userId}`).emit(event, payload);
  }
}

export function closeSocketServer(): Promise<void> {
  return new Promise((resolve) => {
    if (io) {
      io.close(() => {
        io = null;
        console.log('Socket.IO server shut down gracefully.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

