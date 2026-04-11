import { useEffect, useRef, useState } from "react";
import { createRoomWebSocket } from "../services/websocket";

export function useWebSocket(roomCode, token, onEvent) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomCode || !token) return undefined;
    const ws = createRoomWebSocket(roomCode, token);
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data);
        onEvent?.(parsed);
      } catch (_) {
        // Ignore malformed messages from unexpected clients.
      }
    };

    return () => ws.close();
  }, [roomCode, token, onEvent]);

  const send = (event) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    }
  };

  return { connected, send };
}
