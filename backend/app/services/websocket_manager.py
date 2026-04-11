import json
from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.room_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.socket_room: dict[WebSocket, str] = {}
        self.socket_user: dict[WebSocket, int] = {}
        self.room_user_counts: dict[str, dict[int, int]] = defaultdict(dict)
        self.room_user_meta: dict[str, dict[int, dict]] = defaultdict(dict)
        self.room_state: dict[str, dict] = defaultdict(
            lambda: {"code": "", "language": "python", "timer": {"running": False, "seconds": 0}}
        )

    async def connect(self, room_code: str, websocket: WebSocket, user_id: int, user_name: str, role: str) -> bool:
        await websocket.accept()
        self.room_connections[room_code].add(websocket)
        self.socket_room[websocket] = room_code
        self.socket_user[websocket] = user_id

        user_count = self.room_user_counts[room_code].get(user_id, 0)
        self.room_user_counts[room_code][user_id] = user_count + 1
        self.room_user_meta[room_code][user_id] = {"user_id": user_id, "name": user_name, "role": role}
        return user_count == 0

    def disconnect(self, room_code: str, websocket: WebSocket) -> dict | None:
        self.room_connections[room_code].discard(websocket)
        user_id = self.socket_user.pop(websocket, None)
        self.socket_room.pop(websocket, None)

        left_user = None
        if user_id is not None:
            current = self.room_user_counts[room_code].get(user_id, 0)
            next_count = max(current - 1, 0)
            if next_count == 0:
                self.room_user_counts[room_code].pop(user_id, None)
                left_user = self.room_user_meta[room_code].pop(user_id, None)
            else:
                self.room_user_counts[room_code][user_id] = next_count

        if not self.room_connections[room_code]:
            self.room_connections.pop(room_code, None)
            self.room_user_counts.pop(room_code, None)
            self.room_user_meta.pop(room_code, None)
        return left_user

    def get_presence(self, room_code: str) -> list[dict]:
        return list(self.room_user_meta.get(room_code, {}).values())

    async def broadcast(self, room_code: str, event: dict) -> None:
        dead = []
        message = json.dumps(event)
        for connection in self.room_connections.get(room_code, set()):
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(room_code, conn)


ws_manager = WebSocketManager()
