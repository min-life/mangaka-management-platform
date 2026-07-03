import { io, Socket } from 'socket.io-client';

import { API_BASE_URL } from './apiClient';
import { ApiComment, ApiNotification } from './apiTypes';
import { refreshAccessToken } from './authApi';
import { getAccessToken } from './tokenStorage';

export type CommentEntityType = 'APPLICATION' | 'FILE' | 'FRAME' | 'TASK';

type CommentHandler = (comment: ApiComment) => void;
type NotificationHandler = (notification: ApiNotification) => void;

const REALTIME_URL = `${API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')}/realtime`;

let socket: Socket | null = null;
let authRefreshPromise: Promise<string> | null = null;

function setSocketToken(nextSocket: Socket, token: string) {
  nextSocket.auth = { token };
}

function getAuthRefreshPromise() {
  if (!authRefreshPromise) {
    authRefreshPromise = refreshAccessToken().finally(() => {
      authRefreshPromise = null;
    });
  }

  return authRefreshPromise;
}

async function reconnectWithFreshToken(nextSocket: Socket) {
  const token = await getAuthRefreshPromise();

  if (socket !== nextSocket) return;

  setSocketToken(nextSocket, token);
  if (!nextSocket.connected) {
    nextSocket.connect();
  }
}

function createRealtimeSocket(token: string) {
  const nextSocket = io(REALTIME_URL, {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    transports: ['websocket'],
  });

  nextSocket.on('auth_error', () => {
    void reconnectWithFreshToken(nextSocket).catch(() => {
      if (socket === nextSocket) {
        disconnectRealtime();
      }
    });
  });

  return nextSocket;
}

export async function connectRealtime() {
  const token = await getAccessToken();
  if (!token) return null;

  if (!socket) {
    socket = createRealtimeSocket(token);
  } else {
    setSocketToken(socket, token);
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function subscribeToNotifications(handler: NotificationHandler) {
  let isDisposed = false;
  let subscribedSocket: Socket | null = null;

  void connectRealtime().then((nextSocket) => {
    if (isDisposed || !nextSocket) return;

    subscribedSocket = nextSocket;
    nextSocket.on('notification:new', handler);
  });

  return () => {
    isDisposed = true;
    subscribedSocket?.off('notification:new', handler);
  };
}

export function subscribeToComments(
  entityType: CommentEntityType,
  entityId: string | number,
  handler: CommentHandler,
) {
  let isDisposed = false;
  let subscribedSocket: Socket | null = null;
  const payload = { entityId: Number(entityId), entityType };

  const subscribe = () => {
    subscribedSocket?.emit('comment:subscribe', payload);
  };

  void connectRealtime().then((nextSocket) => {
    if (isDisposed || !nextSocket || Number.isNaN(payload.entityId)) return;

    subscribedSocket = nextSocket;
    nextSocket.on('comment:new', handler);
    nextSocket.on('connect', subscribe);
    subscribe();
  });

  return () => {
    isDisposed = true;

    if (subscribedSocket && !Number.isNaN(payload.entityId)) {
      subscribedSocket.emit('comment:unsubscribe', payload);
      subscribedSocket.off('comment:new', handler);
      subscribedSocket.off('connect', subscribe);
    }
  };
}

export function disconnectRealtime() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  authRefreshPromise = null;
}
