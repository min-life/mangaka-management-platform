'use client';

import { io, type Socket } from 'socket.io-client';

export type RealtimeSocket = Socket;

function getRealtimeUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_REALTIME_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function createRealtimeSocket(accessToken: string) {
  return io(`${getRealtimeUrl()}/realtime`, {
    auth: {
      token: `Bearer ${accessToken}`,
    },
    autoConnect: false,
    transports: ['websocket'],
  });
}
