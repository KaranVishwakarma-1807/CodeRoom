export function createRoomWebSocket(roomCode, token) {
  const base = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
  return new WebSocket(`${base}/ws/rooms/${roomCode}?token=${encodeURIComponent(token)}`);
}
