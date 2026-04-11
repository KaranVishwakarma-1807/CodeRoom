from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.participant import Participant
from app.models.room import Room
from app.models.user import User
from app.schemas.room import ParticipantRead, RoomCreate, RoomRead
from app.utils.room_code import generate_room_code


def _ensure_room_active(room: Room, db: Session) -> None:
    if room.expires_at and room.expires_at <= datetime.utcnow():
        room.status = "expired"
        db.commit()
    if room.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room is inactive or expired")


def create_room(payload: RoomCreate, user: User, db: Session) -> RoomRead:
    expires_at = datetime.utcnow() + timedelta(hours=settings.room_expiry_hours)
    room = Room(
        room_code=generate_room_code(),
        title=payload.title,
        created_by=user.id,
        status="active",
        expires_at=expires_at,
    )
    db.add(room)
    db.flush()

    participant = Participant(room_id=room.id, user_id=user.id, role=payload.role)
    db.add(participant)
    db.commit()
    db.refresh(room)
    return RoomRead.model_validate(room)


def join_room(room_code: str, role: str, user: User, db: Session) -> RoomRead:
    room = db.query(Room).filter(Room.room_code == room_code).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    _ensure_room_active(room, db)

    participant = (
        db.query(Participant).filter(Participant.room_id == room.id, Participant.user_id == user.id).first()
    )
    if participant:
        participant.left_at = None
        participant.role = role
    else:
        db.add(Participant(room_id=room.id, user_id=user.id, role=role))

    db.commit()
    return RoomRead.model_validate(room)


def get_room_or_404(room_code: str, db: Session) -> Room:
    room = db.query(Room).filter(Room.room_code == room_code).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    _ensure_room_active(room, db)
    return room


def get_room_participants(room_code: str, db: Session) -> list[ParticipantRead]:
    room = get_room_or_404(room_code, db)
    rows = (
        db.query(Participant, User)
        .join(User, User.id == Participant.user_id)
        .filter(Participant.room_id == room.id, Participant.left_at.is_(None))
        .all()
    )
    return [
        ParticipantRead(
            id=participant.id,
            user_id=user.id,
            name=user.name,
            role=participant.role,
            joined_at=participant.joined_at,
            left_at=participant.left_at,
        )
        for participant, user in rows
    ]
