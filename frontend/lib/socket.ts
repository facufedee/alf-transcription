import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './config';
import { NAMESPACES } from '@shared/events';

let watchSocket: Socket | null = null;

export function getWatchSocket(): Socket {
  if (!watchSocket) {
    watchSocket = io(`${BACKEND_URL}${NAMESPACES.watch}`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return watchSocket;
}
