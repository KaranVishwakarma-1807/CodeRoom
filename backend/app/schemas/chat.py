from datetime import datetime

from pydantic import BaseModel


class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageRead(BaseModel):
    room_id: int
    sender_id: int
    sender_name: str
    message: str
    timestamp: datetime
