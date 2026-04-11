from app.services.websocket_manager import ws_manager


def start_timer(room_code: str, seconds: int) -> dict:
    timer = ws_manager.room_state[room_code]["timer"]
    timer["running"] = True
    timer["seconds"] = seconds
    return timer


def pause_timer(room_code: str) -> dict:
    timer = ws_manager.room_state[room_code]["timer"]
    timer["running"] = False
    return timer


def reset_timer(room_code: str, seconds: int = 0) -> dict:
    timer = ws_manager.room_state[room_code]["timer"]
    timer["running"] = False
    timer["seconds"] = seconds
    return timer
