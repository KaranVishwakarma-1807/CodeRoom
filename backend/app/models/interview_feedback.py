from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id"), nullable=False, index=True)
    interviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    candidate_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    strengths: Mapped[str] = mapped_column(Text, default="", nullable=False)
    improvements: Mapped[str] = mapped_column(Text, default="", nullable=False)
    recommendation: Mapped[str] = mapped_column(String(30), default="hold", nullable=False)

    communication_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    problem_solving_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coding_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSession", back_populates="feedback_entries")
