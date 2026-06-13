import json
from datetime import datetime

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.dependencies import get_or_create_bypass_user, is_auth_bypass_enabled
from app.core.security import decode_access_token
from app.core.database import get_db
from app.models.chat_message import ChatMessage
from app.models.participant import Participant
from app.models.user import User
from app.schemas.code import CodeExecuteRequest
from app.services.code_sync_service import get_room_code_state, update_room_code
from app.services.execution_service import execute_code
from app.services.room_service import get_room_or_404
from app.services.timer_service import pause_timer, reset_timer, start_timer
from app.services.websocket_manager import ws_manager


router = APIRouter(tags=["websocket"])


async def broadcast_presence(room_code: str, user: dict, action: str):
    event_type = "participant_joined" if action == "joined" else "participant_left"
    await ws_manager.broadcast(
        room_code,
        {
            "type": event_type,
            "room_code": room_code,
            "user": user["name"],
            "payload": user,
        },
    )
    await ws_manager.broadcast(
        room_code,
        {
            "type": "presence_state",
            "room_code": room_code,
            "user": "system",
            "payload": {"participants": ws_manager.get_presence(room_code)},
        },
    )


@router.websocket("/ws/rooms/{room_code}")
async def room_socket(websocket: WebSocket, room_code: str, db: Session = Depends(get_db)):
    token = websocket.query_params.get("token")
    user = None

    if token:
        try:
            payload = decode_access_token(token)
            user_id = int(payload["sub"])
            user = db.query(User).filter(User.id == user_id).first()
        except (ValueError, KeyError):
            user = None

    if not user and is_auth_bypass_enabled():
        user = get_or_create_bypass_user(db)

    if not user:
        await websocket.close(code=1008)
        return

    try:
        room = get_room_or_404(room_code, db)
    except HTTPException:
        await websocket.close(code=1008)
        return

    participant = (
        db.query(Participant)
        .filter(Participant.room_id == room.id, Participant.user_id == user.id)
        .order_by(Participant.joined_at.desc())
        .first()
    )
    if not participant:
        participant = Participant(room_id=room.id, user_id=user.id, role="member")
        db.add(participant)
        db.commit()
        db.refresh(participant)
    else:
        if participant.left_at is not None:
            participant.left_at = None
            db.commit()
            db.refresh(participant)
    role = participant.role

    joined_first_connection = await ws_manager.connect(room_code, websocket, user.id, user.name, role)
    current_user = {"user_id": user.id, "name": user.name, "role": role}
    if joined_first_connection:
        await broadcast_presence(room_code, current_user, "joined")
    else:
        await ws_manager.broadcast(
            room_code,
            {
                "type": "presence_state",
                "room_code": room_code,
                "user": "system",
                "payload": {"participants": ws_manager.get_presence(room_code)},
            },
        )

    await ws_manager.broadcast(
        room_code,
        {"type": "code_state", "room_code": room_code, "user": "system", "payload": get_room_code_state(room_code)},
    )
    await ws_manager.broadcast(
        room_code,
        {
            "type": "timer_state",
            "room_code": room_code,
            "user": "system",
            "payload": {"timer": ws_manager.room_state[room_code]["timer"]},
        },
    )

    try:
        while True:
            raw = await websocket.receive_text()
            event = json.loads(raw)
            event_type = event.get("type")
            payload = event.get("payload", {})

            if event_type == "chat_message":
                message = ChatMessage(room_id=room.id, sender_id=user.id, message=payload.get("message", ""))
                db.add(message)
                db.commit()

            if event_type == "code_update":
                update_room_code(room_code, payload.get("code", ""), payload.get("language", "python"))

            if event_type == "timer_start":
                payload["timer"] = start_timer(room_code, int(payload.get("seconds", 0)))
            elif event_type == "timer_pause":
                payload["timer"] = pause_timer(room_code)
            elif event_type == "timer_reset":
                payload["timer"] = reset_timer(room_code, int(payload.get("seconds", 0)))
            elif event_type == "run_code":
                try:
                    result = await execute_code(
                        CodeExecuteRequest(
                            language=payload.get("language", "python"),
                            code=payload.get("code", ""),
                            stdin=payload.get("stdin", ""),
                        )
                    )
                    exec_output = result.output
                    exec_error = result.error
                except HTTPException as exc:
                    exec_output = ""
                    exec_error = exc.detail
                except Exception as exc:
                    exec_output = ""
                    exec_error = str(exc)
                await ws_manager.broadcast(
                    room_code,
                    {
                        "type": "code_output",
                        "room_code": room_code,
                        "user": user.name,
                        "payload": {"output": exec_output, "error": exec_error},
                    },
                )
                continue

            await ws_manager.broadcast(
                room_code,
                {
                    "type": event_type,
                    "room_code": room_code,
                    "user": user.name,
                    "payload": payload,
                },
            )
    except WebSocketDisconnect:
        left_user = ws_manager.disconnect(room_code, websocket)
        if left_user:
            participant = (
                db.query(Participant)
                .filter(Participant.room_id == room.id, Participant.user_id == left_user["user_id"], Participant.left_at.is_(None))
                .order_by(Participant.joined_at.desc())
                .first()
            )
            if participant:
                participant.left_at = datetime.utcnow()
                db.commit()
            await broadcast_presence(room_code, left_user, "left")
