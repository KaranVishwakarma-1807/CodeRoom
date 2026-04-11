from app.services.websocket_manager import ws_manager


def update_room_code(room_code: str, code: str, language: str) -> None:
    state = ws_manager.room_state[room_code]
    state["code"] = code
    state["language"] = language


def get_room_code_state(room_code: str) -> dict:
    state = ws_manager.room_state[room_code]
    return {"code": state["code"], "language": state["language"]}
