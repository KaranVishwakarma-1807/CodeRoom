from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.chat_message import ChatMessage
from app.models.code_snapshot import CodeSnapshot
from app.models.interview_feedback import InterviewFeedback
from app.models.interview_session import InterviewSession
from app.models.participant import Participant
from app.models.user import User
from app.schemas.session import InterviewFeedbackCreate, SessionHistoryRead
from app.services.room_service import get_room_or_404
from app.services.websocket_manager import ws_manager


router = APIRouter(prefix="/sessions", tags=["sessions"])


def _get_latest_session(room_id: int, db: Session) -> InterviewSession | None:
    return (
        db.query(InterviewSession)
        .filter(InterviewSession.room_id == room_id)
        .order_by(InterviewSession.started_at.desc())
        .first()
    )


def _require_interviewer(room_id: int, user_id: int, db: Session) -> None:
    participant = (
        db.query(Participant)
        .filter(Participant.room_id == room_id, Participant.user_id == user_id, Participant.left_at.is_(None))
        .order_by(Participant.joined_at.desc())
        .first()
    )
    if not participant or participant.role != "interviewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only interviewer can perform this action")


@router.post("/{room_code}/start")
def start_session(
    room_code: str,
    language: str = "python",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = get_room_or_404(room_code, db)
    _require_interviewer(room.id, user.id, db)
    session = InterviewSession(room_id=room.id, language=language, status="active")
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "status": session.status, "started_at": session.started_at}


@router.post("/{room_code}/end")
def end_session(room_code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = get_room_or_404(room_code, db)
    _require_interviewer(room.id, user.id, db)
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.room_id == room.id, InterviewSession.status == "active")
        .order_by(InterviewSession.started_at.desc())
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active session not found")
    session.status = "ended"
    session.ended_at = datetime.utcnow()

    room_state = ws_manager.room_state.get(room_code, {"code": "", "language": "python"})
    snapshot = CodeSnapshot(
        room_id=room.id,
        content=room_state.get("code", ""),
        language=room_state.get("language", "python"),
    )
    db.add(snapshot)
    db.commit()
    return {"session_id": session.id, "status": session.status, "ended_at": session.ended_at}


@router.post("/{room_code}/feedback")
def create_feedback(
    room_code: str,
    payload: InterviewFeedbackCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = get_room_or_404(room_code, db)
    _require_interviewer(room.id, user.id, db)
    session = _get_latest_session(room.id, db)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    overall_score = round(
        (payload.communication_score + payload.problem_solving_score + payload.coding_score) / 3
    )
    feedback = InterviewFeedback(
        session_id=session.id,
        interviewer_id=user.id,
        candidate_id=payload.candidate_id,
        summary=payload.summary,
        strengths=payload.strengths,
        improvements=payload.improvements,
        recommendation=payload.recommendation,
        communication_score=payload.communication_score,
        problem_solving_score=payload.problem_solving_score,
        coding_score=payload.coding_score,
        overall_score=overall_score,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {
        "id": feedback.id,
        "session_id": feedback.session_id,
        "interviewer_id": feedback.interviewer_id,
        "candidate_id": feedback.candidate_id,
        "summary": feedback.summary,
        "strengths": feedback.strengths,
        "improvements": feedback.improvements,
        "recommendation": feedback.recommendation,
        "communication_score": feedback.communication_score,
        "problem_solving_score": feedback.problem_solving_score,
        "coding_score": feedback.coding_score,
        "overall_score": feedback.overall_score,
        "created_at": feedback.created_at,
    }


@router.get("/{room_code}/feedback")
def get_feedback(room_code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = get_room_or_404(room_code, db)
    session = _get_latest_session(room.id, db)
    if not session:
        return []
    feedback_rows = (
        db.query(InterviewFeedback)
        .filter(InterviewFeedback.session_id == session.id)
        .order_by(InterviewFeedback.created_at.desc())
        .all()
    )
    return [
        {
            "id": row.id,
            "session_id": row.session_id,
            "interviewer_id": row.interviewer_id,
            "candidate_id": row.candidate_id,
            "summary": row.summary,
            "strengths": row.strengths,
            "improvements": row.improvements,
            "recommendation": row.recommendation,
            "communication_score": row.communication_score,
            "problem_solving_score": row.problem_solving_score,
            "coding_score": row.coding_score,
            "overall_score": row.overall_score,
            "created_at": row.created_at,
        }
        for row in feedback_rows
    ]


@router.get("/{room_code}/history", response_model=list[SessionHistoryRead])
def session_history(room_code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = get_room_or_404(room_code, db)
    sessions = db.query(InterviewSession).filter(InterviewSession.room_id == room.id).order_by(InterviewSession.started_at.desc()).all()

    return [
        _history_row(row, room.id, db) for row in sessions
    ]


def _history_row(session: InterviewSession, room_id: int, db: Session) -> SessionHistoryRead:
    end_at = session.ended_at or datetime.utcnow()
    chat_count = (
        db.query(func.count(ChatMessage.id))
        .filter(
            ChatMessage.room_id == room_id,
            ChatMessage.timestamp >= session.started_at,
            ChatMessage.timestamp <= end_at,
        )
        .scalar()
        or 0
    )

    latest_snapshot = (
        db.query(CodeSnapshot)
        .filter(CodeSnapshot.room_id == room_id, CodeSnapshot.saved_at >= session.started_at, CodeSnapshot.saved_at <= end_at)
        .order_by(CodeSnapshot.saved_at.desc())
        .first()
    )
    latest_feedback = (
        db.query(InterviewFeedback)
        .filter(InterviewFeedback.session_id == session.id)
        .order_by(InterviewFeedback.created_at.desc())
        .first()
    )

    return SessionHistoryRead(
        id=session.id,
        language=session.language,
        status=session.status,
        started_at=session.started_at,
        ended_at=session.ended_at,
        chat_count=chat_count,
        latest_code_language=latest_snapshot.language if latest_snapshot else None,
        latest_code_saved_at=latest_snapshot.saved_at if latest_snapshot else None,
        overall_score=latest_feedback.overall_score if latest_feedback else None,
    )
