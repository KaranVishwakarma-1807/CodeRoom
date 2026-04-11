from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.participant import Participant
from app.models.user import User
from app.schemas.video import VideoCredentialsRead
from app.services.metered_service import ensure_metered_room, generate_metered_token
from app.services.room_service import get_room_or_404


router = APIRouter(prefix="/video", tags=["video"])


@router.get("/rooms/{room_code}/credentials", response_model=VideoCredentialsRead)
async def get_room_video_credentials(
    room_code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = get_room_or_404(room_code, db)
    participant = (
        db.query(Participant)
        .filter(Participant.room_id == room.id, Participant.user_id == user.id, Participant.left_at.is_(None))
        .order_by(Participant.joined_at.desc())
        .first()
    )
    if not participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Join room before requesting video access")
    role = participant.role
    is_admin = role == "interviewer"

    room_name = room.room_code
    await ensure_metered_room(room_name)
    token = await generate_metered_token(room_name, user.name, is_admin)

    return VideoCredentialsRead(
        room_name=room_name,
        room_url=f"https://{settings.metered_domain}/{room_name}",
        access_token=token,
        sdk_url=settings.metered_embed_sdk_url,
    )
