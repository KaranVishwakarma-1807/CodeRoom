from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RoomCreate(BaseModel):
    title: str
    role: str = "interviewer"


class RoomJoin(BaseModel):
    room_code: str
    role: str = "candidate"


class RoomRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_code: str
    title: str
    created_by: int
    status: str
    created_at: datetime
    expires_at: datetime | None


class ParticipantRead(BaseModel):
    id: int
    user_id: int
    name: str
    role: str
    joined_at: datetime
    left_at: datetime | None


class PresenceRead(BaseModel):
    user_id: int
    name: str
    role: str
