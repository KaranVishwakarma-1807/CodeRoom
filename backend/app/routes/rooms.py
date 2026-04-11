from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.room import ParticipantRead, PresenceRead, RoomCreate, RoomJoin, RoomRead
from app.services.room_service import create_room, get_room_or_404, get_room_participants, join_room
from app.services.websocket_manager import ws_manager


router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/create", response_model=RoomRead)
def create(payload: RoomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_room(payload, user, db)


@router.post("/join", response_model=RoomRead)
def join(payload: RoomJoin, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return join_room(payload.room_code, payload.role, user, db)


@router.get("/{room_code}", response_model=RoomRead)
def get_room(room_code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = get_room_or_404(room_code, db)
    return RoomRead.model_validate(room)


@router.get("/{room_code}/participants", response_model=list[ParticipantRead])
def participants(room_code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_room_participants(room_code, db)


@router.get("/{room_code}/presence", response_model=list[PresenceRead])
def presence(room_code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_room_or_404(room_code, db)
    return ws_manager.get_presence(room_code)
