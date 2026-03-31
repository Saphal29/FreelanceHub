"use client";

import { io } from "socket.io-client";

let videoSocket = null;

/**
 * Get or create the singleton Socket.io client for the /video namespace.
 * Connects using the JWT token from localStorage.
 */
export const getVideoSocket = () => {
  // Reuse existing socket even if temporarily disconnected (let reconnection handle it)
  if (videoSocket) return videoSocket;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  const SOCKET_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  ).replace("/api", "");

  videoSocket = io(`${SOCKET_URL}/video`, {
    auth: { token },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5,
    timeout: 10000,
    autoConnect: false,
  });

  return videoSocket;
};

/**
 * Connect the video socket (call when user enters a call).
 */
export const connectVideoSocket = () => {
  const socket = getVideoSocket();
  if (socket && !socket.connected) socket.connect();
  return socket;
};

/**
 * Disconnect the video socket (call when user leaves a call).
 */
export const disconnectVideoSocket = () => {
  if (videoSocket) {
    videoSocket.disconnect();
    videoSocket = null;
  }
};
